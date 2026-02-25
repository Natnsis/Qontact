import { colors } from "@/constants/color";
import { View, Text, Linking } from "react-native";
import { Button } from "./ui/button";
import { Feather } from '@expo/vector-icons';
import { Badge } from "./ui/badge";

const HubOptions = () => {
  return (
    <View className="px-2 h-full flex-1 gap-2">
      <View className="mt-2">
        <Badge variant='secondary'>
          <Text style={{ color: colors.light, fontFamily: 'regular' }} className="p-2">
            Note: none of your numbers or links are saved on server, everything is on your device.
          </Text>
        </Badge>
      </View>

      <View className="flex-row gap-2 mt-2">
        <Button
          style={{
            borderWidth: 1,
            borderColor: colors.secondary,
            backgroundColor: colors.dark,
          }}
        >
          <Feather name="github" color={colors.light} size={15} />
          <Text style={{ color: colors.light, fontFamily: 'regular' }}>
            Source code
          </Text>
        </Button>

        <Button
          style={{
            borderWidth: 1,
            borderColor: colors.secondary,
            backgroundColor: colors.dark,
          }}
        >
          <Feather name="user" color={colors.light} size={15} />
          <Text style={{ color: colors.light, fontFamily: 'regular' }}>
            Contact developer
          </Text>
        </Button>
      </View>

      <Button
        style={{
          borderWidth: 1,
          borderColor: colors.secondary,
          backgroundColor: colors.dark,
        }}
      >
        <Feather name="users" color={colors.light} size={15} />
        <Text style={{ color: colors.light, fontFamily: 'regular' }}>
          Join community
        </Text>
      </Button>

      <View className="mt-2">
        <Badge variant='secondary'>
          <View style={{ padding: 20 }}>
            <Text style={{ color: colors.light, fontFamily: 'regular' }} className="p-2">
              To ensure a seamless function, please populate your details in the
              <Text
                style={{ color: colors.primary, fontFamily: 'light' }}> Configure </Text>
              section before sharing your QR. Your data is stored locally for instant access.
              Got an idea for an update or a feature request? Feel free to
              <Text
                onPress={() => Linking.openURL('https://t.me/your_link')}
                style={{ color: colors.secondary, fontFamily: 'light', textDecorationLine: 'underline' }}
              > contact the developer </Text>
              directly, we're always building.
            </Text>
          </View>
        </Badge>
      </View>

      <View style={{ flex: 1 }} />

      <View className="flex-row justify-center">
        <Text style={{ fontFamily: 'light', fontSize: 12, color: colors.light }}>
          developed with ❤️ by orca-dev.
        </Text>
      </View>
    </View>
  )
}

export default HubOptions 
