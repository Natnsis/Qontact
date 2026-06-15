import { useColorScheme } from 'react-native';

export const palettes = {
  light: {
    background: '#F2EFEA', // cream
    surface: '#F2EFEA',
    primary: '#82B090', // sage green
    primaryHover: '#6E9D7C',
    secondary: '#D0E4D7', // lighter sage tint
    accent: '#82B090',
    text: '#41393C', // brown
    muted: '#7A6E71',
    border: '#D5D0CA',
    dark: '#F2EFEA',
    light: '#41393C',
  },
  dark: {
    background: '#41393C', // brown
    surface: '#4E4449',
    primary: '#82B090', // sage stays the same
    primaryHover: '#9AC4A8',
    secondary: '#5E4F53',
    accent: '#82B090',
    text: '#F2EFEA', // cream
    muted: '#B8AFA5',
    border: '#5E4F53',
    dark: '#41393C',
    light: '#F2EFEA',
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
