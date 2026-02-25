import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const TQRcode = () => {

  const telegram_url = "https://t.me/Flawless_22_4"

  return (
    <View
      className='flex-row items-center justify-center h-full w-full mx-4'>
      <QRCode
        value={telegram_url}
        size={200}
        color="black"
        backgroundColor="white"
      />
    </View>
  )
}

export default TQRcode
