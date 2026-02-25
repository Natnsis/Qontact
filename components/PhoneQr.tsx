import { colors } from '@/constants/color';
import { View, Text, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import QRcode from './QRcode';

const PhoneQr = () => {
  const { height } = Dimensions.get('screen');
  const [hidden, setHidden] = useState(true);

  const contacts = [
    { id: '1', name: 'Natnael Sisay', time: '30-01-24', phone: '+251911223344' },
    { id: '2', name: 'Sara Belay', time: '02-02-24', phone: '+251911556677' },
    { id: '3', name: 'Dawit Isaac', time: '15-02-24', phone: '+251920889900' },
    { id: '4', name: 'Elias Tekle', time: '20-02-24', phone: '+251944112233' },
    { id: '5', name: 'Marta Hailu', time: '22-02-24', phone: '+251912004455' },
    { id: '6', name: 'Yonas Alemu', time: '24-02-24', phone: '+251930778899' },
  ];

  return (
    <View>
      <View
        className='rounded-lg p-2 mt-3'
        style={{ height: height * 0.4, backgroundColor: colors.background }}>
        <View className='flex-row justify-between'>
          <Text style={{ color: colors.light, fontFamily: 'bold', fontSize: 16 }}>Qrcode</Text>
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
            <QRcode />
          }
        </View>
      </View>

      <View className='mt-5 mb-2'>
        <Text style={{ fontFamily: 'heavy', color: colors.light }}>Recent contacts</Text>
      </View>

      {contacts.map((item) => (
        <View
          key={item.id}
          style={{ backgroundColor: colors.background }}
          className='p-3 rounded-lg mb-3'
        >
          <View className='flex-row justify-between'>
            <Text style={{ fontFamily: 'regular', color: colors.light }}>{item.name}</Text>
            <Feather name='phone' color={colors.secondary} size={23} />
          </View>
          <View className='flex-row items-center justify-between mt-1'>
            <Text style={{ fontFamily: 'light', color: colors.primary }}>{item.phone}</Text>
            <View className='flex-row items-center justify-end'>
              <Text style={{ fontFamily: 'light', color: colors.light, fontSize: 12 }}>{item.time}</Text>
              <Button size='icon' variant='ghost'>
                <Feather name='corner-down-right' color={colors.secondary} size={18} />
              </Button>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}

export default PhoneQr
