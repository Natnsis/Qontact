import { colors } from "@/constants/color"
import { View, Text } from "react-native"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Feather } from '@expo/vector-icons';
import { useState } from "react"

const SocialMediaForm = () => {
  const [platform, setPlatform] = useState('telegram');
  const contacts = [
    { id: '0', name: 'All Contacts', time: '30-01-24', phone: '#*********#' },
    { id: '1', name: 'Natnael Sisay', time: '30-01-24', phone: '+251911223344' },
    { id: '2', name: 'Sara Belay', time: '02-02-24', phone: '+251911556677' },
    { id: '3', name: 'Dawit Isaac', time: '15-02-24', phone: '+251920889900' },
    { id: '4', name: 'Elias Tekle', time: '20-02-24', phone: '+251944112233' },
    { id: '5', name: 'Marta Hailu', time: '22-02-24', phone: '+251912004455' },
    { id: '6', name: 'Yonas Alemu', time: '24-02-24', phone: '+251930778899' },
  ];

  return (
    <View>
      <Text
        style={{
          color: colors.light,
          fontFamily: 'regular',
          fontSize: 18
        }}
        className="">Telegram / Twitter links</Text>

      <View className="mt-2 mx-2 p-2">
        <Label
          style={{
            color: colors.light,
            fontFamily: 'light',
            fontSize: 12
          }}
        >
          Your URL
        </Label>
        <Input
          style={{ fontFamily: 'light' }}
          className="border-[#96dded] mb-5"
          placeholder="http://*****" />

        <Label
          style={{
            color: colors.light,
            fontFamily: 'light',
            fontSize: 12
          }}
        >
          Platrorm Type
        </Label>
        <View className="flex-row items-center gap-2">
          <Button
            size='icon'
            className={platform === 'twitter' ? 'bg-[#1DA1F2]' : 'bg-transparent'}
            onPress={() => setPlatform('twitter')}
          >
            <Feather
              name="twitter"
              size={20}
              color={platform === 'twitter' ? colors.secondary : 'white'}
            />
          </Button>
          <Button
            size='icon'
            className={platform === 'telegram' ? 'bg-[#1DA1F2]' : 'bg-transparent'}
            onPress={() => setPlatform('telegram')}
          >
            <Feather
              name="send"
              size={20}
              color={platform === 'telegram' ? colors.secondary : 'white'}
            />
          </Button>
        </View>

        <View className="flex-row justify-end">
          <Button style={{ backgroundColor: colors.secondary }}>
            <Text style={{ color: colors.dark, fontFamily: 'regular' }}>
              Save
            </Text>
          </Button>
        </View>
      </View>

      <View>
        <Text
          style={{
            color: colors.primary,
            fontFamily: 'regular',
            fontSize: 16
          }}>
          Saved Links
        </Text>

        <View>
          {contacts.map((c, index) => (
            <View key={index} className="mb-2">
              <View className="flex-row items-center gap-2">
                <Feather
                  name='phone'
                  color={colors.dark}
                  style={{ backgroundColor: colors.secondary }}
                  className="p-2 rounded-full" />
                <Text
                  style={{ color: colors.light, fontFamily: 'regular' }}>
                  {c.name}
                </Text>
              </View>
              <View className="flex-row gap-2 items-center justify-between">
                <View>
                  <Text
                    style={{ color: colors.light, fontFamily: 'light' }}>
                    {c.time}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text
                    style={{ color: colors.light, fontFamily: 'regular' }}>
                    {c.phone}
                  </Text>
                  <Button size='icon' variant='destructive'>
                    <Feather name="trash" />
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View >
  )
}

export default SocialMediaForm
