import { colors } from '@/constants/color';
import { View, Text, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import TQRcode from './TQRcode';
import { useQuery } from "@tanstack/react-query";
import { getTelegramUrls } from '@/controllers/saveUrl.controller';

const TelegramQR = () => {
  const { height } = Dimensions.get('screen');
  const [hidden, setHidden] = useState(true);

  const { data: telegramUrls } = useQuery({
    queryKey: ['tgUrls'],
    queryFn: getTelegramUrls,
  });

  return (
    <View>
      <View
        className='rounded-lg p-2 mt-3'
        style={{ height: height * 0.4, backgroundColor: colors.background }}>
        <View className='flex-row justify-between'>
          <Text style={{ color: colors.light, fontFamily: 'bold', fontSize: 16 }}>
            Telegram QR
          </Text>
          <Button size='icon' onPress={() => setHidden(!hidden)} variant='ghost'>
            <Feather name={hidden ? 'cast' : 'maximize'} color={colors.secondary} size={24} />
          </Button>
        </View>

        <View className='flex-row p-2 justify-center items-center flex-1'>
          {hidden ?
            <View
              style={{ backgroundColor: colors.primary }}
              className='h-[80%] w-[80%] rounded-full flex-row items-center justify-center'
            >
              <View className='flex-col items-center justify-center'>
                <Text style={{ fontFamily: 'bold' }}>Telegram URL:</Text>
                <Text style={{ fontFamily: 'regular' }}>https://t.me/******</Text>
                <Text style={{ fontFamily: 'light', fontSize: 12 }} className='px-5 text-center'>
                  If you haven't configured, do before sharing
                </Text>
              </View>
            </View>
            :
            <TQRcode />
          }
        </View>
      </View>

      <View className='mt-5 mb-2'>
        <Text style={{ fontFamily: 'heavy', color: colors.light }}>Select which to share</Text>
      </View>
      {telegramUrls && telegramUrls.length > 0 ? (
        telegramUrls.map((item) => (
          <View
            key={item.id}
            style={{ backgroundColor: colors.background }}
            className="p-3 rounded-lg mb-3"
          >
            <View className="flex-row justify-between items-center">
              <Text style={{ fontFamily: 'regular', color: colors.light }}>
                {item.name}
              </Text>
              <Feather name="send" color={colors.secondary} size={23} />
            </View>

            <View className="flex-row items-center justify-between mt-1 gap-2">
              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: 'light', color: colors.primary }}
                >
                  {item.url}
                </Text>
              </View>

              <View>
                <Text style={{ fontFamily: 'light', color: colors.light, fontSize: 10 }}>
                  {item.createdAt}
                </Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={{ color: colors.secondary, textAlign: 'center', fontFamily: 'light' }}>
          No Telegram URLs saved
        </Text>
      )}
    </View>
  )
}

export default TelegramQR
