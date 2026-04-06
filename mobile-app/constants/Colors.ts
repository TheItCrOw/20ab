/**
 * Design tokens mirroring the 20ab dashboard design system.
 */

// --- Semantic / static tokens ---
export const accent = {
  light: '#6366F1',
  dark: '#7C79F5',
};
export const accentBg = {
  light: 'rgba(99,102,241,0.08)',
  dark: 'rgba(124,121,245,0.10)',
};

export const win = {
  light: '#16A34A',
  dark: '#22C55E',
};
export const winBg = {
  light: 'rgba(22,163,74,0.10)',
  dark: 'rgba(34,197,94,0.12)',
};

export const loss = {
  light: '#DC2626',
  dark: '#EF4444',
};
export const lossBg = {
  light: 'rgba(220,38,38,0.10)',
  dark: 'rgba(239,68,68,0.12)',
};

export const finish = {
  light: '#B45309',
  dark: '#F59E0B',
};
export const finishBg = {
  light: 'rgba(180,83,9,0.10)',
  dark: 'rgba(245,158,11,0.12)',
};

// --- Theme-specific tokens ---
const Colors = {
  light: {
    text: '#0F1629',
    textSecondary: '#606878',
    textTertiary: '#9EA5B4',
    background: '#EFF1F8',
    surface: '#FFFFFF',
    border: '#E3E6F0',
    headerBg: 'rgba(0,0,0,0.038)',
    stripeBg: 'rgba(0,0,0,0.018)',
    tint: '#6366F1',
    tabIconDefault: '#9EA5B4',
    tabIconSelected: '#6366F1',
  },
  dark: {
    text: '#ECEEFA',
    textSecondary: '#8A8FA8',
    textTertiary: '#55596C',
    background: '#0C0C16',
    surface: '#1B1B2C',
    border: '#272738',
    headerBg: 'rgba(255,255,255,0.045)',
    stripeBg: 'rgba(255,255,255,0.018)',
    tint: '#7C79F5',
    tabIconDefault: '#55596C',
    tabIconSelected: '#7C79F5',
  },
};

export default Colors;
