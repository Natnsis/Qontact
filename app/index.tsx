import { Button } from '@/components/ui/button';
import { colors } from '@/constants/color';
import { View, Text, Dimensions, Pressable, ScrollView } from 'react-native'; // Replaced FlatList with ScrollView
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import Header from '@/components/Header';
import QRcode from '@/components/QRcode';
import TelegramQR from '@/components/TelegramQR';
import PhoneQr from '@/components/PhoneQr';
import TwitterQR from '@/components/TwitterQR';

const index = () => {
  const { height } = Dimensions.get('screen');
  const [platform, setPlatform] = useState('phone');
  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.dark,
        flex: 1,
      }}
    >
      <Header face='share' />

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
    </SafeAreaView>
  );
};

export default index;
