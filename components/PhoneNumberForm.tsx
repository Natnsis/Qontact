import { useAppColors } from "@/constants/color";
import { View, Text, Platform, PermissionsAndroid } from "react-native";
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
import { useState } from "react";
import { getSimNumbers, SimNumberInfo } from "sim-numbers";
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
  const [fetchingSim, setFetchingSim] = useState(false);
  const [simOptions, setSimOptions] = useState<SimNumberInfo[]>([]);
  const [showSimPicker, setShowSimPicker] = useState(false);

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

  const { handleSubmit, reset, setValue, formState: { errors, isSubmitting }, control } = useForm<PhoneType>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: {
      number: '',
      name: '',
    }
  });

  const handleGetFromPhone = async () => {
    if (Platform.OS !== 'android' || fetchingSim) return;

    setFetchingSim(true);
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
        {
          title: 'Phone number access',
          message: 'Linksy needs access to your phone number to fill it in automatically.',
          buttonPositive: 'Allow',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        toast.error('Permission denied. Please allow phone access in settings.');
        return;
      }

      const numbers = await getSimNumbers();

      if (numbers.length === 0) {
        toast.error("Couldn't detect a number on this device — enter it manually.");
        return;
      }

      if (numbers.length === 1) {
        if (!numbers[0].number) {
          toast.error("Couldn't detect a number on this device — enter it manually.");
          return;
        }
        setValue('number', numbers[0].number, { shouldValidate: true });
        toast.success('Number filled in from your SIM.');
        return;
      }

      setSimOptions(numbers);
      setShowSimPicker(true);
    } catch (error) {
      toast.error('Could not read phone number.');
    } finally {
      setFetchingSim(false);
    }
  };

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
      <View
        className="mb-5 rounded-lg border p-3"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View>
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
            <Text style={{ color: colors.destructive, fontFamily: 'light', marginTop: 4 }}>
              {errors.name.message}
            </Text>}
        </View>

        <View className="mt-4">
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
            <Text style={{ color: colors.destructive, fontFamily: 'light', marginTop: 4 }}>
              {errors.number.message}
            </Text>}
        </View>

        <View className={Platform.OS === 'android' ? 'mt-5 flex-row flex-wrap gap-3' : 'mt-5 flex-row justify-end'}>
          {Platform.OS === 'android' ? (
            <Button
              onPress={handleGetFromPhone}
              disabled={fetchingSim}
              variant="outline"
              className="flex-1 flex-row"
              style={{ borderColor: colors.primary, backgroundColor: colors.surface }}>
              <Feather name="smartphone" color={colors.primary} size={16} />
              <Text style={{ color: colors.primary, fontFamily: 'regular' }}>
                {fetchingSim ? 'Checking...' : 'Get from phone'}
              </Text>
            </Button>
          ) : null}

          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={Platform.OS === 'android' ? 'flex-1 flex-row' : 'flex-row'}
            style={{ backgroundColor: colors.secondary }}>
            <Feather name="check" color={colors.background} size={16} />
            <Text style={{ color: colors.background, fontFamily: 'regular' }}>
              Save number
            </Text>
          </Button>
        </View>

        {Platform.OS === 'android' ? (
          <AlertDialog open={showSimPicker} onOpenChange={setShowSimPicker}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle style={{ color: colors.primary, fontFamily: 'regular' }}>
                  Choose a SIM
                </AlertDialogTitle>
                <AlertDialogDescription style={{ fontFamily: 'light' }}>
                  This device has multiple SIMs. Pick the number to use.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <View className="gap-2">
                {simOptions.map((sim, index) => (
                  <Button
                    key={`${sim.slotIndex}-${index}`}
                    variant="outline"
                    disabled={!sim.number}
                    onPress={() => {
                      if (!sim.number) return;
                      setValue('number', sim.number, { shouldValidate: true });
                      setShowSimPicker(false);
                      toast.success('Number filled in from your SIM.');
                    }}
                    className="flex-row items-center justify-between"
                    style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
                    <View className="flex-row items-center gap-2">
                      <Feather name="smartphone" color={colors.secondary} size={16} />
                      <Text style={{ color: colors.text, fontFamily: 'regular' }}>
                        {sim.carrierName}
                      </Text>
                    </View>
                    <Text style={{ color: sim.number ? colors.muted : colors.destructive, fontFamily: 'light' }}>
                      {sim.number ?? 'number not available'}
                    </Text>
                  </Button>
                ))}
              </View>

              <AlertDialogFooter>
                <AlertDialogCancel
                  style={{ borderColor: colors.primary, borderWidth: 2 }}
                  className="w-full">
                  <Text style={{ color: colors.primary, fontFamily: 'regular' }}>Cancel</Text>
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </View>

      <View>
        <Text style={{ color: colors.text, fontFamily: 'bold', fontSize: 16 }}>
          Saved Numbers
        </Text>

        <View className="mt-2">
          {contactNumbers && contactNumbers.length !== 0 ?
            contactNumbers.map((c, index) => (
              <View
                key={index}
                className="mb-2 rounded-lg border p-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <View className="flex-row items-center gap-3">
                  <Feather
                    name='phone'
                    color={colors.background}
                    style={{ backgroundColor: colors.secondary }}
                    className="p-2 rounded-full" />
                  <View className="flex-1">
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
                <View className="mt-3 flex-row gap-2 items-center justify-between">
                  <Text
                    style={{ color: colors.muted, fontFamily: 'light', fontSize: 11 }}>
                    {c.createdAt}
                  </Text>
                  <AlertDialog>
                    <AlertDialogTrigger
                      style={{ backgroundColor: colors.destructive }}
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
            ))
            :
            <View
              className="rounded-lg border border-dashed p-4"
              style={{ borderColor: colors.border }}>
              <Text
                style={{ fontFamily: 'light', color: colors.muted, textAlign: 'center' }}>
                No numbers saved yet.
              </Text>
            </View>
          }
        </View>
      </View>
    </View >
  )
}

export default PhoneNumberForm
