import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import BottomBar, { TabKey } from "../../components/BottomBar";
import CreatePostModal, { PostItem } from "../../components/CreatePostModal";
import { PlusIcon } from "../../components/Icons";
import { authAPI, postsAPI } from "../../services/api";
import { getUserProfile } from "../../services/storage";
import { logScreenView, logPostCreation } from "../../services/analytics";

import HomeTab from "./tabs/HomeTab";
import MessagingTab from "./tabs/MessagingTab";
import UpdatesTab from "./tabs/UpdatesTab";
import ProfileTab from "./tabs/ProfileTab";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Dashboard">;

const Dashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentTab, setCurrentTab] = useState<TabKey>("home");
  const [messagingInitialMode, setMessagingInitialMode] = useState<"chats" | "requests" | "discover">("chats");
  const [messagingInitialRoomId, setMessagingInitialRoomId] = useState<string | undefined>(undefined);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // User Profile
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState("Driver");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined);

  // Community posts fetched live from MongoDB backend
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [userCreatedCount, setUserCreatedCount] = useState(0);

  // Synchronize user profile and community posts on mount
  useEffect(() => {
    let isMounted = true;
    logScreenView("dashboard");

    async function loadData() {
      // 1. Load user profile from AsyncStorage or backend
      const stored = await getUserProfile();
      if (stored && isMounted) {
        if (stored.uid) setUserId(stored.uid);
        if (stored.fullName) setUserName(stored.fullName);
        if (stored.email) setUserEmail(stored.email);
        if (stored.profilePicture || stored.photoUrl) {
          setUserAvatar(stored.profilePicture || stored.photoUrl);
        }
      }

      try {
        const profileRes = await authAPI.getProfile();
        if (profileRes.success && profileRes.user && isMounted) {
          if (profileRes.user.uid) setUserId(profileRes.user.uid);
          if (profileRes.user.fullName) setUserName(profileRes.user.fullName);
          if (profileRes.user.email) setUserEmail(profileRes.user.email);
          if (profileRes.user.profilePicture || profileRes.user.photoUrl) {
            setUserAvatar(profileRes.user.profilePicture || profileRes.user.photoUrl);
          }
        }
      } catch {}

      // 2. Fetch fresh community posts from MongoDB backend
      try {
        const postsRes = await postsAPI.getPosts();
        if (postsRes.success && Array.isArray(postsRes.posts) && isMounted) {
          setPosts(postsRes.posts);
        }
      } catch {}

      console.log("📊 [Dashboard Data Loaded]", {
        user: { fullName: stored?.fullName, email: stored?.email },
      });
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleLike = async (id: string) => {
    console.log("❤️ [Dashboard Like] Toggling like for post id:", id);

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      })
    );

    try {
      const res = await postsAPI.toggleLike(id);
      if (!res.success && (res.status === 401 || res.error?.includes("token") || res.error?.includes("Authentication"))) {
        // Revert optimistic update
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === id) {
              const isLiked = !p.isLiked;
              return {
                ...p,
                isLiked,
                likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
              };
            }
            return p;
          })
        );
        Alert.alert(
          "Session Expired",
          "Your login session has expired. Please sign in again.",
          [
            { text: "Sign In", onPress: handleSignOut },
            { text: "Cancel", style: "cancel" },
          ]
        );
      }
    } catch {}
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert("Delete Post", "Are you sure you want to permanently delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const previous = [...posts];
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          try {
            const res = await postsAPI.deletePost(postId);
            if (!res.success) {
              setPosts(previous);
              Alert.alert("Deletion Failed", res.error || "Unable to delete post at this time.");
            } else {
              setUserCreatedCount((prev) => Math.max(0, prev - 1));
              Alert.alert("Post Deleted", "Your post has been removed from the community feed.");
            }
          } catch (err: any) {
            setPosts(previous);
            Alert.alert("Error", err.message || "Failed to communicate with server.");
          }
        },
      },
    ]);
  };

  const handleOpenCreatePost = () => {
    setIsCreatePostOpen(true);
  };

  const handlePublishPost = async (postData: {
    content: string;
    fromCity?: string;
    toCity?: string;
    departureTime?: string;
    availableSeats?: number;
    pricePerSeat?: string;
    link?: string;
    linkTitle?: string;
    tag?: string;
    photos?: string[];
  }) => {
    console.log("🚀 [Dashboard Publish Post] Submitting payload:", postData);
    try {
      const res = await postsAPI.createPost(postData);

      if (res.success && res.post) {
        setPosts((prev) => [res.post, ...prev]);
        setUserCreatedCount((prev) => prev + 1);
        logPostCreation(postData.tag, postData.fromCity, postData.toCity);
        Alert.alert("Post Published!", "Your journey update is live on the community feed.");
      } else if (res.status === 401 || res.error?.includes("token") || res.error?.includes("Authentication")) {
        Alert.alert(
          "Session Expired",
          "Your login session has expired or is invalid. Please sign in again to publish posts.",
          [
            { text: "Sign In", onPress: handleSignOut },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else {
        Alert.alert("Unable to Publish", res.error || "Please check your network and try again.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to publish post.");
    }
  };

  const handleSignOut = async () => {
    try {
      await authAPI.logout();
    } catch {}

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.brandContainer}>
            <View style={styles.logoPill}>
              <Text style={styles.logoPillText}>DM</Text>
            </View>
            <Text style={styles.brandTitle}>Drivemate</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Quick Create Post Header Button */}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleOpenCreatePost}
            activeOpacity={0.8}
          >
            <PlusIcon size={15} color="#ffffff" />
          </TouchableOpacity>

          {/* Profile Shortcut */}
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setCurrentTab("profile")}
            activeOpacity={0.8}
          >
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.headerAvatarImg} />
            ) : (
              <Text style={styles.avatarButtonText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Body Content based on Downbar active tab */}
      <View style={styles.tabContent}>
        {currentTab === "home" && (
          <HomeTab
            posts={posts}
            onToggleLike={handleToggleLike}
            onOpenCreatePost={handleOpenCreatePost}
            onDeletePost={handleDeletePost}
            onNavigateTab={(tab, mode, roomId) => {
              if (mode) setMessagingInitialMode(mode);
              if (roomId) setMessagingInitialRoomId(roomId);
              setCurrentTab(tab);
            }}
            userName={userName}
            userId={userId}
            userAvatar={userAvatar}
          />
        )}
        {currentTab === "messaging" && (
          <MessagingTab
            initialTabMode={messagingInitialMode}
            initialRoomId={messagingInitialRoomId}
          />
        )}
        {currentTab === "updates" && <UpdatesTab />}
        {currentTab === "profile" && (
          <ProfileTab
            onSignOut={handleSignOut}
            totalPostsCreated={userCreatedCount}
            userName={userName}
            userEmail={userEmail}
            userAvatar={userAvatar}
          />
        )}
      </View>

      {/* Downbar */}
      <BottomBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unreadMessagesCount={0}
        hasNewUpdates={false}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        visible={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmitPost={handlePublishPost}
        userName={userName}
        userAvatar={userAvatar}
      />
    </SafeAreaView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  topHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    backgroundColor: "#ffffff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoPill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  logoPillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#18181b",
    letterSpacing: 0.3,
  },
  tierProPillText: {
    color: "#09090b",
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  avatarButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  tabContent: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
});
