import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { OsmLocation } from '../../hooks/useOsmLocations';

const AMENITY_COLORS: Record<string, string> = {
  school: '#2563EB',
  university: '#7C3AED',
  college: '#9333EA',
  kindergarten: '#0891B2',
  hospital: '#DC2626',
  clinic: '#EF4444',
  pharmacy: '#059669',
  doctors: '#10B981',
};

function colorFor(type: string): string {
  return AMENITY_COLORS[type] ?? '#6B6B6B';
}

interface Props {
  locations: OsmLocation[];
  bbox: [number, number, number, number]; // [s, w, n, e]
  height?: number;
}

export function OsmMiniMap({ locations, bbox, height = 260 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container || mapRef.current) return;
    // StrictMode runs cleanup+remount; clear any leftover Leaflet state on the DOM node
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    const [s, w, n, e] = bbox;
    map.fitBounds([[s, w], [n, e]], { padding: [8, 8] });

    locations.forEach(loc => {
      L.circleMarker([loc.lat, loc.lon], {
        radius: 5,
        fillColor: colorFor(loc.type),
        color: '#fff',
        weight: 1.5,
        fillOpacity: 0.9,
      })
        .bindTooltip(
          loc.name
            ? `<div style="font-family:inherit;font-size:12px"><strong>${loc.name}</strong></div>`
            : `<div style="font-family:inherit;font-size:12px;color:#6B6B6B">(kein Name)</div>`,
          { className: 'leaflet-tooltip-custom' },
        )
        .addTo(map);
    });

    return () => { map.remove(); mapRef.current = null; delete (container as any)._leaflet_id; };
  }, []);

  return (
    <div ref={ref} style={{
      height,
      borderRadius: 8,
      border: '1px solid #E8E8E4',
      overflow: 'hidden',
      zIndex: 0,
    }} />
  );
}
