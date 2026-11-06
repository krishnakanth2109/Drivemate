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
  GestureResponderEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SparklesIcon, CloseIcon, PlayIcon } from "./Icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ARENA_WIDTH = Math.min(SCREEN_WIDTH - 36, 380);
const ARENA_HEIGHT = 470;
const BALL_RADIUS = 13;
const GRAVITY = 0.23;
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

interface CollectibleItem {
  id: number;
  x: number;
  y: number;
  type: "gem" | "shield";
  collected: boolean;
}

interface BallGameProps {
  visible: boolean;
  onClose: () => void;
}

export const BallGame: React.FC<BallGameProps> = ({ visible, onClose }) => {
  const [gameState, setGameState] = useState<"idle" | "playing" | "out">("idle");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);

  // Scores and stats
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isNewHigh, setIsNewHigh] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [combo, setCombo] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [isInvincible, setIsInvincible] = useState<boolean>(false);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Ball physics state (in refs for 60fps loop)
  const ballPosRef = useRef({
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT - 38,
    vx: 0,
    vy: 0,
  });

  const [ballDisplay, setBallDisplay] = useState({
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT - 38,
  });

  // Obstacles state
  const obstaclesRef = useRef<Obstacle[]>([
    {
      id: 1,
      y: 110,
      width: 105,
      height: 18,
      x: 30,
      speed: 2.2,
      direction: 1,
      color: "#f59e0b",
    },
    {
      id: 2,
      y: 195,
      width: 125,
      height: 18,
      x: 180,
      speed: 2.6,
      direction: -1,
      color: "#ef4444",
    },
    {
      id: 3,
      y: 280,
      width: 115,
      height: 18,
      x: 60,
      speed: 2.0,
      direction: 1,
      color: "#8b5cf6",
    },
    {
      id: 4,
      y: 365,
      width: 100,
      height: 16,
      x: 130,
      speed: 1.8,
      direction: -1,
      color: "#0ea5e9",
    },
  ]);

  const [obstaclesDisplay, setObstaclesDisplay] = useState<Obstacle[]>([
    ...obstaclesRef.current,
  ]);

  // Collectibles state
  const collectiblesRef = useRef<CollectibleItem[]>([
    { id: 1, x: 80, y: 155, type: "gem", collected: false },
    { id: 2, x: 260, y: 325, type: "shield", collected: false },
  ]);

  const [collectiblesDisplay, setCollectiblesDisplay] = useState<CollectibleItem[]>([
    ...collectiblesRef.current,
  ]);

  const animFrameRef = useRef<number | null>(null);
  const hasLaunchedRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const hasShieldRef = useRef<boolean>(false);
  const isInvincibleRef = useRef<boolean>(false);
  const comboRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // Sync refs
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (hapticsEnabled) {
      Vibration.vibrate(pattern);
    }
  }, [hapticsEnabled]);

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
  const triggerCelebration = useCallback((text: string) => {
    setCelebrationMsg(text);
    celebrationAnim.setValue(0);
    Animated.sequence([
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.delay(700),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setCelebrationMsg(null));
  }, [celebrationAnim]);

  // Reset ball to launch pad
  const resetBallToBottom = useCallback(() => {
    ballPosRef.current = {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT - 38,
      vx: 0,
      vy: 0,
    };
    hasLaunchedRef.current = false;
    setBallDisplay({ x: ARENA_WIDTH / 2, y: ARENA_HEIGHT - 38 });
  }, []);

  // Spawn fresh collectibles for new round
  const spawnCollectibles = useCallback(() => {
    const gemTypes: ("gem" | "shield")[] = Math.random() > 0.4 ? ["gem", "shield"] : ["gem", "gem"];
    const newItems: CollectibleItem[] = [
      {
        id: Date.now() + 1,
        x: 40 + Math.random() * (ARENA_WIDTH - 80),
        y: 145 + Math.random() * 50,
        type: gemTypes[0],
        collected: false,
      },
      {
        id: Date.now() + 2,
        x: 40 + Math.random() * (ARENA_WIDTH - 80),
        y: 315 + Math.random() * 50,
        type: gemTypes[1],
        collected: false,
      },
    ];
    collectiblesRef.current = newItems;
    setCollectiblesDisplay(newItems);
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    livesRef.current = 3;
    setHasShield(false);
    hasShieldRef.current = false;
    setCombo(0);
    comboRef.current = 0;
    setLevel(1);
    setIsNewHigh(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setIsInvincible(false);
    isInvincibleRef.current = false;
    resetBallToBottom();

    // Reset obstacles
    obstaclesRef.current = [
      {
        id: 1,
        y: 110,
        width: 105,
        height: 18,
        x: 30,
        speed: 2.2,
        direction: 1,
        color: "#f59e0b",
      },
      {
        id: 2,
        y: 195,
        width: 125,
        height: 18,
        x: 180,
        speed: 2.6,
        direction: -1,
        color: "#ef4444",
      },
      {
        id: 3,
        y: 280,
        width: 115,
        height: 18,
        x: 60,
        speed: 2.0,
        direction: 1,
        color: "#8b5cf6",
      },
      {
        id: 4,
        y: 365,
        width: 100,
        height: 16,
        x: 130,
        speed: 1.8,
        direction: -1,
        color: "#0ea5e9",
      },
    ];

    spawnCollectibles();
    setGameState("playing");
  }, [resetBallToBottom, spawnCollectibles]);

  // Give brief invincibility after collision
  const grantInvincibility = useCallback((durationMs: number = 1400) => {
    isInvincibleRef.current = true;
    setIsInvincible(true);
    setTimeout(() => {
      isInvincibleRef.current = false;
      setIsInvincible(false);
    }, durationMs);
  }, []);

  // Main 60fps Physics & Collision Engine
  useEffect(() => {
    if (gameState !== "playing") {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let isRunning = true;

    const gameLoop = () => {
      if (!isRunning) return;

      if (isPausedRef.current) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const ball = ballPosRef.current;

      // 1. Update ball position if in air
      if (hasLaunchedRef.current) {
        ball.vy += GRAVITY;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce off left/right side walls
        if (ball.x - BALL_RADIUS <= 0) {
          ball.x = BALL_RADIUS;
          ball.vx = -ball.vx * 0.75;
          triggerHaptic(10);
        } else if (ball.x + BALL_RADIUS >= ARENA_WIDTH) {
          ball.x = ARENA_WIDTH - BALL_RADIUS;
          ball.vx = -ball.vx * 0.75;
          triggerHaptic(10);
        }

        // 2. CHECK WIN: Reached TOP GOAL (Score Zone)!
        if (ball.y - BALL_RADIUS <= 40) {
          triggerHaptic(35);
          const currentCombo = comboRef.current + 1;
          comboRef.current = currentCombo;
          setCombo(currentCombo);

          const bonusPoints = currentCombo > 1 ? currentCombo : 1;
          const nextScore = scoreRef.current + bonusPoints;
          scoreRef.current = nextScore;
          setScore(nextScore);
          updateHighScoreIfNeeded(nextScore);

          const newLvl = Math.floor(nextScore / 4) + 1;
          setLevel(newLvl);

          triggerCelebration(
            currentCombo > 1
              ? `🎯 TOP SCORED! +${bonusPoints} (🔥 x${currentCombo} Combo!)`
              : `🎯 TOP REACHED! +1 SCORE`
          );

          // Level speed scaling
          const speedMultiplier = 1 + Math.min(newLvl * 0.12, 1.4);
          obstaclesRef.current = obstaclesRef.current.map((obs) => ({
            ...obs,
            speed: (1.9 + Math.random() * 1.5) * speedMultiplier,
            direction: Math.random() > 0.5 ? 1 : -1,
          }));

          spawnCollectibles();
          resetBallToBottom();
        }

        // 3. CHECK OUT OF BOUNDS: Dropped below arena floor
        if (ball.y - BALL_RADIUS > ARENA_HEIGHT) {
          // If player has multiple lives, deduct 1 life and reset ball
          if (livesRef.current > 1) {
            triggerHaptic([0, 80, 50, 80]);
            const newLives = livesRef.current - 1;
            livesRef.current = newLives;
            setLives(newLives);
            comboRef.current = 0;
            setCombo(0);
            triggerCelebration(`⚠️ FELL OUT! (${newLives} ❤️ Remaining)`);
            grantInvincibility();
            resetBallToBottom();
          } else {
            // No lives left -> Game Over
            triggerHaptic([0, 100, 60, 140]);
            setLives(0);
            livesRef.current = 0;
            setGameState("out");
            updateHighScoreIfNeeded(scoreRef.current);
            return;
          }
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

      // 5. CHECK COLLECTIBLES (Gems / Shields)
      if (hasLaunchedRef.current) {
        for (const item of collectiblesRef.current) {
          if (!item.collected) {
            const distX = ball.x - item.x;
            const distY = ball.y - item.y;
            const distSq = distX * distX + distY * distY;
            if (distSq < (BALL_RADIUS + 12) * (BALL_RADIUS + 12)) {
              item.collected = true;
              triggerHaptic(25);

              if (item.type === "shield") {
                setHasShield(true);
                hasShieldRef.current = true;
                triggerCelebration("🛡️ SHIELD EQUIPPED! (1 Free Hit)");
              } else {
                const bonus = 2;
                const nextScore = scoreRef.current + bonus;
                scoreRef.current = nextScore;
                setScore(nextScore);
                updateHighScoreIfNeeded(nextScore);
                triggerCelebration(`💎 BONUS GEM! (+${bonus} PTS)`);
              }
              setCollectiblesDisplay([...collectiblesRef.current]);
            }
          }
        }
      }

      // 6. CHECK COLLISION with any obstacle
      if (hasLaunchedRef.current && !isInvincibleRef.current) {
        for (const obs of updatedObstacles) {
          const closestX = Math.max(obs.x, Math.min(ball.x, obs.x + obs.width));
          const closestY = Math.max(obs.y, Math.min(ball.y, obs.y + obs.height));

          const distX = ball.x - closestX;
          const distY = ball.y - closestY;
          const distanceSq = distX * distX + distY * distY;

          if (distanceSq < BALL_RADIUS * BALL_RADIUS) {
            // A. Check if Shield is active
            if (hasShieldRef.current) {
              hasShieldRef.current = false;
              setHasShield(false);
              triggerHaptic([0, 50, 40, 60]);
              triggerCelebration("🛡️ SHIELD BROKE! SAVED FROM OUT!");
              grantInvincibility(1600);
              // Bounce ball away safely
              ball.vy = -5.0;
              break;
            }

            // B. If player has lives remaining (> 1), deduct 1 and give invincibility
            if (livesRef.current > 1) {
              triggerHaptic([0, 80, 50, 100]);
              const newLives = livesRef.current - 1;
              livesRef.current = newLives;
              setLives(newLives);
              comboRef.current = 0;
              setCombo(0);
              triggerCelebration(`💥 HIT! (${newLives} ❤️ Left)`);
              grantInvincibility(1800);
              // Bounce back slightly
              ball.vy = -4.5;
              ball.vx = (Math.random() - 0.5) * 4;
              break;
            }

            // C. Final Life Lost -> Game Over
            triggerHaptic([0, 100, 60, 150]);
            setLives(0);
            livesRef.current = 0;
            setGameState("out");
            updateHighScoreIfNeeded(scoreRef.current);
            return;
          }
        }
      }

      // Commit to react state for 60fps render
      setBallDisplay({ x: ball.x, y: ball.y });
      setObstaclesDisplay(updatedObstacles);

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    gameState,
    resetBallToBottom,
    updateHighScoreIfNeeded,
    grantInvincibility,
    spawnCollectibles,
    triggerCelebration,
    triggerHaptic,
  ]);

  // Touch / Tap Controls
  const handleHop = useCallback((direction: "left" | "center" | "right") => {
    if (gameState !== "playing" || isPaused) return;

    hasLaunchedRef.current = true;
    triggerHaptic(15);

    const ball = ballPosRef.current;
    if (direction === "left") {
      ball.vx = -3.5;
      ball.vy = -6.8;
    } else if (direction === "right") {
      ball.vx = 3.5;
      ball.vy = -6.8;
    } else {
      ball.vx = (Math.random() - 0.5) * 1.6;
      ball.vy = -7.6;
    }
  }, [gameState, isPaused, triggerHaptic]);

  // Direct Arena Tap Handler (Tap anywhere on arena!)
  const handleArenaPress = useCallback((e: GestureResponderEvent) => {
    if (gameState !== "playing" || isPaused) return;
    const { locationX } = e.nativeEvent;
    const third = ARENA_WIDTH / 3;
    if (locationX < third) {
      handleHop("left");
    } else if (locationX > third * 2) {
      handleHop("right");
    } else {
      handleHop("center");
    }
  }, [gameState, isPaused, handleHop]);

  // Player Rank based on Score
  const getPlayerRank = (sc: number) => {
    if (sc >= 25) return { title: "Arcade Legend 🏆", color: "#f59e0b" };
    if (sc >= 15) return { title: "Speed Demon ⚡", color: "#8b5cf6" };
    if (sc >= 8) return { title: "Pro Pilot 🚀", color: "#10b981" };
    if (sc >= 3) return { title: "Road Cruiser 🚗", color: "#38bdf8" };
    return { title: "Novice Driver 🔰", color: "#a1a1aa" };
  };

  const rank = getPlayerRank(score);

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
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LVL {level}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {gameState === "playing" && (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => setIsPaused((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Text style={styles.pauseIconText}>{isPaused ? "▶" : "⏸"}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setHapticsEnabled((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.hapticIconText}>{hapticsEnabled ? "📳" : "🔇"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <CloseIcon size={18} color="#09090b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Score & Status Bar */}
        <View style={styles.scoreRow}>
          {/* Current Score */}
          <View style={styles.scorePill}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
            {combo > 1 && (
              <View style={styles.comboBadge}>
                <Text style={styles.comboBadgeText}>x{combo}</Text>
              </View>
            )}
          </View>

          {/* Lives (Hearts) & Shield */}
          <View style={styles.statusPill}>
            <View style={styles.livesRow}>
              {[1, 2, 3].map((heartIndex) => (
                <Text
                  key={heartIndex}
                  style={[
                    styles.heartIcon,
                    heartIndex > lives && styles.heartEmpty,
                  ]}
                >
                  ❤️
                </Text>
              ))}
            </View>
            {hasShield && (
              <View style={styles.shieldActiveBadge}>
                <Text style={styles.shieldActiveText}>🛡️</Text>
              </View>
            )}
          </View>

          {/* High Score */}
          <View style={styles.highScorePill}>
            <SparklesIcon size={13} color="#f59e0b" />
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
                      outputRange: [-18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.celebrationText}>{celebrationMsg}</Text>
          </Animated.View>
        )}

        {/* Interactive Game Arena Board (Touch anywhere on screen!) */}
        <TouchableOpacity
          style={styles.arenaContainer}
          activeOpacity={1}
          onPress={handleArenaPress}
        >
          {/* Subtle Cyber Grid Road Guides */}
          <View style={styles.roadGuideLeft} />
          <View style={styles.roadGuideRight} />

          {/* Top Goal Zone */}
          <View style={styles.goalZone}>
            <Text style={styles.goalText}>🎯 REACH TOP TO SCORE +1 🎯</Text>
          </View>

          {/* Collectible Gems & Shields */}
          {collectiblesDisplay.map((item) =>
            !item.collected ? (
              <View
                key={item.id}
                style={[
                  styles.collectibleBubble,
                  {
                    left: item.x - 14,
                    top: item.y - 14,
                    borderColor: item.type === "shield" ? "#38bdf8" : "#10b981",
                  },
                ]}
              >
                <Text style={styles.collectibleIcon}>
                  {item.type === "shield" ? "🛡️" : "💎"}
                </Text>
              </View>
            ) : null
          )}

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
            >
              <View style={styles.obstacleGleam} />
            </View>
          ))}

          {/* Active Ball */}
          <View
            style={[
              styles.ball,
              {
                left: ballDisplay.x - BALL_RADIUS,
                top: ballDisplay.y - BALL_RADIUS,
                opacity: isInvincible ? 0.6 : 1,
              },
              hasShield && styles.ballWithShield,
            ]}
          >
            <View style={styles.ballInnerGlow} />
          </View>

          {/* Bottom Launch Area Line */}
          <View style={styles.launchArea}>
            <Text style={styles.launchAreaText}>
              TAP ARENA OR USE HOP BUTTONS BELOW
            </Text>
          </View>

          {/* Pause Overlay */}
          {isPaused && gameState === "playing" && (
            <View style={styles.overlay}>
              <View style={styles.modalCard}>
                <Text style={styles.pausedTitle}>Game Paused</Text>
                <Text style={styles.overlayDesc}>
                  Catch your breath! Tap Resume whenever you are ready.
                </Text>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => setIsPaused(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.playBtnText}>RESUME GAME ▶</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Start Screen Overlay */}
          {gameState === "idle" && (
            <View style={styles.overlay}>
              <View style={styles.modalCard}>
                <View style={styles.ballIconCircle}>
                  <View style={styles.demoBall} />
                </View>
                <Text style={styles.overlayTitle}>Rising Ball</Text>
                <Text style={styles.overlayDesc}>
                  Hop the ball to the top goal! Collect 💎 gems for bonus points, grab 🛡️ shields for protection, and dodge obstacle bars!
                </Text>

                <View style={styles.featureHighlights}>
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>❤️ 3 Lives</Text>
                  </View>
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>💎 Gems (+2)</Text>
                  </View>
                  <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>🛡️ Shield</Text>
                  </View>
                </View>

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

                <View style={[styles.rankBadge, { borderColor: rank.color }]}>
                  <Text style={[styles.rankText, { color: rank.color }]}>
                    {rank.title}
                  </Text>
                </View>

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
                    <Text style={styles.resultLabel}>LEVEL</Text>
                    <Text style={styles.resultScore}>{level}</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>BEST</Text>
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
        </TouchableOpacity>

        {/* Bottom Interactive Hop Controls */}
        <View style={styles.controlsSection}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.leftBtn]}
            onPress={() => handleHop("left")}
            disabled={gameState !== "playing" || isPaused}
            activeOpacity={0.7}
          >
            <Text style={styles.controlBtnArrow}>◀</Text>
            <Text style={styles.controlBtnText}>HOP LEFT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.centerBtn]}
            onPress={() => handleHop("center")}
            disabled={gameState !== "playing" || isPaused}
            activeOpacity={0.7}
          >
            <Text style={styles.centerBtnArrow}>▲</Text>
            <Text style={styles.centerBtnText}>BOOST</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.rightBtn]}
            onPress={() => handleHop("right")}
            disabled={gameState !== "playing" || isPaused}
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
    paddingHorizontal: 18,
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
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  levelBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: "#38bdf8",
    fontSize: 10,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  pauseIconText: {
    color: "#ffffff",
    fontSize: 12,
  },
  hapticIconText: {
    fontSize: 14,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreRow: {
    width: ARENA_WIDTH,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  scorePill: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  scoreLabel: {
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scoreValue: {
    color: "#10b981",
    fontSize: 18,
    fontWeight: "900",
  },
  comboBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comboBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
  },
  statusPill: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  livesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  heartIcon: {
    fontSize: 12,
  },
  heartEmpty: {
    opacity: 0.25,
  },
  shieldActiveBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  shieldActiveText: {
    fontSize: 11,
  },
  highScorePill: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  highScoreLabel: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "800",
  },
  celebrationBanner: {
    position: "absolute",
    top: 96,
    zIndex: 99,
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  celebrationText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  arenaContainer: {
    width: ARENA_WIDTH,
    height: ARENA_HEIGHT,
    backgroundColor: "#141417",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#27272a",
    position: "relative",
    overflow: "hidden",
  },
  roadGuideLeft: {
    position: "absolute",
    left: ARENA_WIDTH / 3,
    top: 40,
    bottom: 30,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  roadGuideRight: {
    position: "absolute",
    right: ARENA_WIDTH / 3,
    top: 40,
    bottom: 30,
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
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
  collectibleBubble: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#fff",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  collectibleIcon: {
    fontSize: 14,
  },
  obstacle: {
    position: "absolute",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
    overflow: "hidden",
  },
  obstacleGleam: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: "100%",
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
  ballWithShield: {
    borderWidth: 3,
    borderColor: "#38bdf8",
    shadowColor: "#38bdf8",
    shadowRadius: 12,
    shadowOpacity: 1,
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
    backgroundColor: "rgba(9, 9, 11, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 50,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#27272a",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  ballIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 2,
    borderColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
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
  pausedTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 8,
  },
  overlayDesc: {
    fontSize: 12,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  featureHighlights: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  featureBadge: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#3f3f46",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featureBadgeText: {
    color: "#e4e4e7",
    fontSize: 11,
    fontWeight: "700",
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
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  outBadgeText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
  outTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 8,
  },
  rankBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "800",
  },
  newHighPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "100%",
    justifyContent: "space-around",
    marginBottom: 18,
  },
  resultItem: {
    alignItems: "center",
  },
  resultLabel: {
    color: "#71717a",
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 3,
  },
  resultScore: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },
  resultDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#3f3f46",
  },
  resultBest: {
    color: "#f59e0b",
    fontSize: 20,
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
    fontSize: 13,
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
