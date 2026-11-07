import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
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
  const [isMuted, setIsMuted] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [telemetryText, setTelemetryText] = useState("INITIALIZING DRIVEMATE TELEMETRY...");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const brandAnim = useRef(new Animated.Value(0)).current;
  const brandScaleAnim = useRef(new Animated.Value(0.92)).current;
  const dotPulseAnim = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hasFinishedRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  }, [fadeAnim, onFinish]);

  // Video player initialized with sound enabled by default
  const player = useVideoPlayer(startingVideo, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  const toggleSound = useCallback(() => {
    try {
      const nextMuted = !isMuted;
      player.muted = nextMuted;
      setIsMuted(nextMuted);
    } catch {}
  }, [isMuted, player]);

  useEffect(() => {
    player.play();

    // 1. Entrance animation for the animated DRIVEMATE keyword
    Animated.parallel([
      Animated.timing(brandAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(brandScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous neon dot pulse loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(dotPulseAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Progress bar animation synced to 10-second duration
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 10000,
      useNativeDriver: false,
    }).start();

    // 4. Progress percentage counter & dynamic telemetry updates
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / 9800) * 100));
      setProgressPercent(pct);

      if (pct < 28) {
        setTelemetryText("INITIALIZING NAVIGATION MATRIX...");
      } else if (pct < 60) {
        setTelemetryText("SYNCHRONIZING DRIVEMATE FLEET...");
      } else if (pct < 88) {
        setTelemetryText("CALIBRATING REALTIME TRAFFIC SENSORS...");
      } else {
        setTelemetryText("DRIVEMATE CORE ONLINE • READY");
      }
    }, 100);

    // 5. Completion listener
    const sub = player.addListener("playToEnd", () => {
      handleComplete();
    });

    // 6. Show subtle skip button after 1.5 seconds
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1500);

    // 7. Safety timeout matching the full 10.02s video plus buffer
    const maxTimer = setTimeout(() => {
      handleComplete();
    }, 11000);

    return () => {
      sub.remove();
      pulseLoop.stop();
      clearInterval(interval);
      clearTimeout(skipTimer);
      clearTimeout(maxTimer);
    };
  }, [player, handleComplete, brandAnim, brandScaleAnim, dotPulseAnim, progressAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Layer 1: Ambient edge-to-edge glow background */}
      <View style={StyleSheet.absoluteFill}>
        <VideoView
          player={player}
          style={styles.bgVideo}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={styles.ambientDarkFilter} />
      </View>

      {/* Layer 2: Pristine centered video (contain mode keeps full emblem, text & map visible) */}
      <View style={styles.videoStage}>
        <VideoView
          player={player}
          style={styles.mainVideo}
          contentFit="contain"
          nativeControls={false}
        />
      </View>

      {/* Layer 3: Top HUD Navigation Bar */}
      <View style={styles.topHud}>
        <View style={styles.liveBadge}>
          <Animated.View style={[styles.pulsingDot, { opacity: dotPulseAnim }]} />
          <Text style={styles.liveBadgeText}>DRIVEMATE OS • ONLINE</Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.audioBtn}
            onPress={toggleSound}
            activeOpacity={0.75}
          >
            <Text style={styles.audioBtnText}>{isMuted ? "🔇 Muted" : "🔊 Sound"}</Text>
          </TouchableOpacity>

          {showSkip && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.skipBtnText}>Skip ➔</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Layer 4: Prominently Animated "DRIVEMATE" Keyword Overlay */}
      <Animated.View
        style={[
          styles.brandContainer,
          {
            opacity: brandAnim,
            transform: [{ scale: brandScaleAnim }],
          },
        ]}
      >
        <View style={styles.glowAura} />
        <Text style={styles.brandTitle}>DRIVEMATE</Text>
        <View style={styles.taglinePill}>
          <Text style={styles.taglineText}>YOUR JOURNEY, CONNECTED</Text>
        </View>
      </Animated.View>

      {/* Layer 5: Futuristic Telemetry & Progress Tracker */}
      <View style={styles.bottomTelemetry}>
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>{telemetryText}</Text>
          <Text style={styles.telemetryPercent}>{progressPercent}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>
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
    backgroundColor: "#030712",
    zIndex: 99999,
    elevation: 99999,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "space-between",
  },
  bgVideo: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    opacity: 0.35,
  },
  ambientDarkFilter: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(3, 7, 18, 0.72)",
  },
  videoStage: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  mainVideo: {
    width: "100%",
    height: "100%",
  },
  topHud: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 44 : 54,
    paddingHorizontal: 20,
    zIndex: 100000,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 6, 23, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.35)",
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#00e5ff",
    marginRight: 7,
  },
  liveBadgeText: {
    color: "#00e5ff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audioBtn: {
    backgroundColor: "rgba(2, 6, 23, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  audioBtnText: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "700",
  },
  skipBtn: {
    backgroundColor: "rgba(0, 229, 255, 0.18)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.6)",
  },
  skipBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  brandContainer: {
    position: "absolute",
    top: Platform.OS === "android" ? 100 : 115,
    width: "100%",
    alignItems: "center",
    zIndex: 100000,
  },
  glowAura: {
    position: "absolute",
    width: 220,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 229, 255, 0.12)",
    top: 0,
  },
  brandTitle: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 4,
    textShadowColor: "rgba(0, 229, 255, 0.85)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  taglinePill: {
    marginTop: 6,
    backgroundColor: "rgba(2, 6, 23, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.25)",
  },
  taglineText: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  bottomTelemetry: {
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === "android" ? 36 : 46,
    zIndex: 100000,
  },
  telemetryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  telemetryLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  telemetryPercent: {
    color: "#00e5ff",
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00e5ff",
    borderRadius: 2,
  },
});
