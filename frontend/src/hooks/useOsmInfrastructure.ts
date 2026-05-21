import { useEffect, useState } from 'react';

export interface OsmInfrastructure {
  schools: number;
  hospitals: number;
  pharmacies: number;
  publicFacilities: number;  // town_hall, courthouse, police, fire_station, library, post_office
  sportsLeisure: number;     // sports_centre, social_facility, community_centre
}

let bboxCache: Record<string, [number, number, number, number]> | null = null;

async function getBbox(ags: string): Promise<[number, number, number, number] | null> {
  if (!bboxCache) {
    const res = await fetch('/kreise-bbox.json');
    bboxCache = await res.json();
  }
  return bboxCache?.[ags] ?? null;
}

export function useOsmInfrastructure(ags: string | undefined): {
  data: OsmInfrastructure | null;
  loading: boolean;
} {
  const [data, setData] = useState<OsmInfrastructure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ags) return;
    setLoading(true);
    setData(null);

    getBbox(ags)
      .then(bbox => {
        if (!bbox) { setData({ schools: 0, hospitals: 0, pharmacies: 0, publicFacilities: 0, sportsLeisure: 0 }); setLoading(false); return; }
        const [s, w, n, e] = bbox;
        const pub  = 'town_hall|courthouse|police|fire_station|library|post_office';
        const sport = 'sports_centre|social_facility|community_centre';
        const query = `[out:json][timeout:35];
(node[amenity=school](${s},${w},${n},${e});way[amenity=school](${s},${w},${n},${e}););out count;
(node[amenity=hospital](${s},${w},${n},${e});way[amenity=hospital](${s},${w},${n},${e}););out count;
(node[amenity=pharmacy](${s},${w},${n},${e});way[amenity=pharmacy](${s},${w},${n},${e}););out count;
(node[amenity~"^(${pub})$"](${s},${w},${n},${e});way[amenity~"^(${pub})$"](${s},${w},${n},${e}););out count;
(node[amenity~"^(${sport})$"](${s},${w},${n},${e});way[amenity~"^(${sport})$"](${s},${w},${n},${e}););out count;`;

        return fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }).then(r => r.json());
      })
      .then((payload: { elements?: Array<{ tags?: { total?: string } }> } | undefined) => {
        if (!payload?.elements) { setLoading(false); return; }
        const [schoolEl, hospitalEl, pharmacyEl, publicEl, sportsEl] = payload.elements;
        setData({
          schools:          parseInt(schoolEl?.tags?.total   ?? '0', 10),
          hospitals:        parseInt(hospitalEl?.tags?.total ?? '0', 10),
          pharmacies:       parseInt(pharmacyEl?.tags?.total ?? '0', 10),
          publicFacilities: parseInt(publicEl?.tags?.total   ?? '0', 10),
          sportsLeisure:    parseInt(sportsEl?.tags?.total   ?? '0', 10),
        });
        setLoading(false);
      })
      .catch(() => { setData({ schools: 0, hospitals: 0, pharmacies: 0, publicFacilities: 0, sportsLeisure: 0 }); setLoading(false); });
  }, [ags]);

  return { data, loading };
}
