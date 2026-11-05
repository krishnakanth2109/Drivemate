import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  PlusIcon,
  LinkIcon,
  HeartIcon,
  MessageIcon,
  ShareIcon,
  SparklesIcon,
  CloseIcon,
  UserIcon,
  CheckCircleIcon,
} from "../../../components/Icons";
import { PostItem } from "../../../components/CreatePostModal";
import { messagesAPI, DriverProfile } from "../../../services/api";

interface HomeTabProps {
  posts: PostItem[];
  onToggleLike: (id: string) => void;
  onOpenCreatePost: () => void;
  onOpenPaymentModal: () => void;
  onNavigateTab?: (tab: "home" | "messaging" | "updates" | "services" | "profile") => void;
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
  onNavigateTab,
  freePostsUsed,
  maxFreePosts,
  isProUser,
  singlePasses = 0,
  userName = "Alex Morgan",
}) => {
  const freeRemaining = Math.max(0, maxFreePosts - freePostsUsed);

  // Driver Profile Modal State
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [driversList, setDriversList] = useState<DriverProfile[]>([]);

  // Refresh discoverable drivers & connection statuses
  const refreshDrivers = async () => {
    try {
      const res = await messagesAPI.getDrivers();
      if (res.success && Array.isArray(res.drivers)) {
        setDriversList(res.drivers);
      }
    } catch {}
  };

  useEffect(() => {
    refreshDrivers();
  }, []);

  const handleOpenDriverProfile = (post: PostItem) => {
    const isSelf =
      post.author.toLowerCase() === userName.toLowerCase() ||
      post.authorTag.toLowerCase() === `@${userName.toLowerCase().replace(/\s+/g, "_")}`;

    const matched = driversList.find(
      (d) =>
        (post.userId && d.uid === post.userId) ||
        d.username.toLowerCase() === post.authorTag.replace(/^@/, "").toLowerCase() ||
        d.fullName.toLowerCase() === post.author.toLowerCase()
    );

    const driverData: DriverProfile = matched || {
      uid: post.userId || `driver_${post.authorTag.replace(/[^a-zA-Z0-9]/g, "")}`,
      fullName: post.author,
      username: post.authorTag.replace(/^@/, ""),
      email: `${post.authorTag.replace(/[^a-zA-Z0-9]/g, "")}@drivemate.com`,
      location: post.fromCity || "San Francisco, CA",
      drivingStyle: post.tag?.replace("#", "") || "Highway Commute",
      vehicleName: "Drivemate Certified Vehicle",
      connectionStatus: isSelf ? "accepted" : "none",
    };

    setSelectedDriver(driverData);
    setSelectedPost(post);
    setIsDriverModalVisible(true);
  };

  const handleSendConnectionRequest = async () => {
    if (!selectedDriver) return;
    setIsSendingRequest(true);

    try {
      const res = await messagesAPI.sendRequest(
        selectedDriver.uid,
        selectedDriver.fullName,
        `@${selectedDriver.username}`
      );

      if (res.success) {
        setSelectedDriver((prev) =>
          prev ? { ...prev, connectionStatus: "pending", isSender: true } : null
        );
        refreshDrivers();
        Alert.alert(
          "Request Dispatched!",
          `Connection request sent to ${selectedDriver.fullName}. Once accepted, you can send direct messages, photos, locations, and documents.`
        );
      } else {
        Alert.alert("Unable to send request", res.error || "Please try again later.");
      }
    } catch (err: any) {
      Alert.alert("Request Error", err.message || "Network error sending request.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleGoToMessaging = () => {
    setIsDriverModalVisible(false);
    if (onNavigateTab) {
      onNavigateTab("messaging");
    }
  };

  const handleGoToProfile = () => {
    setIsDriverModalVisible(false);
    if (onNavigateTab) {
      onNavigateTab("profile");
    }
  };

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
    <>
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
            {/* Post Author Row - Clickable to open Driver Profile */}
            <TouchableOpacity
              style={styles.postAuthorRow}
              onPress={() => handleOpenDriverProfile(post)}
              activeOpacity={0.75}
            >
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

              <View style={styles.profileBadgePill}>
                <Text style={styles.profileBadgeText}>Profile ↗</Text>
              </View>
            </TouchableOpacity>

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
                onPress={() => handleOpenDriverProfile(post)}
              >
                <MessageIcon size={18} color="#71717a" />
                <Text style={styles.actionText}>
                  {post.commentsCount > 0 ? `${post.commentsCount} comments` : "Message"}
                </Text>
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

      {/* Driver Profile & Connection Request Modal */}
      <Modal
        visible={isDriverModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDriverModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.driverModalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerIndicator} />
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsDriverModalVisible(false)}
                activeOpacity={0.7}
              >
                <CloseIcon size={18} color="#09090b" />
              </TouchableOpacity>
            </View>

            {selectedDriver && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.driverModalContent}
              >
                {/* Profile Top Card */}
                <View style={styles.driverProfileTop}>
                  <View style={styles.driverBigAvatar}>
                    <Text style={styles.driverBigAvatarText}>
                      {selectedDriver.fullName.charAt(0).toUpperCase()}
                    </Text>
                    <View style={styles.verifiedDot}>
                      <CheckCircleIcon size={14} color="#10b981" />
                    </View>
                  </View>

                  <Text style={styles.driverModalName}>{selectedDriver.fullName}</Text>
                  <Text style={styles.driverModalTag}>@{selectedDriver.username}</Text>

                  <View style={styles.driverPillsRow}>
                    <View style={styles.driverStyleBadge}>
                      <Text style={styles.driverStyleBadgeText}>
                        🚗 {selectedDriver.drivingStyle || "Highway"}
                      </Text>
                    </View>
                    <View style={styles.driverLocationBadge}>
                      <Text style={styles.driverLocationBadgeText}>
                        📍 {selectedDriver.location || "United States"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Driver Vehicle Card */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardLabel}>PRIMARY VEHICLE</Text>
                  <View style={styles.vehicleRow}>
                    <View style={styles.vehicleIconCircle}>
                      <Text style={{ fontSize: 16 }}>🚘</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vehicleNameText}>
                        {selectedDriver.vehicleName || "Drivemate Certified Vehicle"}
                      </Text>
                      <Text style={styles.vehicleSubText}>
                        Verified Garage Entry • Inspection Current
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Active Ride Itinerary if from Route Post */}
                {selectedPost && (selectedPost.fromCity || selectedPost.toCity) && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardLabel}>ACTIVE TRIP ROUTE</Text>
                    <View style={styles.modalRouteRow}>
                      <Text style={styles.modalRouteCity}>{selectedPost.fromCity || "Departure"}</Text>
                      <Text style={styles.modalRouteArrow}>→</Text>
                      <Text style={styles.modalRouteCity}>{selectedPost.toCity || "Destination"}</Text>
                    </View>
                    <View style={styles.modalRouteMeta}>
                      {selectedPost.departureTime && (
                        <Text style={styles.modalRouteMetaText}>🕒 {selectedPost.departureTime}</Text>
                      )}
                      {selectedPost.availableSeats ? (
                        <Text style={styles.modalRouteMetaText}>👥 {selectedPost.availableSeats} Seats Open</Text>
                      ) : null}
                      {selectedPost.pricePerSeat && (
                        <Text style={styles.modalRouteMetaPrice}>{selectedPost.pricePerSeat}</Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Driver Trust Stats */}
                <View style={styles.trustStatsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>4.9 ★</Text>
                    <Text style={styles.statLabel}>Trip Rating</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>48+</Text>
                    <Text style={styles.statLabel}>Completed Trips</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>&lt; 5m</Text>
                    <Text style={styles.statLabel}>Response Time</Text>
                  </View>
                </View>

                {/* Action Button: Connect / Message / Profile */}
                <View style={styles.modalActionContainer}>
                  {selectedDriver.fullName.toLowerCase() === userName.toLowerCase() ? (
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={handleGoToProfile}
                      activeOpacity={0.85}
                    >
                      <UserIcon size={16} color="#ffffff" />
                      <Text style={styles.primaryActionButtonText}>
                        View My Profile & Garage
                      </Text>
                    </TouchableOpacity>
                  ) : selectedDriver.connectionStatus === "accepted" ? (
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={handleGoToMessaging}
                      activeOpacity={0.85}
                    >
                      <MessageIcon size={16} color="#ffffff" />
                      <Text style={styles.primaryActionButtonText}>
                        Send Message in Driver Comms
                      </Text>
                    </TouchableOpacity>
                  ) : selectedDriver.connectionStatus === "pending" ? (
                    <View style={styles.pendingStatusBox}>
                      <Text style={styles.pendingStatusText}>
                        ⏳ Connection Request Pending Approval
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={handleSendConnectionRequest}
                      disabled={isSendingRequest}
                      activeOpacity={0.85}
                    >
                      {isSendingRequest ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <SparklesIcon size={16} color="#ffffff" />
                          <Text style={styles.primaryActionButtonText}>
                            Request Connection & Message
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
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
  profileBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#f4f4f5",
    marginLeft: "auto",
  },
  profileBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#09090b",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  driverModalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
    position: "relative",
  },
  headerIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e4e4e7",
  },
  modalCloseBtn: {
    position: "absolute",
    right: 18,
    top: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  driverModalContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  driverProfileTop: {
    alignItems: "center",
    marginVertical: 14,
  },
  driverBigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },
  driverBigAvatarText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
  },
  verifiedDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 2,
  },
  driverModalName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 2,
  },
  driverModalTag: {
    fontSize: 13,
    color: "#71717a",
    fontWeight: "500",
    marginBottom: 12,
  },
  driverPillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  driverStyleBadge: {
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  driverStyleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#09090b",
  },
  driverLocationBadge: {
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  driverLocationBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#52525b",
  },
  infoCard: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 14,
    marginTop: 14,
  },
  infoCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#71717a",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  vehicleSubText: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 2,
  },
  modalRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  modalRouteCity: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  modalRouteArrow: {
    fontSize: 13,
    color: "#a1a1aa",
    fontWeight: "700",
  },
  modalRouteMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalRouteMetaText: {
    fontSize: 12,
    color: "#52525b",
    fontWeight: "500",
  },
  modalRouteMetaPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
    marginLeft: "auto",
  },
  trustStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingVertical: 14,
    marginTop: 14,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#71717a",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#e4e4e7",
  },
  modalActionContainer: {
    marginTop: 18,
  },
  primaryActionButton: {
    backgroundColor: "#09090b",
    borderRadius: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryActionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  pendingStatusBox: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingStatusText: {
    color: "#92400e",
    fontSize: 13,
    fontWeight: "700",
  },
});
