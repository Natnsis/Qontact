import { useColorScheme } from 'react-native';

export const palettes = {
  light: {
    background: '#EEF0F3', // cool neutral
    surface: '#FFFFFF',
    primary: '#834965', // mauve
    primaryHover: '#693A51',
    secondary: '#61904C', // green
    accent: '#ECDCE3',
    text: '#181B21',
    muted: '#5A6072',
    border: '#C9CFD8',
    destructive: '#B8332E',
    dark: '#EEF0F3',
    light: '#181B21',
  },
  dark: {
    background: '#14171C',
    surface: '#1C2027',
    primary: '#AE7891', // mauve, lightened for dark
    primaryHover: '#BD91A6',
    secondary: '#79AC70',
    accent: '#39252F',
    text: '#E6E9EF',
    muted: '#9097A6',
    border: '#353C48',
    destructive: '#D4524C',
    dark: '#14171C',
    light: '#E6E9EF',
  },
} as const;

export type AppPalette = typeof palettes.light;

export const useAppColors = () => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palettes.dark : palettes.light;
};
