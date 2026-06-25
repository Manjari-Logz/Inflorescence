// Inflorescence – Premium Design System
// Inspired by Notion, TickTick, Todoist, Linear

export type ThemeMode = 'dark' | 'light';

const darkColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#263548',
  surfaceLighter: '#2D3F55',
  glass: '#1E293B',
  glassLight: '#263548',
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryLighter: '#60A5FA',
  primaryLightest: '#93C5FD',
  accent: '#3B82F6',
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textDim: '#475569',
  border: '#1E293B',
  borderLight: '#1A2740',
  borderStrong: '#2563EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  tabBar: '#0F172A',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  surfaceLighter: '#E2E8F0',
  glass: '#FFFFFF',
  glassLight: '#F8FAFC',
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryLighter: '#60A5FA',
  primaryLightest: '#93C5FD',
  accent: '#2563EB',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textDim: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderStrong: '#2563EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  tabBar: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.5)',
};

export const getThemeColors = (mode: ThemeMode) => ({
  ...mode === 'dark' ? darkColors : lightColors,
  priority: {
    Low: '#22C55E',
    Medium: '#3B82F6',
    High: '#F59E0B',
    Critical: '#EF4444',
  } as Record<string, string>,
  badge: {
    bronze: '#CD7F32',
    silver: '#94A3B8',
    gold: '#F59E0B',
    diamond: '#60A5FA',
    master: '#A855F7',
    legend: '#EF4444',
    heart: '#F43F5E',
    focus: '#3B82F6',
    health: '#22C55E',
    motivation: '#F59E0B',
    reader: '#8B5CF6',
    scholar: '#6366F1',
  } as Record<string, string>,
  mood: {
    Happy: '#F59E0B',
    Good: '#3B82F6',
    Neutral: '#94A3B8',
    Sad: '#8B5CF6',
    'Very Sad': '#6366F1',
  } as Record<string, string>,
  domainColors: [
    '#3B82F6', '#2563EB', '#8B5CF6', '#6366F1',
    '#22C55E', '#F59E0B', '#EF4444', '#EC4899',
  ],
});

export const Colors = getThemeColors('dark');

export const Typography = {
  fontFamily: 'System',
  fontFamilyAlt: 'System',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  glow: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const MODULE_ROUTES = [
  { key: 'books', title: 'Books', icon: 'book-open', route: '/modules/books', color: '#8B5CF6' },
  { key: 'podcasts', title: 'Podcasts', icon: 'headphones', route: '/modules/podcasts', color: '#22C55E' },
  { key: 'placement', title: 'Placement', icon: 'briefcase', route: '/modules/placement', color: '#F59E0B' },
  { key: 'custom', title: 'Custom', icon: 'layout-grid', route: '/modules/custom-sections', color: '#06B6D4' },
  { key: 'exercise', title: 'Exercise', icon: 'activity', route: '/modules/exercise', color: '#22C55E' },
  { key: 'money', title: 'Money Vault', icon: 'wallet', route: '/modules/money-vault', color: '#F59E0B' },
  { key: 'reflection', title: 'Reflect', icon: 'pen-line', route: '/modules/reflection', color: '#A855F7' },
  { key: 'analytics', title: 'Analytics', icon: 'bar-chart-2', route: '/modules/analytics', color: '#3B82F6' },
  { key: 'badges', title: 'Badges', icon: 'award', route: '/modules/badges', color: '#F59E0B' },
] as const;
