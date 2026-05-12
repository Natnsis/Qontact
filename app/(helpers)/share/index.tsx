import { colors } from '@/constants/color';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import ShareOptions from '@/components/ShareOptions';

const index = () => {
  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.dark,
        flex: 1,
      }}
    >
      <Header face='share' />
      <ShareOptions />
    </SafeAreaView>
  );
};

export default index
