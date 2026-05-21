.//**
 * Downloads Landkreis GeoJSON from OpenDataSoft, simplifies it with topojson,
 * and writes the result to frontend/public/kreise.geo.json (~800 KB target).
 *
 * Run once at setup: bun run scripts/prepare-geodata.ts
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { topology } from 'topojson-server';
import { feature } from 'topojson-client';
import { simplify, presimplify } from 'topojson-simplify';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

const SOURCE_URL =
  'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-germany-kreis/exports/geojson?limit=-1&timezone=UTC';

const OUT_PATH = join(import.meta.dir, '..', 'frontend', 'public', 'kreise.geo.json');

console.log('Downloading Landkreis GeoJSON…');
const res = await fetch(SOURCE_URL);
if (!res.ok) throw new Error(`Download failed: ${res.status}`);

const raw = await res.json() as FeatureCollection<Geometry, GeoJsonProperties>;
console.log(`Downloaded ${raw.features.length} features`);

// Build topology with quantization, then simplify aggressively
const topo = topology({ kreise: raw }, 1e4);  // lower quantization = smaller
const prepped = presimplify(topo);
const simplified_topo = simplify(prepped, 0.0005);  // higher = more aggressive
const simplified = feature(simplified_topo, simplified_topo.objects.kreise) as FeatureCollection;
console.log(`Simplified: ${simplified.features.length} features`);

const json = JSON.stringify(simplified);
writeFileSync(OUT_PATH, json);
const kb = (json.length / 1024).toFixed(0);
console.log(`Written to ${OUT_PATH} (${kb} KB)`);
