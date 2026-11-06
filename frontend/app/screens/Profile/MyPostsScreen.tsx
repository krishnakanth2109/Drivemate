import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeftIcon,
  HeartIcon,
  MessageIcon,
  LinkIcon,
  TrashIcon,
  PlusIcon,
} from "../../components/Icons";
import { postsAPI } from "../../services/api";
import { getUserProfile } from "../../services/storage";

interface UserPost {
  id: string;
  timeAgo: string;
  content: string;
  fromCity?: string;
  toCity?: string;
  departureTime?: string;
  availableSeats?: number;
  link?: string;
  linkTitle?: string;
  tag: string;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
}

const MyPostsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"published" | "liked">("published");
  const [myPosts, setMyPosts] = useState<UserPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<UserPost[]>([]);

  useEffect(() => {
    async function loadData() {
      const user = await getUserProfile();
      try {
        const res = await postsAPI.getPosts();
        if (res.success && Array.isArray(res.posts)) {
          const userUid = user?.uid;
          const userEmail = user?.email;
          const userName = user?.fullName;

          const mine = res.posts.filter((p) => {
            if (userUid && p.userId === userUid) return true;
            if (userName && p.author === userName) return true;
            return false;
          });

          const liked = res.posts.filter((p) => p.isLiked);

          setMyPosts(mine);
          setLikedPosts(liked);
        }
      } catch {}
    }
    loadData();
  }, []);

  const handleDeletePost = (id: string) => {
    Alert.alert("Delete Post", "Are you sure you want to permanently delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setMyPosts((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  };

  const handleOpenLink = (url?: string) => {
    if (!url) return;
    const formatted = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formatted).catch(() => {
      Alert.alert("Unable to open link", formatted);
    });
  };

  const currentList = activeTab === "published" ? myPosts : likedPosts;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeftIcon size={20} color="#09090b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Posts & Activity</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "published" && styles.tabItemActive]}
          onPress={() => setActiveTab("published")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "published" && styles.tabTextActive,
            ]}
          >
            My Posts ({myPosts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "liked" && styles.tabItemActive]}
          onPress={() => setActiveTab("liked")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "liked" && styles.tabTextActive,
            ]}
          >
            Liked Posts ({likedPosts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentList.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postTopRow}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{post.tag}</Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{post.timeAgo}</Text>
                {activeTab === "published" && (
                  <TouchableOpacity
                    style={styles.deletePostBtn}
                    onPress={() => handleDeletePost(post.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <TrashIcon size={14} color="#a1a1aa" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {/* Attached Link */}
            {post.link && (
              <TouchableOpacity
                style={styles.linkBox}
                onPress={() => handleOpenLink(post.link)}
                activeOpacity={0.8}
              >
                <View style={styles.linkIconBox}>
                  <LinkIcon size={14} color="#09090b" />
                </View>
                <View style={styles.linkDetails}>
                  <Text style={styles.linkTitle} numberOfLines={1}>
                    {post.linkTitle || post.link}
                  </Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>
                    {post.link}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Metrics */}
            <View style={styles.postFooter}>
              <View style={styles.metricItem}>
                <HeartIcon
                  size={16}
                  color={activeTab === "liked" ? "#ef4444" : "#71717a"}
                  filled={activeTab === "liked"}
                />
                <Text style={styles.metricText}>{post.likes} likes</Text>
              </View>

              <View style={styles.metricItem}>
                <MessageIcon size={16} color="#71717a" />
                <Text style={styles.metricText}>{post.commentsCount} comments</Text>
              </View>
            </View>
          </View>
        ))}

        {currentList.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No posts found</Text>
            <Text style={styles.emptySub}>
              {activeTab === "published"
                ? "You haven't published any road updates yet."
                : "Posts you like in the feed will appear here."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyPostsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.3,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingHorizontal: 20,
  },
  tabItem: {
    paddingVertical: 14,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: "#09090b",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717a",
  },
  tabTextActive: {
    color: "#09090b",
    fontWeight: "800",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  postCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 14,
  },
  postTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tagBadge: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#09090b",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeText: {
    fontSize: 12,
    color: "#a1a1aa",
  },
  deletePostBtn: {
    padding: 2,
  },
  postContent: {
    fontSize: 14,
    color: "#09090b",
    lineHeight: 21,
    marginBottom: 12,
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 10,
    marginBottom: 12,
    gap: 10,
  },
  linkIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  linkDetails: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
  },
  linkUrl: {
    fontSize: 11,
    color: "#71717a",
  },
  postFooter: {
    flexDirection: "row",
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 10,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricText: {
    fontSize: 12,
    color: "#71717a",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#09090b",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: "#71717a",
    textAlign: "center",
  },
});

