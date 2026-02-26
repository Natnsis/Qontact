import { colors } from "@/constants/color";
import { View, Text } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { Feather } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PhoneSchema, PhoneType } from "@/schema/phone.schema";
import { toast } from "sonner-native";

const PhoneNumberForm = () => {
  const contacts = [
    { id: '0', name: 'All Contacts', time: '30-01-24', phone: '#*********#' },
    { id: '1', name: 'Natnael Sisay', time: '30-01-24', phone: '+251911223344' },
    { id: '2', name: 'Sara Belay', time: '02-02-24', phone: '+251911556677' },
    { id: '3', name: 'Dawit Isaac', time: '15-02-24', phone: '+251920889900' },
    { id: '4', name: 'Elias Tekle', time: '20-02-24', phone: '+251944112233' },
    { id: '5', name: 'Marta Hailu', time: '22-02-24', phone: '+251912004455' },
    { id: '6', name: 'Yonas Alemu', time: '24-02-24', phone: '+251930778899' },
  ];

  const { handleSubmit, formState: { errors, isSubmitting }, control } = useForm<PhoneType>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: {
      number: '',
      name: ''
    }
  });

  const onSubmit = async (data: PhoneType) => {
    console.log("Submit Data:", data);
    toast.success('number has been saved')
  };

  return (
    <View>
      <Text
        style={{
          color: colors.light,
          fontFamily: 'regular',
          fontSize: 20
        }}
      >
        Phone number infos
      </Text>

      <View className="mt-2 mx-2 p-2">
        <View className="mb-5">
          <Label
            style={{
              color: colors.light,
              fontFamily: 'light',
              fontSize: 12
            }}
          >
            Full Name / Nick Name
          </Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                onChangeText={onChange}
                value={value}
                style={{ fontFamily: 'light' }}
                className="border-[#96dded]" />
            )}
          />
          {errors.name && <Text style={{ color: colors.primary, fontFamily: 'light' }}>{errors.name.message}</Text>}
        </View>

        <View className="mb-5">
          <Label
            style={{
              color: colors.light,
              fontFamily: 'light',
              fontSize: 12
            }}
          >
            Phone Number
          </Label>

          <Controller
            control={control}
            name="number"
            render={({ field: { onChange, value } }) => (
              <Input
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
                style={{ fontFamily: 'light' }}
                className="border-[#96dded]" />
            )}
          />
          {errors.number && <Text style={{ color: colors.primary, fontFamily: 'light' }}>{errors.number.message}</Text>}
        </View>

        <View className="flex-row justify-end">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            style={{ backgroundColor: colors.secondary }}>
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
          Saved Numbers
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
                  <Button
                    size='icon'
                    variant='destructive'
                  >
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

export default PhoneNumberForm
