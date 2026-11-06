import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Image } from "react-native";

interface UpdateItem {
  id: string;
  category: "Feature" | "Alert" | "Community";
  title: string;
  date: string;
  summary: string;
  photoUrl: string;
}

const UPDATES_DATA: UpdateItem[] = [
  {
    id: "1",
    category: "Feature",
    title: "Community Carpooling & Route Sharing Live",
    date: "Just Now",
    summary:
      "All members can now connect with verified drivers, coordinate carpools, and share real-time road conditions.",
    photoUrl:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "2",
    category: "Alert",
    title: "Highway 101 Resurfacing Notice",
    date: "2 hours ago",
    summary:
      "Southbound lane closures reported between exit 24 and 29. Expect minor delays during peak evening hours.",
    photoUrl:
      "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "3",
    category: "Community",
    title: "Weekend Scenic Drive & EV Meetup",
    date: "Yesterday",
    summary:
      "Join 40+ local drivers this Saturday at Skyline Viewpoint. Route sharing, coffee, and battery charging stalls available.",
    photoUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "4",
    category: "Feature",
    title: "Smart Fuel & Battery Diagnostics v1.2",
    date: "3 days ago",
    summary:
      "OBD-II sync algorithms now calculate real-time fuel efficiency and predictive battery health degradation notifications.",
    photoUrl:
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
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
          activeOpacity={0.85}
        >
          {/* Cloudinary Visual Banner */}
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: update.photoUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{update.category.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={styles.dateText}>{update.date}</Text>
            </View>

            <Text style={styles.updateTitle}>{update.title}</Text>
            <Text style={styles.updateSummary}>{update.summary}</Text>

            <View style={styles.cardBottom}>
              <Text style={styles.readMoreText}>Read details →</Text>
            </View>
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
  imageWrapper: {
    width: "100%",
    height: 160,
    position: "relative",
    backgroundColor: "#f4f4f5",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  categoryPill: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(9, 9, 11, 0.78)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.6,
  },
  cardContent: {
    padding: 18,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  dateText: {
    fontSize: 11,
    color: "#a1a1aa",
    fontWeight: "500",
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#09090b",
    marginBottom: 6,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  updateSummary: {
    fontSize: 13,
    color: "#52525b",
    lineHeight: 19,
    marginBottom: 14,
  },
  cardBottom: {
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 12,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
  },
});
