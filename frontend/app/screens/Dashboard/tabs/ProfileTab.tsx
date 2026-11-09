import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import {
  SparklesIcon,
  LogOutIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  EditIcon,
  CarIcon,
  SettingsIcon,
  HelpCircleIcon,
  FileTextIcon,
  UserIcon,
  PlusIcon,
  TrashIcon,
  PlayIcon,
  MailIcon,
  ShieldIcon,
} from "../../../components/Icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BallGame from "../../../components/BallGame";
import { authAPI, vehiclesAPI, postsAPI } from "../../../services/api";
import { getUserProfile, StoredUserProfile } from "../../../services/storage";

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList>;

interface ProfileTabProps {
  onSignOut: () => void;
  totalPostsCreated: number;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  onSignOut,
  totalPostsCreated: fallbackPostsCount,
  userName: fallbackName = "Driver",
  userEmail: fallbackEmail = "",
  userAvatar,
}) => {
  const navigation = useNavigation<ProfileNavProp>();

  const [profile, setProfile] = useState<StoredUserProfile | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [userPostsCount, setUserPostsCount] = useState<number>(fallbackPostsCount);
  const [totalLikesCount, setTotalLikesCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isGameOpen, setIsGameOpen] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(0);
  const [isResendingEmail, setIsResendingEmail] = useState<boolean>(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState<boolean>(false);

  const handleResendVerification = async () => {
    setIsResendingEmail(true);
    try {
      const res = await authAPI.resendVerificationEmail(displayEmail);
      if (res.success) {
        Alert.alert(
          "Verification Email Sent! 📩",
          `Google has dispatched a verification link to ${displayEmail}.\n\nPlease open your email app and click the link to verify your account. If you don't see it, be sure to check your Spam folder.`,
          [{ text: "Got it" }]
        );
      } else {
        Alert.alert("Notice", res.error || "Unable to send verification link at this moment.");
      }
    } catch (err: any) {
      Alert.alert("Notice", err.message || "Failed to contact verification service.");
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    try {
      const profileRes = await authAPI.getProfile();
      if (profileRes.success && profileRes.user) {
        setProfile(profileRes.user);
        if (profileRes.user.isVerified || profileRes.user.emailVerified) {
          Alert.alert("Verified! 🎉", "Your email is officially verified. Welcome aboard as a verified Drivemate driver!");
        } else {
          Alert.alert(
            "Pending Verification",
            `We have not received verification for ${displayEmail} yet. Please check your inbox and tap the link Google sent you, then tap 'Check Status' again.`,
            [
              { text: "Resend Email", onPress: handleResendVerification },
              { text: "OK" },
            ]
          );
        }
      }
    } catch {
      Alert.alert("Notice", "Unable to refresh verification status. Please check your network connection.");
    } finally {
      setIsCheckingVerification(false);
    }
  };

  useEffect(() => {
    async function loadHighScore() {
      try {
        const val = await AsyncStorage.getItem("@drivemate_ball_game_high_score");
        if (val) setHighScore(parseInt(val, 10) || 0);
      } catch {}
    }
    loadHighScore();
  }, [isGameOpen]);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account Permanently",
      "Are you sure you want to permanently delete your Drivemate driver account? All your posts, profile information, vehicles, and message connections will be irreversibly erased.\n\nThis action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const res = await authAPI.deleteAccount();
              if (res.success) {
                Alert.alert(
                  "Account Deleted",
                  "Your account and all associated data have been permanently removed.",
                  [{ text: "OK", onPress: onSignOut }]
                );
              } else {
                Alert.alert("Deletion Failed", res.error || "Unable to delete account at this time.");
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to communicate with server.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Fetch complete profile, garage vehicles, and user posts live from backend
  const fetchBackendData = async () => {
    try {
      // 1. Fetch Profile
      const cached = await getUserProfile();
      if (cached) setProfile(cached);

      const profileRes = await authAPI.getProfile();
      if (profileRes.success && profileRes.user) {
        setProfile(profileRes.user);
      }

      // 2. Fetch Garage Vehicles
      const vehiclesRes = await vehiclesAPI.getVehicles();
      if (vehiclesRes.success && Array.isArray(vehiclesRes.vehicles)) {
        setVehicles(vehiclesRes.vehicles);
      }

      // 3. Fetch Posts to count user's published posts & accumulated likes
      const postsRes = await postsAPI.getPosts();
      if (postsRes.success && Array.isArray(postsRes.posts)) {
        const activeName = (profileRes.user?.fullName || cached?.fullName || fallbackName).toLowerCase();
        const myPosts = postsRes.posts.filter((p: any) =>
          p.author?.toLowerCase() === activeName || p.authorTag?.toLowerCase() === `@${profileRes.user?.username?.toLowerCase()}`
        );
        setUserPostsCount(myPosts.length);
        const likes = myPosts.reduce((acc: number, p: any) => acc + (p.likes || 0), 0);
        setTotalLikesCount(likes);
      }
    } catch (err: any) {
      console.warn("⚠️ [ProfileTab] Error fetching backend profile data:", err?.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBackendData();
  };

  // Derive active values prioritizing fresh backend data
  const displayName = profile?.fullName || fallbackName || "Drivemate Driver";
  const displayEmail = profile?.email || fallbackEmail || "";
  const displayUsername = profile?.username ? `@${profile.username}` : "@driver";
  const avatarUrl = profile?.profilePicture || profile?.photoUrl || userAvatar;
  const isVerified = Boolean(profile?.isVerified || profile?.emailVerified);

  // Primary vehicle
  const primaryVehicle = vehicles.find((v) => v.isPrimary) || vehicles[0] || null;

  return (
    <>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#09090b" />
      }
    >
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate("EditProfile")}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editBadge}
            onPress={() => navigation.navigate("EditProfile")}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <EditIcon size={12} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{displayEmail}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.planBadge}>
            <SparklesIcon size={12} color="#09090b" />
            <Text style={styles.planBadgeText}>COMMUNITY MEMBER</Text>
          </View>

          {isVerified ? (
            <View style={styles.verifiedBadge}>
              <CheckCircleIcon size={12} color="#16a34a" />
              <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.unverifiedBadge}
              onPress={handleCheckVerification}
              activeOpacity={0.7}
            >
              <ShieldIcon size={12} color="#d97706" />
              <Text style={styles.unverifiedBadgeText}>UNVERIFIED</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Live Backend Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => navigation.navigate("MyPosts")}
          >
            <Text style={styles.statNumber}>{userPostsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => navigation.navigate("MyVehicles")}
          >
            <Text style={styles.statNumber}>{vehicles.length}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => navigation.navigate("MyPosts")}
          >
            <Text style={styles.statNumber}>{totalLikesCount}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Unverified Email Action Banner */}
      {!isVerified && (
        <View style={styles.unverifiedBanner}>
          <View style={styles.unverifiedBannerTop}>
            <View style={styles.unverifiedIconCircle}>
              <MailIcon size={16} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.unverifiedBannerTitle}>Check your email for verification</Text>
              <Text style={styles.unverifiedBannerText}>
                We sent a verification link to <Text style={{ fontWeight: "700" }}>{displayEmail || "your email"}</Text>. Please click the link to verify your driver account.
              </Text>
            </View>
          </View>

          <View style={styles.unverifiedActionRow}>
            <TouchableOpacity
              style={styles.resendActionBtn}
              onPress={handleResendVerification}
              disabled={isResendingEmail}
              activeOpacity={0.8}
            >
              {isResendingEmail ? (
                <ActivityIndicator size="small" color="#92400e" />
              ) : (
                <Text style={styles.resendActionBtnText}>Resend Email</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verifyCheckBtn}
              onPress={handleCheckVerification}
              disabled={isCheckingVerification}
              activeOpacity={0.8}
            >
              {isCheckingVerification ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.verifyCheckBtnText}>Check Status</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Primary Vehicle Quick Card (Fetched from Backend Garage) */}
      <TouchableOpacity
        style={styles.sectionCard}
        onPress={() => navigation.navigate("MyVehicles")}
        activeOpacity={0.8}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Primary Vehicle</Text>
          <Text style={styles.sectionActionText}>Manage Garage →</Text>
        </View>

        {primaryVehicle ? (
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleIcon}>
              <Text style={styles.vehicleIconText}>
                {primaryVehicle.type?.toLowerCase().includes("motor") ? "🏍️" : "🚗"}
              </Text>
            </View>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleName}>
                {primaryVehicle.year ? `${primaryVehicle.year} ` : ""}
                {primaryVehicle.name}
              </Text>
              <Text style={styles.vehiclePlate}>
                Plate: {primaryVehicle.plate || "No plate entered"} • {primaryVehicle.batteryOrFuel || "Online"}
              </Text>
            </View>
            <View style={styles.vehicleStatusPill}>
              <CheckCircleIcon size={13} color="#10b981" />
              <Text style={styles.vehicleStatusText}>Garage</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyVehicleBox}>
            <CarIcon size={24} color="#71717a" />
            <Text style={styles.emptyVehicleText}>
              No vehicle registered yet. Tap to add your car or motorcycle.
            </Text>
            <View style={styles.addVehicleBadge}>
              <PlusIcon size={12} color="#09090b" />
              <Text style={styles.addVehicleBadgeText}>Add Vehicle</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Featured Mini Game Banner */}
      <View style={styles.gameCard}>
        <View style={styles.gameCardTop}>
          <View style={styles.gameBadge}>
            <SparklesIcon size={12} color="#ffffff" />
            <Text style={styles.gameBadgeText}>ARCADE MINI GAME</Text>
          </View>
          <View style={styles.gameScoreBadge}>
            <Text style={styles.gameScoreBadgeText}>BEST: {highScore}</Text>
          </View>
        </View>

        <View style={styles.gameContent}>
          <View style={styles.gameVisualWrap}>
            <View style={styles.gameVisualTopGoal} />
            <View style={styles.gameVisualObstacle1} />
            <View style={styles.gameVisualObstacle2} />
            <View style={styles.gameVisualBall} />
          </View>

          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>Rising Ball Challenge</Text>
            <Text style={styles.gameDesc}>
              Tap screen to hop the ball to the top green zone! Score points, collect gems & shields, dodge obstacle bars, and don't get OUT!
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.playGameBtn}
          onPress={() => setIsGameOpen(true)}
          activeOpacity={0.85}
        >
          <PlayIcon size={16} color="#09090b" />
          <Text style={styles.playGameBtnText}>PLAY ARCADE GAME</Text>
        </TouchableOpacity>
      </View>

      {/* Account Navigation Menu */}
      <Text style={styles.menuSectionHeader}>Account & Services</Text>

      <View style={styles.menuCard}>
        {/* Edit Profile */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate("EditProfile")}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconBox}>
            <UserIcon size={18} color="#09090b" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Edit Personal Details</Text>
            <Text style={styles.menuSub}>
              {displayUsername} • {profile?.location || "Update city & bio"}
            </Text>
          </View>
          <ChevronRightIcon size={18} color="#a1a1aa" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* My Vehicles */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate("MyVehicles")}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconBox}>
            <CarIcon size={18} color="#09090b" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>My Garage & Vehicles</Text>
            <Text style={styles.menuSub}>
              {vehicles.length === 0
                ? "No registered vehicles yet"
                : `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} registered in garage`}
            </Text>
          </View>
          <ChevronRightIcon size={18} color="#a1a1aa" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* My Posts & Activity */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate("MyPosts")}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconBox}>
            <FileTextIcon size={18} color="#09090b" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>My Posts & Activity</Text>
            <Text style={styles.menuSub}>
              {userPostsCount} published posts • {totalLikesCount} likes received
            </Text>
          </View>
          <ChevronRightIcon size={18} color="#a1a1aa" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* Settings & Preferences */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate("Settings")}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconBox}>
            <SettingsIcon size={18} color="#09090b" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Settings & Preferences</Text>
            <Text style={styles.menuSub}>Alerts, Face ID, units & offline cache</Text>
          </View>
          <ChevronRightIcon size={18} color="#a1a1aa" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* Help Center & Support */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate("HelpCenter")}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconBox}>
            <HelpCircleIcon size={18} color="#09090b" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Help & Concierge Support</Text>
            <Text style={styles.menuSub}>24/7 Roadside hotline & driver FAQs</Text>
          </View>
          <ChevronRightIcon size={18} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      {/* Sign Out Action */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={() => {
          Alert.alert("Sign Out", "Are you sure you want to sign out of Drivemate?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: onSignOut },
          ]);
        }}
        activeOpacity={0.7}
      >
        <LogOutIcon size={16} color="#71717a" />
        <Text style={styles.signOutBtnText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Danger Zone: Permanent Account Deletion */}
      <View style={styles.dangerZoneCard}>
        <View style={styles.dangerZoneHeader}>
          <TrashIcon size={15} color="#ef4444" />
          <Text style={styles.dangerZoneTitle}>Delete Account</Text>
        </View>
        <Text style={styles.dangerZoneSub}>
          Permanently erase your Drivemate profile, verified garage, community posts, and message history.
        </Text>
        <TouchableOpacity
          style={styles.deleteAccountBtn}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <TrashIcon size={15} color="#ffffff" />
              <Text style={styles.deleteAccountBtnText}>Delete Account Permanently</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>

    {/* Rising Ball Arcade Modal */}
    <BallGame visible={isGameOpen} onClose={() => setIsGameOpen(false)} />
  </>
  );
};

export default ProfileTab;

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 36,
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },
  editBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#09090b",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  email: {
    fontSize: 13,
    color: "#71717a",
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#18181b",
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803d",
    letterSpacing: 0.5,
  },
  unverifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fde68a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  unverifiedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#b45309",
    letterSpacing: 0.5,
  },
  unverifiedBanner: {
    backgroundColor: "#fffbeb",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#fde68a",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  unverifiedBannerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  unverifiedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fde68a",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  unverifiedBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 3,
  },
  unverifiedBannerText: {
    fontSize: 12,
    color: "#b45309",
    lineHeight: 18,
  },
  unverifiedActionRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 4,
  },
  resendActionBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fde68a",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resendActionBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400e",
  },
  verifyCheckBtn: {
    flex: 1,
    backgroundColor: "#09090b",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyCheckBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 18,
  },
  statBox: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#09090b",
  },
  statLabel: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#e4e4e7",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.2,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  planNotice: {
    fontSize: 13,
    color: "#52525b",
    lineHeight: 19,
    marginBottom: 12,
  },
  progressContainer: {
    height: 6,
    backgroundColor: "#f4f4f5",
    borderRadius: 3,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#09090b",
    borderRadius: 3,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#09090b",
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  upgradeBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  vehicleIconText: {
    fontSize: 20,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  vehiclePlate: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  vehicleStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#18181b",
  },
  emptyVehicleBox: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyVehicleText: {
    fontSize: 13,
    color: "#71717a",
    textAlign: "center",
  },
  addVehicleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 4,
  },
  addVehicleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
  },
  menuSectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: "#09090b",
    marginTop: 10,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  menuCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  menuSub: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f4f4f5",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  signOutBtnText: {
    color: "#71717a",
    fontSize: 14,
    fontWeight: "600",
  },
  dangerZoneCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 16,
    marginBottom: 28,
  },
  dangerZoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  dangerZoneTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#dc2626",
    letterSpacing: 0.3,
  },
  dangerZoneSub: {
    fontSize: 12,
    color: "#7f1d1d",
    lineHeight: 18,
    marginBottom: 14,
  },
  deleteAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 10,
  },
  deleteAccountBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  gameCard: {
    backgroundColor: "#18181b",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#27272a",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  gameCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  gameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gameBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  gameScoreBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  gameScoreBadgeText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "800",
  },
  gameContent: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  gameVisualWrap: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "#3f3f46",
    position: "relative",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  gameVisualTopGoal: {
    width: 44,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  gameVisualObstacle1: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#f59e0b",
  },
  gameVisualObstacle2: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ef4444",
  },
  gameVisualBall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#38bdf8",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  gameDesc: {
    color: "#a1a1aa",
    fontSize: 11,
    lineHeight: 16,
  },
  playGameBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    paddingVertical: 11,
    borderRadius: 12,
  },
  playGameBtnText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
