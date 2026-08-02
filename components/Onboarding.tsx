import { useAppColors } from '@/constants/color';
import { FlatList, View, Dimensions, Text, Image, Pressable } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addCheck, loadCheck } from '@/controllers/onboarding.controller';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('screen');

const SLIDES = [
  {
    id: '1',
    text: "Tired of sharing your data orally whenever you create a connection?",
    img: require('@/assets/images/onboarding1.png')
  },
  {
    id: '2',
    text: "Configure once and share via QR for all times.",
    img: require('@/assets/images/onboarding2.png')
  },
  {
    id: '3',
    text: "A faster, more modern way to stay connected.",
    img: require('@/assets/images/onboarding3.png')
  },
];
type OnboardingProps = {
  onDone?: () => void;
}

export function Onboarding({ onDone }: OnboardingProps) {
  const colors = useAppColors();
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    checkData()
  }, []);

  const checkData = async () => {
    try {
      const checked = await loadCheck()
      if (checked) {
        if (onDone) {
          onDone()
          return;
        }
        router.replace('/share');
      }
    } catch (error) {
      console.log(error)
    }
  }

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const finish = async () => {
    await addCheck()
    if (onDone) {
      onDone()
      return;
    }
    router.replace('/share')
  };

  const handlePress = async () => {
    if (isLastSlide) {
      await finish();
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
      });
    }
  };

  return (
    <FlatList
      data={SLIDES}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      onScroll={(event) => {
        const scrollOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollOffset / width);
        setCurrentIndex(index);
      }}
      ref={flatListRef}
      renderItem={({ item }) => (
        <SafeAreaView
          style={{ width, height, backgroundColor: colors.background }}
          className='px-6'
        >
          <View
            style={{ height: height * 0.5 }}
            className='items-center justify-center'
          >
            <Image
              alt='onboarding-img'
              source={item.img}
              resizeMode="cover"
              style={{ width: '90%', height: '90%', borderRadius: 9999 }}
            />
          </View>

          <View className='flex-row justify-center gap-1.5'>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: index <= currentIndex ? colors.secondary : colors.border,
                  width: index <= currentIndex ? 24 : 8,
                  height: 4,
                  borderRadius: 2
                }}
              />
            ))}
          </View>

          {/* Fixed-height flex region: text of any length centers here so the
              footer below never shifts position between slides. */}
          <View className='flex-1 justify-center'>
            <Text
              style={{ fontFamily: 'regular', color: colors.text, fontSize: 28, lineHeight: 36 }}>
              {item.text}
            </Text>
          </View>

          <View className='flex-row items-center justify-between pb-4'>
            {isLastSlide ? (
              <View />
            ) : (
              <Pressable onPress={finish} hitSlop={12}>
                <Text style={{ fontFamily: 'regular', color: colors.text, fontSize: 16, opacity: 0.6 }}>
                  Skip
                </Text>
              </Pressable>
            )}

            <Button
              onPress={handlePress}
              style={{
                backgroundColor: colors.surface,
                width: 72,
                height: 72,
                borderWidth: 1,
                borderColor: colors.primary
              }}
              className='rounded-full'
            >
              {isLastSlide ?
                <Feather name="cpu" size={32} color={colors.primary} /> :
                <Feather name="arrow-right" size={32} color={colors.primary} />}
            </ Button>
          </View>
        </SafeAreaView>
      )
      }
    />
  );
}
