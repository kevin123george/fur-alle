import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { kreisPath } from '../../lib/kreis-slugs';
import type { EmploymentDTO } from '../../types/employment';
import type { ClusterDTO } from '../../types/cluster';
import type { OverlayPoint } from '../../hooks/useMapOverlay';
import { aloQuoteColor, YLORD_RD_7, BLUES_7 } from '../../lib/colors';

export interface OverlayMeta {
  label: string;
  unit: string;
  higherIsBetter: boolean;
}

interface Props {
  data: EmploymentDTO[];
  interactive?: boolean;
  height?: number;
  focusAgs?: string;
  fitBL?: string;
  colorMode?: 'alq' | 'cluster' | 'overlay';
  clusterData?: ClusterDTO[];
  overlayData?: OverlayPoint[];
  overlayMeta?: OverlayMeta;
  showLegend?: boolean;
}

// Compute 7 quantile break-points from a sorted array
function quantileBreaks(values: number[]): number[] {
  if (!values.length) return Array(8).fill(0);
  const sorted = [...values].sort((a, b) => a - b);
  return Array.from({ length: 8 }, (_, i) =>
    sorted[Math.min(Math.floor(i * (sorted.length - 1) / 7), sorted.length - 1)]
  );
}

function bucketIndex(value: number, breaks: number[]): number {
  for (let i = 0; i < breaks.length - 2; i++) {
    if (value <= breaks[i + 1]) return i;
  }
  return 6;
}

function fmtBreak(v: number, unit: string): string {
  if (unit === '€' || unit === '€/Mon') return `${Math.round(v).toLocaleString('de-DE')} ${unit}`;
  if (unit === 'EW/km²') return `${Math.round(v).toLocaleString('de-DE')}`;
  return `${v % 1 === 0 ? v : v.toFixed(1)} ${unit}`;
}

export function KreisMap({
  data,
  interactive = true,
  height = 520,
  focusAgs,
  fitBL,
  colorMode = 'alq',
  clusterData,
  overlayData,
  overlayMeta,
  showLegend = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const legendRef = useRef<L.Control | null>(null);
  const navigate = useNavigate();

  const byAgs = useMemo(() => Object.fromEntries(data.map(d => [d.ags, d])), [data]);
  const byAgsCluster = useMemo(() => Object.fromEntries((clusterData ?? []).map(c => [c.ags, c])), [clusterData]);
  const byAgsOverlay = useMemo(() => Object.fromEntries((overlayData ?? []).map(o => [o.ags, o.value])), [overlayData]);

  const overlayBreaks = useMemo(() => {
    if (!overlayData?.length) return null;
    return quantileBreaks(overlayData.map(o => o.value));
  }, [overlayData]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    if ((container as any)._leaflet_id) delete (container as any)._leaflet_id;

    const map = L.map(container, { zoomControl: true, attributionControl: true })
      .setView([51.1, 10.4], 6);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    return () => { map.remove(); mapRef.current = null; delete (container as any)._leaflet_id; };
  }, []);

  // Rebuild legend when mode/data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    legendRef.current?.remove();
    if (!showLegend) return;

    const legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.style.cssText = 'background:#fff;padding:10px 12px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:11px;font-family:inherit;max-width:160px';

      if (colorMode === 'cluster' && clusterData?.length) {
        const seen = new Map<string, string>();
        clusterData.forEach(c => { if (!seen.has(c.clusterLabel)) seen.set(c.clusterLabel, c.clusterColor); });
        div.innerHTML = '<div style="font-weight:700;margin-bottom:6px;color:#1A1A1A">Kreistyp</div>';
        seen.forEach((color, label) => {
          div.innerHTML += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <span style="width:12px;height:12px;background:${color};border-radius:2px;border:1px solid #ddd;display:inline-block;flex-shrink:0"></span>
            <span style="color:#4B5563">${label}</span></div>`;
        });

      } else if (colorMode === 'overlay' && overlayBreaks && overlayMeta) {
        const scale = overlayMeta.higherIsBetter ? BLUES_7 : YLORD_RD_7;
        const colors = overlayMeta.higherIsBetter ? [...scale] : [...scale].reverse();
        div.innerHTML = `<div style="font-weight:700;margin-bottom:6px;color:#1A1A1A">${overlayMeta.label}</div>`;
        for (let i = 0; i < 7; i++) {
          const lo = fmtBreak(overlayBreaks[i], overlayMeta.unit);
          const hi = fmtBreak(overlayBreaks[i + 1], overlayMeta.unit);
          div.innerHTML += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span style="width:12px;height:12px;background:${colors[i]};border-radius:2px;border:1px solid #ddd;display:inline-block;flex-shrink:0"></span>
            <span style="color:#6B6B6B;font-size:10px">${lo} – ${hi}</span></div>`;
        }

      } else {
        div.innerHTML = '<div style="font-weight:700;margin-bottom:6px;color:#1A1A1A">Arbeitslosenquote</div>';
        const labels = ['0–2 %', '2–4 %', '4–6 %', '6–8 %', '8–10 %', '10–12 %', '>12 %'];
        YLORD_RD_7.forEach((color, i) => {
          div.innerHTML += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <span style="width:12px;height:12px;background:${color};border-radius:2px;border:1px solid #ddd;display:inline-block"></span>
            <span style="color:#6B6B6B">${labels[i]}</span></div>`;
        });
      }

      if (interactive) div.innerHTML += '<div style="margin-top:6px;color:#9B9B9B;font-size:10px">Klicken für Kreis-Details</div>';
      return div;
    };
    legend.addTo(map);
    legendRef.current = legend;
  }, [colorMode, clusterData, overlayBreaks, overlayMeta, interactive, showLegend]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    geoLayerRef.current?.remove();
    geoLayerRef.current = null;

    fetch('/kreise.geo.json')
      .then(r => r.json())
      .then(geojson => {
        const layer = L.geoJSON(geojson, {
          style: (feature) => {
            const raw = feature?.properties?.krs_code as string[] | string | undefined;
            const code = Array.isArray(raw) ? raw[0] : raw;
            const isFocus = focusAgs && code === focusAgs;

            if (colorMode === 'cluster') {
              const cluster = code ? byAgsCluster[code] : undefined;
              return {
                fillColor: cluster ? cluster.clusterColor : '#E8E8E4',
                fillOpacity: isFocus ? 1.0 : (cluster ? 0.72 : 0.25),
                color: isFocus ? '#1d4ed8' : '#94a3b8',
                weight: isFocus ? 3 : 0.5,
              };
            }

            if (colorMode === 'overlay' && overlayBreaks && overlayMeta) {
              const val = code != null ? byAgsOverlay[code] : undefined;
              const scale = overlayMeta.higherIsBetter ? BLUES_7 : YLORD_RD_7;
              const colors = overlayMeta.higherIsBetter ? [...scale] : [...scale].reverse();
              const fillColor = val != null ? colors[bucketIndex(val, overlayBreaks)] : '#E8E8E4';
              return {
                fillColor,
                fillOpacity: isFocus ? 1.0 : (val != null ? 0.75 : 0.25),
                color: isFocus ? '#1d4ed8' : '#94a3b8',
                weight: isFocus ? 3 : 0.5,
              };
            }

            const entry = code ? byAgs[code] : undefined;
            const hasData = Boolean(entry?.unemploymentRate);
            return {
              fillColor: hasData ? aloQuoteColor(entry!.unemploymentRate) : '#E8E8E4',
              fillOpacity: isFocus ? 1.0 : (hasData ? 0.75 : 0.3),
              color: isFocus ? '#1d4ed8' : '#94a3b8',
              weight: isFocus ? 3 : 0.5,
            };
          },
          onEachFeature: (feature, lyr) => {
            const raw = feature?.properties?.krs_code as string[] | string | undefined;
            const code = Array.isArray(raw) ? raw[0] : raw;
            const name = feature?.properties?.krs_name ?? feature?.properties?.GEN ?? code ?? '';

            let tooltip = '';
            if (colorMode === 'cluster') {
              const cluster = code ? byAgsCluster[code] : undefined;
              tooltip = cluster
                ? `<div style="font-family:inherit"><strong style="font-size:13px">${name}</strong><br/>
                   <span style="color:${cluster.clusterColor};font-weight:600">${cluster.clusterLabel}</span>
                   ${interactive ? '<br/><span style="color:#2563EB;font-size:11px;display:block;margin-top:2px">→ Klicken für Details</span>' : ''}</div>`
                : `<div style="font-family:inherit"><strong style="font-size:13px">${name}</strong><br/><span style="color:#9B9B9B;font-size:11px">Noch keine Daten</span></div>`;
            } else if (colorMode === 'overlay' && overlayMeta) {
              const val = code != null ? byAgsOverlay[code] : undefined;
              tooltip = `<div style="font-family:inherit"><strong style="font-size:13px">${name}</strong><br/>
                ${val != null
                  ? `<span style="color:#0f172a;font-weight:600">${fmtBreak(val, overlayMeta.unit)}</span>
                     <span style="color:#6B6B6B;font-size:11px"> ${overlayMeta.label}</span>`
                  : `<span style="color:#9B9B9B;font-size:11px">Keine Daten</span>`}
                ${interactive ? '<br/><span style="color:#2563EB;font-size:11px;display:block;margin-top:2px">→ Klicken für Details</span>' : ''}
              </div>`;
            } else {
              const entry = code ? byAgs[code] : undefined;
              tooltip = entry
                ? `<div style="font-family:inherit"><strong style="font-size:13px">${name}</strong><br/>
                   <span style="color:#2563EB;font-weight:600">${entry.unemploymentRate ?? '—'} %</span>
                   <span style="color:#6B6B6B;font-size:11px"> Arbeitslosenquote</span><br/>
                   <span style="color:#9B9B9B;font-size:10px">Stand: ${entry.dataDate}</span>
                   ${interactive ? '<br/><span style="color:#2563EB;font-size:11px;display:block;margin-top:2px">→ Klicken für Details</span>' : ''}</div>`
                : `<div style="font-family:inherit"><strong style="font-size:13px">${name}</strong><br/>
                   <span style="color:#9B9B9B;font-size:11px">Noch keine Daten</span>
                   ${interactive ? '<br/><span style="color:#F59E0B;font-size:11px;display:block;margin-top:2px">→ Daten anfragen</span>' : ''}</div>`;
            }
            if (interactive && code) {
              lyr.bindTooltip(
                `<img src="/posters/${code}.png" width="270" height="270" style="border-radius:14px;display:block">`,
                { className: 'leaflet-poster-tooltip', sticky: true, opacity: 1 }
              );
            } else {
              lyr.bindTooltip(tooltip, { className: 'leaflet-tooltip-custom' });
            }

            lyr.on('mouseover', () => { (lyr as L.Path).setStyle({ weight: 2, color: '#2563EB' }); });
            lyr.on('mouseout', () => { layer.resetStyle(lyr as L.Path); });

            if (interactive && code) {
              lyr.on('click', () => navigate(kreisPath(code)));
              (lyr as L.Path).getElement()?.setAttribute('style', 'cursor:pointer');
            }
          },
        }).addTo(map);
        geoLayerRef.current = layer;

        if (focusAgs) {
          layer.eachLayer(lyr => {
            const feature = (lyr as L.GeoJSON & { feature?: GeoJSON.Feature }).feature;
            const raw = feature?.properties?.krs_code as string[] | string | undefined;
            const code = Array.isArray(raw) ? raw[0] : raw;
            if (code === focusAgs) {
              const bounds = (lyr as L.Path & { getBounds?: () => L.LatLngBounds }).getBounds?.();
              if (bounds) map.fitBounds(bounds, { padding: [32, 32] });
            }
          });
        }

        if (fitBL) {
          let union: L.LatLngBounds | null = null;
          layer.eachLayer(lyr => {
            const feature = (lyr as L.GeoJSON & { feature?: GeoJSON.Feature }).feature;
            const raw = feature?.properties?.krs_code as string[] | string | undefined;
            const code = Array.isArray(raw) ? raw[0] : raw;
            if (code && String(code).startsWith(fitBL)) {
              const b = (lyr as L.Path & { getBounds?: () => L.LatLngBounds }).getBounds?.();
              if (b) union = union ? union.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast());
            }
          });
          if (union) map.fitBounds(union as L.LatLngBounds, { padding: [28, 28] });
        }
      })
      .catch(console.error);
  }, [data, byAgs, byAgsCluster, byAgsOverlay, overlayBreaks, overlayMeta, colorMode, interactive, navigate, focusAgs, fitBL]);

  return (
    <div ref={containerRef} style={{
      height, borderRadius: 12,
      border: '1px solid #E8E8E4',
      overflow: 'hidden',
    }} />
  );
}
