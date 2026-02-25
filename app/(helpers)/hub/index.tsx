import Header from "@/components/Header"
import HubOptions from "@/components/HubOptions"
import { colors } from "@/constants/color"
import { Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const index = () => {
  const { height } = Dimensions.get('screen');
  return (
    <SafeAreaView style={{
      backgroundColor: colors.dark,
      height: height
    }}>
      <Header face="hub" />
      <HubOptions />
    </SafeAreaView>
  )
}

export default index
