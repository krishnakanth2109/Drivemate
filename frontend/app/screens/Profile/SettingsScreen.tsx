import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  LockIcon,
  BellIcon,
  ShieldIcon,
  TrashIcon,
} from "../../components/Icons";
import { authAPI } from "../../services/api";
import { getUserProfile } from "../../services/storage";

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    getUserProfile().then((u) => {
      if (u?.email) setUserEmail(u.email);
    });
  }, []);

  // Notifications
  const [trafficAlerts, setTrafficAlerts] = useState(true);
  const [communityReplies, setCommunityReplies] = useState(true);
  const [serviceReminders, setServiceReminders] = useState(true);
  const [chargingUpdates, setChargingUpdates] = useState(false);

  // Security
  const [biometrics, setBiometrics] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  // Preferences
  const [isMiles, setIsMiles] = useState(true);
  const [isFahrenheit, setIsFahrenheit] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cached Data",
      "Are you sure you want to clear cached map routes and offline posts (42.8 MB)?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Cache",
          onPress: () => {
            Alert.alert("Cache Cleared", "42.8 MB of offline data has been cleared.");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "Are you sure you want to permanently delete your Drivemate account? All your vehicles, routes, profile details, and community posts will be erased immediately. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              const res = await authAPI.deleteAccount();
              if (res.success) {
                Alert.alert(
                  "Account Deleted",
                  "Your account has been permanently removed.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: "Login" }],
                        });
                      },
                    },
                  ]
                );
              } else {
                Alert.alert("Error", res.error || "Failed to delete account. Please try again.");
              }
            } catch (err: any) {
              Alert.alert("Error", err?.message || "An unexpected error occurred.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Settings & Preferences</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Hazard & Road Alerts</Text>
              <Text style={styles.rowSub}>Live warnings for fog, ice, and traffic stops</Text>
            </View>
            <Switch
              value={trafficAlerts}
              onValueChange={setTrafficAlerts}
              trackColor={{ false: "#e4e4e7", true: "#09090b" }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Discussion Replies</Text>
              <Text style={styles.rowSub}>When other drivers reply to your posts</Text>
            </View>
            <Switch
              value={communityReplies}
              onValueChange={setCommunityReplies}
              trackColor={{ false: "#e4e4e7", true: "#09090b" }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Vehicle Maintenance Reminders</Text>
              <Text style={styles.rowSub}>Tire pressure, brake wear, and inspection dates</Text>
            </View>
            <Switch
              value={serviceReminders}
              onValueChange={setServiceReminders}
              trackColor={{ false: "#e4e4e7", true: "#09090b" }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>EV Charger Availability</Text>
              <Text style={styles.rowSub}>Notifications for open stalls on saved routes</Text>
            </View>
            <Switch
              value={chargingUpdates}
              onValueChange={setChargingUpdates}
              trackColor={{ false: "#e4e4e7", true: "#09090b" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>Security & Access</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Face ID / Biometric Login</Text>
              <Text style={styles.rowSub}>Unlock app instantly using biometrics</Text>
            </View>
            <Switch
              value={biometrics}
              onValueChange={setBiometrics}
              trackColor={{ false: "#e4e4e7", true: "#09090b" }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Two-Factor Authentication (2FA)</Text>
              <Text style={styles.rowSub}>Require verification code upon sign-in</Text>
            </View>
            <Switch
              value={twoFactor}
              onValueChange={setTwoFactor}
              trackColor={{ false: "#e4e4e7", true: "#09090b" }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() =>
              Alert.alert(
                "Change Password",
                `A password reset link will be dispatched to ${userEmail || "your registered email"}.`
              )
            }
          >
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Change Password</Text>
              <Text style={styles.rowSub}>Last updated 3 months ago</Text>
            </View>
            <ChevronRightIcon size={18} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Units & Display</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Distance Unit</Text>
              <Text style={styles.rowSub}>Speedometer and route calculation</Text>
            </View>
            <TouchableOpacity
              style={styles.unitToggle}
              onPress={() => setIsMiles(!isMiles)}
            >
              <Text style={styles.unitToggleText}>{isMiles ? "Miles (mph)" : "Km (km/h)"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Temperature</Text>
              <Text style={styles.rowSub}>Weather and battery pack thermal readings</Text>
            </View>
            <TouchableOpacity
              style={styles.unitToggle}
              onPress={() => setIsFahrenheit(!isFahrenheit)}
            >
              <Text style={styles.unitToggleText}>{isFahrenheit ? "°Fahrenheit" : "°Celsius"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={handleClearCache}
          >
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Clear Offline Cache</Text>
              <Text style={styles.rowSub}>Free up local storage (42.8 MB)</Text>
            </View>
            <ChevronRightIcon size={18} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone / Delete Account */}
        <Text style={[styles.sectionTitle, { color: "#ef4444" }]}>Danger Zone</Text>
        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            <View style={styles.dangerIconWrap}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <TrashIcon size={18} color="#ef4444" />
              )}
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: "#ef4444" }]}>Delete Account</Text>
              <Text style={styles.rowSub}>
                Permanently erase your account, profile, vehicles, and posts
              </Text>
            </View>
            <ChevronRightIcon size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

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
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#09090b",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  rowSub: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#f4f4f5",
  },
  unitToggle: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
  },
  dangerCard: {
    borderColor: "#fecaca",
    backgroundColor: "#fffafa",
  },
  dangerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});

