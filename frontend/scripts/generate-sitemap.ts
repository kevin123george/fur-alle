import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { BL_META } from '../src/lib/bundeslaender';
import { AGS_TO_KREIS_SLUG } from '../src/lib/kreis-slugs';

const BASE_URL = 'https://regiohub.byastra.de';

const geoJson = JSON.parse(
  readFileSync(resolve(import.meta.dir, '../public/kreise.geo.json'), 'utf8')
);

const agsCodes: string[] = geoJson.features
  .map((f: any) => {
    const raw = f.properties.krs_code;
    return Array.isArray(raw) ? raw[0] : raw;
  })
  .filter(Boolean)
  .sort();

const staticRoutes = [
  { loc: '/',              changefreq: 'daily',  priority: '1.0' },
  { loc: '/bundeslaender', changefreq: 'weekly', priority: '0.9' },
  { loc: '/stellen',       changefreq: 'weekly', priority: '0.8' },
  { loc: '/impressum',     changefreq: 'yearly', priority: '0.3' },
  { loc: '/datenschutz',   changefreq: 'yearly', priority: '0.3' },
];

const bundeslandRoutes = Object.entries(BL_META).map(([, m]) => ({
  loc: `/bundeslaender/${m.slug}`,
  changefreq: 'weekly',
  priority: '0.8',
}));

const kreisRoutes = agsCodes.map(ags => {
  const entry = AGS_TO_KREIS_SLUG[ags];
  const stateSlug = entry ? (BL_META[entry.bl]?.slug ?? entry.bl) : null;
  const loc = stateSlug && entry ? `/kreis/${stateSlug}/${entry.slug}` : `/kreis/${ags}`;
  return { loc, changefreq: 'weekly', priority: '0.7' };
});

const allRoutes = [...staticRoutes, ...bundeslandRoutes, ...kreisRoutes];

const today = new Date().toISOString().split('T')[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(r => `  <url>
    <loc>${BASE_URL}${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const outPath = resolve(import.meta.dir, '../public/sitemap.xml');
writeFileSync(outPath, xml, 'utf8');
console.log(`Sitemap generated: ${allRoutes.length} URLs → public/sitemap.xml`);
