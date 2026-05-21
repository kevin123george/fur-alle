const WP = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;

export const BL_META: Record<string, { name: string; abbr: string; slug: string; wappen: string; tagline: string }> = {
  '01': { name: 'Schleswig-Holstein',     abbr: 'SH', slug: 'schleswig-holstein',     tagline: 'Der echte Norden',                    wappen: WP('Coat of arms of Schleswig-Holstein.svg') },
  '02': { name: 'Hamburg',                abbr: 'HH', slug: 'hamburg',                tagline: 'Tor zur Welt',                         wappen: WP('Coat of arms of Hamburg.svg') },
  '03': { name: 'Niedersachsen',          abbr: 'NI', slug: 'niedersachsen',          tagline: 'Niedersachsen. Klar.',                 wappen: WP('Coat of arms of Lower Saxony.svg') },
  '04': { name: 'Bremen',                 abbr: 'HB', slug: 'bremen',                 tagline: 'Mehr als Märchen!',                    wappen: WP('Bremen greater coat of arms.svg') },
  '05': { name: 'Nordrhein-Westfalen',    abbr: 'NW', slug: 'nordrhein-westfalen',    tagline: 'Europe\'s heartbeat',                  wappen: WP('Coat of arms of North Rhine-Westphalia.svg') },
  '06': { name: 'Hessen',                 abbr: 'HE', slug: 'hessen',                 tagline: 'An Hessen führt kein Weg vorbei',      wappen: WP('Coat of arms of Hesse.svg') },
  '07': { name: 'Rheinland-Pfalz',        abbr: 'RP', slug: 'rheinland-pfalz',        tagline: 'Das Weinland',                         wappen: WP('Coat of arms of Rhineland-Palatinate.svg') },
  '08': { name: 'Baden-Württemberg',      abbr: 'BW', slug: 'baden-wuerttemberg',     tagline: 'Wir können alles. Außer Hochdeutsch.', wappen: WP('Greater coat of arms of Baden-Württemberg.svg') },
  '09': { name: 'Bayern',                 abbr: 'BY', slug: 'bayern',                 tagline: 'Mia san mia',                          wappen: WP('Coat of arms of Bavaria.svg') },
  '10': { name: 'Saarland',               abbr: 'SL', slug: 'saarland',               tagline: 'Großes entsteht im Kleinen',           wappen: WP('Wappen des Saarlands.svg') },
  '11': { name: 'Berlin',                 abbr: 'BE', slug: 'berlin',                 tagline: 'Arm, aber sexy',                       wappen: WP('DEU Berlin COA.svg') },
  '12': { name: 'Brandenburg',            abbr: 'BB', slug: 'brandenburg',            tagline: 'Brandenburg entdecken',                wappen: WP('DEU Brandenburg COA.svg') },
  '13': { name: 'Mecklenburg-Vorpommern', abbr: 'MV', slug: 'mecklenburg-vorpommern', tagline: 'MV tut gut.',                          wappen: WP('Coat of arms of Mecklenburg-Western Pomerania (small).svg') },
  '14': { name: 'Sachsen',                abbr: 'SN', slug: 'sachsen',                tagline: 'So geht sächsisch',                    wappen: WP('Coat of arms of Saxony.svg') },
  '15': { name: 'Sachsen-Anhalt',         abbr: 'ST', slug: 'sachsen-anhalt',         tagline: 'Land der Frühaufsteher',               wappen: WP('Wappen Sachsen-Anhalt.svg') },
  '16': { name: 'Thüringen',              abbr: 'TH', slug: 'thueringen',             tagline: 'Das Grüne Herz Deutschlands',          wappen: WP('Coat of arms of Thuringia.svg') },
};

// First 2 digits of AGS → Bundesland name (kept for back-compat)
export const AGS_TO_BUNDESLAND: Record<string, string> = Object.fromEntries(
  Object.entries(BL_META).map(([k, v]) => [k, v.name])
);

export const BUNDESLAENDER = Object.values(AGS_TO_BUNDESLAND).sort();

export function getBundesland(ags: string): string {
  return AGS_TO_BUNDESLAND[ags.slice(0, 2)] ?? 'Unbekannt';
}

const SLUG_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(BL_META).map(([code, v]) => [v.slug, code])
);

export function slugToCode(slug: string): string | undefined {
  return SLUG_TO_CODE[slug];
}

export function codeToSlug(code: string): string {
  return BL_META[code]?.slug ?? code;
}
