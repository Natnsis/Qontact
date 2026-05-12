import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import ShareOptions from '@/components/ShareOptions';
import ConfigureOption from '@/components/ConfigureOption';
import ScanOptions from '@/components/ScanOptions';
import { colors } from '@/constants/color';

type HomeTab = 'configure' | 'share' | 'scan';

const MainTabs = () => {
  const [activeTab, setActiveTab] = useState<HomeTab>('scan');

  return (
    <SafeAreaView style={{ backgroundColor: colors.dark, flex: 1 }}>
      <Header face={activeTab} onChange={setActiveTab} />
      {
        {
          configure: <ConfigureOption />,
          share: <ShareOptions />,
          scan: <ScanOptions />,
        }[activeTab]
      }
    </SafeAreaView>
  );
};

export default MainTabs;
