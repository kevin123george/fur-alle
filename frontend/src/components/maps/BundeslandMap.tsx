import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import type { EmploymentDTO } from '../../types/employment';
import { BL_META, codeToSlug } from '../../lib/bundeslaender';
import { aloQuoteColor, YLORD_RD_7 } from '../../lib/colors';

interface Props {
  data: EmploymentDTO[];
  height?: number;
}

export function BundeslandMap({ data, height = 520 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const layerRef     = useRef<L.GeoJSON | null>(null);
  const legendRef    = useRef<L.Control | null>(null);
  const navigate     = useNavigate();

  const stateStats = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const d of data) {
      if (d.unemploymentRate == null) continue;
      const code = d.ags.slice(0, 2);
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(d.unemploymentRate);
    }
    const result: Record<string, { avg: number; count: number }> = {};
    map.forEach((vals, code) => {
      result[code] = { avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length };
    });
    return result;
  }, [data]);

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

  // Legend
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    legendRef.current?.remove();

    const legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.style.cssText = 'background:#fff;padding:10px 12px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:11px;font-family:inherit;max-width:150px';
      div.innerHTML = '<div style="font-weight:700;margin-bottom:6px;color:#1A1A1A">Ø ALQ je Bundesland</div>';
      const labels = ['0–2 %', '2–4 %', '4–6 %', '6–8 %', '8–10 %', '10–12 %', '>12 %'];
      YLORD_RD_7.forEach((color, i) => {
        div.innerHTML += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          <span style="width:12px;height:12px;background:${color};border-radius:2px;border:1px solid #ddd;display:inline-block;flex-shrink:0"></span>
          <span style="color:#6B6B6B">${labels[i]}</span></div>`;
      });
      div.innerHTML += '<div style="margin-top:6px;color:#9B9B9B;font-size:10px">Klicken für Bundesland-Details</div>';
      return div;
    };
    legend.addTo(map);
    legendRef.current = legend;
  }, []);

  // GeoJSON layer — re-render when stateStats changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !Object.keys(stateStats).length) return;

    layerRef.current?.remove();
    layerRef.current = null;

    fetch('/kreise.geo.json')
      .then(r => r.json())
      .then(geojson => {
        if (!mapRef.current) return;
        const layer = L.geoJSON(geojson, {
          style: (feature) => {
            const raw = feature?.properties?.krs_code as string[] | string | undefined;
            const code = Array.isArray(raw) ? raw[0] : raw;
            const blCode = code ? String(code).slice(0, 2) : '';
            const stats = stateStats[blCode];
            return {
              fillColor: stats ? aloQuoteColor(stats.avg) : '#E8E8E4',
              fillOpacity: stats ? 0.78 : 0.2,
              color: '#fff',
              weight: 0.5,
            };
          },
          onEachFeature: (feature, lyr) => {
            const raw = feature?.properties?.krs_code as string[] | string | undefined;
            const code = Array.isArray(raw) ? raw[0] : raw;
            const blCode = code ? String(code).slice(0, 2) : '';
            const meta  = BL_META[blCode];
            const stats = stateStats[blCode];

            const wappenHtml = meta?.wappen
              ? `<img src="${meta.wappen}" style="height:28px;width:auto;object-fit:contain;float:left;margin-right:8px;margin-bottom:2px" onerror="this.style.display='none'" />`
              : '';
            lyr.bindTooltip(
              `<div style="font-family:inherit;min-width:140px">
                ${wappenHtml}
                <strong style="font-size:13px">${meta?.name ?? blCode}</strong><br/>
                ${stats
                  ? `<span style="font-weight:700;color:#2563EB">${stats.avg.toFixed(1)} %</span>
                     <span style="color:#6B6B6B;font-size:11px"> Ø ALQ · ${stats.count} Kreise</span>`
                  : '<span style="color:#9B9B9B;font-size:11px">Keine Daten</span>'
                }<br/>
                <span style="color:#2563EB;font-size:11px;display:block;margin-top:3px">→ Details & Kreiskarte</span>
              </div>`,
              { className: 'leaflet-tooltip-custom' }
            );

            lyr.on('mouseover', () => {
              (lyr as L.Path).setStyle({ weight: 2.5, color: '#2563EB', fillOpacity: 0.92 });
              (lyr as L.Path).bringToFront();
            });
            lyr.on('mouseout', () => { layer.resetStyle(lyr as L.Path); });
            lyr.on('click', () => { if (blCode) navigate(`/bundeslaender/${codeToSlug(blCode)}`); });
          },
        }).addTo(mapRef.current);

        layerRef.current = layer;
      })
      .catch(console.error);
  }, [stateStats, navigate]);

  return (
    <div ref={containerRef} style={{ height, borderRadius: 12, border: '1px solid #E8E8E4', overflow: 'hidden' }} />
  );
}
