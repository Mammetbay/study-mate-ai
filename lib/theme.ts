export const theme = {
  colors: {
    dark: {
      background: '#0F1115',
      surface: '#1A1D24',
      primary: '#F59E0B',
      primaryPressed: '#D97706',
      accent: '#2DD4BF',
      error: '#F87171',
      textPrimary: '#F1F2F4',
      textSecondary: '#9CA3AF',
      textOnPrimary: '#FFFFFF',
      border: '#2A2D35',
    },
    light: {
      background: '#F8F9FB',
      surface: '#FFFFFF',
      primary: '#F59E0B',
      primaryPressed: '#D97706',
      accent: '#2DD4BF',
      error: '#F87171',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      textOnPrimary: '#FFFFFF',
      border: '#E5E7EB',
    },
  },
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      bold: 'Inter-Bold',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    screenPadding: 16,
    cardGap: 12,
  },
  radius: {
    sm: 8,
    button: 12,
    input: 12,
    card: 16,
    full: 9999,
  },
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    },
    fab: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

export type ThemeColors = typeof theme.colors.dark;
