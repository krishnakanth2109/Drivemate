import React, { useState, useRef, useEffect } from "react";
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
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  LockIcon,
  SparklesIcon,
  ArrowLeftIcon,
  CarIcon,
  MotorcycleIcon,
  CheckCircleIcon,
} from "../../components/Icons";
import { authAPI } from "../../services/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;

const TOTAL_STEPS = 7;

const DRIVING_STYLES = [
  {
    id: "ev",
    title: "EV Long-Haul & Charging",
    desc: "Supercharger networks, live stalls, and battery thermal tips",
    icon: "⚡",
  },
  {
    id: "commute",
    title: "Daily Commute & Traffic",
    desc: "Real-time road hazard alerts, speed traps, and traffic bypasses",
    icon: "🚗",
  },
  {
    id: "performance",
    title: "Performance & Track-Day",
    desc: "Tire pressure telemetry, brake wear, and spirited mountain runs",
    icon: "🏎️",
  },
  {
    id: "roadtrip",
    title: "Scenic Highway Road-Trips",
    desc: "Coastal corridors, national park routes, and scenic vistas",
    icon: "🌄",
  },
];

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [vehicleType, setVehicleType] = useState<"4 Wheeler" | "2 Wheeler">("4 Wheeler");
  const [drivingStyle, setDrivingStyle] = useState("commute");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animations
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const cardScale4W = useRef(new Animated.Value(1)).current;
  const cardScale2W = useRef(new Animated.Value(1)).current;

  // Animate progress bar on step change
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / TOTAL_STEPS,
      duration: 320,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const triggerStepTransition = (nextStep: number, direction: "forward" | "back") => {
    fadeAnim.setValue(0);
    slideAnim.setValue(direction === "forward" ? 24 : -24);
    setCurrentStep(nextStep);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 1:
        if (!fullName.trim()) {
          Alert.alert("Name Required", "Please enter your full legal name to proceed.");
          return;
        }
        break;
      case 2:
        if (!email.trim() || !email.includes("@")) {
          Alert.alert("Valid Email Required", "Please enter a valid email address.");
          return;
        }
        break;
      case 3:
        if (!phoneNumber.trim() || phoneNumber.trim().length < 7) {
          Alert.alert("Phone Required", "Please enter a valid mobile number for roadside dispatch.");
          return;
        }
        break;
      case 4:
        if (!username.trim()) {
          Alert.alert("Username Required", "Please choose a community driver handle.");
          return;
        }
        break;
      case 5:
        if (!vehicleType) {
          Alert.alert("Vehicle Type Required", "Please select 4 Wheeler or 2 Wheeler.");
          return;
        }
        break;
      case 6:
        if (!drivingStyle) {
          Alert.alert("Focus Required", "Please select your primary driving focus.");
          return;
        }
        break;
      default:
        break;
    }

    if (currentStep < TOTAL_STEPS) {
      triggerStepTransition(currentStep + 1, "forward");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      triggerStepTransition(currentStep - 1, "back");
    } else {
      navigation.goBack();
    }
  };

  const selectVehicleTypeWithAnimation = (type: "4 Wheeler" | "2 Wheeler") => {
    setVehicleType(type);
    const targetAnim = type === "4 Wheeler" ? cardScale4W : cardScale2W;

    Animated.sequence([
      Animated.timing(targetAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(targetAnim, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCompleteRegistration = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Password Required", "Please create and confirm your password.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match. Please verify.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        username: username.trim(),
        vehicleType: vehicleType,
        drivingStyle: drivingStyle,
        password: password.trim(),
      });

      setIsLoading(false);

      if (response.success) {
        Alert.alert(
          "Welcome to Drivemate!",
          `Account verified for ${fullName}. You have 2 free community posts ready to use.`,
          [{ text: "Start Driving", onPress: () => navigation.replace("Dashboard") }]
        );
      } else {
        Alert.alert("Registration Failed", response.error || "Unable to create account.");
      }
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert("Error", err.message || "Failed to connect to registration server.");
    }
  };

  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top Header & Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handlePreviousStep}
          activeOpacity={0.7}
        >
          <ArrowLeftIcon size={18} color="#09090b" />
        </TouchableOpacity>

        <View style={styles.stepIndicatorCenter}>
          <Text style={styles.stepBadgeText}>
            STEP {currentStep} OF {TOTAL_STEPS}
          </Text>
          <View style={styles.dotsRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.miniDot,
                  idx + 1 === currentStep && styles.miniDotActive,
                  idx + 1 < currentStep && styles.miniDotCompleted,
                ]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.signInLinkBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.signInLinkText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Smooth Animated Progress Bar */}
      <View style={styles.progressBarTrack}>
        <Animated.View
          style={[styles.progressBarFill, { width: progressInterpolate }]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }}
          >
            {/* STEP 1: FULL LEGAL NAME */}
            {currentStep === 1 && (
              <View style={styles.stepCard}>
                <View style={styles.stepIconSquircle}>
                  <UserIcon size={24} color="#09090b" />
                </View>
                <Text style={styles.stepTitle}>What's your full name?</Text>
                <Text style={styles.stepSubtitle}>
                  How other drivers and roadside dispatch teams will address you.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Full Legal Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "name" && styles.inputFocused,
                    ]}
                    placeholder="e.g. Alex Morgan"
                    placeholderTextColor="#a1a1aa"
                    value={fullName}
                    onChangeText={setFullName}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    autoFocus
                  />
                </View>
              </View>
            )}

            {/* STEP 2: EMAIL ADDRESS */}
            {currentStep === 2 && (
              <View style={styles.stepCard}>
                <View style={styles.stepIconSquircle}>
                  <MailIcon size={24} color="#09090b" />
                </View>
                <Text style={styles.stepTitle}>What's your email?</Text>
                <Text style={styles.stepSubtitle}>
                  We'll send your route summaries, vehicle health diagnostics, and invoices here.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "email" && styles.inputFocused,
                    ]}
                    placeholder="name@example.com"
                    placeholderTextColor="#a1a1aa"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    autoFocus
                  />
                </View>
              </View>
            )}

            {/* STEP 3: MOBILE NUMBER */}
            {currentStep === 3 && (
              <View style={styles.stepCard}>
                <View style={styles.stepIconSquircle}>
                  <PhoneIcon size={24} color="#09090b" />
                </View>
                <Text style={styles.stepTitle}>Your mobile number</Text>
                <Text style={styles.stepSubtitle}>
                  Critical for 2-factor security and instant 24/7 emergency roadside dispatch.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Mobile Phone Number</Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "phone" && styles.inputFocused,
                    ]}
                    placeholder="+1 (555) 382-9014"
                    placeholderTextColor="#a1a1aa"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    autoFocus
                  />
                </View>
              </View>
            )}

            {/* STEP 4: DRIVER HANDLE / USERNAME */}
            {currentStep === 4 && (
              <View style={styles.stepCard}>
                <View style={styles.stepIconSquircle}>
                  <Text style={styles.atSymbolIcon}>@</Text>
                </View>
                <Text style={styles.stepTitle}>Pick a driver handle</Text>
                <Text style={styles.stepSubtitle}>
                  Your unique community name for posts, route tips, and leaderboards.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Driver Handle</Text>
                  <View
                    style={[
                      styles.prefixInputWrapper,
                      focusedField === "handle" && styles.inputFocused,
                    ]}
                  >
                    <Text style={styles.prefixText}>@</Text>
                    <TextInput
                      style={styles.prefixInput}
                      placeholder="alex_m"
                      placeholderTextColor="#a1a1aa"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField("handle")}
                      onBlur={() => setFocusedField(null)}
                      autoFocus
                    />
                  </View>
                </View>
              </View>
            )}

            {/* STEP 5: VEHICLE SELECTION (4-WHEELER OR 2-WHEELER) */}
            {currentStep === 5 && (
              <View style={styles.stepCard}>
                <View style={styles.stepIconSquircle}>
                  <CarIcon size={24} color="#09090b" />
                </View>
                <Text style={styles.stepTitle}>Select your vehicle</Text>
                <Text style={styles.stepSubtitle}>
                  Choose your primary vehicle type. You can switch or add more rides anytime.
                </Text>

                <View style={styles.vehicleCardsContainer}>
                  {/* 4 Wheeler Option */}
                  <Animated.View style={{ transform: [{ scale: cardScale4W }] }}>
                    <TouchableOpacity
                      style={[
                        styles.vehicleOptionCard,
                        vehicleType === "4 Wheeler" && styles.vehicleOptionCardActive,
                      ]}
                      onPress={() => selectVehicleTypeWithAnimation("4 Wheeler")}
                      activeOpacity={0.85}
                    >
                      <View style={styles.vehicleOptionIconWrapper}>
                        <CarIcon
                          size={28}
                          color={vehicleType === "4 Wheeler" ? "#09090b" : "#71717a"}
                        />
                      </View>
                      <View style={styles.vehicleOptionInfo}>
                        <View style={styles.vehicleHeaderRow}>
                          <Text style={styles.vehicleOptionTitle}>4 Wheeler</Text>
                          <Text style={styles.vehicleBadgePill}>Cars • SUVs • EVs</Text>
                        </View>
                        <Text style={styles.vehicleOptionSubtitle}>
                          Ideal for daily commute, long highway road trips, family touring, and charging network alerts.
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.selectionIndicatorCircle,
                          vehicleType === "4 Wheeler" && styles.selectionIndicatorActive,
                        ]}
                      >
                        {vehicleType === "4 Wheeler" && (
                          <View style={styles.selectionIndicatorDot} />
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* 2 Wheeler Option */}
                  <Animated.View style={{ transform: [{ scale: cardScale2W }] }}>
                    <TouchableOpacity
                      style={[
                        styles.vehicleOptionCard,
                        vehicleType === "2 Wheeler" && styles.vehicleOptionCardActive,
                      ]}
                      onPress={() => selectVehicleTypeWithAnimation("2 Wheeler")}
                      activeOpacity={0.85}
                    >
                      <View style={styles.vehicleOptionIconWrapper}>
                        <MotorcycleIcon
                          size={28}
                          color={vehicleType === "2 Wheeler" ? "#09090b" : "#71717a"}
                        />
                      </View>
                      <View style={styles.vehicleOptionInfo}>
                        <View style={styles.vehicleHeaderRow}>
                          <Text style={styles.vehicleOptionTitle}>2 Wheeler</Text>
                          <Text style={styles.vehicleBadgePill}>Motorcycles • Scooters</Text>
                        </View>
                        <Text style={styles.vehicleOptionSubtitle}>
                          Perfect for urban lane filtering, scenic mountain passes, agile parking, and quick fuel stops.
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.selectionIndicatorCircle,
                          vehicleType === "2 Wheeler" && styles.selectionIndicatorActive,
                        ]}
                      >
                        {vehicleType === "2 Wheeler" && (
                          <View style={styles.selectionIndicatorDot} />
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            )}

            {/* STEP 6: DRIVING STYLE / COMMUNITY FOCUS */}
            {currentStep === 6 && (
              <View style={styles.stepCard}>
                <View style={styles.stepIconSquircle}>
                  <SparklesIcon size={24} color="#09090b" />
                </View>
                <Text style={styles.stepTitle}>Your driving focus</Text>
                <Text style={styles.stepSubtitle}>
                  We personalize your community discussions and route alerts based on this.
                </Text>

                <View style={styles.stylesList}>
                  {DRIVING_STYLES.map((style) => {
                    const isSelected = drivingStyle === style.id;
                    return (
                      <TouchableOpacity
                        key={style.id}
                        style={[
                          styles.styleCard,
                          isSelected && styles.styleCardSelected,
                        ]}
                        onPress={() => setDrivingStyle(style.id)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.styleIconWrapper}>
                          <Text style={styles.styleIconEmoji}>{style.icon}</Text>
                        </View>
                        <View style={styles.styleInfo}>
                          <Text style={styles.styleTitle}>{style.title}</Text>
                          <Text style={styles.styleDesc}>{style.desc}</Text>
                        </View>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 7: SECURE PASSWORD & CONFIRM */}
            {currentStep === 7 && (
              <View style={styles.stepCard}>
                <View style={styles.stepIconSquircle}>
                  <LockIcon size={24} color="#09090b" />
                </View>
                <Text style={styles.stepTitle}>Secure your account</Text>
                <Text style={styles.stepSubtitle}>
                  Create a strong password of at least 6 characters.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View
                    style={[
                      styles.passWrapper,
                      focusedField === "pass" && styles.inputFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.passInput}
                      placeholder="••••••••"
                      placeholderTextColor="#a1a1aa"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onFocus={() => setFocusedField("pass")}
                      onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.togglePassBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.togglePassText}>
                        {showPassword ? "Hide" : "Show"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Confirm Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "confirmPass" && styles.inputFocused,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor="#a1a1aa"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField("confirmPass")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                {/* Free Tier Perk Box */}
                <View style={styles.perkNoticeBox}>
                  <View style={styles.perkTopRow}>
                    <CheckCircleIcon size={16} color="#09090b" />
                    <Text style={styles.perkNoticeTitle}>
                      2 Complimentary Community Posts Included
                    </Text>
                  </View>
                  <Text style={styles.perkNoticeSub}>
                    Publish tips, traffic updates, or road trip routes immediately after signup. Concurrency quota locked via Redis.
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Action Button */}
          <View style={styles.actionSection}>
            {currentStep < TOTAL_STEPS ? (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleNextStep}
                activeOpacity={0.88}
              >
                <Text style={styles.continueBtnText}>Continue →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.continueBtn,
                  isLoading && styles.continueBtnDisabled,
                ]}
                onPress={handleCompleteRegistration}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                <Text style={styles.continueBtnText}>
                  {isLoading ? "Creating Account..." : "Complete & Launch Drivemate"}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.termsNotice}>
              By registering, you agree to Drivemate's Terms of Service & Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndicatorCenter: {
    alignItems: "center",
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: 0.8,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
    alignItems: "center",
  },
  miniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#e4e4e7",
  },
  miniDotActive: {
    width: 14,
    backgroundColor: "#09090b",
    borderRadius: 2.5,
  },
  miniDotCompleted: {
    backgroundColor: "#71717a",
  },
  signInLinkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  signInLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: "#f4f4f5",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#09090b",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  stepCard: {
    marginBottom: 24,
  },
  stepIconSquircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  atSymbolIcon: {
    fontSize: 24,
    fontWeight: "800",
    color: "#09090b",
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#71717a",
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#09090b",
  },
  inputFocused: {
    borderColor: "#09090b",
    backgroundColor: "#ffffff",
  },
  prefixInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#71717a",
    marginRight: 4,
  },
  prefixInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#09090b",
  },
  vehicleCardsContainer: {
    gap: 14,
  },
  vehicleOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
    borderRadius: 18,
    padding: 16,
  },
  vehicleOptionCardActive: {
    backgroundColor: "#ffffff",
    borderColor: "#09090b",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  vehicleOptionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  vehicleOptionInfo: {
    flex: 1,
  },
  vehicleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  vehicleOptionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#09090b",
  },
  vehicleBadgePill: {
    fontSize: 10,
    fontWeight: "700",
    color: "#71717a",
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vehicleOptionSubtitle: {
    fontSize: 12,
    color: "#71717a",
    lineHeight: 16,
  },
  selectionIndicatorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d4d4d8",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  selectionIndicatorActive: {
    borderColor: "#09090b",
  },
  selectionIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#09090b",
  },
  stylesList: {
    gap: 10,
  },
  styleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    padding: 14,
  },
  styleCardSelected: {
    backgroundColor: "#ffffff",
    borderColor: "#09090b",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  styleIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  styleIconEmoji: {
    fontSize: 18,
  },
  styleInfo: {
    flex: 1,
  },
  styleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  styleDesc: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 2,
    lineHeight: 15,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d4d4d8",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  radioCircleSelected: {
    borderColor: "#09090b",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#09090b",
  },
  passWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  passInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#09090b",
  },
  togglePassBtn: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  togglePassText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  perkNoticeBox: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 16,
    marginTop: 10,
  },
  perkTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  perkNoticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  perkNoticeSub: {
    fontSize: 12,
    color: "#71717a",
    lineHeight: 18,
  },
  actionSection: {
    marginTop: 8,
  },
  continueBtn: {
    backgroundColor: "#09090b",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  termsNotice: {
    fontSize: 11,
    color: "#a1a1aa",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 16,
  },
});
