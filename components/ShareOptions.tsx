import { useAppColors } from '@/constants/color';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import TelegramQR from '@/components/TelegramQR';
import PhoneQr from '@/components/PhoneQr';
import TwitterQR from '@/components/TwitterQR';

const sharePlatforms = [
  { key: 'phone', label: 'Phone', icon: 'phone' },
  { key: 'telegram', label: 'Telegram', icon: 'send' },
  { key: 'twitter', label: 'Twitter / X', icon: 'twitter' },
] as const;

const ShareOptions = () => {
  const [platform, setPlatform] = useState<'phone' | 'telegram' | 'twitter'>('phone');
  const colors = useAppColors();

  return (
    <ScrollView
      className='flex-1 px-4'
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24, paddingTop: 12 }}
    >
      <View className='mb-1 flex-row gap-2'>
        {sharePlatforms.map((item) => {
          const selected = platform === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setPlatform(item.key)}
              style={{
                flex: 1,
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                borderWidth: 1,
              }}
              className='items-center gap-2 rounded-lg px-2 py-3'
            >
              <Feather
                name={item.icon}
                color={selected ? colors.background : colors.secondary}
                size={22}
              />
              <Text
                style={{
                  color: selected ? colors.background : colors.text,
                  fontFamily: 'regular',
                  fontSize: 12,
                }}
                className='text-center'
                numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {
        {
          phone: <PhoneQr />,
          telegram: <TelegramQR />,
          twitter: <TwitterQR />
        }[platform]
      }
    </ScrollView>
  );
};

export default ShareOptions;
