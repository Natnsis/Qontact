import { useAppColors } from "@/constants/color";
import { View, Text } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { Feather } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PhoneSchema, PhoneType } from "@/schema/phone.schema";
import { addNumber, deleteNumberById, getNumbers } from "@/controllers/saveNumber.controller";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const PhoneNumberForm = () => {
  const colors = useAppColors();
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

  const { handleSubmit, reset, formState: { errors, isSubmitting }, control } = useForm<PhoneType>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: {
      number: '',
      name: '',
    }
  });

  const onSubmit = async (data: PhoneType) => {
    try {
      const now = getFormattedDate();
      const payload = {
        ...data,
        createdAt: now,
        id: Date.now().toString()
      };
      await addNumber(payload);
      reset();
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error) {
      toast.error('error occured');

      console.error(error);
    }
  };

  return (
    <View>
      <View className="mt-2 mx-2 p-2">
        <View className="mb-5">
          <Label
            style={{
              color: colors.muted,
              fontFamily: 'regular',
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
                placeholder='john wick'
                onChangeText={onChange}
                value={value}
                placeholderTextColor={colors.muted}
                style={{ fontFamily: 'light', borderColor: colors.border, color: colors.text }} />
            )}
          />
          {errors.name &&
            <Text style={{ color: colors.primary, fontFamily: 'light' }}>
              {errors.name.message}
            </Text>}
        </View>

        <View className="mb-5">
          <Label
            style={{
              color: colors.muted,
              fontFamily: 'regular',
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
                placeholder="0912345678"
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
                placeholderTextColor={colors.muted}
                style={{ fontFamily: 'light', borderColor: colors.border, color: colors.text }} />
            )}
          />
          {errors.number &&
            <Text style={{ color: colors.primary, fontFamily: 'light' }}>
              {errors.number.message}
            </Text>}
        </View>

        <View className="flex-row justify-end">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            style={{ backgroundColor: colors.secondary }}>
            <Feather name="check" color={colors.background} size={16} />
            <Text style={{ color: colors.background, fontFamily: 'regular' }}>
              Save number
            </Text>
          </Button>
        </View>
      </View>

      <View className="mt-2">
        <View className="flex-row items-center">
          <Text
            style={{
              color: colors.primary,
              fontFamily: 'regular',
              fontSize: 16
            }}>
            Saved Numbers
          </Text>
        </View>
        {contactNumbers && contactNumbers.length !== 0 ?
          <View>
            {contactNumbers.map((c, index) => (
              <View key={index} className="mb-2">
                <View className="flex-row items-center gap-2">
                  <Feather
                    name='phone'
                    color={colors.background}
                    style={{ backgroundColor: colors.secondary }}
                    className="p-2 rounded-full" />
                  <View>
                    <Text
                      style={{ color: colors.text, fontFamily: 'regular' }}>
                      {c.name}
                    </Text>
                    <Text
                      style={{ color: colors.muted, fontFamily: 'regular' }}>
                      {c.number}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2 items-center justify-between">
                  <View>
                    <Text
                      style={{ color: colors.muted, fontFamily: 'light' }}>
                      {c.createdAt}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger
                        style={{ backgroundColor: '#ef4444' }}
                        className="h-10 w-10 items-center justify-center rounded-md"
                      >
                        <Feather name="trash" color="white" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle style={{ color: colors.primary, fontFamily: 'regular' }}>
                            Delete this number?
                          </AlertDialogTitle>
                          <AlertDialogDescription style={{ fontFamily: 'light' }}>
                            This will remove {c.name}'s phone number from this device.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row justify-between">
                          <AlertDialogCancel
                            style={{ borderColor: colors.primary, borderWidth: 2 }}
                            className="w-[45%]">
                            <Text style={{ color: colors.primary, fontFamily: 'regular' }}>Cancel</Text>
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="w-[45%]"
                            style={{ borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.background }}
                            onPress={async () => {
                              await deleteNumberById(c.id)
                              queryClient.invalidateQueries({ queryKey: ['contacts'] });
                            }}
                          >
                            <Text style={{ color: colors.primary, fontFamily: 'regular' }}>Continue</Text>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </View>
                </View>
              </View>
            ))}
          </View>
          :
          <Text
            style={{ fontFamily: 'light', color: colors.primary }}
            className="text-center mt-2">
            no numbers saved.
          </Text>
        }
      </View>
    </View >
  )
}

export default PhoneNumberForm
