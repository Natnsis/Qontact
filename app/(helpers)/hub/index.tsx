import Header from "@/components/Header"
import ScanOptions from "@/components/ScanOptions"
import { colors } from "@/constants/color"
import { SafeAreaView } from "react-native-safe-area-context"
const index = () => {
  return (
    <SafeAreaView style={{
      backgroundColor: colors.dark,
      flex: 1
    }}>
      <Header face="hub" />
      <ScanOptions />
    </SafeAreaView>
  )
}

export default index
