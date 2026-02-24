import { Button } from '@/components/ui/button';
import { colors } from '@/constants/color';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';

const index = () => {
  const { height } = Dimensions.get('screen');
  const [hidden, setHidden] = useState(false);

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.dark,
        height: height
      }}
    >
      <View className='flex-row justify-between px-2'>
        <Button
          style={{}}
          className='rounded-full'
        >
          <Text
            style={{
              fontFamily: 'regular',
              color: colors.primary
            }}
          >
            Configure
          </Text>
        </Button>

        <Button
          style={{ backgroundColor: colors.background }}
          className='rounded-full'
        >
          <Text
            style={{
              fontFamily: 'regular',
              color: colors.primary
            }}
          >
            Share
          </Text>
        </Button>

        <Button
          style={{}}
          className='rounded-full'
        >
          <Text
            style={{
              fontFamily: 'regular',
              color: colors.primary
            }}
          >
            Profile
          </Text>
        </Button>
      </View>
      <View className='px-4'>
        <View
          style={{ backgroundColor: colors.background, height: height * 0.15 }}
          className='mt-3 rounded-lg p-2'
        >
          <Text style={{ fontFamily: 'regular', color: colors.light }}>Platform</Text>
          <View className='flex-row justify-between mt-2 px-2'>
            <View>
              <View className='flex-row justify-center'>
                <Feather name='phone' color={colors.primary} size={40} />
              </View>
              <Text style={{ color: colors.light, fontFamily: 'regular' }} className='text-center'>
                Phone
              </Text>
            </View>

            <View>
              <View className='flex-row justify-center'>
                <Feather name='send' color={colors.light} size={40} />
              </View>
              <Text style={{ color: colors.light, fontFamily: 'regular' }} className='text-center'>
                Telegram
              </Text>
            </View>

            <View>
              <View className='flex-row justify-center'>
                <Feather name='twitter' color={colors.light} size={40} />
              </View>
              <Text style={{ color: colors.light, fontFamily: 'regular' }} className='text-center'>
                Twitter
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className='mt-3 px-1'>
          <View
            className='rounded-lg p-2'
            style={{ height: height * 0.4, backgroundColor: colors.background }}>
            <View className='flex-row justify-between'>
              <Text style={{ color: colors.light, fontFamily: 'bold', fontSize: 16 }}>
                Qrcode
              </Text>
              <Button size='icon' onPress={() => hidden ? setHidden(false) : setHidden(true)}>
                {hidden ?
                  <Feather name='cast' color={colors.secondary} size={20} />
                  :
                  <Feather name='maximize' color={colors.secondary} size={20} />
                }
              </Button>
            </View>

            <View className='flex-row p-2 justify-center items-center flex-1'>
              <View
                style={{ backgroundColor: colors.primary }}
                className='h-full w-[80%] rounded-full flex-row 
                items-center justify-center'
              >
                <View className='flex-col items-center justify-center'>
                  <Text style={{ fontFamily: 'bold' }}>Contact Info:</Text>
                  <Text style={{ fontFamily: 'regular' }}>+2519********</Text>
                  <Text style={{ fontFamily: 'light', fontSize: 12 }}
                    className='px-5 text-center'
                  >
                    If you havent configured, do before sharing
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className='mt-3'>
            <Text>hehe</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default index
