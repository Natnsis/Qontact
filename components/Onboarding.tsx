import { colors } from '@/constants/color';
import { FlatList, View, Dimensions, Text, Image } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addCheck, loadCheck } from '@/controllers/onboarding.controller';

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
export function Onboarding() {
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
        router.replace('/share');
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handlePress = async () => {
    const isLastSlide = currentIndex === SLIDES.length - 1;
    if (isLastSlide) {
      await addCheck()
      router.replace('/share')
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
      onScroll={(event) => {
        const scrollOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollOffset / width);
        setCurrentIndex(index);
      }}
      ref={flatListRef}
      renderItem={({ item }) => (
        <View
          style={{ width, height, backgroundColor: colors.dark }}
          className='px-2'
        >
          <View
            style={{ height: height * 0.6 }}
            className='flex items-center justify-center'
          >
            <Image
              alt='onboarding-img'
              source={item.img}
              className="w-[90%] h-[90%] rounded-full"
            />
          </View>

          <View className='flex-row justify-center gap-1.5'>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: index <= currentIndex ? colors.secondary : colors.light,
                  width: index <= currentIndex ? 24 : 8,
                  height: 4,
                  borderRadius: 2
                }}
              />
            ))}
          </View>

          <Text
            style={{ fontFamily: 'regular', color: colors.light, fontSize: 32 }}>
            {item.text}
          </Text>
          <View
            className="flex-row justify-end items-end">
            <Button
              onPress={handlePress}
              style={{
                backgroundColor: colors.dark,
                width: 100,
                height: 100,
                borderWidth: 1,
                borderColor: colors.primary
              }}
              className='rounded-full'
            >
              {currentIndex === SLIDES.length - 1 ?
                <Feather name="cpu" size={50} color={colors.primary} /> :
                <Feather name="arrow-right" size={50} color={colors.primary} />}
            </ Button>
          </View>
        </View >
      )
      }
    />
  );
}
