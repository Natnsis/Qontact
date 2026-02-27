import { colors } from '@/constants/color';
import { View, Text, Dimensions, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import QRcode from './QRcode';
import { useQuery } from '@tanstack/react-query';
import { getNumbers } from '@/controllers/saveNumber.controller';

const PhoneQr = () => {
  const { height } = Dimensions.get('screen');
  const [hidden, setHidden] = useState(true);
  const [selectedOption, setSelectedOption] = useState('hehe');

  const { data: contactNumbers } = useQuery({
    queryKey: ['contacts'],
    queryFn: getNumbers,
  });

  return (
    <View>
      <View
        className='rounded-lg p-2 mt-3'
        style={{ height: height * 0.4, backgroundColor: colors.background }}>
        <View className='flex-row justify-between'>
          <Text style={{ color: colors.light, fontFamily: 'bold', fontSize: 16 }}>Phone Qrcode</Text>
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
                <Text style={{ fontFamily: 'bold' }}>Contact Info:</Text>
                <Text style={{ fontFamily: 'regular' }}>+2519********</Text>
                <Text style={{ fontFamily: 'light', fontSize: 12 }} className='px-5 text-center'>
                  If you haven't configured, do before sharing
                </Text>
              </View>
            </View>
            :
            <QRcode id={selectedOption} />
          }
        </View>
      </View>

      <View className='mt-5 mb-2'>
        <Text style={{ fontFamily: 'heavy', color: colors.light }}>Select Numbers</Text>
      </View>

      <View className="flex-row flex-wrap justify-between p-2">
        <Pressable
          onPress={() => setSelectedOption('all')}
          style={{
            backgroundColor: colors.background,
            width: '48%',
          }}
          className={`p-3 rounded-lg mb-3 ${selectedOption === 'all' ? 'border border-dashed border-[#96dded]' : ''}`}
        >

          <View
          >
            <View className='flex-row justify-between'>
              <Text
                numberOfLines={1}
                style={{ fontFamily: 'regular', color: colors.light, flex: 1 }}
              >
                All Contacts
              </Text>
              <Feather name='users' color={colors.secondary} size={18} />
            </View>

            <View className='mt-2'>
              <Text style={{ fontFamily: 'light', color: colors.primary, fontSize: 12 }}>
                {contactNumbers?.length || 0} Contacts
              </Text>

              <View className='flex-row items-center justify-between mt-2'>
                <Text style={{ fontFamily: 'light', color: colors.light, fontSize: 10 }}>
                  Master List
                </Text>
                <Feather name='corner-down-right' color={colors.secondary} size={14} />
              </View>
            </View>
          </View>
        </Pressable>

        {contactNumbers?.map((item) => (
          <Pressable
            key={item.id}
            style={{
              backgroundColor: colors.background,
              width: '48%',
            }}
            onPress={() => setSelectedOption(item.id)}
            className={`p-3 rounded-lg mb-3 ${selectedOption === item.id ? 'border border-dashed border-[#96dded]' : ''}`}
          >
            <View className='flex-row justify-between'>
              <Text
                numberOfLines={1}
                style={{ fontFamily: 'regular', color: colors.light, flex: 1 }}
              >
                {item.name}
              </Text>
              <Feather
                name={item.platform === 'twitter' ? 'twitter' : 'phone'}
                color={colors.secondary}
                size={18}
              />
            </View>

            <View className='mt-2'>
              <Text style={{ fontFamily: 'light', color: colors.primary, fontSize: 12 }}>
                {item.number || item.url}
              </Text>

              <View className='flex-row items-center justify-between mt-2'>
                <Text style={{ fontFamily: 'light', color: colors.light, fontSize: 10 }}>
                  {item.createdAt}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View >
  )
}

export default PhoneQr
