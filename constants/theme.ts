// Inflorescence – Design System
// Blue Glassmorphism Theme | Arial Typography

export const Colors = {
  background: '#050D1A',
  surface: '#0A1628',
  surfaceLight: '#0F1F3A',
  surfaceLighter: '#162540',
  glass: 'rgba(15, 31, 58, 0.85)',
  glassLight: 'rgba(22, 37, 64, 0.7)',

  primary: '#0288D1',
  primaryLight: '#4FC3F7',
  primaryLighter: '#81D4FA',
  primaryLightest: '#B3E5FC',
  accent: '#29B6F6',

  text: '#FFFFFF',
  textSecondary: '#B3E5FC',
  textMuted: 'rgba(179, 229, 252, 0.55)',
  textDim: 'rgba(255, 255, 255, 0.35)',

  border: 'rgba(79, 195, 247, 0.22)',
  borderLight: 'rgba(179, 229, 252, 0.1)',
  borderStrong: 'rgba(79, 195, 247, 0.45)',

  success: '#4CAF50',
  warning: '#FFC107',
  error: '#EF5350',
  info: '#29B6F6',

  priority: {
    Low: '#4CAF50',
    Medium: '#29B6F6',
    High: '#FF9800',
    Critical: '#EF5350',
  } as Record<string, string>,

  badge: {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    diamond: '#B9F2FF',
    master: '#FF69B4',
    legend: '#FF4500',
    heart: '#FF6B9D',
    focus: '#29B6F6',
    health: '#4CAF50',
    motivation: '#FFC107',
  } as Record<string, string>,

  mood: {
    Happy: '#FFD700',
    Good: '#4FC3F7',
    Neutral: '#81D4FA',
    Sad: '#7E57C2',
    'Very Sad': '#5C6BC0',
  } as Record<string, string>,

  domainColors: [
    '#29B6F6', '#0288D1', '#4FC3F7', '#81D4FA',
    '#00BCD4', '#26C6DA', '#4DD0E1', '#00ACC1',
  ],
};

export const Typography = {
  fontFamily: 'Arial',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#29B6F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    shadowColor: '#0288D1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: {
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};
