import { Pressable, Text, View } from 'react-native';
import { useAppColors } from '@/constants/color';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

type TabFace = 'configure' | 'share' | 'scan' | 'hub';

type HeaderProps = {
  face: TabFace;
  onChange?: (face: 'configure' | 'share' | 'scan') => void;
};

const tabs = [
  { key: 'configure', label: 'Configure', icon: 'sliders' },
  { key: 'share', label: 'Share', icon: 'share-2' },
  { key: 'scan', label: 'Scan', icon: 'maximize' },
] as const;

const Header = ({ face, onChange }: HeaderProps) => {
  const router = useRouter();
  const activeFace = face === 'hub' ? 'scan' : face;
  const colors = useAppColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
      }}
      className="flex-row gap-2 px-3 pb-2 pt-2">
      {tabs.map((tab) => {
        const isActive = activeFace === tab.key;

        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              if (onChange) {
                onChange(tab.key);
                return;
              }
              router.replace(tab.key === 'scan' ? '/hub' : `/${tab.key}`);
            }}
            style={{
              flex: 1,
              backgroundColor: isActive ? colors.primary : 'transparent',
            }}
            className="items-center justify-center gap-1 rounded-xl py-2">
            <Feather
              name={tab.icon}
              size={20}
              color={isActive ? colors.background : colors.muted}
            />
            <Text
              style={{
                fontFamily: isActive ? 'bold' : 'regular',
                fontSize: 12,
                color: isActive ? colors.background : colors.muted,
              }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default Header;
