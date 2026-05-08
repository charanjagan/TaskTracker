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

const dark = {
  mode: 'dark',
  bg: '#111111',
  card: '#1a1a1a',
  surface: '#161616',
  text: '#f5f5f5',
  textMuted: '#d4d4d4',
  textSubtle: '#a3a3a3',
  border: '#2a2a2a',
  borderStrong: '#3a3a3a',
  primary: '#e11d48',
  onPrimary: '#fff1f2',
  danger: '#fb7185',
  successBg: '#0f2a1f',
  successText: '#86efac',
  warningBg: '#31210f',
  warningText: '#fbbf24',
  headerTint: '#fda4af',
  overdueBg: '#1c1010',
  overdueBorder: '#7f1d1d',
};

export function getTheme() {
  return dark;
}
