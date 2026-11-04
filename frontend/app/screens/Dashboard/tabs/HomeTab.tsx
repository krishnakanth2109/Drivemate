import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import {
  PlusIcon,
  LinkIcon,
  HeartIcon,
  MessageIcon,
  ShareIcon,
  SparklesIcon,
} from "../../../components/Icons";
import { PostItem } from "../../../components/CreatePostModal";

interface HomeTabProps {
  posts: PostItem[];
  onToggleLike: (id: string) => void;
  onOpenCreatePost: () => void;
  onOpenPaymentModal: () => void;
  freePostsUsed: number;
  maxFreePosts: number;
  isProUser: boolean;
  singlePasses?: number;
  userName?: string;
}

const HomeTab: React.FC<HomeTabProps> = ({
  posts,
  onToggleLike,
  onOpenCreatePost,
  onOpenPaymentModal,
  freePostsUsed,
  maxFreePosts,
  isProUser,
  singlePasses = 0,
  userName = "Alex Morgan",
}) => {
  const freeRemaining = Math.max(0, maxFreePosts - freePostsUsed);

  React.useEffect(() => {
    console.log("🏠 [HomeTab Live Feed Data]", {
      totalPosts: posts.length,
      freeRemaining,
      freePostsUsed,
      maxFreePosts,
      isProUser,
      singlePasses,
      userName,
      posts,
    });
  }, [posts, freePostsUsed, isProUser, singlePasses, userName]);

  const handleOpenLink = (url?: string) => {
    if (!url) return;
    const formattedUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    Linking.openURL(formattedUrl).catch(() => {
      Alert.alert("Unable to open link", formattedUrl);
    });
  };

  const handleShare = (post: PostItem) => {
    Alert.alert("Share Post", `Sharing: "${post.content.slice(0, 50)}..."`);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Compose Trigger Card */}
      <View style={styles.composeCard}>
        <View style={styles.composeTopRow}>
          <View style={styles.composeAvatar}>
            <Text style={styles.composeAvatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.composeTrigger}
            onPress={onOpenCreatePost}
            activeOpacity={0.8}
          >
            <Text style={styles.composePlaceholder}>
              Share a road update, vehicle tip, or link...
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.composeDivider} />

        <View style={styles.composeBottomRow}>
          {/* Post Allowance Pill */}
          <TouchableOpacity
            style={styles.tierStatusPill}
            onPress={onOpenPaymentModal}
            activeOpacity={0.7}
          >
            <SparklesIcon size={13} color="#09090b" />
            <Text style={styles.tierStatusText}>
              {isProUser
                ? "Pro Unlimited"
                : singlePasses > 0
                ? `${singlePasses} post pass${singlePasses > 1 ? "es" : ""} active`
                : `${freeRemaining} of ${maxFreePosts} free posts left`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newPostBtn}
            onPress={onOpenCreatePost}
            activeOpacity={0.85}
          >
            <PlusIcon size={15} color="#ffffff" />
            <Text style={styles.newPostBtnText}>New Post</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed Section Title */}
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Community Feed</Text>
        <Text style={styles.feedCount}>{posts.length} posts</Text>
      </View>

      {/* Posts List */}
      {posts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          {/* Post Author Row */}
          <View style={styles.postAuthorRow}>
            <View style={styles.postAvatar}>
              <Text style={styles.postAvatarText}>
                {post.author.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.authorMeta}>
              <View style={styles.nameTagRow}>
                <Text style={styles.authorName}>{post.author}</Text>
                {post.tag && (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{post.tag}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.postTime}>
                {post.authorTag} • {post.timeAgo}
              </Text>
            </View>
          </View>

          {/* Post Content */}
          <Text style={styles.postBody}>{post.content}</Text>

          {/* Journey Route & City Coordinates Badge */}
          {Boolean(post.fromCity || post.toCity) && (
            <View style={styles.routeBadgeCard}>
              <View style={styles.routeRow}>
                <Text style={styles.routeCity}>{post.fromCity || "Departure"}</Text>
                <Text style={styles.routeArrow}>→</Text>
                <Text style={styles.routeCity}>{post.toCity || "Destination"}</Text>
              </View>
              <View style={styles.routeDetailsRow}>
                {Boolean(post.departureTime) && (
                  <Text style={styles.routeTime}>🕒 {post.departureTime}</Text>
                )}
                {Boolean(post.availableSeats) && (
                  <Text style={styles.routeSeats}>🚗 {post.availableSeats} seats</Text>
                )}
                {Boolean(post.pricePerSeat) && (
                  <Text style={styles.routePrice}>{post.pricePerSeat}</Text>
                )}
              </View>
            </View>
          )}

          {/* Attached Link Card */}
          {post.link && (
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => handleOpenLink(post.link)}
              activeOpacity={0.85}
            >
              <View style={styles.linkIconWrapper}>
                <LinkIcon size={16} color="#09090b" />
              </View>
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle} numberOfLines={1}>
                  {post.linkTitle || "Attached Link"}
                </Text>
                <Text style={styles.linkUrl} numberOfLines={1}>
                  {post.link}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Interaction Bar */}
          <View style={styles.interactionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onToggleLike(post.id)}
            >
              <HeartIcon
                size={18}
                color={post.isLiked ? "#ef4444" : "#71717a"}
                filled={post.isLiked}
              />
              <Text
                style={[
                  styles.actionText,
                  post.isLiked && styles.actionTextLiked,
                ]}
              >
                {post.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                Alert.alert("Comments", `Viewing discussion for this post.`)
              }
            >
              <MessageIcon size={18} color="#71717a" />
              <Text style={styles.actionText}>{post.commentsCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(post)}
            >
              <ShareIcon size={18} color="#71717a" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default HomeTab;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  composeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: "#e4e4e7",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  composeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  composeAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  composeAvatarText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  composeTrigger: {
    flex: 1,
    height: 42,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  composePlaceholder: {
    fontSize: 13,
    color: "#a1a1aa",
  },
  composeDivider: {
    height: 1,
    backgroundColor: "#f4f4f5",
    marginVertical: 12,
  },
  composeBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tierStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#27272a",
  },
  newPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#09090b",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newPostBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.2,
  },
  feedCount: {
    fontSize: 12,
    color: "#a1a1aa",
    fontWeight: "500",
  },
  postCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: "#e4e4e7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  postAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  postAvatarText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  authorMeta: {
    flex: 1,
  },
  nameTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  tagBadge: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 10,
    color: "#52525b",
    fontWeight: "700",
  },
  postTime: {
    fontSize: 11,
    color: "#a1a1aa",
    marginTop: 2,
  },
  postBody: {
    fontSize: 14,
    color: "#27272a",
    lineHeight: 21,
    marginBottom: 12,
  },
  routeBadgeCard: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  routeCity: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  routeArrow: {
    fontSize: 13,
    fontWeight: "700",
    color: "#71717a",
  },
  routeDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routeTime: {
    fontSize: 11,
    color: "#52525b",
    fontWeight: "500",
  },
  routeSeats: {
    fontSize: 11,
    color: "#52525b",
    fontWeight: "600",
  },
  routePrice: {
    fontSize: 11,
    color: "#09090b",
    fontWeight: "700",
    marginLeft: "auto",
  },
  linkCard: {
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
  linkIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 2,
  },
  linkUrl: {
    fontSize: 11,
    color: "#71717a",
  },
  interactionsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 10,
    gap: 22,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: "#71717a",
    fontWeight: "600",
  },
  actionTextLiked: {
    color: "#ef4444",
  },
});
