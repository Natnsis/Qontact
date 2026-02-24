import { Button } from '@/components/ui/button';
import { colors } from '@/constants/color';
import { View, Text, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import Header from '@/components/Header';
import QRCode from 'react-native-qrcode-svg';

const index = () => {
  const { height } = Dimensions.get('screen');
  const [hidden, setHidden] = useState(true);
  const [history, setHistory] = useState(true);
  const [platform, setPlatform] = useState('phone');

  const contacts = [
    { id: '1', name: 'Natnael Sisay', time: '30-01-24', phone: '+251911223344' },
    { id: '2', name: 'Sara Belay', time: '02-02-24', phone: '+251911556677' },
    { id: '3', name: 'Dawit Isaac', time: '15-02-24', phone: '+251920889900' },
    { id: '4', name: 'Elias Tekle', time: '20-02-24', phone: '+251944112233' },
    { id: '5', name: 'Marta Hailu', time: '22-02-24', phone: '+251912004455' },
    { id: '6', name: 'Yonas Alemu', time: '24-02-24', phone: '+251930778899' },
  ];
  const renderHeader = () => (
    <View>
      {/* Platform Section */}
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
            <Text style={{ color: colors.light, fontFamily: 'regular' }} className='text-center'>Phone</Text>
          </View>

          <View>
            <View className='flex-row justify-center'>
              <Feather name='send' color={colors.light} size={40} />
            </View>
            <Text style={{ color: colors.light, fontFamily: 'regular' }} className='text-center'>Telegram</Text>
          </View>

          <View>
            <View className='flex-row justify-center'>
              <Feather name='twitter' color={colors.light} size={40} />
            </View>
            <Text style={{ color: colors.light, fontFamily: 'regular' }} className='text-center'>Twitter</Text>
          </View>
        </View>
      </View>

      {/* QR Code Section */}
      <View
        className='rounded-lg p-2 mt-3'
        style={{ height: height * 0.4, backgroundColor: colors.background }}>
        <View className='flex-row justify-between'>
          <Text style={{ color: colors.light, fontFamily: 'bold', fontSize: 16 }}>Qrcode</Text>
          <Button size='icon' onPress={() => setHidden(!hidden)}>
            <Feather name={hidden ? 'cast' : 'maximize'} color={colors.secondary} size={20} />
          </Button>
        </View>

        <View className='flex-row p-2 justify-center items-center flex-1'>
          {hidden ? (
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
          ) : (
            <View
              className='flex-row items-center justify-center h-full w-full mx-4'>
              <QRCode
                value="https://github.com/your-dev-profile"
                size={200}
                color="black"
                backgroundColor="white"
              />
            </View>
          )}
        </View>
      </View>

      {/* Recent Contacts Label */}
      <View className='mt-5 mb-2'>
        <Text style={{ fontFamily: 'heavy', color: colors.light }}>Recent contacts</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.dark,
        flex: 1,
      }}
    >
      <Header face='share' />

      <View className='px-4 flex-1'>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader} // Renders the top UI
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: colors.background }} className='p-3 rounded-lg mb-3'>
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
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default index;
