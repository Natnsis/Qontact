import Header from "@/components/Header"
import ScanOptions from "@/components/ScanOptions"
import { useAppColors } from "@/constants/color"
import { SafeAreaView } from "react-native-safe-area-context"
const index = () => {
  const colors = useAppColors();
  return (
    <SafeAreaView style={{
      backgroundColor: colors.background,
      flex: 1
    }}>
      <Header face="hub" />
      <ScanOptions />
    </SafeAreaView>
  )
}

export default index
