import { useColorScheme } from 'react-native';

export const palettes = {
  light: {
    background: '#F7FAF9',
    surface: '#FFFFFF',
    primary: '#3BBFA3',
    primaryHover: '#2FA58C',
    secondary: '#6C7CF0',
    accent: '#FFD9A0',
    text: '#1E293B',
    muted: '#64748B',
    border: '#E2E8F0',
    dark: '#F7FAF9',
    light: '#1E293B',
  },
  dark: {
    background: '#0F172A',
    surface: '#162033',
    primary: '#52D6BA',
    primaryHover: '#42C2A7',
    secondary: '#8C9BFF',
    accent: '#FFC97A',
    text: '#F8FAFC',
    muted: '#94A3B8',
    border: '#243247',
    dark: '#0F172A',
    light: '#F8FAFC',
  },
} as const;

export type AppPalette = typeof palettes.light;

export const useAppColors = () => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palettes.dark : palettes.light;
};

export const colors = {
  ...palettes.dark,
  dark: palettes.dark.background,
  light: palettes.dark.text,
};
