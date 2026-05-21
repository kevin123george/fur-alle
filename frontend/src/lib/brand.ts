const isRegio = typeof window !== 'undefined' && window.location.hostname.includes('regiohub');

export const BRAND = {
  name:     isRegio ? 'RegioHub'           : 'Für Alle',
  domain:   isRegio ? 'regiohub.byastra.de' : 'fueralle.byastra.de',
  badge:    isRegio ? 'RH'                 : 'FA',
  slug:     isRegio ? 'regiohub'           : 'fueralle',
} as const;
