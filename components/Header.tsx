import { View, Text } from 'react-native'
import { Button } from './ui/button'
import { colors } from '@/constants/color'
import { useRouter } from 'expo-router'

const Header = ({ face }: { face: string }) => {
  const router = useRouter()

  return (
    <View className='flex-row justify-between px-2'>
      <Button
        style={face === 'configure' ? { backgroundColor: colors.background } : {}}
        variant={face === 'configure' ? 'default' : 'ghost'}
        onPress={() => router.replace('/configure')}
        className='rounded-full'
      >
        <Text
          style={{
            fontFamily: 'regular',
            color: colors.primary
          }}
        >
          Configure
        </Text>
      </Button>

      <Button
        style={face === 'share' ? { backgroundColor: colors.background } : {}}
        variant={face === 'share' ? 'default' : 'ghost'}
        onPress={() => router.replace('/share')}
        className='rounded-full'
      >
        <Text
          style={{
            fontFamily: 'regular',
            color: colors.primary
          }}
        >
          Share
        </Text>
      </Button>

      <Button
        style={face === 'profile' ? { backgroundColor: colors.background } : {}}
        variant={face === 'profile' ? 'default' : 'ghost'}
        className='rounded-full'
        onPress={() => router.replace('/profile')}
      >
        <Text
          style={{
            fontFamily: 'regular',
            color: colors.primary
          }}
        >
          Inner Hub
        </Text>
      </Button>
    </View>
  )
}

export default Header
