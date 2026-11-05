import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
  ScrollView,
  Easing,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HomeIcon,
  MessageIcon,
  BellIcon,
  WrenchIcon,
  UserIcon,
  PlusIcon,
  SparklesIcon,
  LogOutIcon,
  CloseIcon,
  CreditCardIcon,
} from "../Icons";
import { TabKey } from "../BottomBar";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabKey) => void;
  onOpenCreatePost: () => void;
  onOpenPaymentModal: () => void;
  onSignOut: () => void;
  freePostsUsed: number;
  maxFreePosts: number;
  isProUser: boolean;
  singlePasses?: number;
  userName?: string;
  userEmail?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenCreatePost,
  onOpenPaymentModal,
  onSignOut,
  freePostsUsed,
  maxFreePosts,
  isProUser,
  singlePasses = 0,
  userName = "Driver",
  userEmail = "",
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const drawerWidth = Math.min((windowWidth || 360) * 0.82, 320);

  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("📑 [Sidebar Drawer]", { isOpen, drawerWidth, userName, userEmail });

    if (isOpen) {
      slideAnim.setValue(-drawerWidth);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, drawerWidth]);

  const handleClose = (callback?: () => void) => {
    console.log("📑 [Sidebar] Collapsing drawer");
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      if (callback) {
        setTimeout(callback, 80);
      }
    });
  };

  const freeRemaining = Math.max(0, maxFreePosts - freePostsUsed);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={() => handleClose()}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Backdrop: tapping outside the drawer collapses it */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => handleClose()}
          />
        </Animated.View>

        {/* Drawer Panel */}
        <Animated.View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              paddingTop: insets.top + (Platform.OS === "ios" ? 12 : 20),
              paddingBottom: Math.max(insets.bottom, 20),
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerScroll}
            bounces={false}
          >
            {/* Header: Driver Avatar, Name & Close Button */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.profileRow}
                onPress={() => handleClose(() => onNavigateTab("profile"))}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(userName || "D").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {userName || "Driver Profile"}
                  </Text>
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {userEmail || "View garage & settings"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleClose()}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <CloseIcon size={16} color="#09090b" />
              </TouchableOpacity>
            </View>

            {/* Plan / Posts Allowance Card */}
            <View style={styles.tierCard}>
              <View style={styles.tierHeader}>
                <View style={styles.tierBadge}>
                  <SparklesIcon size={13} color="#09090b" />
                  <Text style={styles.tierBadgeText}>
                    {isProUser ? "PRO UNLIMITED" : "FREE TIER"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleClose(onOpenPaymentModal)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.upgradeLink}>
                    {isProUser ? "Manage" : "Upgrade"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.tierSub}>
                {isProUser
                  ? "Unlimited community posting activated."
                  : singlePasses > 0
                  ? `${singlePasses} paid post pass active.`
                  : `${freeRemaining} of ${maxFreePosts} complimentary posts remaining.`}
              </Text>

              {!isProUser && (
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(
                          100,
                          (freePostsUsed / maxFreePosts) * 100
                        )}%`,
                      },
                    ]}
                  />
                </View>
              )}

              {!isProUser && freeRemaining === 0 && singlePasses === 0 && (
                <TouchableOpacity
                  style={styles.addPostsBtn}
                  onPress={() => handleClose(onOpenPaymentModal)}
                  activeOpacity={0.8}
                >
                  <CreditCardIcon size={15} color="#ffffff" />
                  <Text style={styles.addPostsBtnText}>
                    Unlock Posts ($1.99 / Pro)
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Navigation Actions */}
            <View style={styles.navSection}>
              {/* Community Feed */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleClose(() => onNavigateTab("home"))}
                activeOpacity={0.7}
              >
                <HomeIcon size={20} color="#09090b" />
                <Text style={styles.navItemText}>Community Feed</Text>
              </TouchableOpacity>

              {/* Quick Create Post */}
              <TouchableOpacity
                style={[styles.navItem, styles.createNavItem]}
                onPress={() => handleClose(onOpenCreatePost)}
                activeOpacity={0.8}
              >
                <View style={styles.createIconWrapper}>
                  <PlusIcon size={14} color="#ffffff" />
                </View>
                <Text style={[styles.navItemText, styles.createText]}>
                  Create New Post
                </Text>
              </TouchableOpacity>

              {/* Realtime Messaging */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleClose(() => onNavigateTab("messaging"))}
                activeOpacity={0.7}
              >
                <MessageIcon size={20} color="#09090b" />
                <Text style={styles.navItemText}>Direct Messages</Text>
              </TouchableOpacity>

              {/* Road Updates */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleClose(() => onNavigateTab("updates"))}
                activeOpacity={0.7}
              >
                <BellIcon size={20} color="#09090b" />
                <Text style={styles.navItemText}>New Updates</Text>
              </TouchableOpacity>

              {/* Drive Services */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleClose(() => onNavigateTab("services"))}
                activeOpacity={0.7}
              >
                <WrenchIcon size={20} color="#09090b" />
                <Text style={styles.navItemText}>Drive Services</Text>
              </TouchableOpacity>

              {/* Account Profile */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleClose(() => onNavigateTab("profile"))}
                activeOpacity={0.7}
              >
                <UserIcon size={20} color="#09090b" />
                <Text style={styles.navItemText}>Account Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={() => handleClose(onSignOut)}
                activeOpacity={0.7}
              >
                <LogOutIcon size={18} color="#ef4444" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>Drivemate • v1.0.0</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default Sidebar;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(9, 9, 11, 0.48)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    height: "100%",
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderRightColor: "#e4e4e7",
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 28,
  },
  drawerScroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#09090b",
  },
  profileEmail: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  tierCard: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 20,
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: 0.5,
  },
  upgradeLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
    textDecorationLine: "underline",
  },
  tierSub: {
    fontSize: 12,
    color: "#52525b",
    lineHeight: 16,
  },
  progressTrack: {
    height: 5,
    backgroundColor: "#e4e4e7",
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#09090b",
    borderRadius: 3,
  },
  addPostsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#09090b",
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 12,
  },
  addPostsBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  navSection: {
    flex: 1,
    marginBottom: 16,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
  },
  createNavItem: {
    backgroundColor: "#fafafa",
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#f4f4f5",
  },
  createIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  createText: {
    color: "#09090b",
    fontWeight: "700",
  },
  navItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#27272a",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 16,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
  versionText: {
    fontSize: 11,
    color: "#a1a1aa",
  },
});
