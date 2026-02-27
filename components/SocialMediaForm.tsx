import { colors } from "@/constants/color"
import { View, Text } from "react-native"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Feather } from '@expo/vector-icons';
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MediaSchema, MediaType } from "@/schema/media.schema"
import { addUrl, deleteUrlById, getUrls } from "@/controllers/saveUrl.controller"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner-native"

const SocialMediaForm = () => {
  const [platform, setPlatform] = useState('telegram');

  const { data: mediaUrls } = useQuery({
    queryKey: ['urls'],
    queryFn: getUrls,
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

  const { handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(MediaSchema),
    defaultValues: {
      name: '',
      url: '',
      platform: 'telegram'
    }
  });

  const onSubmit = async (data: MediaType) => {
    try {
      const now = getFormattedDate();
      const payload = {
        ...data,
        createdAt: now,
        id: Date.now().toString(),
        platform: platform.toString()
      };
      await addUrl(payload);
      reset();
      queryClient.invalidateQueries({ queryKey: ['urls'] });
    } catch (error) {
      toast.error('error occured');
      console.error(error);
    }
  };

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
        <View className="mb-2">
          <Label
            style={{
              color: colors.light,
              fontFamily: 'light',
              fontSize: 12
            }}
          >
            Channel/ Account name
          </Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                onChangeText={onChange}
                value={value}
                style={{ fontFamily: 'light' }}
                className="border-[#96dded]"
                placeholder="My main channel" />
            )}
          />
          {errors.name &&
            <Text style={{ fontFamily: 'light', color: colors.primary }}>
              {errors.name.message}
            </Text>}
        </View>

        <View className=" mb-2">
          <Label
            style={{
              color: colors.light,
              fontFamily: 'light',
              fontSize: 12
            }}
          >
            Your URL
          </Label>
          <Controller
            control={control}
            name="url"
            render={({ field: { onChange, value } }) => (
              <Input
                onChangeText={onChange}
                value={value}
                style={{ fontFamily: 'light' }}
                className="border-[#96dded]"
                placeholder="http://*****" />
            )}
          />
          {errors.url &&
            <Text style={{ fontFamily: 'light', color: colors.primary }}>
              {errors.url.message}
            </Text>}
        </View>

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
          <Button
            onPress={
              handleSubmit(onSubmit)
            }
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
          Saved Links
        </Text>

        <View className="mt-2 px-2">
          {mediaUrls && mediaUrls.length !== 0 ? (
            mediaUrls.map((c, index) => (
              <View key={c.id || index} className="mb-2">
                <View className="flex-row items-center gap-2">
                  <Feather
                    name={c.platform === 'twitter' ? 'twitter' : 'send'} // Dynamic icon!
                    color={colors.dark}
                    style={{ backgroundColor: colors.secondary }}
                    className="p-2 rounded-full"
                  />
                  <Text style={{ color: colors.light, fontFamily: 'regular' }}>
                    {c.name}
                  </Text>
                </View>

                <View className="flex-row gap-2 items-center justify-between">
                  <View>
                    <Text style={{ color: colors.light, fontFamily: 'light', fontSize: 10 }}>
                      {c.createdAt}
                    </Text>
                    <Text style={{ color: colors.light, fontFamily: 'regular' }}>
                      {c.url}
                    </Text>
                    <Text style={{ color: colors.light, fontFamily: 'regular' }}>
                      {c.platform}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Button
                      size='icon'
                      variant='destructive'
                      onPress={async () => {
                        await deleteUrlById(c.id);
                        queryClient.invalidateQueries({ queryKey: ['urls'] });
                      }}
                    >
                      <Feather name="trash" color="white" />
                    </Button>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text
              style={{
                color: colors.primary,
                fontFamily: 'light'
              }}
              className="text-center">
              No saved URLs.
            </Text>
          )}
        </View>
      </View>
    </View >
  )
}

export default SocialMediaForm
