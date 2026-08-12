import ConfigureOption from "@/components/ConfigureOption"
import Header from "@/components/Header"
import { useAppColors } from "@/constants/color"
import { SafeAreaView } from "react-native-safe-area-context"

const index = () => {
  const colors = useAppColors();
  return (
    <SafeAreaView style={{
      backgroundColor: colors.background,
      flex: 1
    }}>
      <Header face="configure" />
      <ConfigureOption />
    </SafeAreaView>
  )
}

export default index
