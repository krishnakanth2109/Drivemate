import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  Vibration,
  Animated,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SparklesIcon, CloseIcon, PlayIcon } from "./Icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ARENA_WIDTH = Math.min(SCREEN_WIDTH - 36, 380);
const ARENA_HEIGHT = 460;
const BALL_RADIUS = 12;
const GRAVITY = 0.22;
const HIGH_SCORE_KEY = "@drivemate_ball_game_high_score";

interface Obstacle {
  id: number;
  y: number;
  width: number;
  height: number;
  x: number;
  speed: number;
  direction: number; // 1 or -1
  color: string;
}

interface BallGameProps {
  visible: boolean;
  onClose: () => void;
}

export const BallGame: React.FC<BallGameProps> = ({ visible, onClose }) => {
  const [gameState, setGameState] = useState<"idle" | "playing" | "out">("idle");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isNewHigh, setIsNewHigh] = useState<boolean>(false);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Ball physics state (kept in refs for high-fps animation loop)
  const ballPosRef = useRef({
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT - 35,
    vx: 0,
    vy: 0,
  });

  const [ballDisplay, setBallDisplay] = useState({
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT - 35,
  });

  // Obstacles state
  const obstaclesRef = useRef<Obstacle[]>([
    {
      id: 1,
      y: 110,
      width: 110,
      height: 18,
      x: 30,
      speed: 2.2,
      direction: 1,
      color: "#f59e0b",
    },
    {
      id: 2,
      y: 200,
      width: 130,
      height: 18,
      x: 180,
      speed: 2.6,
      direction: -1,
      color: "#ef4444",
    },
    {
      id: 3,
      y: 290,
      width: 120,
      height: 18,
      x: 60,
      speed: 2.0,
      direction: 1,
      color: "#8b5cf6",
    },
    {
      id: 4,
      y: 370,
      width: 100,
      height: 16,
      x: 120,
      speed: 1.8,
      direction: -1,
      color: "#0ea5e9",
    },
  ]);

  const [obstaclesDisplay, setObstaclesDisplay] = useState<Obstacle[]>([
    ...obstaclesRef.current,
  ]);

  const animFrameRef = useRef<number | null>(null);
  const hasLaunchedRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);
  const celebrationAnim = useRef(new Animated.Value(0)).current;

  // Load High Score on mount
  useEffect(() => {
    async function loadHighScore() {
      try {
        const saved = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        if (saved) {
          setHighScore(parseInt(saved, 10) || 0);
        }
      } catch {}
    }
    loadHighScore();
  }, [visible]);

  // Save new high score helper
  const updateHighScoreIfNeeded = useCallback(async (currentScore: number) => {
    try {
      const saved = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      const prev = saved ? parseInt(saved, 10) || 0 : 0;
      if (currentScore > prev) {
        setIsNewHigh(true);
        setHighScore(currentScore);
        await AsyncStorage.setItem(HIGH_SCORE_KEY, currentScore.toString());
      }
    } catch {}
  }, []);

  // Flash celebration banner
  const triggerCelebration = (text: string) => {
    setCelebrationMsg(text);
    celebrationAnim.setValue(0);
    Animated.sequence([
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.delay(650),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setCelebrationMsg(null));
  };

  // Reset ball to launch pad
  const resetBallToBottom = useCallback(() => {
    ballPosRef.current = {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT - 35,
      vx: 0,
      vy: 0,
    };
    hasLaunchedRef.current = false;
    setBallDisplay({ x: ARENA_WIDTH / 2, y: ARENA_HEIGHT - 35 });
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    setIsNewHigh(false);
    resetBallToBottom();

    // Reset obstacles
    obstaclesRef.current = [
      {
        id: 1,
        y: 110,
        width: 110,
        height: 18,
        x: 30,
        speed: 2.2,
        direction: 1,
        color: "#f59e0b",
      },
      {
        id: 2,
        y: 200,
        width: 130,
        height: 18,
        x: 180,
        speed: 2.6,
        direction: -1,
        color: "#ef4444",
      },
      {
        id: 3,
        y: 290,
        width: 120,
        height: 18,
        x: 60,
        speed: 2.0,
        direction: 1,
        color: "#8b5cf6",
      },
      {
        id: 4,
        y: 370,
        width: 100,
        height: 16,
        x: 120,
        speed: 1.8,
        direction: -1,
        color: "#0ea5e9",
      },
    ];

    setGameState("playing");
  }, [resetBallToBottom]);

  // Main 60fps Physics & Collision Engine
  useEffect(() => {
    if (gameState !== "playing") {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let isRunning = true;

    const gameLoop = () => {
      if (!isRunning) return;

      const ball = ballPosRef.current;

      // 1. Update ball position if in air
      if (hasLaunchedRef.current) {
        ball.vy += GRAVITY;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce off left/right side boundaries
        if (ball.x - BALL_RADIUS <= 0) {
          ball.x = BALL_RADIUS;
          ball.vx = -ball.vx * 0.75;
        } else if (ball.x + BALL_RADIUS >= ARENA_WIDTH) {
          ball.x = ARENA_WIDTH - BALL_RADIUS;
          ball.vx = -ball.vx * 0.75;
        }

        // 2. CHECK WIN: Reached the TOP GOAL (Score Zone)!
        if (ball.y - BALL_RADIUS <= 38) {
          Vibration.vibrate(35);
          const nextScore = scoreRef.current + 1;
          scoreRef.current = nextScore;
          setScore(nextScore);
          updateHighScoreIfNeeded(nextScore);

          triggerCelebration(`+1 SCORE! 🎯 (${nextScore})`);

          // Slightly speed up obstacles as score goes higher
          const speedMultiplier = 1 + Math.min(nextScore * 0.08, 1.2);
          obstaclesRef.current = obstaclesRef.current.map((obs) => ({
            ...obs,
            speed: (1.8 + Math.random() * 1.4) * speedMultiplier,
            direction: Math.random() > 0.5 ? 1 : -1,
          }));

          // Reset ball to launch pad for the next run
          resetBallToBottom();
        }

        // 3. CHECK OUT: Ball dropped below arena floor
        if (ball.y - BALL_RADIUS > ARENA_HEIGHT) {
          Vibration.vibrate([0, 80, 50, 100]);
          setGameState("out");
          updateHighScoreIfNeeded(scoreRef.current);
          return;
        }
      }

      // 4. Update obstacle positions
      const updatedObstacles = obstaclesRef.current.map((obs) => {
        let newX = obs.x + obs.speed * obs.direction;
        let newDir = obs.direction;

        // Bounce obstacles between left and right walls
        if (newX <= 0) {
          newX = 0;
          newDir = 1;
        } else if (newX + obs.width >= ARENA_WIDTH) {
          newX = ARENA_WIDTH - obs.width;
          newDir = -1;
        }

        return { ...obs, x: newX, direction: newDir };
      });

      obstaclesRef.current = updatedObstacles;

      // 5. CHECK COLLISION with any obstacle -> OUT!
      if (hasLaunchedRef.current) {
        for (const obs of updatedObstacles) {
          const closestX = Math.max(obs.x, Math.min(ball.x, obs.x + obs.width));
          const closestY = Math.max(obs.y, Math.min(ball.y, obs.y + obs.height));

          const distX = ball.x - closestX;
          const distY = ball.y - closestY;
          const distanceSq = distX * distX + distY * distY;

          if (distanceSq < BALL_RADIUS * BALL_RADIUS) {
            // Collision occurred -> OUT!
            Vibration.vibrate([0, 100, 60, 120]);
            setGameState("out");
            updateHighScoreIfNeeded(scoreRef.current);
            return;
          }
        }
      }

      // Commit to react state for render
      setBallDisplay({ x: ball.x, y: ball.y });
      setObstaclesDisplay(updatedObstacles);

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, resetBallToBottom, updateHighScoreIfNeeded]);

  // Touch / Tap Controls
  const handleHop = (direction: "left" | "center" | "right") => {
    if (gameState !== "playing") return;

    hasLaunchedRef.current = true;
    Vibration.vibrate(15);

    const ball = ballPosRef.current;
    if (direction === "left") {
      ball.vx = -3.4;
      ball.vy = -6.8;
    } else if (direction === "right") {
      ball.vx = 3.4;
      ball.vy = -6.8;
    } else {
      ball.vx = (Math.random() - 0.5) * 1.5;
      ball.vy = -7.5;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.arcadeBadge}>
              <Text style={styles.arcadeBadgeText}>ARCADE</Text>
            </View>
            <Text style={styles.headerTitle}>Rising Ball</Text>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <CloseIcon size={18} color="#09090b" />
          </TouchableOpacity>
        </View>

        {/* Scoreboard Bar */}
        <View style={styles.scoreRow}>
          <View style={styles.scorePill}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>

          <View style={styles.highScorePill}>
            <SparklesIcon size={14} color="#f59e0b" />
            <Text style={styles.highScoreLabel}>BEST: {highScore}</Text>
          </View>
        </View>

        {/* Floating Celebration Notification */}
        {celebrationMsg && (
          <Animated.View
            style={[
              styles.celebrationBanner,
              {
                opacity: celebrationAnim,
                transform: [
                  {
                    translateY: celebrationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-15, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.celebrationText}>{celebrationMsg}</Text>
          </Animated.View>
        )}

        {/* Game Arena Board */}
        <View style={styles.arenaContainer}>
          {/* Top Goal Zone */}
          <View style={styles.goalZone}>
            <Text style={styles.goalText}>🎯 REACH TOP TO SCORE +1 🎯</Text>
          </View>

          {/* Moving Obstacles */}
          {obstaclesDisplay.map((obs) => (
            <View
              key={obs.id}
              style={[
                styles.obstacle,
                {
                  top: obs.y,
                  left: obs.x,
                  width: obs.width,
                  height: obs.height,
                  backgroundColor: obs.color,
                },
              ]}
            />
          ))}

          {/* Active Ball */}
          <View
            style={[
              styles.ball,
              {
                left: ballDisplay.x - BALL_RADIUS,
                top: ballDisplay.y - BALL_RADIUS,
              },
            ]}
          >
            <View style={styles.ballInnerGlow} />
          </View>

          {/* Bottom Launch Area Line */}
          <View style={styles.launchArea}>
            <Text style={styles.launchAreaText}>TAP HOP BUTTONS BELOW</Text>
          </View>

          {/* Start Screen Overlay */}
          {gameState === "idle" && (
            <View style={styles.overlay}>
              <View style={styles.modalCard}>
                <View style={styles.ballIconCircle}>
                  <View style={styles.demoBall} />
                </View>
                <Text style={styles.overlayTitle}>Rising Ball</Text>
                <Text style={styles.overlayDesc}>
                  Propel the ball to the top green zone to score points. Dodge moving obstacle bars! Don't get OUT!
                </Text>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={startGame}
                  activeOpacity={0.85}
                >
                  <PlayIcon size={18} color="#ffffff" />
                  <Text style={styles.playBtnText}>START GAME</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* OUT / Game Over Overlay */}
          {gameState === "out" && (
            <View style={styles.overlay}>
              <View style={[styles.modalCard, styles.outCard]}>
                <View style={styles.outBadge}>
                  <Text style={styles.outBadgeText}>OUT!</Text>
                </View>
                <Text style={styles.outTitle}>Game Over</Text>

                {isNewHigh && (
                  <View style={styles.newHighPill}>
                    <SparklesIcon size={14} color="#f59e0b" />
                    <Text style={styles.newHighText}>NEW PERSONAL RECORD!</Text>
                  </View>
                )}

                <View style={styles.resultRow}>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>FINAL SCORE</Text>
                    <Text style={styles.resultScore}>{score}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>HIGH SCORE</Text>
                    <Text style={styles.resultBest}>{highScore}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.restartBtn}
                  onPress={startGame}
                  activeOpacity={0.85}
                >
                  <Text style={styles.restartBtnText}>PLAY AGAIN ↻</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Interactive Hop Controls */}
        <View style={styles.controlsSection}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.leftBtn]}
            onPress={() => handleHop("left")}
            disabled={gameState !== "playing"}
            activeOpacity={0.7}
          >
            <Text style={styles.controlBtnArrow}>◀</Text>
            <Text style={styles.controlBtnText}>HOP LEFT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.centerBtn]}
            onPress={() => handleHop("center")}
            disabled={gameState !== "playing"}
            activeOpacity={0.7}
          >
            <Text style={styles.centerBtnArrow}>▲</Text>
            <Text style={styles.centerBtnText}>BOOST</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.rightBtn]}
            onPress={() => handleHop("right")}
            disabled={gameState !== "playing"}
            activeOpacity={0.7}
          >
            <Text style={styles.controlBtnArrow}>▶</Text>
            <Text style={styles.controlBtnText}>HOP RIGHT</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default BallGame;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arcadeBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  arcadeBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreRow: {
    width: ARENA_WIDTH,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  scorePill: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  scoreLabel: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scoreValue: {
    color: "#10b981",
    fontSize: 22,
    fontWeight: "900",
  },
  highScorePill: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  highScoreLabel: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "800",
  },
  celebrationBanner: {
    position: "absolute",
    top: 105,
    zIndex: 99,
    backgroundColor: "#10b981",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  celebrationText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  arenaContainer: {
    width: ARENA_WIDTH,
    height: ARENA_HEIGHT,
    backgroundColor: "#18181b",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#27272a",
    position: "relative",
    overflow: "hidden",
  },
  goalZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 42,
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  goalText: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  obstacle: {
    position: "absolute",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ball: {
    position: "absolute",
    width: BALL_RADIUS * 2,
    height: BALL_RADIUS * 2,
    borderRadius: BALL_RADIUS,
    backgroundColor: "#38bdf8",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  ballInnerGlow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  launchArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  launchAreaText: {
    color: "#71717a",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 50,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#27272a",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  ballIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 2,
    borderColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  demoBall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#38bdf8",
  },
  overlayTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  overlayDesc: {
    fontSize: 13,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
  },
  playBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  outCard: {
    borderColor: "#ef4444",
  },
  outBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  outBadgeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  outTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 12,
  },
  newHighPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
  },
  newHighText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "900",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  resultItem: {
    alignItems: "center",
  },
  resultLabel: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 4,
  },
  resultScore: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  resultDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#3f3f46",
  },
  resultBest: {
    color: "#f59e0b",
    fontSize: 24,
    fontWeight: "900",
  },
  restartBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  restartBtnText: {
    color: "#09090b",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  controlsSection: {
    width: ARENA_WIDTH,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 14,
  },
  controlBtn: {
    flex: 1,
    backgroundColor: "#18181b",
    borderWidth: 1.5,
    borderColor: "#27272a",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  leftBtn: {
    borderColor: "#3f3f46",
  },
  rightBtn: {
    borderColor: "#3f3f46",
  },
  centerBtn: {
    flex: 1.1,
    backgroundColor: "#27272a",
    borderColor: "#38bdf8",
  },
  controlBtnArrow: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 2,
  },
  controlBtnText: {
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  centerBtnArrow: {
    color: "#38bdf8",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 2,
  },
  centerBtnText: {
    color: "#38bdf8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
