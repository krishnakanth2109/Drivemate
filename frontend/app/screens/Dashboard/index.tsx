import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import BottomBar, { TabKey } from "../../components/BottomBar";
import Sidebar from "../../components/Sidebar";
import CreatePostModal, { PostItem } from "../../components/CreatePostModal";
import PaymentModal from "../../components/PaymentModal";
import { MenuIcon, PlusIcon, SparklesIcon } from "../../components/Icons";
import { authAPI, postsAPI, billingAPI } from "../../services/api";
import { getUserProfile } from "../../services/storage";
import { logScreenView, logPostCreation } from "../../services/analytics";

import HomeTab from "./tabs/HomeTab";
import MessagingTab from "./tabs/MessagingTab";
import UpdatesTab from "./tabs/UpdatesTab";
import ServicesTab from "./tabs/ServicesTab";
import ProfileTab from "./tabs/ProfileTab";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Dashboard">;

const Dashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentTab, setCurrentTab] = useState<TabKey>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // User Profile & Free Tier Post Limits (2 free posts)
  const MAX_FREE_POSTS = 2;
  const [userName, setUserName] = useState("Drivemate Driver");
  const [userEmail, setUserEmail] = useState("");
  const [freePostsUsed, setFreePostsUsed] = useState(0);
  const [singlePasses, setSinglePasses] = useState(0);
  const [isProUser, setIsProUser] = useState(false);

  // Community posts fetched live from MongoDB backend
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [userCreatedCount, setUserCreatedCount] = useState(0);

  // Synchronize user profile, community posts, and billing quota on mount
  useEffect(() => {
    let isMounted = true;
    logScreenView("dashboard");

    async function loadData() {
      // 1. Load user profile from AsyncStorage or backend
      const stored = await getUserProfile();
      if (stored && isMounted) {
        if (stored.fullName) setUserName(stored.fullName);
        if (stored.email) setUserEmail(stored.email);
        if (typeof stored.freePostsUsed === "number") setFreePostsUsed(stored.freePostsUsed);
        if (typeof stored.singlePasses === "number") setSinglePasses(stored.singlePasses);
        if (typeof stored.isProUser === "boolean") setIsProUser(stored.isProUser);
      }

      // 2. Fetch fresh community posts from MongoDB backend
      try {
        const postsRes = await postsAPI.getPosts();
        if (postsRes.success && Array.isArray(postsRes.posts) && isMounted) {
          setPosts(postsRes.posts);
        }
      } catch {}

      // 3. Fetch latest billing quota status from backend
      try {
        const billingRes = await billingAPI.getStatus();
        if (billingRes.success && billingRes.billing && isMounted) {
          setIsProUser(!!billingRes.billing.isProUser);
          setFreePostsUsed(billingRes.billing.freePostsUsed || 0);
          setSinglePasses(billingRes.billing.singlePasses || 0);
        }
      } catch {}

      console.log("📊 [Dashboard Data Loaded]", {
        user: { fullName: stored?.fullName, email: stored?.email },
        isProUser: stored?.isProUser,
        freePostsUsed: stored?.freePostsUsed,
        singlePasses: stored?.singlePasses,
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
      await postsAPI.toggleLike(id);
    } catch {}
  };

  const canPost = isProUser || singlePasses > 0 || freePostsUsed < MAX_FREE_POSTS;

  const handleOpenCreatePost = () => {
    console.log("✍️ [Dashboard] Opening create post dialog. canPost:", canPost);
    if (!canPost) {
      setIsPaymentModalOpen(true);
    } else {
      setIsCreatePostOpen(true);
    }
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
  }) => {
    console.log("🚀 [Dashboard Publish Post] Submitting payload:", postData);
    try {
      const res = await postsAPI.createPost(postData);

      if (res.requirePayment) {
        setIsCreatePostOpen(false);
        setIsPaymentModalOpen(true);
        Alert.alert(
          "Free Limit Reached",
          "You have used your 2 free community posts. Purchase a Single Pass or upgrade to Pro to publish."
        );
        return;
      }

      if (res.success && res.post) {
        setPosts((prev) => [res.post, ...prev]);
        setUserCreatedCount((prev) => prev + 1);

        logPostCreation(postData.tag, postData.fromCity, postData.toCity);

        if (res.quota) {
          setFreePostsUsed(res.quota.freePostsUsed);
          setSinglePasses(res.quota.singlePasses);
          setIsProUser(res.quota.isProUser);
        }
      } else {
        // Fallback local update if network is unreachable
        const fallbackPost: PostItem = {
          id: `p_${Date.now()}`,
          author: userName,
          authorTag: `@${userName.toLowerCase().replace(/\s+/g, "_")}`,
          timeAgo: "Just now",
          content: postData.content,
          fromCity: postData.fromCity,
          toCity: postData.toCity,
          departureTime: postData.departureTime,
          availableSeats: postData.availableSeats,
          pricePerSeat: postData.pricePerSeat,
          link: postData.link,
          linkTitle: postData.linkTitle,
          tag: postData.tag,
          likes: 0,
          commentsCount: 0,
          isLiked: false,
        };
        setPosts([fallbackPost, ...posts]);
        setUserCreatedCount((prev) => prev + 1);
        if (!isProUser) {
          if (freePostsUsed < MAX_FREE_POSTS) {
            setFreePostsUsed((prev) => prev + 1);
          } else if (singlePasses > 0) {
            setSinglePasses((prev) => Math.max(0, prev - 1));
          }
        }
      }
    } catch (err) {
      // Local fallback
      const fallbackPost: PostItem = {
        id: `p_${Date.now()}`,
        author: userName,
        authorTag: `@${userName.toLowerCase().replace(/\s+/g, "_")}`,
        timeAgo: "Just now",
        content: postData.content,
        fromCity: postData.fromCity,
        toCity: postData.toCity,
        departureTime: postData.departureTime,
        availableSeats: postData.availableSeats,
        pricePerSeat: postData.pricePerSeat,
        link: postData.link,
        linkTitle: postData.linkTitle,
        tag: postData.tag,
        likes: 0,
        commentsCount: 0,
        isLiked: false,
      };
      setPosts([fallbackPost, ...posts]);
      setUserCreatedCount((prev) => prev + 1);
    }
  };

  const handlePaymentSuccess = async (plan: "single" | "pro") => {
    try {
      if (plan === "pro") {
        const res = await billingAPI.upgradePro();
        if (res.success && res.billing) {
          setIsProUser(true);
        } else {
          setIsProUser(true);
        }
      } else {
        const res = await billingAPI.buySinglePass();
        if (res.success && res.billing) {
          setSinglePasses(res.billing.singlePasses);
        } else {
          setSinglePasses((prev) => prev + 1);
        }
      }
    } catch {
      if (plan === "pro") {
        setIsProUser(true);
      } else {
        setSinglePasses((prev) => prev + 1);
      }
    }

    // Re-open post modal for seamless posting experience
    setTimeout(() => {
      setIsCreatePostOpen(true);
    }, 500);
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
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              console.log("🍔 [Dashboard] Opening sidebar drawer");
              setIsSidebarOpen(true);
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MenuIcon size={22} color="#09090b" />
          </TouchableOpacity>

          <View style={styles.brandContainer}>
            <View style={styles.logoPill}>
              <Text style={styles.logoPillText}>DM</Text>
            </View>
            <Text style={styles.brandTitle}>Drivemate</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Post Limit or Pro Badge */}
          <TouchableOpacity
            style={styles.tierPill}
            onPress={() => setIsPaymentModalOpen(true)}
            activeOpacity={0.7}
          >
            <SparklesIcon size={12} color="#09090b" />
            <Text style={[styles.tierPillText, isProUser && styles.tierProPillText]}>
              {isProUser
                ? "PRO"
                : singlePasses > 0
                ? `${singlePasses} PASS`
                : `${Math.max(0, MAX_FREE_POSTS - freePostsUsed)} FREE`}
            </Text>
          </TouchableOpacity>

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
            <Text style={styles.avatarButtonText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
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
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
            freePostsUsed={freePostsUsed}
            maxFreePosts={MAX_FREE_POSTS}
            singlePasses={singlePasses}
            isProUser={isProUser}
            userName={userName}
          />
        )}
        {currentTab === "messaging" && <MessagingTab />}
        {currentTab === "updates" && <UpdatesTab />}
        {currentTab === "services" && <ServicesTab />}
        {currentTab === "profile" && (
          <ProfileTab
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
            onSignOut={handleSignOut}
            freePostsUsed={freePostsUsed}
            maxFreePosts={MAX_FREE_POSTS}
            singlePasses={singlePasses}
            isProUser={isProUser}
            totalPostsCreated={userCreatedCount}
            userName={userName}
            userEmail={userEmail}
          />
        )}
      </View>

      {/* Downbar */}
      <BottomBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unreadMessagesCount={2}
        hasNewUpdates={true}
      />

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setIsSidebarOpen(false);
        }}
        onOpenCreatePost={() => {
          setIsSidebarOpen(false);
          handleOpenCreatePost();
        }}
        onOpenPaymentModal={() => {
          setIsSidebarOpen(false);
          setIsPaymentModalOpen(true);
        }}
        onSignOut={handleSignOut}
        freePostsUsed={freePostsUsed}
        maxFreePosts={MAX_FREE_POSTS}
        singlePasses={singlePasses}
        isProUser={isProUser}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        visible={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmitPost={handlePublishPost}
        onOpenPaymentModal={() => {
          setIsCreatePostOpen(false);
          setIsPaymentModalOpen(true);
        }}
        freePostsUsed={freePostsUsed}
        maxFreePosts={MAX_FREE_POSTS}
        singlePasses={singlePasses}
        isProUser={isProUser}
        userName={userName}
      />

      {/* Payment / Upgrade Modal */}
      <PaymentModal
        visible={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        freePostsUsed={freePostsUsed}
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
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
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
