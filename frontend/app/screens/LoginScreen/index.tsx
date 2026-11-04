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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { MailIcon, LockIcon, GoogleLogo, AppleLogo } from "../../components/Icons";
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.login(email.trim(), password.trim());
      setIsLoading(false);

      if (response.success) {
        navigation.replace("Dashboard");
      } else {
        Alert.alert("Sign In Failed", response.error || "Invalid email or password.");
      }
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert("Sign In Error", err.message || "Failed to connect to authentication server.");
    }
  };

  const handleSocialAuth = (provider: string) => {
    Alert.alert(`${provider} Sign In`, `Connecting with ${provider}...`, [
      { text: "Continue", onPress: () => navigation.replace("Dashboard") },
    ]);
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
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Reset Password",
                      "A password reset link will be sent to your email."
                    )
                  }
                >
                  <Text style={styles.forgotLink}>Forgot?</Text>
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
                  placeholder="••••••••"
                  placeholderTextColor="#a1a1aa"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsPassFocused(true)}
                  onBlur={() => setIsPassFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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

            {/* Social Logins */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialAuth("Google")}
                activeOpacity={0.8}
              >
                <GoogleLogo size={18} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialAuth("Apple")}
                activeOpacity={0.8}
              >
                <AppleLogo size={18} color="#09090b" />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>
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
    fontSize: 32,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 15,
    color: "#71717a",
    lineHeight: 22,
    maxWidth: 320,
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#27272a",
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 13,
    color: "#71717a",
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: "#fafafa",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#e4e4e7",
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: "#09090b",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#09090b",
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717a",
  },
  primaryButton: {
    height: 52,
    backgroundColor: "#09090b",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e4e4e7",
  },
  dividerText: {
    fontSize: 12,
    color: "#a1a1aa",
    paddingHorizontal: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#27272a",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: "#71717a",
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
    textDecorationLine: "underline",
  },
});
