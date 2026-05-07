export const typography = {
  title: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h1: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  h2: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
};

const light = {
  mode: 'light',
  bg: '#F4F4F5',
  card: '#FFFFFF',
  surface: '#FAFAFA',
  text: '#18181B',
  textMuted: '#52525B',
  textSubtle: '#71717A',
  border: '#E4E4E7',
  borderStrong: '#D4D4D8',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  danger: '#DC2626',
  successBg: '#DCFCE7',
  successText: '#15803D',
  warningBg: '#FEF3C7',
  warningText: '#92400E',
  headerTint: '#2563EB',
};

const dark = {
  mode: 'dark',
  bg: '#0F172A',
  card: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textMuted: '#D1D5DB',
  textSubtle: '#9CA3AF',
  border: '#334155',
  borderStrong: '#475569',
  primary: '#3B82F6',
  onPrimary: '#F8FAFC',
  danger: '#F87171',
  successBg: '#064E3B',
  successText: '#A7F3D0',
  warningBg: '#78350F',
  warningText: '#FCD34D',
  headerTint: '#93C5FD',
};

export function getTheme(isDarkMode) {
  return isDarkMode ? dark : light;
}
