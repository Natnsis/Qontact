import { Pressable, Text, View } from 'react-native';
import { useAppColors } from '@/constants/color';
import { useRouter } from 'expo-router';

type TabFace = 'configure' | 'share' | 'scan' | 'hub';

type HeaderProps = {
  face: TabFace;
  onChange?: (face: 'configure' | 'share' | 'scan') => void;
};

const tabs = [
  { key: 'configure', label: 'Configure' },
  { key: 'share', label: 'Share' },
  { key: 'scan', label: 'Scan' },
] as const;

const Header = ({ face, onChange }: HeaderProps) => {
  const router = useRouter();
  const activeFace = face === 'hub' ? 'scan' : face;
  const colors = useAppColors();

  return (
    <View className="px-3 pt-3">
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        }}
        className="flex-row overflow-hidden rounded-lg">
        {tabs.map((tab, index) => {
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
                minHeight: 50,
                backgroundColor: isActive ? colors.primary : colors.surface,
                borderBottomWidth: 3,
                borderBottomColor: isActive ? colors.accent : 'transparent',
              }}
              className="items-center justify-center">
              <Text
                style={{
                  fontFamily: 'regular',
                  color: isActive ? colors.background : colors.text,
                }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default Header;
