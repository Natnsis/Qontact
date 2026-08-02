import { useAppColors } from '@/constants/color';
import { clearMyDevData } from '@/controllers/overall.controller';
import { Feather } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import { useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, Text, View, Platform } from 'react-native';
import { toast } from 'sonner-native';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { parseQrPayload, ParsedQrData } from '@/lib/qr';
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

const TELEGRAM_URL = 'https://t.me/bugpusher';

const ScanOptions = () => {
  const colors = useAppColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ParsedQrData | null>(null);
  const [contactPermission, setContactPermission] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const isOpeningRef = useRef(false);

  useEffect(() => {
    const checkContactsPermission = async () => {
      const { status } = await Contacts.getPermissionsAsync();
      if (status === 'granted') {
        setContactPermission('granted');
      } else if (status === 'denied') {
        setContactPermission('denied');
      }
    };
    checkContactsPermission();
  }, []);

  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      setContactPermission('granted');
      return true;
    } else if (status === 'denied') {
      setContactPermission('denied');
    }
    return false;
  };

  const openAppSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      Linking.openURL('app-settings:');
    }
  };

  const handleBarcodeScanned = async ({ data, raw }: BarcodeScanningResult) => {
    const payload = raw?.trim().length && raw.trim() !== data.trim() ? raw.trim() : data;
    if (!payload || isOpeningRef.current) return;

    isOpeningRef.current = true;
    setLastScanned(payload);

    const parsed = parseQrPayload(payload);
    setScanResult(parsed);

    try {
      if (parsed.contactPayload) {
        const granted = await requestContactsPermission();
        if (!granted) {
          toast.error('Permission denied. Please allow contacts access in settings.');
          return;
        }
        const contact: Contacts.Contact = {
          contactType: Contacts.ContactTypes.Person,
          name: parsed.contactPayload.name ?? parsed.contactPayload.phone ?? '',
          ...(parsed.contactPayload.name ? { firstName: parsed.contactPayload.name } : {}),
          ...(parsed.contactPayload.phone
            ? {
                phoneNumbers: [
                  {
                    number: parsed.contactPayload.phone,
                    label: 'mobile',
                  },
                ],
              }
            : {}),
        };
        await Contacts.presentFormAsync(undefined, contact, { isNew: true });
        return;
      }

      if (parsed.actionUrl) {
        const canOpen = await Linking.canOpenURL(parsed.actionUrl);
        if (!canOpen) {
          toast.error('Detected a link but this device cannot open it.');
          return;
        }
        await Linking.openURL(parsed.actionUrl);
        return;
      }

      toast.success('QR scanned. View decoded content below.');
    } catch (error) {
      toast.error('Could not complete this action.');
    } finally {
      setTimeout(() => {
        isOpeningRef.current = false;
      }, 1600);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 12, paddingTop: 12 }}>
      <Badge variant="secondary">
        <Text style={{ color: colors.light, fontFamily: 'regular' }} className="p-2">
          Point the camera at a QR code — Linksy saves the contact or opens the link instantly.
        </Text>
      </Badge>

      <View
        style={{
          backgroundColor: colors.background,
          borderColor: colors.secondary,
          borderWidth: 1,
          overflow: 'hidden',
        }}
        className="relative mt-3 h-[420px] rounded-lg">
        {!permission ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text style={{ color: colors.light, fontFamily: 'regular' }}>
              Checking camera access...
            </Text>
          </View>
        ) : !permission.granted ? (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <Feather name="camera" color={colors.primary} size={42} />
            <Text style={{ color: colors.light, fontFamily: 'regular' }} className="text-center">
              Camera permission is needed to scan QR codes.
            </Text>
            <Button onPress={requestPermission} style={{ backgroundColor: colors.secondary }}>
              <Text style={{ color: colors.dark, fontFamily: 'regular' }}>Allow camera</Text>
            </Button>
          </View>
        ) : (
          <>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
            <View className="absolute inset-0 items-center justify-center">
              <View
                style={{
                  borderColor: colors.primary,
                  borderWidth: 2,
                  width: 230,
                  height: 230,
                  backgroundColor: 'transparent',
                }}
                className="rounded-lg"
              />
            </View>
            <View
              style={{ backgroundColor: 'rgba(17,20,24,0.82)' }}
              className="absolute bottom-0 left-0 right-0 px-3 py-3">
              <Text style={{ color: colors.light, fontFamily: 'light' }} numberOfLines={1}>
                {scanResult
                  ? scanResult.title
                  : lastScanned
                    ? `Last scan: ${lastScanned}`
                    : 'Point the camera at a QR code'}
              </Text>
            </View>
          </>
        )}
      </View>

      {scanResult ? (
        <View
          style={{
            backgroundColor: colors.background,
            borderColor: colors.secondary,
            borderWidth: 1,
          }}
          className="my-4 rounded-2xl p-4">
          <Text
            style={{ color: colors.light, fontFamily: 'regular', fontSize: 16 }}
            className="mb-2">
            {scanResult.title}
          </Text>
          <Text style={{ color: colors.light, fontFamily: 'light', fontSize: 13 }} className="mb-3">
            {scanResult.description}
          </Text>
          {scanResult.entries.map((entry, index) => (
            <View key={index} className="mb-2">
              <Text style={{ color: colors.primary, fontFamily: 'regular' }}>{entry.label}</Text>
              <Text style={{ color: colors.light, fontFamily: 'light' }}>{entry.value}</Text>
            </View>
          ))}

          {(scanResult.contactPayload || scanResult.actionUrl) ? (
            <View className="flex-row items-center gap-2">
              <Feather name="check-circle" color={colors.secondary} size={14} />
              <Text style={{ color: colors.secondary, fontFamily: 'light', fontSize: 12 }}>
                {scanResult.actionLabel ?? 'Action completed'} automatically.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="mt-4">
        <AlertDialog>
          <AlertDialogTrigger
            style={{
              borderWidth: 1,
              borderColor: colors.secondary,
              backgroundColor: colors.dark,
            }}
            className="flex-row items-center justify-center gap-2 rounded py-2">
            <Feather name="trash" color={colors.light} size={15} />
            <Text style={{ color: colors.light, fontFamily: 'regular' }}>Clear all data</Text>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: colors.primary, fontFamily: 'regular' }}>
                Clear all saved data?
              </AlertDialogTitle>
              <AlertDialogDescription style={{ fontFamily: 'light' }}>
                This will permanently delete your saved phone numbers and social links from this
                device.
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
                style={{
                  borderColor: colors.primary,
                  borderWidth: 2,
                  backgroundColor: colors.dark,
                }}
                onPress={clearMyDevData}>
                <Text style={{ color: colors.primary, fontFamily: 'regular' }}>Continue</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </View>

      <View style={{ flex: 1 }} />

      <View className="mb-2 flex-row justify-center">
        <Text style={{ fontFamily: 'light', fontSize: 12, color: colors.light }}>
          developed by orca-dev.{' '}
        </Text>
        <Text
          onPress={() => Linking.openURL(TELEGRAM_URL)}
          style={{
            fontFamily: 'light',
            fontSize: 12,
            color: colors.secondary,
            textDecorationLine: 'underline',
          }}>
          Telegram
        </Text>
      </View>
    </ScrollView>
  );
};

export default ScanOptions;
