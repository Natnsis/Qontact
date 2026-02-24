import { View, Text } from 'react-native'
import { Button } from './ui/button'
import { colors } from '@/constants/color'

const Header = ({ face }: { face: string }) => {
  const page = face;

  return (
    <View className='flex-row justify-between px-2'>
      <Button
        style={face === 'configure' ? { backgroundColor: colors.background } : {}}
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
        className='rounded-full'
      >
        <Text
          style={{
            fontFamily: 'regular',
            color: colors.primary
          }}
        >
          Profile data
        </Text>
      </Button>
    </View>
  )
}

export default Header
