import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import AppNavigator from "./app/navigation/AppNavigator";
import "./app/globals.css";

// Prevent native splash screen from hiding before initial render
SplashScreen.preventAutoHideAsync().catch(() => {});

const fontAssets = {
  "SF-bold": require("./assets/fonts/SanFranciscoProText/SFProText-Bold.ttf"),
  "SF-medium": require("./assets/fonts/SanFranciscoProText/SFProText-Medium.ttf"),
  "SF-semibold": require("./assets/fonts/SanFranciscoProText/SFProText-Semibold.ttf"),
  "SF-regular": require("./assets/fonts/SanFranciscoProText/SFProText-Regular.ttf"),
  "PP-bold": require("./assets/fonts/poppins/Poppins-Bold.ttf"),
  "PP-semibold": require("./assets/fonts/poppins/Poppins-SemiBold.ttf"),
  "PP-light": require("./assets/fonts/poppins/Poppins-Light.ttf"),
  "PP-regular": require("./assets/fonts/poppins/Poppins-Regular.ttf"),
  "PP-medium": require("./assets/fonts/poppins/Poppins-Medium.ttf"),
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const splashHiddenRef = useRef(false);

  const hideSplash = useCallback(async () => {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    try {
      await SplashScreen.hideAsync();
    } catch {}
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideSplash();
    }
  }, [fontsLoaded, fontError, hideSplash]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer onReady={hideSplash}>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
