import { colors } from "@/constants/color";
import { View, Text, ScrollView } from "react-native";
import { Button } from "./ui/button";
import { Feather } from '@expo/vector-icons';

const ConfigureOption = () => {
  return (
    <View className="flex-1">
      <ScrollView className="mt-2 px-2">
        <View className="flex-row items-center gap-2">
          <Button className="flex-row items-center ">
            <Feather name="phone" />
            <Text style={{ fontFamily: 'bold' }}>Phone nos.</Text>
          </Button>

          <Button className="flex-row items-center">
            <Feather name="phone" />
            <Text style={{ fontFamily: 'bold' }}>Medias</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

export default ConfigureOption
