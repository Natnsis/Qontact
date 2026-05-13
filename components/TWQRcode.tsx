import { View, ActivityIndicator, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useQuery } from '@tanstack/react-query';
import { getTwitterUrls } from '@/controllers/saveUrl.controller';
import { useAppColors } from '@/constants/color';
const TWQRcode = ({ id }: { id: string }) => {
  const colors = useAppColors();
  const { data: twitterUrls, isLoading } = useQuery({
    queryKey: ['twUrls'],
    queryFn: getTwitterUrls,
  });

  if (isLoading) return <ActivityIndicator size="large" className="mt-10" />;
  const targetObject = twitterUrls?.find((item: any) => item.id === id);
  const qrValue = targetObject ? targetObject.url : "https://x.me/default";

  if (!targetObject && id !== 'all') {
    return <Text className='text-center' style={{ color: colors.primary, fontFamily: 'regular' }}>
      URL not found
    </Text>;
  }

  return (
    <View className='flex-1 items-center justify-center p-4'>
      <View className="bg-white rounded-xl p-2 shadow-md">
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
          className="mt-2 font-bold">
          {targetObject.name}
        </Text>
      )}
    </View>
  );
};

export default TWQRcode;
