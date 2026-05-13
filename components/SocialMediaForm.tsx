import { useAppColors } from "@/constants/color"
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

const platformOptions = [
  { key: 'telegram', label: 'Telegram', icon: 'send', hint: '@Natnsis or t.me/Natnsis' },
  { key: 'twitter', label: 'Twitter / X', icon: 'twitter', hint: '@Natnsis or x.com/Natnsis' },
] as const;

const normalizeSocialUrl = (rawValue: string, platform: string) => {
  const cleaned = rawValue.trim().replace(/^@+/, '');
  const withProtocol = cleaned.match(/^https?:\/\//i) ? cleaned : `https://${cleaned}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const username = url.pathname.split('/').filter(Boolean)[0] ?? '';

    if (platform === 'telegram' && ['t.me', 'telegram.me'].includes(host) && username) {
      return `https://t.me/${username}`;
    }

    if (platform === 'twitter' && ['x.com', 'twitter.com'].includes(host) && username) {
      return `https://x.com/${username}`;
    }
  } catch {
    // Fall through and treat the value as a username.
  }

  const username = cleaned
    .replace(/^https?:\/\//i, '')
    .replace(/^(t\.me|telegram\.me|x\.com|twitter\.com)\//i, '')
    .split(/[/?#]/)[0];

  return platform === 'telegram' ? `https://t.me/${username}` : `https://x.com/${username}`;
};

const SocialMediaForm = () => {
  const [platform, setPlatform] = useState<'telegram' | 'twitter'>('telegram');
  const colors = useAppColors();

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
        url: normalizeSocialUrl(data.url, platform),
        createdAt: now,
        id: Date.now().toString(),
        platform
      };
      await addUrl(payload);
      reset();
      queryClient.invalidateQueries({ queryKey: ['urls'] });
      queryClient.invalidateQueries({ queryKey: ['tgUrls'] });
      queryClient.invalidateQueries({ queryKey: ['twUrls'] });
    } catch (error) {
      toast.error('Could not save link');
      console.error(error);
    }
  };

  const selectedPlatform = platformOptions.find((item) => item.key === platform)!;

  return (
    <View>
      <View
        className="mb-5 rounded-lg border p-3"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <Label style={{ color: colors.muted, fontFamily: 'regular', fontSize: 12 }}>
          Platform
        </Label>
        <View className="mt-2 flex-row gap-2">
          {platformOptions.map((item) => {
            const selected = platform === item.key;
            return (
              <Button
                key={item.key}
                className="flex-1 flex-row"
                variant={selected ? 'default' : 'outline'}
                onPress={() => setPlatform(item.key)}
                style={{
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                }}
              >
                <Feather name={item.icon} size={17} color={selected ? colors.background : colors.secondary} />
                <Text style={{ color: selected ? colors.background : colors.text, fontFamily: 'regular' }}>
                  {item.label}
                </Text>
              </Button>
            );
          })}
        </View>

        <View className="mt-4">
          <Label style={{ color: colors.muted, fontFamily: 'regular', fontSize: 12 }}>
            Label
          </Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                onChangeText={onChange}
                value={value}
                style={{ fontFamily: 'light', borderColor: colors.border, color: colors.text }}
                placeholder="Main profile"
                placeholderTextColor={colors.muted}
              />
            )}
          />
          {errors.name ? (
            <Text style={{ fontFamily: 'light', color: colors.primaryHover, marginTop: 4 }}>
              {errors.name.message}
            </Text>
          ) : null}
        </View>

        <View className="mt-4">
          <Label style={{ color: colors.muted, fontFamily: 'regular', fontSize: 12 }}>
            Username or URL
          </Label>
          <Controller
            control={control}
            name="url"
            render={({ field: { onChange, value } }) => (
              <Input
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                style={{ fontFamily: 'light', borderColor: colors.border, color: colors.text }}
                placeholder={selectedPlatform.hint}
                placeholderTextColor={colors.muted}
              />
            )}
          />
          {errors.url ? (
            <Text style={{ fontFamily: 'light', color: colors.primaryHover, marginTop: 4 }}>
              {errors.url.message}
            </Text>
          ) : null}
        </View>

        <View className="mt-5 flex-row justify-end">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            style={{ backgroundColor: colors.secondary }}>
            <Feather name="check" color={colors.background} size={16} />
            <Text style={{ color: colors.background, fontFamily: 'regular' }}>
              Save link
            </Text>
          </Button>
        </View>
      </View>

      <View>
        <Text style={{ color: colors.text, fontFamily: 'bold', fontSize: 16 }}>
          Saved links
        </Text>

        <View className="mt-2">
          {mediaUrls && mediaUrls.length !== 0 ? (
            mediaUrls.map((c, index) => (
              <View
                key={c.id || index}
                className="mb-2 rounded-lg border p-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Feather
                        name={c.platform === 'twitter' ? 'twitter' : 'send'}
                        color={colors.background}
                        style={{ backgroundColor: colors.primary }}
                        className="p-2 rounded-full"
                      />
                      <View className="flex-1">
                        <Text style={{ color: colors.text, fontFamily: 'regular' }} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={{ color: colors.muted, fontFamily: 'light', fontSize: 11 }}>
                          {c.createdAt}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{ color: colors.secondary, fontFamily: 'regular', marginTop: 8 }}
                      numberOfLines={1}>
                      {c.url}
                    </Text>
                  </View>

                  <Button
                    size='icon'
                    variant='destructive'
                    onPress={async () => {
                      await deleteUrlById(c.id);
                      queryClient.invalidateQueries({ queryKey: ['urls'] });
                      queryClient.invalidateQueries({ queryKey: ['tgUrls'] });
                      queryClient.invalidateQueries({ queryKey: ['twUrls'] });
                    }}
                  >
                    <Feather name="trash" color="white" />
                  </Button>
                </View>
              </View>
            ))
          ) : (
            <View
              className="mt-2 rounded-lg border border-dashed p-4"
              style={{ borderColor: colors.border }}>
              <Text style={{ color: colors.muted, fontFamily: 'light', textAlign: 'center' }}>
                No links saved yet.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View >
  )
}

export default SocialMediaForm
