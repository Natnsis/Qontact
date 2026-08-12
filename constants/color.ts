import { useColorScheme } from 'react-native';

export const palettes = {
  light: {
    background: '#F3F6FA', // cool, clear off-white
    surface: '#FFFFFF',
    primary: '#5B4FE0', // indigo/violet — from the logo's link mark
    primaryHover: '#4A3FC7',
    secondary: '#0E9AAE', // cyan/teal — from the logo's link mark
    accent: '#FBE7D3', // warm peach tint — from the logo's glow dot
    text: '#171A21',
    muted: '#5B6472',
    border: '#D7DEE8',
    destructive: '#DC4C3E',
    dark: '#F3F6FA',
    light: '#171A21',
  },
  dark: {
    background: '#10131A',
    surface: '#181C26',
    primary: '#8D84F2', // indigo/violet, lightened for dark
    primaryHover: '#A79DF5',
    secondary: '#22B8D6',
    accent: '#3A2313',
    text: '#EDEFF5',
    muted: '#99A1B2',
    border: '#2C3340',
    destructive: '#E2665A',
    dark: '#10131A',
    light: '#EDEFF5',
  },
} as const;

export type AppPalette = typeof palettes.light;

export const useAppColors = () => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palettes.dark : palettes.light;
};
