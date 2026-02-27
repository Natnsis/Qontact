import { View, Text, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useQuery } from '@tanstack/react-query';
import { getNumbers } from '@/controllers/saveNumber.controller';

const QRcode = ({ id }) => {
  const { data: contactNumbers, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: getNumbers,
  });

  if (isLoading) return <ActivityIndicator size="large" />;

  let targetContacts = [];

  if (id === 'all') {
    targetContacts = contactNumbers || [];
  } else {
    targetContacts = contactNumbers?.filter((item) => item.id === id) || [];
  }

  const vCardValue = targetContacts
    .map((c) => {
      return `BEGIN:VCARD
VERSION:3.0
FN:${c.name}
TEL;TYPE=CELL:${c.number}
REV:${c.createdAt}
END:VCARD`;
    })
    .join('\n');

  if (targetContacts.length === 0) {
    return (
      <View className="items-center justify-center">
        <Text>No contact found</Text>
      </View>
    );
  }

  return (
    <View className='flex-1 items-center justify-center mt-2'>
      <View className="bg-white p-2 rounded-lg shadow-lg">
        <QRCode
          value={vCardValue}
          size={250}
          color="black"
          backgroundColor="white"
        />
      </View>
    </View>
  );
};

export default QRcode;
