import { useAppColors } from '@/constants/color';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import QRcode from './QRcode';
import { useQuery } from '@tanstack/react-query';
import { getNumbers } from '@/controllers/saveNumber.controller';

const PhoneQr = () => {
  const [showQr, setShowQr] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const colors = useAppColors();

  const { data: contactNumbers } = useQuery({
    queryKey: ['contacts'],
    queryFn: getNumbers,
  });

  const selectedContact = contactNumbers?.find((item) => item.id === selectedOption);

  return (
    <View>
      <View
        className='mt-3 rounded-lg border p-3'
        style={{ minHeight: 310, backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className='flex-row items-start justify-between gap-3'>
          <View className="flex-1">
            <Text style={{ color: colors.text, fontFamily: 'bold', fontSize: 18 }}>Phone QR</Text>
            <Text style={{ color: colors.muted, fontFamily: 'light', marginTop: 2 }}>
              {selectedContact ? selectedContact.name : 'Select a saved number below'}
            </Text>
          </View>
          <Button
            onPress={() => setShowQr(!showQr)}
            disabled={!selectedOption}
            style={{ backgroundColor: selectedOption ? colors.secondary : colors.border }}
          >
            <Feather name={showQr ? 'eye-off' : 'grid'} color={colors.background} size={16} />
            <Text style={{ color: colors.background, fontFamily: 'regular' }}>
              {showQr ? 'Hide QR' : 'Show QR'}
            </Text>
          </Button>
        </View>

        <View className='flex-row p-2 justify-center items-center flex-1'>
          {showQr && selectedOption ? (
            <QRcode id={selectedOption} />
          ) : (
            <View
              style={{ backgroundColor: colors.background, borderColor: colors.border }}
              className='w-full items-center justify-center rounded-lg border border-dashed p-6'
            >
              <Feather name="phone-call" color={colors.primary} size={36} />
              <Text style={{ color: colors.text, fontFamily: 'bold', marginTop: 10 }}>
                {selectedContact?.number ?? '+251 9xx xxx xxx'}
              </Text>
              <Text style={{ color: colors.muted, fontFamily: 'light', fontSize: 12 }} className='mt-1 text-center'>
                Pick a number, then tap Show QR.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className='mb-2 mt-5'>
        <Text style={{ fontFamily: 'bold', color: colors.text }}>Select a number</Text>
      </View>

      <View className="flex-row flex-wrap justify-between">
        {contactNumbers && contactNumbers.length > 0 ? contactNumbers.map((item) => {
          const selected = selectedOption === item.id;
          return (
            <Pressable
              key={item.id}
              style={{
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                borderWidth: 1,
                width: '48%',
              }}
              onPress={() => {
                setSelectedOption(item.id);
                setShowQr(false);
              }}
              className='mb-3 rounded-lg p-3'
            >
              <View className='flex-row justify-between gap-2'>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: 'regular', color: selected ? colors.background : colors.text, flex: 1 }}
                >
                  {item.name}
                </Text>
                <Feather
                  name="phone"
                  color={selected ? colors.background : colors.secondary}
                  size={18}
                />
              </View>

              <Text style={{ fontFamily: 'light', color: selected ? colors.background : colors.muted, fontSize: 12, marginTop: 8 }}>
                {item.number}
              </Text>
            </Pressable>
          );
        }) : (
          <View className="w-full rounded-lg border border-dashed p-4" style={{ borderColor: colors.border }}>
            <Text style={{ color: colors.muted, textAlign: 'center', fontFamily: 'light' }}>
              No phone numbers saved yet.
            </Text>
          </View>
        )}
      </View>
    </View >
  )
}

export default PhoneQr
