import { ActivityIndicator, View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useQuery } from "@tanstack/react-query";
import { getTelegramUrls } from '@/controllers/saveUrl.controller';
import { colors } from '@/constants/color';

const TQRcode = ({ id }: { id: string }) => {
  const { data: telegramUrls, isLoading } = useQuery({
    queryKey: ['tgUrls'],
    queryFn: getTelegramUrls,
  });

  if (isLoading) return <ActivityIndicator size="large" className="mt-10" />;
  const targetObject = telegramUrls?.find((item: any) => item.id === id);
  const qrValue = targetObject ? targetObject.url : "https://t.me/default";

  if (!targetObject && id !== 'all') {
    return <Text className='text-center' style={{ color: colors.primary, fontFamily: 'regular' }}>
      URL not found
    </Text>;
  }

  return (
    <View className='flex-1 items-center justify-center p-4'>
      <View className="bg-white rounded-xl shadow-md">
        <QRCode
          value={qrValue}
          size={220}
          color="black"
          backgroundColor="white"
        />
      </View>
      {targetObject && (
        <Text
          style={{ fontFamily: 'light', color: colors.primary }}
          className="text-white mt-1 font-bold">
          {targetObject.name}
        </Text>
      )}
    </View>
  );
};

export default TQRcode
