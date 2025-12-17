// Design System Color Palette
// These colors are shared across all frontend applications

export const colors = {
  // Brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Semantic colors
  background: {
    light: '#ffffff',
    dark: '#0a0a0a',
  },
  foreground: {
    light: '#171717',
    dark: '#ededed',
  },

  // Surface colors
  surface: {
    light: '#f9fafb',
    dark: 'rgba(255, 255, 255, 0.05)',
  },

  // Border colors
  border: {
    light: '#e5e7eb',
    dark: 'rgba(255, 255, 255, 0.15)',
  },

  // Status colors
  success: {
    light: '#dbeafe',
    dark: '#1e3a8a',
    text: {
      light: '#1e40af',
      dark: '#93c5fd',
    },
  },
  warning: {
    light: '#fef3c7',
    dark: 'rgba(120, 53, 15, 0.3)',
    border: '#fbbf24',
    text: {
      light: '#92400e',
      dark: '#fcd34d',
    },
  },

  // Interactive colors
  link: {
    light: '#2563eb',
    dark: '#60a5fa',
  },
};

// CSS custom properties for runtime theming
export const cssVariables = {
  light: {
    '--background': colors.background.light,
    '--foreground': colors.foreground.light,
    '--surface': colors.surface.light,
    '--border': colors.border.light,
  },
  dark: {
    '--background': colors.background.dark,
    '--foreground': colors.foreground.dark,
    '--surface': colors.surface.dark,
    '--border': colors.border.dark,
  },
};
