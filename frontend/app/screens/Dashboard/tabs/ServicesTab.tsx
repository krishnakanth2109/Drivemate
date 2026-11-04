import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { WrenchIcon, SparklesIcon, CheckCircleIcon } from "../../../components/Icons";

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  badge?: string;
  status: "Available" | "Active" | "Configured";
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
  },
  {
    id: "2",
    title: "Digital Glovebox & Vault",
    category: "Documents",
    description:
      "Secure encrypted storage for driver license, vehicle registration, and auto insurance cards.",
    status: "Configured",
  },
  {
    id: "3",
    title: "OBD Vehicle Health Scan",
    category: "Maintenance",
    description:
      "Real-time diagnostic trouble codes, brake wear estimations, and upcoming service schedules.",
    badge: "AI SCAN",
    status: "Available",
  },
  {
    id: "4",
    title: "EV Supercharge Locator",
    category: "Charging",
    description:
      "Find high-speed chargers with live availability, stall power ratings, and peak hour pricing.",
    status: "Available",
  },
  {
    id: "5",
    title: "Trip Expense & Fuel Log",
    category: "Finance",
    description:
      "Automatic mileage tracking, tax deduction reports, and multi-currency fuel receipts management.",
    status: "Available",
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

      {/* Emergency Assistance Banner - Sleek Minimalist Luxury */}
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

      {/* Services List */}
      {SERVICES_DATA.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={styles.card}
          onPress={() => handleServicePress(service)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleArea}>
              <Text style={styles.serviceCategory}>{service.category}</Text>
              <Text style={styles.serviceTitle}>{service.title}</Text>
            </View>
            {service.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{service.badge}</Text>
              </View>
            )}
          </View>

          <Text style={styles.serviceDescription}>{service.description}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.statusRow}>
              <CheckCircleIcon size={14} color="#10b981" />
              <Text style={styles.statusText}>{service.status}</Text>
            </View>
            <View style={styles.actionBtn}>
              <Text style={styles.actionLink}>Open Service →</Text>
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
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    color: "#71717a",
    marginTop: 3,
  },
  emergencyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#09090b",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#27272a",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  emergencyIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  emergencySub: {
    color: "#a1a1aa",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  sosButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    marginLeft: 10,
  },
  sosButtonText: {
    color: "#09090b",
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
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleArea: {
    flex: 1,
  },
  serviceCategory: {
    fontSize: 10,
    fontWeight: "700",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#09090b",
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: "#09090b",
    fontSize: 10,
    fontWeight: "700",
  },
  serviceDescription: {
    fontSize: 13,
    color: "#52525b",
    lineHeight: 19,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#18181b",
    fontWeight: "600",
  },
  actionBtn: {
    paddingVertical: 4,
  },
  actionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
});
