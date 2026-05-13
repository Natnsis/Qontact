import ConfigureOption from "@/components/ConfigureOption"
import Header from "@/components/Header"
import { useAppColors } from "@/constants/color"
import { Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const index = () => {
  const { height } = Dimensions.get('screen');
  const colors = useAppColors();
  return (
    <SafeAreaView style={{
      backgroundColor: colors.background,
      height: height
    }}>
      <Header face="configure" />
      <ConfigureOption />
    </SafeAreaView>
  )
}

export default index
