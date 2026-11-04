import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";

interface UpdateItem {
  id: string;
  category: "Feature" | "Alert" | "Community";
  title: string;
  date: string;
  summary: string;
}

const UPDATES_DATA: UpdateItem[] = [
  {
    id: "1",
    category: "Feature",
    title: "Drivemate Pro Posting & Payments Live",
    date: "Just Now",
    summary:
      "All members receive 2 free community posts with instant Pro subscription unlocks for high-frequency posters and clubs.",
  },
  {
    id: "2",
    category: "Alert",
    title: "Highway 101 Resurfacing Notice",
    date: "2 hours ago",
    summary:
      "Southbound lane closures reported between exit 24 and 29. Expect minor delays during peak evening hours.",
  },
  {
    id: "3",
    category: "Community",
    title: "Weekend Scenic Drive & EV Meetup",
    date: "Yesterday",
    summary:
      "Join 40+ local drivers this Saturday at Skyline Viewpoint. Route sharing, coffee, and battery charging stalls available.",
  },
  {
    id: "4",
    category: "Feature",
    title: "Smart Fuel & Battery Diagnostics v1.2",
    date: "3 days ago",
    summary:
      "OBD-II sync algorithms now calculate real-time fuel efficiency and predictive battery health degradation notifications.",
  },
];

const UpdatesTab: React.FC = () => {
  const handleItemPress = (item: UpdateItem) => {
    Alert.alert(item.title, `${item.summary}\n\nPublished: ${item.date}`);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Updates</Text>
        <Text style={styles.headerSub}>
          Latest announcements, road alerts, and platform releases
        </Text>
      </View>

      {UPDATES_DATA.map((update) => (
        <TouchableOpacity
          key={update.id}
          style={styles.card}
          onPress={() => handleItemPress(update)}
          activeOpacity={0.8}
        >
          <View style={styles.cardTop}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{update.category}</Text>
            </View>
            <Text style={styles.dateText}>{update.date}</Text>
          </View>

          <Text style={styles.updateTitle}>{update.title}</Text>
          <Text style={styles.updateSummary}>{update.summary}</Text>

          <View style={styles.cardBottom}>
            <Text style={styles.readMoreText}>Read details →</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default UpdatesTab;

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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: "#e4e4e7",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#09090b",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 11,
    color: "#a1a1aa",
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 6,
  },
  updateSummary: {
    fontSize: 13,
    color: "#52525b",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardBottom: {
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 10,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#09090b",
  },
});
