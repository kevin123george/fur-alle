"""
ML clustering for German Kreise — K-means(k=6) on ~18 socioeconomic features.

Reads from 12 *_current tables, imputes missing values with column medians,
standardises, runs K-means, computes cosine similarity for "Ähnliche Kreise",
auto-labels each cluster, and writes results to kreis_clusters_current.

Run manually:  python run_once.py clusters
Scheduled:     weekly Sunday 04:00
"""
import logging
import os

import numpy as np
from sklearn.cluster import KMeans
from sklearn.impute import SimpleImputer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import psycopg
from psycopg.rows import dict_row

from models.schemas import KreisClusterRaw

logger = logging.getLogger(__name__)

N_CLUSTERS = 6
SIMILAR_K = 5
RANDOM_STATE = 42
CLUSTER_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#64748b"]

FEATURE_COLS = [
    "unemployment_rate",
    "gdp_per_capita",
    "population_density",
    "electric_share",
    "solar_density",           # derived: solar_kwp / area_km2
    "avg_age",
    "share_65plus",
    "net_migration_per_1000",
    "income_monthly_eur",
    "child_poverty_pct",
    "crime_rate_per_100k",
    "abitur_rate",
    "dropout_rate",
    "cov_100mbit",
    "rent_per_sqm",
    "doctors_per_100k",
    "commuter_ratio",
    "dist_supermarket_m",
]

# Each rule: (feature_name, label) — cluster with highest value gets this label
_LABEL_RULES = [
    ("gdp_per_capita",         "Wirtschaftsstark"),
    ("population_density",     "Stadtregion"),
    ("unemployment_rate",      "Strukturschwach"),
    ("share_65plus",           "Alternde Bevölkerung"),
    ("net_migration_per_1000", "Wachsende Region"),
]
_FALLBACK_LABEL = "Ländlicher Raum"

_LOAD_SQL = """
SELECT
    e.ags,
    e.district_name,
    CAST(e.unemployment_rate AS FLOAT)            AS unemployment_rate,
    CAST(g.gdp_per_capita AS FLOAT)               AS gdp_per_capita,
    CAST(d.population_density AS FLOAT)           AS population_density,
    CAST(d.area_km2 AS FLOAT)                     AS area_km2,
    CAST(v.electric_share AS FLOAT)               AS electric_share,
    CAST(r.solar_kwp AS FLOAT)                    AS solar_kwp,
    CAST(pd.avg_age AS FLOAT)                     AS avg_age,
    CAST(pd.share_65plus AS FLOAT)                AS share_65plus,
    CAST(pd.net_migration_per_1000 AS FLOAT)      AS net_migration_per_1000,
    CAST(s.income_monthly_eur AS FLOAT)           AS income_monthly_eur,
    CAST(s.child_poverty_pct AS FLOAT)            AS child_poverty_pct,
    CAST(s.crime_rate_per_100k AS FLOAT)          AS crime_rate_per_100k,
    CAST(ed.abitur_rate AS FLOAT)                 AS abitur_rate,
    CAST(ed.dropout_rate AS FLOAT)                AS dropout_rate,
    CAST(bb.cov_100mbit AS FLOAT)                 AS cov_100mbit,
    CAST(h.rent_per_sqm AS FLOAT)                 AS rent_per_sqm,
    CAST(hc.doctors_per_100k AS FLOAT)            AS doctors_per_100k,
    CAST(c.commuter_ratio AS FLOAT)               AS commuter_ratio,
    CAST(ac.dist_supermarket_m AS FLOAT)          AS dist_supermarket_m
FROM employment_current e
LEFT JOIN gdp_current                  g  ON e.ags = g.ags
LEFT JOIN demographics_current         d  ON e.ags = d.ags
LEFT JOIN vehicles_current             v  ON e.ags = v.ags
LEFT JOIN renewables_current           r  ON e.ags = r.ags
LEFT JOIN population_dynamics_current  pd ON e.ags = pd.ags
LEFT JOIN social_current               s  ON e.ags = s.ags
LEFT JOIN education_current            ed ON e.ags = ed.ags
LEFT JOIN broadband_current            bb ON e.ags = bb.ags
LEFT JOIN housing_current              h  ON e.ags = h.ags
LEFT JOIN healthcare_current           hc ON e.ags = hc.ags
LEFT JOIN commuters_current            c  ON e.ags = c.ags
LEFT JOIN accessibility_current        ac ON e.ags = ac.ags
ORDER BY e.ags
"""


def _load_data(dsn: str) -> list[dict]:
    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(_LOAD_SQL)
            rows = cur.fetchall()
    logger.info("ML: loaded %d Kreise from DB", len(rows))
    return rows


def _build_matrix(rows: list[dict]) -> np.ndarray:
    mat = []
    for r in rows:
        solar_kwp = r.get("solar_kwp") or 0.0
        area_km2  = r.get("area_km2")  or 1.0
        solar_density = (solar_kwp / area_km2) if area_km2 > 0 else None

        vec = [
            r.get("unemployment_rate"),
            r.get("gdp_per_capita"),
            r.get("population_density"),
            r.get("electric_share"),
            solar_density,
            r.get("avg_age"),
            r.get("share_65plus"),
            r.get("net_migration_per_1000"),
            r.get("income_monthly_eur"),
            r.get("child_poverty_pct"),
            r.get("crime_rate_per_100k"),
            r.get("abitur_rate"),
            r.get("dropout_rate"),
            r.get("cov_100mbit"),
            r.get("rent_per_sqm"),
            r.get("doctors_per_100k"),
            r.get("commuter_ratio"),
            r.get("dist_supermarket_m"),
        ]
        mat.append([v if v is not None else np.nan for v in vec])

    return np.array(mat, dtype=np.float64)


def _auto_label(centroids: np.ndarray) -> list[str]:
    """
    Assign one descriptive German label per cluster.
    Each rule claims the cluster with the highest value for its key feature.
    Remaining clusters receive the fallback label.
    """
    labels = [""] * len(centroids)
    used: set[int] = set()

    for feat_name, label in _LABEL_RULES:
        fi = FEATURE_COLS.index(feat_name)
        for ci in np.argsort(centroids[:, fi])[::-1]:
            if ci not in used:
                labels[ci] = label
                used.add(ci)
                break

    for i in range(len(labels)):
        if not labels[i]:
            labels[i] = _FALLBACK_LABEL

    return labels


def run() -> None:
    from db.writer import write_clusters_batch

    dsn = os.getenv("DB_DSN", "host=localhost dbname=fueralle user=astra")
    raw_rows = _load_data(dsn)
    if len(raw_rows) < N_CLUSTERS:
        logger.error(
            "ML: only %d Kreise in DB — need at least %d to cluster, skipping",
            len(raw_rows), N_CLUSTERS,
        )
        return

    ags_list  = [r["ags"]           for r in raw_rows]
    name_list = [r["district_name"] for r in raw_rows]

    X = _build_matrix(raw_rows)

    imputer = SimpleImputer(strategy="median")
    X_imp = imputer.fit_transform(X)

    scaler = StandardScaler()
    X_sc = scaler.fit_transform(X_imp)

    km = KMeans(n_clusters=N_CLUSTERS, n_init=20, random_state=RANDOM_STATE)
    cluster_ids = km.fit_predict(X_sc)
    cluster_labels = _auto_label(km.cluster_centers_)

    logger.info(
        "ML: K-means converged in %d iterations — cluster sizes: %s",
        km.n_iter_,
        {label: int((cluster_ids == i).sum()) for i, label in enumerate(cluster_labels)},
    )

    sim_matrix = cosine_similarity(X_sc)

    output: list[KreisClusterRaw] = []
    for i, (ags, name) in enumerate(zip(ags_list, name_list)):
        ci = int(cluster_ids[i])

        sims = sim_matrix[i].copy()
        sims[i] = -1.0  # exclude self
        top_indices = np.argsort(sims)[::-1][:SIMILAR_K]
        similar = [
            {
                "ags":           ags_list[j],
                "district_name": name_list[j],
                "cluster_id":    int(cluster_ids[j]),
                "cluster_label": cluster_labels[int(cluster_ids[j])],
                "cluster_color": CLUSTER_COLORS[int(cluster_ids[j])],
                "similarity":    round(float(sims[j]), 4),
            }
            for j in top_indices
        ]

        output.append(KreisClusterRaw(
            ags=ags,
            district_name=name,
            cluster_id=ci,
            cluster_label=cluster_labels[ci],
            cluster_color=CLUSTER_COLORS[ci],
            similar_kreise=similar,
            feature_vector=[round(float(v), 4) for v in X_sc[i]],
        ))

    write_clusters_batch(output)
    logger.info("ML: wrote %d cluster rows", len(output))
