import { colors } from "@/constants/color";
import { View, Text, ScrollView } from "react-native";
import { Button } from "./ui/button";
import { Feather } from '@expo/vector-icons';
import { useState } from "react";
import PhoneNumberForm from "./PhoneNumberForm";
import SocialMediaForm from "./SocialMediaForm";

const ConfigureOption = () => {
  const [config, setConfig] = useState('phone');
  return (
    <View className="flex-1">
      <ScrollView className="mt-2 px-2">
        {/*toggles*/}
        <View className="flex-row items-center gap-2">
          <Button
            className={`flex-row items-center gap-2 ${config === 'media' ? '' : 'border-secondary'}`}
            variant={config === 'phone' ? 'default' : 'outline'}
            onPress={() => setConfig('phone')}
          >
            <Feather
              name="phone"
              size={18}
              color={config === 'phone' ? '#111418' : colors.secondary}
            />
            <Text
              style={{ fontFamily: 'bold' }}
              className={config === 'phone' ? 'text-[#111418]' : 'text-[#96dded]'}
            >
              Phone No.s
            </Text>
          </Button>

          <Button
            className={`flex-row items-center gap-2 ${config === 'media' ? '' : 'border-secondary'}`}
            variant={config === 'media' ? 'default' : 'outline'}
            onPress={() => setConfig('media')}
          >
            <Feather
              name="phone"
              size={18}
              color={config === 'media' ? '#111418' : colors.secondary}
            />
            <Text
              style={{ fontFamily: 'bold' }}
              className={config === 'media' ? 'text-[#111418]' : 'text-[#96dded]'}
            >
              Medias
            </Text>
          </Button>
        </View>

        <View className="mt-5">
          {config === 'phone'
            ?
            <PhoneNumberForm />
            :
            <SocialMediaForm />
          }
        </View>
      </ScrollView>
    </View>
  )
}

export default ConfigureOption
