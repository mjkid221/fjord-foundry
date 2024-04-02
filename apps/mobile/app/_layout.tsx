import FontAwesome from "@expo/vector-icons/FontAwesome";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import { Slot, SplashScreen, usePathname, useRouter } from "expo-router";
import { NativeBaseProvider } from "native-base";
import { useEffect } from "react";
import { LogBox, Pressable, Text, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// eslint-disable-next-line camelcase -- default expo export
export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Native Base Issue
LogBox.ignoreLogs([
  "In React 18, SSRProvider is not necessary and is a noop. You can remove it from your app.",
]);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const [loaded, error] = useFonts({
    // eslint-disable-next-line global-require -- need to load fonts here
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
};

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const storybookEnabled =
    Constants.expoConfig?.extra?.storybookEnabled === "true";
  const storybookOpen = pathname === "/storybook";

  return (
    <NativeBaseProvider>
      {storybookEnabled && (
        <Pressable
          onPress={() => router.replace(!storybookOpen ? "/storybook" : "/")}
          style={{
            paddingTop: insets.top,
            alignSelf: "center",
          }}
        >
          <Text>{!storybookOpen ? "Open" : "Exit"} Storybook</Text>
        </Pressable>
      )}
      <Slot />
    </NativeBaseProvider>
  );
};
export default RootLayout;
