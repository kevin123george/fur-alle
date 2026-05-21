export interface ThemeColors {
  bgPage:   string;
  bgCard:   string;
  bgCard2:  string;
  bgGrid:   string;
  border:   string;
  text1:    string;
  text2:    string;
  text3:    string;
  text4:    string;
  text5:    string;
  accent:   string;
  accentBg: string;
}

const COLORS: ThemeColors = {
  bgPage:   'var(--color-base-200)',
  bgCard:   'var(--color-base-100)',
  bgCard2:  'var(--color-base-200)',
  bgGrid:   'var(--color-base-300)',
  border:   'var(--color-base-300)',
  text1:    'var(--color-base-content)',
  text2:    'color-mix(in oklch, var(--color-base-content) 70%, transparent)',
  text3:    'color-mix(in oklch, var(--color-base-content) 50%, transparent)',
  text4:    'color-mix(in oklch, var(--color-base-content) 35%, transparent)',
  text5:    'color-mix(in oklch, var(--color-base-content) 20%, transparent)',
  accent:   'var(--color-primary)',
  accentBg: 'color-mix(in oklch, var(--color-primary) 15%, transparent)',
};

export function useThemeColors(): ThemeColors {
  return COLORS;
}
