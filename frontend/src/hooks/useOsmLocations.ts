import { useEffect, useState } from 'react';

export interface OsmLocation {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: string; // amenity value
}

let bboxCache: Record<string, [number, number, number, number]> | null = null;

async function getBbox(ags: string): Promise<[number, number, number, number] | null> {
  if (!bboxCache) {
    const res = await fetch('/kreise-bbox.json');
    bboxCache = await res.json();
  }
  return bboxCache?.[ags] ?? null;
}

async function fetchLocations(
  bbox: [number, number, number, number],
  amenities: string[],
  limit = 80,
): Promise<OsmLocation[]> {
  const [s, w, n, e] = bbox;
  const query = `[out:json][timeout:30];
(node[amenity~"^(${amenities.join('|')})$"](${s},${w},${n},${e});
 way[amenity~"^(${amenities.join('|')})$"](${s},${w},${n},${e}););
out center ${limit};`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const data = await res.json();

  return (data.elements as Array<{
    type: string; id: number;
    lat?: number; lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>)
    .map(el => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) return null;
      return {
        id: el.id,
        lat, lon,
        name: el.tags?.name ?? el.tags?.['name:de'] ?? '',
        type: el.tags?.amenity ?? '',
      };
    })
    .filter(Boolean) as OsmLocation[];
}

export function useOsmLocations(
  ags: string | undefined,
  amenities: string[],
  enabled: boolean,
): { data: OsmLocation[] | null; loading: boolean } {
  const [data, setData] = useState<OsmLocation[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ags || !enabled) return;
    setLoading(true);
    getBbox(ags)
      .then(bbox => {
        if (!bbox) return [];
        return fetchLocations(bbox, amenities);
      })
      .then(locs => { setData(locs ?? []); setLoading(false); })
      .catch(() => { setData([]); setLoading(false); });
  }, [ags, enabled, amenities.join(',')]);

  return { data, loading };
}
