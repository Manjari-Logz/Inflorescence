// Inflorescence – Design System
// Blue Glassmorphism Theme | Arial / Calibri Typography

export type ThemeMode = 'dark' | 'light';

const darkColors = {
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
  tabBar: 'rgba(5, 13, 26, 0.97)',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

const lightColors = {
  background: '#E3F2FD',
  surface: '#FFFFFF',
  surfaceLight: '#F5FAFF',
  surfaceLighter: '#E1F5FE',
  glass: 'rgba(255, 255, 255, 0.88)',
  glassLight: 'rgba(227, 242, 253, 0.9)',
  primary: '#0277BD',
  primaryLight: '#0288D1',
  primaryLighter: '#039BE5',
  primaryLightest: '#4FC3F7',
  accent: '#0288D1',
  text: '#0D2137',
  textSecondary: '#1565C0',
  textMuted: 'rgba(13, 33, 55, 0.55)',
  textDim: 'rgba(13, 33, 55, 0.35)',
  border: 'rgba(2, 136, 209, 0.25)',
  borderLight: 'rgba(2, 136, 209, 0.12)',
  borderStrong: 'rgba(2, 136, 209, 0.45)',
  success: '#388E3C',
  warning: '#F9A825',
  error: '#D32F2F',
  info: '#0288D1',
  tabBar: 'rgba(255, 255, 255, 0.97)',
  overlay: 'rgba(13, 33, 55, 0.45)',
};

export const getThemeColors = (mode: ThemeMode) => ({
  ...mode === 'dark' ? darkColors : lightColors,
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
    reader: '#7E57C2',
    scholar: '#5C6BC0',
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
});

export const Colors = getThemeColors('dark');

export const Typography = {
  fontFamily: 'Arial',
  fontFamilyAlt: 'Calibri',
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

export const MODULE_ROUTES = [
  { key: 'books', title: 'Books', icon: 'menu-book', route: '/modules/books', color: '#7E57C2' },
  { key: 'podcasts', title: 'Podcasts', icon: 'headphones', route: '/modules/podcasts', color: '#1DB954' },
  { key: 'placement', title: 'Placement', icon: 'work', route: '/modules/placement', color: '#FF9800' },
  { key: 'custom', title: 'Custom Sections', icon: 'dashboard-customize', route: '/modules/custom-sections', color: '#00BCD4' },
  { key: 'exercise', title: 'Exercise', icon: 'fitness-center', route: '/modules/exercise', color: '#4CAF50' },
  { key: 'reflection', title: 'Reflection', icon: 'edit-note', route: '/modules/reflection', color: '#AB47BC' },
  { key: 'analytics', title: 'Analytics', icon: 'analytics', route: '/modules/analytics', color: '#29B6F6' },
  { key: 'badges', title: 'Badge Collection', icon: 'military-tech', route: '/modules/badges', color: '#FFD700' },
] as const;
