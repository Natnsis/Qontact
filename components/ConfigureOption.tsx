import { useAppColors } from "@/constants/color";
import { View, Text, ScrollView } from "react-native";
import { Button } from "./ui/button";
import { Feather } from '@expo/vector-icons';
import { useState } from "react";
import PhoneNumberForm from "./PhoneNumberForm";
import SocialMediaForm from "./SocialMediaForm";

const ConfigureOption = () => {
  const [config, setConfig] = useState('phone');
  const colors = useAppColors();

  const options = [
    { key: 'phone', title: 'Phone', icon: 'phone' },
    { key: 'media', title: 'Social', icon: 'at-sign' },
  ] as const;

  return (
    <View className="flex-1">
      <ScrollView
        className="px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 12 }}>
        <View className="mb-4 flex-row gap-2">
          {options.map((item) => {
            const selected = config === item.key;
            return (
              <Button
                key={item.key}
                className="h-12 flex-1 flex-row rounded-lg border"
                variant="outline"
                onPress={() => setConfig(item.key)}
                style={{
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                }}
              >
                <View className="flex-row items-center gap-2">
                  <Feather
                    name={item.icon}
                    size={18}
                    color={selected ? colors.background : colors.secondary}
                  />
                  <Text style={{ color: selected ? colors.background : colors.text, fontFamily: 'bold' }}>
                    {item.title}
                  </Text>
                </View>
              </Button>
            );
          })}
        </View>

        <View>
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
