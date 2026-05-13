import { useAppColors } from '@/constants/color';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import TWQRcode from './TWQRcode';
import { useQuery } from "@tanstack/react-query";
import { getTwitterUrls } from '@/controllers/saveUrl.controller';

const TwitterQR = () => {
  const [showQr, setShowQr] = useState(false);
  const [selectedId, setSelectedId] = useState('')
  const colors = useAppColors();

  const { data: twitterUrls } = useQuery({
    queryKey: ['twUrls'],
    queryFn: getTwitterUrls,
  });

  const selectedLink = twitterUrls?.find((item) => item.id === selectedId);

  return (
    <View>
      <View
        className='mt-3 rounded-lg border p-3'
        style={{ minHeight: 310, backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className='flex-row items-start justify-between gap-3'>
          <View className="flex-1">
            <Text style={{ color: colors.text, fontFamily: 'bold', fontSize: 18 }}>Twitter / X QR</Text>
            <Text style={{ color: colors.muted, fontFamily: 'light', marginTop: 2 }} numberOfLines={1}>
              {selectedLink ? selectedLink.url : 'Select a Twitter profile below'}
            </Text>
          </View>
          <Button
            onPress={() => setShowQr(!showQr)}
            disabled={!selectedId}
            style={{ backgroundColor: selectedId ? colors.secondary : colors.border }}
          >
            <Feather name={showQr ? 'eye-off' : 'grid'} color={colors.background} size={16} />
            <Text style={{ color: colors.background, fontFamily: 'regular' }}>
              {showQr ? 'Hide QR' : 'Show QR'}
            </Text>
          </Button>
        </View>

        <View className='flex-row p-2 justify-center items-center flex-1'>
          {showQr && selectedId ? (
            <TWQRcode id={selectedId} />
          ) : (
            <View
              style={{ backgroundColor: colors.background, borderColor: colors.border }}
              className='w-full items-center justify-center rounded-lg border border-dashed p-6'
            >
              <Feather name="twitter" color={colors.primary} size={38} />
              <Text style={{ color: colors.text, fontFamily: 'bold', marginTop: 10 }}>
                {selectedLink?.name ?? 'Twitter / X profile'}
              </Text>
              <Text style={{ color: colors.muted, fontFamily: 'light', fontSize: 12 }} className='mt-1 text-center'>
                Choose a link, then tap Show QR.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className='mb-2 mt-5'>
        <Text style={{ fontFamily: 'bold', color: colors.text }}>Select a Twitter link</Text>
      </View>
      {twitterUrls && twitterUrls.length > 0 ? (
        twitterUrls.map((item) => {
          const selected = selectedId === item.id;
          return (
            <Pressable
              key={item.id}
              style={{
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                borderWidth: 1,
              }}
              onPress={() => {
                setSelectedId(item.id!);
                setShowQr(false);
              }}
              className='mb-3 rounded-lg p-3'
            >
              <View className="flex-row justify-between items-center">
                <Text style={{ fontFamily: 'regular', color: selected ? colors.background : colors.text }}>
                  {item.name}
                </Text>
                <Feather name="twitter" color={selected ? colors.background : colors.secondary} size={20} />
              </View>

              <Text numberOfLines={1} style={{ fontFamily: 'light', color: selected ? colors.background : colors.muted, marginTop: 6 }}>
                {item.url}
              </Text>
            </Pressable>
          );
        })
      ) : (
        <View className="rounded-lg border border-dashed p-4" style={{ borderColor: colors.border }}>
          <Text style={{ color: colors.muted, textAlign: 'center', fontFamily: 'light' }}>
            No Twitter links saved yet.
          </Text>
        </View>
      )}
    </View>
  )
}

export default TwitterQR
