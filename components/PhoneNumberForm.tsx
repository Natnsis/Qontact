import { colors } from "@/constants/color"
import { View, Text } from "react-native"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "./ui/button"

const PhoneNumberForm = () => {
  return (
    <View>
      <Text
        style={{
          color: colors.light,
          fontFamily: 'regular',
          fontSize: 20
        }}
      >Phone number infos</Text>

      <View className="mt-2 mx-2 p-2">
        <Label
          style={{
            color: colors.light,
            fontFamily: 'light',
            fontSize: 12
          }}
        >Full Name / Nick Name</Label>
        <Input style={{ fontFamily: 'light' }} className="border-[#96dded] mb-5" />

        <Label
          style={{
            color: colors.light,
            fontFamily: 'light',
            fontSize: 12
          }}
        >
          Phone Number
        </Label>
        <Input
          style={{ fontFamily: 'light' }}
          className="border-[#96dded] mb-5"
          keyboardType="numeric" />

        <View className="flex-row justify-end">
          <Button style={{ backgroundColor: colors.secondary }}>
            <Text style={{ color: colors.dark, fontFamily: 'regular' }}>
              Save
            </Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default PhoneNumberForm
