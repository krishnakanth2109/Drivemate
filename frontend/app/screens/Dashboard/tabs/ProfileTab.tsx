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
} from "../../../components/Icons";
import { authAPI, vehiclesAPI, postsAPI, billingAPI } from "../../../services/api";
import { getUserProfile, StoredUserProfile } from "../../../services/storage";

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList>;

interface ProfileTabProps {
  onOpenPaymentModal: () => void;
  onSignOut: () => void;
  freePostsUsed: number;
  maxFreePosts: number;
  isProUser: boolean;
  singlePasses?: number;
  totalPostsCreated: number;
  userName?: string;
  userEmail?: string;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  onOpenPaymentModal,
  onSignOut,
  freePostsUsed: fallbackFreeUsed,
  maxFreePosts: fallbackMaxFree,
  isProUser: fallbackIsPro,
  singlePasses: fallbackSinglePasses = 0,
  totalPostsCreated: fallbackPostsCount,
  userName: fallbackName = "Driver",
  userEmail: fallbackEmail = "",
}) => {
  const navigation = useNavigation<ProfileNavProp>();

  const [profile, setProfile] = useState<StoredUserProfile | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [userPostsCount, setUserPostsCount] = useState<number>(fallbackPostsCount);
  const [totalLikesCount, setTotalLikesCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
  const displayEmail = profile?.email || fallbackEmail || "driver@drivemate.com";
  const displayUsername = profile?.username ? `@${profile.username}` : "@driver";
  const isPro = typeof profile?.isProUser === "boolean" ? profile.isProUser : fallbackIsPro;
  const freeUsed = typeof profile?.freePostsUsed === "number" ? profile.freePostsUsed : fallbackFreeUsed;
  const maxFree = typeof profile?.maxFreePosts === "number" ? profile.maxFreePosts : fallbackMaxFree;
  const passes = typeof profile?.singlePasses === "number" ? profile.singlePasses : fallbackSinglePasses;
  const freeRemaining = Math.max(0, maxFree - freeUsed);

  // Primary vehicle
  const primaryVehicle = vehicles.find((v) => v.isPrimary) || vehicles[0] || null;

  return (
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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
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

        <View style={styles.planBadge}>
          <SparklesIcon size={12} color="#09090b" />
          <Text style={styles.planBadgeText}>
            {isPro ? "PRO MEMBER" : "FREE TIER PLAN"}
          </Text>
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

      {/* Posting Allowance Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Posting Allowance</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Billing")}>
            <Text style={styles.sectionActionText}>
              {isPro ? "Billing" : "Upgrade"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.planNotice}>
          {isPro
            ? "You are on Drivemate Pro with unlimited community posts and verified priority."
            : passes > 0
            ? `Free tier includes ${maxFree} posts (${freeUsed}/${maxFree} used). You have ${passes} paid post pass active.`
            : `Free tier includes ${maxFree} posts. You have used ${freeUsed} of ${maxFree} free posts.`}
        </Text>

        {!isPro && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(100, (freeUsed / Math.max(1, maxFree)) * 100)}%` },
              ]}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={onOpenPaymentModal}
          activeOpacity={0.8}
        >
          <CreditCardIcon size={16} color="#ffffff" />
          <Text style={styles.upgradeBtnText}>
            {isPro ? "Manage Subscription" : "Upgrade to Pro ($9.99/mo)"}
          </Text>
        </TouchableOpacity>
      </View>

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

        {/* Membership & Billing */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate("Billing")}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconBox}>
            <CreditCardIcon size={18} color="#09090b" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Membership & Billing</Text>
            <Text style={styles.menuSub}>
              {isPro ? "Pro Member Active" : `${passes} single pass${passes === 1 ? "" : "es"} available`}
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
        <LogOutIcon size={16} color="#ef4444" />
        <Text style={styles.signOutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 20,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#18181b",
    letterSpacing: 0.5,
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
    borderColor: "#fecaca",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  signOutBtnText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
  },
});
