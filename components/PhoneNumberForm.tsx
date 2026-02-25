import { colors } from "@/constants/color"
import { View, Text } from "react-native"
const PhoneNumberForm = () => {
  return (
    <View>
      <Text
        style={{
          color: colors.light,
          fontFamily: 'regular',
          fontSize: 18
        }}
        className="">Phone number infos</Text>
      <Text>all data will be saved locally, and share whenever you choose</Text>
      <View>

      </View>
    </View>
  )
}

export default PhoneNumberForm
