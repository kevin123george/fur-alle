// forthepeople.in-inspired palette adapted for Germany
export const COLOR = {
  blue: '#2563EB',
  blueDark: '#1d4ed8',
  blueLight: '#EFF6FF',
  green: '#10B981',
  greenLight: '#ECFDF5',
  red: '#E11D48',
  amber: '#F59E0B',
  amberLight: '#FFFBEB',
  bg: '#FAFAF8',
  bgCard: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B6B6B',
  border: '#E8E8E4',
  borderDark: '#D1D0CB',
} as const;

// ColorBrewer YlOrRd — colorblind-friendly, 7 steps
export const YLORD_RD_7 = [
  '#FFFFB2', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#B10026',
] as const;

export const BLUES_7 = [
  '#EFF3FF', '#C6DBEF', '#9ECAE1', '#6BAED6', '#4292C6', '#2171B5', '#084594',
] as const;

export const ENERGY_COLORS: Record<number, string> = {
  410:  '#64748b',
  4068: '#F59E0B',
  4067: '#2563EB',
  1225: '#06B6D4',
  4066: '#10B981',
};

export function aloQuoteColor(value: number | null): string {
  if (value === null) return '#E8E8E4';
  const idx = Math.min(Math.floor(value / 2), YLORD_RD_7.length - 1);
  return YLORD_RD_7[idx];
}
