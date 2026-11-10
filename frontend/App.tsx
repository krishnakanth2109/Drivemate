import "./app/utils/applyGlobalFont";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import AppNavigator from "./app/navigation/AppNavigator";
import StartingVideoSplash from "./app/components/StartingVideoSplash";
import "./app/globals.css";

// Hide native splash immediately so only the startup video plays from the very start
SplashScreen.hideAsync().catch(() => {});

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
  "Poppins": require("./assets/fonts/poppins/Poppins-Regular.ttf"),
  "Poppins-Regular": require("./assets/fonts/poppins/Poppins-Regular.ttf"),
  "Poppins-Medium": require("./assets/fonts/poppins/Poppins-Medium.ttf"),
  "Poppins-SemiBold": require("./assets/fonts/poppins/Poppins-SemiBold.ttf"),
  "Poppins-Bold": require("./assets/fonts/poppins/Poppins-Bold.ttf"),
  "Poppins-Light": require("./assets/fonts/poppins/Poppins-Light.ttf"),
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [isVideoDone, setIsVideoDone] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar hidden={!isVideoDone} style={isVideoDone ? "dark" : "light"} />
        {fontsLoaded || fontError ? (
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000000" }]} />
        )}
        {!isVideoDone && (
          <StartingVideoSplash onFinish={() => setIsVideoDone(true)} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
