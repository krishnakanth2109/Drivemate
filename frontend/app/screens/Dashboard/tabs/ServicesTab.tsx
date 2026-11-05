import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { WrenchIcon, SparklesIcon, CheckCircleIcon } from "../../../components/Icons";

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
      "https://res.cloudinary.com/djl2x1rhf/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1619642751034-765dfdf7c58e",
  },
  {
    id: "2",
    title: "Digital Glovebox & Vault",
    category: "Documents",
    description:
      "Secure encrypted storage for driver license, vehicle registration, and auto insurance cards.",
    status: "Configured",
    photoUrl:
      "https://res.cloudinary.com/djl2x1rhf/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
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
      "https://res.cloudinary.com/djl2x1rhf/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1486006920555-c77dce18193b",
  },
  {
    id: "4",
    title: "EV Supercharge Locator",
    category: "Charging",
    description:
      "Find high-speed chargers with live availability, stall power ratings, and peak hour pricing.",
    status: "Available",
    photoUrl:
      "https://res.cloudinary.com/djl2x1rhf/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1593941707882-a5bba14938c7",
  },
  {
    id: "5",
    title: "Trip Expense & Fuel Log",
    category: "Finance",
    description:
      "Automatic mileage tracking, tax deduction reports, and multi-currency fuel receipts management.",
    status: "Available",
    photoUrl:
      "https://res.cloudinary.com/djl2x1rhf/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1554224154-26032ffc0d07",
  },
];

const ServicesTab: React.FC = () => {
  const handleServicePress = (service: ServiceItem) => {
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
