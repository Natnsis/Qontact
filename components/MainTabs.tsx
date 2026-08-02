import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import ShareOptions from '@/components/ShareOptions';
import ConfigureOption from '@/components/ConfigureOption';
import ScanOptions from '@/components/ScanOptions';
import { useAppColors } from '@/constants/color';

type HomeTab = 'configure' | 'share' | 'scan';

const MainTabs = () => {
  const [activeTab, setActiveTab] = useState<HomeTab>('scan');
  const colors = useAppColors();

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <View className="px-4 pb-1 pt-2">
        <Text style={{ fontFamily: 'bold', fontSize: 20, color: colors.text }}>Linksy</Text>
      </View>

      <View style={{ flex: 1 }}>
        {
          {
            configure: <ConfigureOption />,
            share: <ShareOptions />,
            scan: <ScanOptions />,
          }[activeTab]
        }
      </View>

      <Header face={activeTab} onChange={setActiveTab} />
    </SafeAreaView>
  );
};

export default MainTabs;
