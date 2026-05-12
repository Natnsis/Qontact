import { colors } from '@/constants/color';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import TelegramQR from '@/components/TelegramQR';
import PhoneQr from '@/components/PhoneQr';
import TwitterQR from '@/components/TwitterQR';

const ShareOptions = () => {
  const { height } = Dimensions.get('screen');
  const [platform, setPlatform] = useState('phone');

  return (
    <ScrollView
      className='px-4 flex-1'
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View
        style={{ backgroundColor: colors.background, height: height * 0.15 }}
        className='mt-3 rounded-lg p-2'
      >
        <Text style={{ fontFamily: 'regular', color: colors.light }}>Platform</Text>
        <View className='flex-row justify-between mt-2 px-2'>
          <Pressable onPress={() => setPlatform('phone')}>
            <View>
              <View className='flex-row justify-center'>
                <Feather
                  name='phone'
                  color={platform === 'phone' ? colors.primary : colors.light}
                  size={40} />
              </View>
              <Text style={{ color: colors.light, fontFamily: 'regular' }} className='text-center'>Phone</Text>
            </View>
          </Pressable>

          <Pressable onPress={() => setPlatform('telegram')}>
            <View>
              <View className='flex-row justify-center'>
                <Feather
                  name='send'
                  color={platform === 'telegram' ? colors.primary : colors.light}
                  size={40} />
              </View>
              <Text style={{ color: colors.light, fontFamily: 'regular' }} className='text-center'>Telegram</Text>
            </View>
          </Pressable>

          <Pressable onPress={() => setPlatform('twitter')}>
            <View>
              <View className='flex-row justify-center'>
                <Feather
                  name='twitter'
                  color={platform === 'twitter' ? colors.primary : colors.light}
                  size={40} />
              </View>
              <Text style={{ color: colors.light, fontFamily: 'regular' }} className='text-center'>Twitter</Text>
            </View>
          </Pressable>
        </View>
      </View>
      {
        {
          'phone': <PhoneQr />,
          'telegram': <TelegramQR />,
          'twitter': <TwitterQR />
        }[platform]
      }
    </ScrollView>
  );
};

export default ShareOptions;
