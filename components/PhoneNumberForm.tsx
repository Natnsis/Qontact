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
import { addNumber, getNumbers, wipeContacts } from "@/controllers/saveNumber.controller";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const PhoneNumberForm = () => {
  const { data: contactNumbers } = useQuery({
    queryKey: ['contacts'],
    queryFn: getNumbers,
  });

  const queryClient = useQueryClient();

  const getFormattedDate = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(now);
  };

  const { handleSubmit, formState: { errors, isSubmitting }, control } = useForm<PhoneType>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: {
      number: '',
      name: '',
      createdAt: getFormattedDate().toString()
    }
  });

  const onSubmit = async (data: PhoneType) => {
    try {
      await addNumber(data);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error) {
      toast.error('error while adding number')
    }
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
        <View className="flex-row items-center justify-between">
          <Text
            style={{
              color: colors.primary,
              fontFamily: 'regular',
              fontSize: 16
            }}>
            Saved Numbers
          </Text>
          <Button
            variant='ghost'
            onPress={() => {
              wipeContacts()
              queryClient.invalidateQueries({ queryKey: ['contacts'] });
            }}
          >
            <Text
              style={{
                fontFamily: 'regular',
                color: colors.light
              }}
            >
              Remove All
            </Text>
          </Button>
        </View>
        {contactNumbers ?
          <View>
            {contactNumbers.map((c, index) => (
              <View key={index} className="mb-2">
                <View className="flex-row items-center gap-2">
                  <Feather
                    name='phone'
                    color={colors.dark}
                    style={{ backgroundColor: colors.secondary }}
                    className="p-2 rounded-full" />
                  <View>
                    <Text
                      style={{ color: colors.light, fontFamily: 'regular' }}>
                      {c.name}
                    </Text>
                    <Text
                      style={{ color: colors.light, fontFamily: 'regular' }}>
                      {c.number}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2 items-center justify-between">
                  <View>
                    <Text
                      style={{ color: colors.light, fontFamily: 'light' }}>
                      {c.createdAt}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
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
          :
          <Text
            style={{ fontFamily: 'light', color: colors.primary }}
            className="text-center mt-2">
            no numbers found.
          </Text>
        }
      </View>
    </View >
  )
}

export default PhoneNumberForm
