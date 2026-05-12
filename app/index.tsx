import { Onboarding } from "@/components/Onboarding"
import MainTabs from "@/components/MainTabs"
import { loadCheck } from "@/controllers/onboarding.controller"
import { useEffect, useState } from "react"
import { ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "@/constants/color"

const index = () => {
  const [checkedOnboarding, setCheckedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const isDone = await loadCheck();
      setCheckedOnboarding(!!isDone);
    };

    checkOnboarding();
  }, []);

  if (checkedOnboarding === null) {
    return (
      <SafeAreaView
        style={{ backgroundColor: colors.dark, flex: 1 }}
        className="items-center justify-center"
      >
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (checkedOnboarding) {
    return <MainTabs />
  }

  return (
    <SafeAreaView className="flex-col" style={{ backgroundColor: colors.dark, flex: 1 }}>
      <Onboarding onDone={() => setCheckedOnboarding(true)} />
    </SafeAreaView>
  )
}

export default index
