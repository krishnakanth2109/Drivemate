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
  Image,
  Share,
  TextInput,
  KeyboardAvoidingView,
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
  TrashIcon,
  ShieldIcon,
  CarIcon,
  MailIcon,
} from "../../../components/Icons";
import { PostItem } from "../../../components/CreatePostModal";
import { messagesAPI, DriverProfile } from "../../../services/api";

interface HomeTabProps {
  posts: PostItem[];
  onToggleLike: (id: string) => void;
  onOpenCreatePost: () => void;
  onDeletePost?: (id: string) => void;
  onNavigateTab?: (
    tab: "home" | "messaging" | "updates" | "profile",
    mode?: "chats" | "requests" | "discover",
    roomId?: string
  ) => void;
  userName?: string;
  userId?: string;
  userAvatar?: string;
}

const HomeTab: React.FC<HomeTabProps> = ({
  posts,
  onToggleLike,
  onOpenCreatePost,
  onDeletePost,
  onNavigateTab,
  userName = "Driver",
  userId,
  userAvatar,
}) => {
  // Driver Profile Modal State
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [driversList, setDriversList] = useState<DriverProfile[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // Message & Connection Popup Modal State
  const [messageModalTarget, setMessageModalTarget] = useState<{
    driver: DriverProfile;
    post: PostItem;
    existingRoomId?: string;
    isPending?: boolean;
    isAccepted?: boolean;
  } | null>(null);
  const [isMessagePopupVisible, setIsMessagePopupVisible] = useState(false);
  const [customIntroMessage, setCustomIntroMessage] = useState("");
  const [isSendingMessageInvite, setIsSendingMessageInvite] = useState(false);
  const [sentInviteSuccess, setSentInviteSuccess] = useState(false);

  // Refresh discoverable drivers & connection statuses
  const refreshDrivers = async () => {
    try {
      const [driversRes, reqRes] = await Promise.all([
        messagesAPI.getDrivers(),
        messagesAPI.getRequests(),
      ]);
      if (driversRes.success && Array.isArray(driversRes.drivers)) {
        setDriversList(driversRes.drivers);
      }
      if (reqRes.success) {
        const all = reqRes.all || [
          ...(reqRes.incoming || []),
          ...(reqRes.outgoing || []),
          ...(reqRes.accepted || []),
        ];
        setConnections(all);
      }
    } catch {}
  };

  useEffect(() => {
    refreshDrivers();
  }, []);

  const handleOpenDriverProfile = (post: PostItem) => {
    const isSelf =
      (userId && post.userId && post.userId === userId) ||
      post.author.toLowerCase() === userName.toLowerCase() ||
      post.authorTag.toLowerCase() === `@${userName.toLowerCase().replace(/\s+/g, "_")}`;

    const matched = driversList.find(
      (d) =>
        (post.userId && d.uid === post.userId) ||
        d.username.toLowerCase() === post.authorTag.replace(/^@/, "").toLowerCase() ||
        d.fullName.toLowerCase() === post.author.toLowerCase()
    );

    const targetUid =
      post.userId ||
      (matched ? matched.uid : isSelf && userId ? userId : `driver_${post.authorTag.replace(/[^a-zA-Z0-9]/g, "")}`);
    const targetName = matched?.fullName || post.author || "Driver";
    const targetTag = matched?.username ? `@${matched.username}` : post.authorTag;

    const existingConn = connections.find(
      (c: any) =>
        (c.fromUserId === targetUid && c.toUserId === userId) ||
        (c.toUserId === targetUid && c.fromUserId === userId) ||
        (isSelf && (c.fromUserId === userId || c.toUserId === userId)) ||
        (c.toUserName && c.toUserName.toLowerCase() === targetName.toLowerCase()) ||
        (c.fromUserName && c.fromUserName.toLowerCase() === targetName.toLowerCase())
    );

    const effectiveStatus: "none" | "pending" | "accepted" | "declined" =
      existingConn?.status || matched?.connectionStatus || "none";

    const driverData: DriverProfile = {
      ...(matched || {}),
      uid: targetUid,
      fullName: targetName,
      username: targetTag.replace(/^@/, ""),
      email: matched?.email || "",
      location: post.fromCity || matched?.location || "Driver",
      drivingStyle: post.tag?.replace("#", "") || matched?.drivingStyle || "Community Driver",
      vehicleName: matched?.vehicleName || "Registered Driver",
      connectionStatus: effectiveStatus,
      isSender: existingConn ? existingConn.fromUserId === userId : false,
    };

    setSelectedDriver(driverData);
    setSelectedPost(post);
    setIsDriverModalVisible(true);
  };

  const sendInviteToDriver = async (driver: DriverProfile) => {
    setIsSendingRequest(true);
    try {
      const res = await messagesAPI.sendRequest(
        driver.uid,
        driver.fullName,
        `@${driver.username}`
      );

      if (res.success) {
        setDriversList((prev) => {
          const exists = prev.some((d) => d.uid === driver.uid);
          if (exists) {
            return prev.map((d) =>
              d.uid === driver.uid
                ? { ...d, connectionStatus: "pending", isSender: true }
                : d
            );
          }
          return [...prev, { ...driver, connectionStatus: "pending", isSender: true }];
        });

        if (res.connection) {
          setConnections((prev) => [res.connection, ...prev]);
        }

        refreshDrivers();

        Alert.alert(
          "Request Sent!",
          `Connection request sent to ${driver.fullName}. Once they accept your invitation, direct messaging will be unlocked.`,
          [
            { text: "OK" },
            {
              text: "View Requests",
              onPress: () => onNavigateTab && onNavigateTab("messaging", "requests"),
            },
          ]
        );
      } else {
        Alert.alert("Unable to send request", res.error || "Please try again later.");
      }
    } catch (err: any) {
      Alert.alert("Request Error", err.message || "Network error sending invitation.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleSendConnectionRequest = async () => {
    if (!selectedDriver) return;
    setIsDriverModalVisible(false);
    setMessageModalTarget({
      driver: selectedDriver,
      post: selectedPost || ({} as any),
      isPending: selectedDriver.connectionStatus === "pending",
      isAccepted: false,
    });
    const firstWord = selectedDriver.fullName.split(" ")[0] || "Driver";
    setCustomIntroMessage(`Hi ${firstWord}! I would love to connect with you on Drivemate.`);
    setSentInviteSuccess(false);
    setIsMessagePopupVisible(true);
  };

  const handleTapMessageOnPost = (post: PostItem) => {
    // 1. Check if clicking own post
    const isSelf =
      (userId && post.userId && post.userId === userId) ||
      post.author.toLowerCase() === userName.toLowerCase() ||
      post.authorTag.toLowerCase() === `@${userName.toLowerCase().replace(/\s+/g, "_")}`;

    if (isSelf) {
      Alert.alert(
        "Your Post",
        "This is your own community post. You cannot send a connection request or message to yourself.",
        [{ text: "OK" }]
      );
      return;
    }

    // 2. Resolve target driver UID & data
    const matched = driversList.find(
      (d) =>
        (post.userId && d.uid === post.userId) ||
        d.username.toLowerCase() === post.authorTag.replace(/^@/, "").toLowerCase() ||
        d.fullName.toLowerCase() === post.author.toLowerCase()
    );

    const targetUid =
      post.userId ||
      (matched ? matched.uid : `driver_${post.authorTag.replace(/[^a-zA-Z0-9]/g, "")}`);
    const targetName = matched?.fullName || post.author || "Driver";
    const targetTag = matched?.username ? `@${matched.username}` : post.authorTag;

    // 3. Find if there is an existing connection between current user and target driver
    const existingConn = connections.find(
      (c: any) =>
        (c.fromUserId === targetUid && c.toUserId === userId) ||
        (c.toUserId === targetUid && c.fromUserId === userId) ||
        (c.toUserName && c.toUserName.toLowerCase() === targetName.toLowerCase()) ||
        (c.fromUserName && c.fromUserName.toLowerCase() === targetName.toLowerCase())
    );

    const effectiveStatus: "none" | "pending" | "accepted" | "declined" =
      existingConn?.status || matched?.connectionStatus || "none";

    console.log("💬 [handleTapMessageOnPost]", {
      targetUid,
      targetName,
      effectiveStatus,
      isSelf,
    });

    const driverData: DriverProfile = {
      ...(matched || {}),
      uid: targetUid,
      fullName: targetName,
      username: targetTag.replace(/^@/, ""),
      email: matched?.email || "",
      location: post.fromCity || matched?.location || "Driver",
      drivingStyle: post.tag?.replace("#", "") || matched?.drivingStyle || "Community Driver",
      vehicleName: matched?.vehicleName || "Registered Driver",
      connectionStatus: effectiveStatus,
      isSender: existingConn ? existingConn.fromUserId === userId : false,
    };

    // 4. If connection is already accepted, navigate straight to active direct chat
    if (effectiveStatus === "accepted") {
      if (onNavigateTab) {
        onNavigateTab("messaging", "chats", existingConn?.roomId);
      }
      return;
    }

    // 5. Open the custom Message & Connection Popup Modal
    setMessageModalTarget({
      driver: driverData,
      post,
      existingRoomId: existingConn?.roomId,
      isPending: effectiveStatus === "pending",
      isAccepted: false,
    });

    const firstWord = targetName.split(" ")[0] || "Driver";
    const defaultIntro = `Hi ${firstWord}! I saw your post regarding ${post.fromCity || "the route"} ➔ ${post.toCity || "your trip"} on Drivemate and would love to connect.`;
    setCustomIntroMessage(defaultIntro);
    setSentInviteSuccess(false);
    setIsMessagePopupVisible(true);
  };

  const handleSendMessageInviteFromPopup = async () => {
    if (!messageModalTarget) return;
    setIsSendingMessageInvite(true);
    try {
      const res = await messagesAPI.sendRequest(
        messageModalTarget.driver.uid,
        messageModalTarget.driver.fullName,
        `@${messageModalTarget.driver.username}`
      );

      if (res.success) {
        setDriversList((prev) => {
          const exists = prev.some((d) => d.uid === messageModalTarget.driver.uid);
          if (exists) {
            return prev.map((d) =>
              d.uid === messageModalTarget.driver.uid
                ? { ...d, connectionStatus: "pending", isSender: true }
                : d
            );
          }
          return [
            ...prev,
            { ...messageModalTarget.driver, connectionStatus: "pending", isSender: true },
          ];
        });

        if (res.connection) {
          setConnections((prev) => [res.connection, ...prev]);
        }

        refreshDrivers();
        setSentInviteSuccess(true);
      } else {
        Alert.alert("Unable to send", res.error || "Please try again later.");
      }
    } catch (err: any) {
      Alert.alert("Network Error", err.message || "Failed to dispatch connection request.");
    } finally {
      setIsSendingMessageInvite(false);
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

  const handleShare = async (post: PostItem) => {
    try {
      let message = `🚗 Drivemate Update from ${post.author} (${post.authorTag}):\n\n"${post.content}"`;
      if (post.fromCity && post.toCity) {
        message += `\n\n📍 Route: ${post.fromCity} ➔ ${post.toCity}`;
        if (post.departureTime) message += `\n🕒 Departure: ${post.departureTime}`;
        if (post.availableSeats) message += `\n👥 Available Seats: ${post.availableSeats}`;
        if (post.pricePerSeat) message += `\n🏷️ Rate: ${post.pricePerSeat}`;
      }
      if (post.link) {
        message += `\n\n🔗 ${post.link}`;
      }
      message += `\n\nShared via Drivemate Community`;
      await Share.share({
        message,
        title: `Drivemate Post by ${post.author}`,
        url: post.link || undefined,
      });
    } catch (err: any) {
      console.warn("Share dialog closed or error:", err.message);
    }
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
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.composeAvatarImg} />
              ) : (
                <Text style={styles.composeAvatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              )}
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
            <View style={styles.communityBadgeWrap}>
              <SparklesIcon size={13} color="#09090b" />
              <Text style={styles.communityBadgeText}>Community Feed</Text>
            </View>

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
          <Text style={styles.feedCount}>{posts.slice(0, 5).length} posts</Text>
        </View>

        {/* Posts List */}
        {posts.slice(0, 5).map((post) => {
          const isPostAuthorSelf =
            post.author.toLowerCase() === userName.toLowerCase() ||
            post.authorTag.toLowerCase() === `@${userName.toLowerCase().replace(/\s+/g, "_")}`;
          const avatarSource = post.authorAvatar || (isPostAuthorSelf ? userAvatar : undefined);

          return (
            <View key={post.id} style={styles.postCard}>
              {/* Post Author Row - Clickable to open Driver Profile */}
              <TouchableOpacity
                style={styles.postAuthorRow}
                onPress={() => handleOpenDriverProfile(post)}
                activeOpacity={0.75}
              >
                <View style={styles.postAvatar}>
                  {avatarSource ? (
                    <Image source={{ uri: avatarSource }} style={styles.postAvatarImg} />
                  ) : (
                    <Text style={styles.postAvatarText}>
                      {post.author.charAt(0).toUpperCase()}
                    </Text>
                  )}
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
                    <Text style={styles.routePrice}>
                      {post.pricePerSeat && post.pricePerSeat.replace(/\$/g, "").trim()
                        ? `Carpool • ${post.pricePerSeat.replace(/\$/g, "").trim()}`
                        : "Carpool"}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Attached Photos (Limit of 3) */}
            {post.photos && post.photos.length > 0 && (
              <View style={styles.postPhotosContainer}>
                {post.photos.length === 1 && (
                  <TouchableOpacity
                    style={styles.singlePhotoWrapper}
                    onPress={() => setZoomPhotoUrl(post.photos![0])}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: post.photos[0] }}
                      style={styles.singlePhoto}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}

                {post.photos.length === 2 && (
                  <View style={styles.doublePhotosRow}>
                    {post.photos.slice(0, 2).map((photoUrl, pIdx) => (
                      <TouchableOpacity
                        key={pIdx}
                        style={styles.doublePhotoWrapper}
                        onPress={() => setZoomPhotoUrl(photoUrl)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: photoUrl }}
                          style={styles.doublePhoto}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {post.photos.length >= 3 && (
                  <View style={styles.triplePhotosContainer}>
                    <TouchableOpacity
                      style={styles.triplePhotoTopWrapper}
                      onPress={() => setZoomPhotoUrl(post.photos![0])}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: post.photos[0] }}
                        style={styles.triplePhotoTop}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <View style={styles.triplePhotosBottomRow}>
                      {post.photos.slice(1, 3).map((photoUrl, pIdx) => (
                        <TouchableOpacity
                          key={pIdx}
                          style={styles.triplePhotoBottomWrapper}
                          onPress={() => setZoomPhotoUrl(photoUrl)}
                          activeOpacity={0.9}
                        >
                          <Image
                            source={{ uri: photoUrl }}
                            style={styles.triplePhotoBottom}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
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
            {(() => {
              const isPostSelf =
                (userId && post.userId && post.userId === userId) ||
                post.author.toLowerCase() === userName.toLowerCase() ||
                post.authorTag.toLowerCase() === `@${userName.toLowerCase().replace(/\s+/g, "_")}`;

              const postMatched = driversList.find(
                (d) =>
                  (post.userId && d.uid === post.userId) ||
                  d.username.toLowerCase() === post.authorTag.replace(/^@/, "").toLowerCase() ||
                  d.fullName.toLowerCase() === post.author.toLowerCase()
              );

              const postTargetUid =
                post.userId ||
                (postMatched ? postMatched.uid : isPostSelf && userId ? userId : `driver_${post.authorTag.replace(/[^a-zA-Z0-9]/g, "")}`);
              const postTargetName = postMatched?.fullName || post.author;

              const postConn = connections.find(
                (c: any) =>
                  (c.fromUserId === postTargetUid && c.toUserId === userId) ||
                  (c.toUserId === postTargetUid && c.fromUserId === userId) ||
                  (isPostSelf && (c.fromUserId === userId || c.toUserId === userId)) ||
                  (c.toUserName && c.toUserName.toLowerCase() === postTargetName.toLowerCase()) ||
                  (c.fromUserName && c.fromUserName.toLowerCase() === postTargetName.toLowerCase())
              );

              const postConnStatus = postConn?.status || postMatched?.connectionStatus || "none";
              const isConnAccepted = postConnStatus === "accepted";
              const isConnPending = postConnStatus === "pending";

              return (
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
                    onPress={() => handleTapMessageOnPost(post)}
                    activeOpacity={0.7}
                  >
                    <MessageIcon
                      size={18}
                      color={isConnAccepted ? "#10b981" : isConnPending ? "#f59e0b" : "#71717a"}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        isConnAccepted && { color: "#10b981", fontWeight: "600" },
                        isConnPending && { color: "#f59e0b", fontWeight: "600" },
                      ]}
                    >
                      {isConnAccepted ? "Message" : isConnPending ? "Pending" : "Message"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleShare(post)}
                  >
                    <ShareIcon size={18} color="#71717a" />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>

                  {isPostSelf && onDeletePost && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onDeletePost(post.id)}
                    >
                      <TrashIcon size={17} color="#ef4444" />
                      <Text style={[styles.actionText, { color: "#ef4444", fontWeight: "600" }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}
          </View>
        );
      })}
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
                    {selectedDriver.photoUrl || selectedDriver.profilePicture ? (
                      <Image
                        source={{ uri: selectedDriver.photoUrl || selectedDriver.profilePicture }}
                        style={styles.driverBigAvatarImg}
                      />
                    ) : (
                      <Text style={styles.driverBigAvatarText}>
                        {selectedDriver.fullName.charAt(0).toUpperCase()}
                      </Text>
                    )}
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
                  {selectedDriver.connectionStatus === "accepted" ? (
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
                      <TouchableOpacity
                        style={styles.viewRequestsModalBtn}
                        onPress={() => {
                          setIsDriverModalVisible(false);
                          if (onNavigateTab) {
                            onNavigateTab("messaging", "requests");
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.viewRequestsModalBtnText}>
                          View in Requests →
                        </Text>
                      </TouchableOpacity>
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
                            Send Connection Request
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

      {/* ======================================================== */}
      {/* MAGNIFICENT MESSAGE & DRIVER CONNECTION POPUP MODAL     */}
      {/* ======================================================== */}
      <Modal
        visible={isMessagePopupVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMessagePopupVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.msgModalOverlay}
        >
          <TouchableOpacity
            style={styles.msgModalBackdrop}
            activeOpacity={1}
            onPress={() => setIsMessagePopupVisible(false)}
          />

          <View style={styles.msgModalContainer}>
            {/* Top Indicator Drag Bar */}
            <View style={styles.msgModalHeaderBar}>
              <View style={styles.msgDragIndicator} />
              <TouchableOpacity
                style={styles.msgCloseBtn}
                onPress={() => setIsMessagePopupVisible(false)}
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color="#71717a" />
              </TouchableOpacity>
            </View>

            {messageModalTarget && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.msgModalScrollContent}
              >
                {/* SUCCESS CONFIRMATION STATE */}
                {sentInviteSuccess ? (
                  <View style={styles.msgSuccessContainer}>
                    <View style={styles.msgSuccessIconCircle}>
                      <CheckCircleIcon size={36} color="#16a34a" />
                    </View>
                    <Text style={styles.msgSuccessTitle}>Connection Dispatched!</Text>
                    <Text style={styles.msgSuccessSubtitle}>
                      Your invitation and message have been sent to{" "}
                      <Text style={{ fontWeight: "700", color: "#09090b" }}>
                        {messageModalTarget.driver.fullName}
                      </Text>
                      . Direct 1-on-1 messaging will unlock automatically as soon as they accept.
                    </Text>

                    <View style={styles.msgSuccessBadgesRow}>
                      <View style={styles.msgSuccessPill}>
                        <CheckCircleIcon size={12} color="#16a34a" />
                        <Text style={styles.msgSuccessPillText}>Push Alert Sent</Text>
                      </View>
                      <View style={styles.msgSuccessPill}>
                        <MailIcon size={12} color="#16a34a" />
                        <Text style={styles.msgSuccessPillText}>Email Notification</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.msgDoneBtn}
                      onPress={() => setIsMessagePopupVisible(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.msgDoneBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {/* DRIVER IDENTITY HERO CARD */}
                    <View style={styles.msgDriverHeroCard}>
                      <View style={styles.msgAvatarWrapper}>
                        {messageModalTarget.driver.photoUrl || messageModalTarget.driver.profilePicture ? (
                          <Image
                            source={{
                              uri:
                                messageModalTarget.driver.photoUrl ||
                                messageModalTarget.driver.profilePicture,
                            }}
                            style={styles.msgBigAvatar}
                          />
                        ) : (
                          <View style={styles.msgBigAvatarFallback}>
                            <Text style={styles.msgBigAvatarText}>
                              {messageModalTarget.driver.fullName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.msgOnlineBadge}>
                          <CheckCircleIcon size={14} color="#16a34a" />
                        </View>
                      </View>

                      <View style={styles.msgDriverDetails}>
                        <View style={styles.msgNameRow}>
                          <Text style={styles.msgDriverName} numberOfLines={1}>
                            {messageModalTarget.driver.fullName}
                          </Text>
                          <View style={styles.msgVerifiedPill}>
                            <ShieldIcon size={11} color="#09090b" />
                            <Text style={styles.msgVerifiedPillText}>VERIFIED</Text>
                          </View>
                        </View>

                        <Text style={styles.msgDriverTag}>
                          @{messageModalTarget.driver.username}
                        </Text>

                        <View style={styles.msgQuickStatsRow}>
                          <Text style={styles.msgStatPill}>⭐ 4.9 Rating</Text>
                          <Text style={styles.msgStatDot}>•</Text>
                          <Text style={styles.msgStatPill}>⚡ &lt; 5m replies</Text>
                        </View>
                      </View>
                    </View>

                    {/* TRIP ROUTE CONTEXT CARD */}
                    {(messageModalTarget.post.fromCity || messageModalTarget.post.toCity) && (
                      <View style={styles.msgRouteCard}>
                        <View style={styles.msgRouteHeader}>
                          <View style={styles.msgRouteBadge}>
                            <CarIcon size={12} color="#09090b" />
                            <Text style={styles.msgRouteBadgeText}>COMMUNITY TRIP</Text>
                          </View>
                          {messageModalTarget.post.pricePerSeat && (
                            <Text style={styles.msgRoutePrice}>
                              {messageModalTarget.post.pricePerSeat}
                            </Text>
                          )}
                        </View>

                        <View style={styles.msgRoutePathRow}>
                          <Text style={styles.msgRouteCity}>
                            {messageModalTarget.post.fromCity || "Departure"}
                          </Text>
                          <Text style={styles.msgRouteArrow}>➔</Text>
                          <Text style={styles.msgRouteCity}>
                            {messageModalTarget.post.toCity || "Destination"}
                          </Text>
                        </View>

                        {(messageModalTarget.post.departureTime || messageModalTarget.post.availableSeats) && (
                          <View style={styles.msgRouteMetaRow}>
                            {messageModalTarget.post.departureTime && (
                              <Text style={styles.msgRouteMetaItem}>
                                🕒 {messageModalTarget.post.departureTime}
                              </Text>
                            )}
                            {messageModalTarget.post.availableSeats && (
                              <Text style={styles.msgRouteMetaItem}>
                                👥 {messageModalTarget.post.availableSeats} Seats Open
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    )}

                    {/* PENDING APPROVAL NOTICE IF ALREADY PENDING */}
                    {messageModalTarget.isPending ? (
                      <View style={styles.msgPendingCard}>
                        <View style={styles.msgPendingHeader}>
                          <Text style={styles.msgPendingIcon}>⏳</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.msgPendingTitle}>
                              Invitation Pending Approval
                            </Text>
                            <Text style={styles.msgPendingDesc}>
                              You've already sent a connection invite to{" "}
                              {messageModalTarget.driver.fullName}. Once they tap accept, direct 1-on-1 driver comms will activate immediately.
                            </Text>
                          </View>
                        </View>

                        <View style={styles.msgPendingActionsRow}>
                          <TouchableOpacity
                            style={styles.msgViewRequestsBtn}
                            onPress={() => {
                              setIsMessagePopupVisible(false);
                              if (onNavigateTab) {
                                onNavigateTab("messaging", "requests");
                              }
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.msgViewRequestsBtnText}>
                              View in Requests Tab →
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        {/* MESSAGE COMPOSER SECTION */}
                        <View style={styles.msgComposerSection}>
                          <View style={styles.msgComposerHeader}>
                            <Text style={styles.msgComposerLabel}>Introductory Message</Text>
                            <Text style={styles.msgCharCount}>
                              {customIntroMessage.length}/160
                            </Text>
                          </View>

                          <View style={styles.msgInputBox}>
                            <TextInput
                              style={styles.msgTextInput}
                              placeholder="Type an introductory message..."
                              placeholderTextColor="#a1a1aa"
                              value={customIntroMessage}
                              onChangeText={(t) => setCustomIntroMessage(t.slice(0, 160))}
                              multiline
                              numberOfLines={3}
                              textAlignVertical="top"
                            />
                          </View>

                          {/* QUICK SUGGESTION CHIPS */}
                          <Text style={styles.msgQuickChipsLabel}>Quick suggestions:</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.msgChipsScroll}
                          >
                            {[
                              "🚗 Are seats still available?",
                              "📍 Where is the exact pickup?",
                              "🕒 Is departure time flexible?",
                              "👋 Can we connect on this trip?",
                            ].map((chip, idx) => (
                              <TouchableOpacity
                                key={idx}
                                style={styles.msgChipBtn}
                                onPress={() => setCustomIntroMessage(chip)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.msgChipText}>{chip}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>

                        {/* SEND ACTION BUTTON */}
                        <TouchableOpacity
                          style={[
                            styles.msgPrimarySendBtn,
                            isSendingMessageInvite && styles.btnDisabled,
                          ]}
                          onPress={handleSendMessageInviteFromPopup}
                          disabled={isSendingMessageInvite}
                          activeOpacity={0.88}
                        >
                          {isSendingMessageInvite ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <>
                              <MessageIcon size={18} color="#ffffff" />
                              <Text style={styles.msgPrimarySendBtnText}>
                                Send Message & Connection
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    )}

                    {/* TRUST & PRIVACY FOOTER */}
                    <View style={styles.msgTrustFooter}>
                      <ShieldIcon size={13} color="#71717a" />
                      <Text style={styles.msgTrustFooterText}>
                        End-to-end encrypted driver communications • Zero spam policy
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullscreen Photo Viewer Modal */}
      <Modal
        visible={Boolean(zoomPhotoUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomPhotoUrl(null)}
      >
        <View style={styles.zoomBackdrop}>
          <TouchableOpacity
            style={styles.zoomCloseBtn}
            onPress={() => setZoomPhotoUrl(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <CloseIcon size={20} color="#ffffff" />
          </TouchableOpacity>
          {zoomPhotoUrl && (
            <View style={styles.zoomImageContainer}>
              <Image
                source={{ uri: zoomPhotoUrl }}
                style={styles.zoomImage}
                resizeMode="contain"
              />
            </View>
          )}
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
    overflow: "hidden",
  },
  composeAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
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
  communityBadgeWrap: {
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
  communityBadgeText: {
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
    overflow: "hidden",
  },
  postAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
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
    overflow: "hidden",
  },
  driverBigAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
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
  viewRequestsModalBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  viewRequestsModalBtnText: {
    color: "#b45309",
    fontSize: 12,
    fontWeight: "700",
  },
  postPhotosContainer: {
    marginVertical: 10,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#f4f4f5",
  },
  singlePhotoWrapper: {
    width: "100%",
    height: 200,
  },
  singlePhoto: {
    width: "100%",
    height: "100%",
  },
  doublePhotosRow: {
    flexDirection: "row",
    gap: 3,
    height: 160,
  },
  doublePhotoWrapper: {
    flex: 1,
    height: "100%",
  },
  doublePhoto: {
    width: "100%",
    height: "100%",
  },
  triplePhotosContainer: {
    width: "100%",
  },
  triplePhotoTopWrapper: {
    width: "100%",
    height: 160,
    marginBottom: 3,
  },
  triplePhotoTop: {
    width: "100%",
    height: "100%",
  },
  triplePhotosBottomRow: {
    flexDirection: "row",
    gap: 3,
    height: 110,
  },
  triplePhotoBottomWrapper: {
    flex: 1,
    height: "100%",
  },
  triplePhotoBottom: {
    width: "100%",
    height: "100%",
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomCloseBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 32,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  zoomImageContainer: {
    width: "96%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomImage: {
    width: "100%",
    height: "100%",
  },

  /* Magnificent Message & Connection Popup Styles */
  btnDisabled: {
    opacity: 0.5,
  },
  msgModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  msgModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(9, 9, 11, 0.65)",
  },
  msgModalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  msgModalHeaderBar: {
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 10,
    position: "relative",
  },
  msgDragIndicator: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e4e4e7",
  },
  msgCloseBtn: {
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
  msgModalScrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  msgDriverHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 16,
    gap: 14,
  },
  msgAvatarWrapper: {
    position: "relative",
  },
  msgBigAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  msgBigAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  msgBigAvatarText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  msgOnlineBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 1.5,
  },
  msgDriverDetails: {
    flex: 1,
  },
  msgNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  msgDriverName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.3,
  },
  msgVerifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  msgVerifiedPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: 0.5,
  },
  msgDriverTag: {
    fontSize: 12,
    color: "#71717a",
    fontWeight: "600",
    marginBottom: 6,
  },
  msgQuickStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  msgStatPill: {
    fontSize: 11,
    fontWeight: "600",
    color: "#52525b",
  },
  msgStatDot: {
    fontSize: 11,
    color: "#a1a1aa",
  },
  msgRouteCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  msgRouteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  msgRouteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  msgRouteBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: 0.4,
  },
  msgRoutePrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16a34a",
  },
  msgRoutePathRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  msgRouteCity: {
    fontSize: 15,
    fontWeight: "700",
    color: "#09090b",
  },
  msgRouteArrow: {
    fontSize: 14,
    color: "#a1a1aa",
    fontWeight: "700",
  },
  msgRouteMetaRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
  },
  msgRouteMetaItem: {
    fontSize: 11,
    fontWeight: "600",
    color: "#71717a",
  },
  msgComposerSection: {
    marginBottom: 16,
  },
  msgComposerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  msgComposerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  msgCharCount: {
    fontSize: 11,
    color: "#a1a1aa",
    fontWeight: "600",
  },
  msgInputBox: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 88,
    marginBottom: 12,
  },
  msgTextInput: {
    fontSize: 14,
    color: "#09090b",
    lineHeight: 20,
    padding: 0,
  },
  msgQuickChipsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717a",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  msgChipsScroll: {
    gap: 8,
    paddingBottom: 2,
  },
  msgChipBtn: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  msgChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3f3f46",
  },
  msgPrimarySendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#09090b",
    height: 52,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  msgPrimarySendBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  msgPendingCard: {
    backgroundColor: "#fffbeb",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#fde68a",
    padding: 16,
    marginBottom: 16,
  },
  msgPendingHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  msgPendingIcon: {
    fontSize: 22,
  },
  msgPendingTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 4,
  },
  msgPendingDesc: {
    fontSize: 12,
    color: "#b45309",
    lineHeight: 18,
  },
  msgPendingActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  msgViewRequestsBtn: {
    flex: 1,
    backgroundColor: "#92400e",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  msgViewRequestsBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  msgSuccessContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  msgSuccessIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#dcfce7",
    borderWidth: 2,
    borderColor: "#86efac",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  msgSuccessTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#09090b",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  msgSuccessSubtitle: {
    fontSize: 13,
    color: "#52525b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  msgSuccessBadgesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  msgSuccessPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  msgSuccessPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
  },
  msgDoneBtn: {
    width: "100%",
    backgroundColor: "#09090b",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  msgDoneBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  msgTrustFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 4,
  },
  msgTrustFooterText: {
    fontSize: 11,
    color: "#a1a1aa",
    fontWeight: "500",
  },
});
