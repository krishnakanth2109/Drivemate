import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");
const startingVideo = require("../../starting.mp4");

interface StartingVideoSplashProps {
  onFinish: () => void;
}

export const StartingVideoSplash: React.FC<StartingVideoSplashProps> = ({
  onFinish,
}) => {
  const [showSkip, setShowSkip] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasFinishedRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  }, [fadeAnim, onFinish]);

  const player = useVideoPlayer(startingVideo, (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    player.play();
    const sub = player.addListener("playToEnd", () => {
      handleComplete();
    });

    // Show subtle skip button after 1.5 seconds
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1500);

    // Safety timeout in case video stalls or fails to report end
    const maxTimer = setTimeout(() => {
      handleComplete();
    }, 6000);

    return () => {
      sub.remove();
      clearTimeout(skipTimer);
      clearTimeout(maxTimer);
    };
  }, [player, handleComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      {showSkip && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.skipBtnText}>Skip ➔</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default StartingVideoSplash;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    zIndex: 99999,
    elevation: 99999,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  video: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  skipBtn: {
    position: "absolute",
    top: 52,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 10000,
  },
  skipBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
