import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import {
  MailIcon,
  LockIcon,
  GoogleLogo,
  CloseIcon,
  CheckCircleIcon,
  UserIcon,
} from "../../components/Icons";
import { authAPI } from "../../services/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Google Sign-In State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [isAuthenticatingGoogle, setIsAuthenticatingGoogle] = useState(false);

  const handleLogin = async () => {
    console.log("🔐 [LoginScreen Input] Email:", email.trim(), "| Password length:", password.length);
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔐 [LoginScreen handleLogin] Dispatching login request for:", email.trim());
      const response = await authAPI.login(email.trim(), password.trim());
      setIsLoading(false);

      console.log("🔐 [LoginScreen handleLogin] Server Response:", response);

      if (response.success) {
        navigation.replace("Dashboard");
      } else {
        Alert.alert("Sign In Failed", response.error || "Invalid email or password.");
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error("❌ [LoginScreen handleLogin] Exception:", err);
      Alert.alert("Sign In Error", err.message || "Failed to connect to authentication server.");
    }
  };

  const executeGoogleLogin = async (targetEmail: string, displayName?: string) => {
    console.log("🌐 [LoginScreen Google] Attempting Google login:", { targetEmail, displayName });
    if (!targetEmail.trim() || !targetEmail.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid Google account email.");
      return;
    }

    setIsAuthenticatingGoogle(true);
    try {
      const response = await authAPI.googleLogin({
        email: targetEmail.trim(),
        displayName: displayName || targetEmail.split("@")[0],
      });

      setIsAuthenticatingGoogle(false);
      setIsGoogleModalOpen(false);

      console.log("🌐 [LoginScreen Google] Server Response:", response);

      if (response.success) {
        navigation.replace("Dashboard");
      } else {
        Alert.alert("Google Sign In Failed", response.error || "Unable to sign in with Google.");
      }
    } catch (err: any) {
      setIsAuthenticatingGoogle(false);
      console.error("❌ [LoginScreen Google] Exception:", err);
      Alert.alert("Connection Error", err.message || "Failed to communicate with authentication server.");
    }
  };

  const handleOpenGoogleAuth = () => {
    console.log("🌐 [LoginScreen] Opening Google authentication modal");
    setIsGoogleModalOpen(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brandSection}>
            <View style={styles.logoPill}>
              <View style={styles.logoInnerSquare} />
              <Text style={styles.logoText}>DRIVEMATE</Text>
            </View>
            <Text style={styles.headline}>Welcome back</Text>
            <Text style={styles.subheadline}>
              Sign in to manage your journeys and vehicle services
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email address</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isEmailFocused && styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <MailIcon size={18} color={isEmailFocused ? "#09090b" : "#a1a1aa"} />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#a1a1aa"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Reset Password",
                      "Password reset dispatch has been logged for this account."
                    )
                  }
                >
                  <Text style={styles.forgotPassword}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  isPassFocused && styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <LockIcon size={18} color={isPassFocused ? "#09090b" : "#a1a1aa"} />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#a1a1aa"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setIsPassFocused(true)}
                  onBlur={() => setIsPassFocused(false)}
                />
                <TouchableOpacity
                  style={styles.toggleBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.toggleBtnText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Primary Action */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Signing in..." : "Continue"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Minimalist Google Sign-In */}
            <TouchableOpacity
              style={styles.googleFullButton}
              onPress={handleOpenGoogleAuth}
              activeOpacity={0.82}
            >
              <GoogleLogo size={20} />
              <Text style={styles.googleFullButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Drivemate? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.signupLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Sign-In Account Selector Modal */}
      <Modal
        visible={isGoogleModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsGoogleModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.googleSheet}>
            {/* Modal Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.googleTitleRow}>
                <GoogleLogo size={22} />
                <Text style={styles.sheetTitle}>Sign in with Google</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsGoogleModalOpen(false)}
                style={styles.sheetCloseBtn}
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color="#09090b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle}>
              Enter your Google account to continue to Drivemate
            </Text>

            {/* Google Account Input */}
            <View style={styles.customAccountBox}>
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customAccountInput}
                  placeholder="your.email@gmail.com"
                  placeholderTextColor="#a1a1aa"
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  style={[
                    styles.customSignInBtn,
                    (!customGoogleEmail.trim() || isAuthenticatingGoogle) && styles.buttonDisabled,
                  ]}
                  onPress={() => executeGoogleLogin(customGoogleEmail)}
                  disabled={!customGoogleEmail.trim() || isAuthenticatingGoogle}
                  activeOpacity={0.8}
                >
                  <Text style={styles.customSignInBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Loading Indicator */}
            {isAuthenticatingGoogle && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#09090b" />
                <Text style={styles.loadingText}>Authenticating with Google...</Text>
              </View>
            )}

            {/* Dismiss Link */}
            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setIsGoogleModalOpen(false)}
              disabled={isAuthenticatingGoogle}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "ios" ? 24 : 36,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  brandSection: {
    alignItems: "flex-start",
    marginBottom: 32,
  },
  logoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 24,
  },
  logoInnerSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#09090b",
  },
  logoText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: 1.5,
  },
  headline: {
    fontSize: 28,
    fontWeight: "700",
    color: "#09090b",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 14,
    color: "#71717a",
    lineHeight: 20,
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#09090b",
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: "#09090b",
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIconContainer: {
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#09090b",
    height: "100%",
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  primaryButton: {
    backgroundColor: "#09090b",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e4e4e7",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: "#a1a1aa",
    fontWeight: "500",
  },
  googleFullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 52,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  googleFullButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#09090b",
    letterSpacing: -0.2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: "#71717a",
  },
  signupLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(9, 9, 11, 0.48)",
    justifyContent: "flex-end",
  },
  googleSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: Platform.OS === "ios" ? 38 : 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  googleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#09090b",
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#71717a",
    marginBottom: 18,
  },
  googleAccountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  accountAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  accountEmail: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 1,
  },
  customAccountBox: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  customAccountLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#52525b",
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customAccountInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#09090b",
  },
  customSignInBtn: {
    backgroundColor: "#09090b",
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  customSignInBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#52525b",
    fontWeight: "600",
  },
  sheetCancelBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717a",
  },
});
