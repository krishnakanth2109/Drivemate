import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  WrenchIcon,
  SparklesIcon,
  CheckCircleIcon,
  PlayIcon,
} from "../../../components/Icons";
import BallGame from "../../../components/BallGame";

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  badge?: string;
  status: "Available" | "Active" | "Configured";
  photoUrl: string;
}

const SERVICES_DATA: ServiceItem[] = [
  {
    id: "1",
    title: "24/7 Roadside Rescue",
    category: "Emergency",
    description:
      "Towing, flat tire fix, battery jump-start, and emergency fuel delivery dispatched in minutes.",
    badge: "24/7 HOTLINE",
    status: "Active",
    photoUrl:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "2",
    title: "Digital Glovebox & Vault",
    category: "Documents",
    description:
      "Secure encrypted storage for driver license, vehicle registration, and auto insurance cards.",
    status: "Configured",
    photoUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "3",
    title: "OBD Vehicle Health Scan",
    category: "Maintenance",
    description:
      "Real-time diagnostic trouble codes, brake wear estimations, and upcoming service schedules.",
    badge: "AI SCAN",
    status: "Available",
    photoUrl:
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "4",
    title: "EV Supercharge Locator",
    category: "Charging",
    description:
      "Find high-speed chargers with live availability, stall power ratings, and peak hour pricing.",
    status: "Available",
    photoUrl:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "5",
    title: "Trip Mileage & Route Log",
    category: "Navigation",
    description:
      "Automatic mileage tracking, journey waypoint history, and vehicle commute logs.",
    status: "Available",
    photoUrl:
      "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "game_arcade",
    title: "Rising Ball Arcade",
    category: "Mini Game",
    description:
      "Play while waiting or charging: Tap to hop the ball to the top green target, navigate moving obstacle bars, and avoid getting OUT!",
    badge: "PLAYABLE",
    status: "Active",
    photoUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
  },
];

const ServicesTab: React.FC = () => {
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    async function loadScore() {
      try {
        const val = await AsyncStorage.getItem("@drivemate_ball_game_high_score");
        if (val) setHighScore(parseInt(val, 10) || 0);
      } catch {}
    }
    if (!isGameOpen) {
      loadScore();
    }
  }, [isGameOpen]);

  const handleServicePress = (service: ServiceItem) => {
    if (service.id === "game_arcade") {
      setIsGameOpen(true);
      return;
    }
    Alert.alert(
      service.title,
      `${service.description}\n\nCategory: ${service.category}\nStatus: ${service.status}`
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services & Utilities</Text>
        <Text style={styles.headerSub}>
          Vehicle tools, emergency rescue, and digital auto utilities
        </Text>
      </View>

      {/* Featured Mini Game Banner */}
      <View style={styles.gameCard}>
        <View style={styles.gameCardTop}>
          <View style={styles.gameBadge}>
            <SparklesIcon size={12} color="#ffffff" />
            <Text style={styles.gameBadgeText}>NEW MINI GAME</Text>
          </View>
          <View style={styles.gameScoreBadge}>
            <Text style={styles.gameScoreBadgeText}>🏆 BEST: {highScore}</Text>
          </View>
        </View>

        <View style={styles.gameContent}>
          <View style={styles.gameVisualWrap}>
            <View style={styles.gameVisualTopGoal} />
            <View style={styles.gameVisualObstacle1} />
            <View style={styles.gameVisualObstacle2} />
            <View style={styles.gameVisualBall} />
          </View>

          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>Rising Ball Challenge</Text>
            <Text style={styles.gameDesc}>
              Tap to hop the ball to the top green zone! Score points, dodge obstacle bars, and don't get OUT!
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.playGameBtn}
          onPress={() => setIsGameOpen(true)}
          activeOpacity={0.85}
        >
          <PlayIcon size={16} color="#ffffff" />
          <Text style={styles.playGameBtnText}>PLAY GAME NOW</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Assistance Banner */}
      <View style={styles.emergencyBanner}>
        <View style={styles.emergencyIcon}>
          <WrenchIcon size={20} color="#ffffff" />
        </View>
        <View style={styles.emergencyInfo}>
          <Text style={styles.emergencyTitle}>Instant Road Assistance</Text>
          <Text style={styles.emergencySub}>
            Stranded or need immediate towing? Tap for rapid dispatch.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.sosButton}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert(
              "Dispatching Assistance",
              "Connecting to Drivemate rapid response center..."
            )
          }
        >
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available Utilities</Text>
        <Text style={styles.sectionCount}>{SERVICES_DATA.length} active</Text>
      </View>

      {/* Services List with Cloudinary Media */}
      {SERVICES_DATA.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={styles.card}
          onPress={() => handleServicePress(service)}
          activeOpacity={0.85}
        >
          {/* Service Image Banner */}
          <View style={styles.cardImageContainer}>
            <Image
              source={{ uri: service.photoUrl }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
            {service.badge && (
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{service.badge}</Text>
              </View>
            )}
            <View style={styles.statusPill}>
              <CheckCircleIcon size={12} color="#10b981" />
              <Text style={styles.statusPillText}>{service.status}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryText}>{service.category.toUpperCase()}</Text>
            </View>

            <Text style={styles.serviceTitle}>{service.title}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.accessText}>Access Utility →</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* Interactive Arcade Ball Game Modal */}
      <BallGame
        visible={isGameOpen}
        onClose={() => setIsGameOpen(false)}
      />
    </ScrollView>
  );
};

export default ServicesTab;

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#09090b",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: "#71717a",
  },
  gameCard: {
    backgroundColor: "#18181b",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#27272a",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  gameCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  gameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gameBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  gameScoreBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  gameScoreBadgeText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "800",
  },
  gameContent: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  gameVisualWrap: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "#3f3f46",
    position: "relative",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  gameVisualTopGoal: {
    width: 44,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  gameVisualObstacle1: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#f59e0b",
  },
  gameVisualObstacle2: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ef4444",
  },
  gameVisualBall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#38bdf8",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  gameDesc: {
    color: "#a1a1aa",
    fontSize: 11,
    lineHeight: 16,
  },
  playGameBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    paddingVertical: 11,
    borderRadius: 12,
  },
  playGameBtnText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  emergencyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#09090b",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  emergencyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  emergencySub: {
    color: "#a1a1aa",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  sosButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sosButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 12,
    color: "#71717a",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: "#e4e4e7",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageContainer: {
    width: "100%",
    height: 140,
    position: "relative",
    backgroundColor: "#f4f4f5",
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  badgePill: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(9, 9, 11, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePillText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusPill: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#09090b",
  },
  cardBody: {
    padding: 16,
  },
  categoryRow: {
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#71717a",
    letterSpacing: 0.5,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#09090b",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  serviceDescription: {
    fontSize: 13,
    color: "#52525b",
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 10,
  },
  accessText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
  },
});
