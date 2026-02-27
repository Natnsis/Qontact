import { colors } from '@/constants/color';
import { View, Text, Dimensions, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import TWQRcode from './TWQRcode';
import { useQuery } from "@tanstack/react-query";
import { getTwitterUrls } from '@/controllers/saveUrl.controller';

const TwitterQR = () => {
  const { height } = Dimensions.get('screen');
  const [hidden, setHidden] = useState(true);

  const [selectedId, setSelectedId] = useState('')

  const { data: twitterUrls } = useQuery({
    queryKey: ['twUrls'],
    queryFn: getTwitterUrls,
  });

  return (
    <View>
      <View
        className='rounded-lg p-2 mt-3'
        style={{ height: height * 0.4, backgroundColor: colors.background }}>
        <View className='flex-row justify-between'>
          <Text style={{ color: colors.light, fontFamily: 'bold', fontSize: 16 }}>
            Twitter QRcode
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
                <Text style={{ fontFamily: 'bold' }}>Twitter URL:</Text>
                <Text style={{ fontFamily: 'regular' }}>https://t.me/******</Text>
                <Text style={{ fontFamily: 'light', fontSize: 12 }} className='px-5 text-center'>
                  If you haven't configured, do before sharing
                </Text>
              </View>
            </View>
            :
            <TWQRcode id={selectedId} />
          }
        </View>
      </View>

      <View className='mt-5 mb-2'>
        <Text style={{ fontFamily: 'heavy', color: colors.light }}>Select which to share</Text>
      </View>

      {twitterUrls && twitterUrls.length > 0 ? (
        twitterUrls.map((item) => (
          <Pressable
            key={item.id}
            style={{ backgroundColor: colors.background }}
            onPress={() => setSelectedId(item.id!)}
            className={`p-3 rounded-lg mb-3 ${selectedId === item.id ? 'border border-dashed border-[#96dded]' : ''}`}
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
          </Pressable>
        ))
      ) : (
        <Text style={{ color: colors.secondary, textAlign: 'center', fontFamily: 'light' }}>
          No Twitter URLs saved
        </Text>
      )}
    </View>
  )
}

export default TwitterQR
