import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const QRcode = () => {
  const contactInfo = {
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com'
  };

  const vCardValue = `BEGIN:VCARD
VERSION:3.0
FN:${contactInfo.name}
TEL:${contactInfo.phone}
`
  return (
    <View
      className='flex-row items-center justify-center h-full w-full mx-4'>
      <QRCode
        value={vCardValue}
        size={200}
        color="black"
        backgroundColor="white"
      />
    </View>
  )
}

export default QRcode
