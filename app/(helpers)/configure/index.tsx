import Header from "@/components/Header"
import { colors } from "@/constants/color"
import { Dimensions, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const index = () => {
  const { height } = Dimensions.get('screen');
  return (
    <SafeAreaView style={{
      backgroundColor: colors.dark,
      height: height
    }}>
      <Header face="configure" />
    </SafeAreaView>
  )
}

export default index
