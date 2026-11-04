import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HomeIcon,
  MessageIcon,
  BellIcon,
  WrenchIcon,
  UserIcon,
} from "../Icons";

export type TabKey = "home" | "messaging" | "updates" | "services" | "profile";

interface BottomBarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  unreadMessagesCount?: number;
  hasNewUpdates?: boolean;
}

const BottomBar: React.FC<BottomBarProps> = ({
  currentTab,
  onSelectTab,
  unreadMessagesCount = 2,
  hasNewUpdates = true,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 10 : 8);

  const tabs: Array<{
    key: TabKey;
    label: string;
    renderIcon: (active: boolean) => React.ReactNode;
    badge?: number | boolean;
  }> = [
    {
      key: "home",
      label: "Home",
      renderIcon: (active) => (
        <HomeIcon size={20} color={active ? "#09090b" : "#a1a1aa"} />
      ),
    },
    {
      key: "messaging",
      label: "Messages",
      renderIcon: (active) => (
        <MessageIcon size={20} color={active ? "#09090b" : "#a1a1aa"} />
      ),
      badge: unreadMessagesCount,
    },
    {
      key: "updates",
      label: "Updates",
      renderIcon: (active) => (
        <BellIcon size={20} color={active ? "#09090b" : "#a1a1aa"} />
      ),
      badge: hasNewUpdates,
    },
    {
      key: "services",
      label: "Services",
      renderIcon: (active) => (
        <WrenchIcon size={20} color={active ? "#09090b" : "#a1a1aa"} />
      ),
    },
    {
      key: "profile",
      label: "Profile",
      renderIcon: (active) => (
        <UserIcon size={20} color={active ? "#09090b" : "#a1a1aa"} />
      ),
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                {tab.renderIcon(isActive)}

                {/* Badge indicator */}
                {typeof tab.badge === "number" && tab.badge > 0 ? (
                  <View style={styles.counterBadge}>
                    <Text style={styles.counterBadgeText}>{tab.badge}</Text>
                  </View>
                ) : tab.badge === true ? (
                  <View style={styles.dotBadge} />
                ) : null}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.activeTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>

              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default BottomBar;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 4,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  iconWrapper: {
    position: "relative",
    width: 38,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  iconWrapperActive: {
    backgroundColor: "#fafafa",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#a1a1aa",
    marginTop: 2,
    letterSpacing: -0.2,
  },
  activeTabLabel: {
    color: "#09090b",
    fontWeight: "700",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#09090b",
    marginTop: 2,
  },
  counterBadge: {
    position: "absolute",
    top: -2,
    right: 2,
    backgroundColor: "#09090b",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  counterBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },
  dotBadge: {
    position: "absolute",
    top: 1,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
});
