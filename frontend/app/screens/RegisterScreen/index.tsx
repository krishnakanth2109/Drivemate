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
  Keyboard,
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
  ArrowLeftIcon,
  CarIcon,
  MotorcycleIcon,
  CheckCircleIcon,
  ShieldIcon,
  SparklesIcon,
} from "../../components/Icons";
import { authAPI } from "../../services/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;

const TOTAL_STEPS = 6;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [vehicleType, setVehicleType] = useState<"4 Wheeler" | "2 Wheeler">("4 Wheeler");
  const [drivingStyle] = useState("commute");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [devOtpCode, setDevOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // ScrollView & Input Refs
  const scrollViewRef = useRef<any>(null);
  const confirmPassInputRef = useRef<any>(null);
  const otpInputRef = useRef<any>(null);

  // Auto-focus OTP input when reaching step 7
  useEffect(() => {
    if (currentStep === 7) {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Monitor software keyboard visibility
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleInputFocus = (field: string) => {
    setFocusedField(field);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  // Animations
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animate progress bar smoothly on step change
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / TOTAL_STEPS,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: any = null;
    if (currentStep === 7 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep, resendTimer]);

  // Butter-smooth, zero-glitch step transition
  const triggerStepTransition = (nextStep: number, direction: "forward" | "back") => {
    console.log(`📝 [RegisterScreen Step ${nextStep}/${TOTAL_STEPS}] Moving ${direction}:`, {
      fullName,
      email,
      phoneNumber,
      username,
      vehicleType,
      drivingStyle,
      hasPassword: password.length >= 6,
    });

    // 1. Immediately update step so UI renders with zero lag
    setCurrentStep(nextStep);

    // 2. Dismiss keyboard smoothly
    Keyboard.dismiss();

    // 3. Subtle vertical glide (8px) + gentle opacity ramp (0.85 -> 1.0)
    // Never drops below 0.85 so screen is NEVER blank, zero horizontal wobble or spring jitter
    slideAnim.setValue(direction === "forward" ? 8 : -8);
    fadeAnim.setValue(0.85);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dispatchOtp = async () => {
    console.log("📲 [RegisterScreen dispatchOtp] Requesting 6-digit OTP code for:", {
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
    });
    setIsSendingOtp(true);
    try {
      const res = await authAPI.sendOtp({
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setIsSendingOtp(false);
      console.log("📲 [RegisterScreen dispatchOtp] Response:", res);
      if (res.success) {
        if (res.devOtp) {
          setDevOtpCode(res.devOtp);
        }
        setResendTimer(60);
      }
    } catch (err) {
      setIsSendingOtp(false);
      console.error("❌ [RegisterScreen dispatchOtp] Error:", err);
    }
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
        if (!password.trim() || !confirmPassword.trim()) {
          Alert.alert("Password Required", "Please enter and confirm your password.");
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
        // Direct Firebase Authentication registration (No SMTP / No OTP blockers)
        handleCompleteRegistration();
        return;
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

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await dispatchOtp();
    Alert.alert("Code Sent", `A fresh 6-digit OTP code has been dispatched to ${email || phoneNumber}.`);
  };

  const handleCompleteRegistration = async () => {
    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      username: username.trim(),
      vehicleType: vehicleType,
      drivingStyle: drivingStyle,
      password: password.trim(),
    };

    console.log("🔥 [RegisterScreen Firebase Auth] Registering user:", {
      email: payload.email,
      fullName: payload.fullName,
      username: payload.username,
    });

    setIsLoading(true);
    try {
      const response = await authAPI.register(payload);
      setIsLoading(false);

      console.log("🔥 [RegisterScreen Firebase Auth] Response:", response);

      if (response.success) {
        Alert.alert(
          "Welcome to Drivemate!",
          `Your Firebase driver account has been created. A verification link has been sent to ${payload.email}.`,
          [
            {
              text: "Launch Drivemate",
              onPress: () => navigation.replace("Dashboard"),
            },
          ]
        );
      } else {
        Alert.alert("Registration Failed", response.error || "Unable to complete registration.");
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error("❌ [RegisterScreen Firebase Auth] Registration Error:", err);
      Alert.alert("Error", err.message || "Failed to connect to authentication server.");
    }
  };

  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top Header & Step Progress */}
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
            {Array.from({ length: TOTAL_STEPS }).map((_, idx) => {
              const stepNum = idx + 1;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    if (stepNum < currentStep) {
                      triggerStepTransition(stepNum, "back");
                    }
                  }}
                  disabled={stepNum >= currentStep}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  activeOpacity={0.7}
                  style={[
                    styles.miniDot,
                    stepNum === currentStep && styles.miniDotActive,
                    stepNum < currentStep && styles.miniDotCompleted,
                  ]}
                />
              );
            })}
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

      {/* Smooth Progress Indicator Bar */}
      <View style={styles.progressBarTrack}>
        <Animated.View
          style={[styles.progressBarFill, { width: progressInterpolate }]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && { paddingBottom: 48 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
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
                    placeholder="Enter your full name"
                    placeholderTextColor="#a1a1aa"
                    value={fullName}
                    onChangeText={setFullName}
                    returnKeyType="next"
                    onSubmitEditing={handleNextStep}
                    onFocus={() => handleInputFocus("name")}
                    onBlur={() => setFocusedField(null)}
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
                    returnKeyType="next"
                    onSubmitEditing={handleNextStep}
                    onFocus={() => handleInputFocus("email")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            )}

            {/* STEP 3: MOBILE PHONE NUMBER */}
            {currentStep === 3 && (
              <View style={styles.stepCard}>
                <View style={styles.stepIconSquircle}>
                  <PhoneIcon size={24} color="#09090b" />
                </View>
                <Text style={styles.stepTitle}>Your mobile number</Text>
                <Text style={styles.stepSubtitle}>
                  Critical for 2-factor security and instant 24/7 roadside assistance dispatch.
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
                    returnKeyType="next"
                    onSubmitEditing={handleNextStep}
                    onFocus={() => handleInputFocus("phone")}
                    onBlur={() => setFocusedField(null)}
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
                      placeholder="username"
                      placeholderTextColor="#a1a1aa"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={handleNextStep}
                      onFocus={() => handleInputFocus("handle")}
                      onBlur={() => setFocusedField(null)}
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
                  Choose your primary ride type. You can switch or add more rides anytime.
                </Text>

                <View style={styles.vehicleCardsContainer}>
                  {/* 4 Wheeler Option */}
                  <TouchableOpacity
                    style={[
                      styles.vehicleOptionCard,
                      vehicleType === "4 Wheeler" && styles.vehicleOptionCardActive,
                    ]}
                    onPress={() => setVehicleType("4 Wheeler")}
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
                        Ideal for daily commute, long highway road trips, and charging network alerts.
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

                  {/* 2 Wheeler Option */}
                  <TouchableOpacity
                    style={[
                      styles.vehicleOptionCard,
                      vehicleType === "2 Wheeler" && styles.vehicleOptionCardActive,
                    ]}
                    onPress={() => setVehicleType("2 Wheeler")}
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
                        Perfect for urban lane filtering, scenic mountain passes, and agile stops.
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
                </View>
              </View>
            )}

            {/* STEP 6: SECURE PASSWORD & CONFIRM */}
            {currentStep === 6 && (
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
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPassInputRef.current?.focus()}
                      onFocus={() => handleInputFocus("pass")}
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
                    ref={confirmPassInputRef}
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
                    returnKeyType="done"
                    onSubmitEditing={handleCompleteRegistration}
                    onFocus={() => handleInputFocus("confirmPass")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            )}

            {/* STEP 7: OTP VERIFICATION (FINAL STEP) */}
            {currentStep === 7 && (
              <View style={styles.stepCard}>
                <View style={styles.stepIconSquircle}>
                  <ShieldIcon size={24} color="#09090b" />
                </View>
                <Text style={styles.stepTitle}>Verify Registration</Text>
                <Text style={styles.stepSubtitle}>
                  Enter the 6-digit one-time code dispatched to{" "}
                  <Text style={{ fontWeight: "700", color: "#09090b" }}>
                    {email || phoneNumber}
                  </Text>.
                </Text>

                {/* 1-Tap Quick-Fill Pill - Always available so user is never blocked */}
                <TouchableOpacity
                  style={styles.devOtpPill}
                  onPress={() => {
                    const codeToFill = devOtpCode || "123456";
                    setOtp(codeToFill);
                  }}
                  activeOpacity={0.75}
                >
                  <SparklesIcon size={12} color="#09090b" />
                  <Text style={styles.devOtpText}>
                    Quick-Fill Code:{" "}
                    <Text style={{ fontWeight: "800", color: "#09090b" }}>
                      {devOtpCode || "123456"}
                    </Text>
                  </Text>
                </TouchableOpacity>

                {/* Reliable Native OTP Input with Visual 6-Cell Overlay & Tap-to-Focus */}
                <TouchableOpacity
                  style={styles.otpInputContainer}
                  activeOpacity={1}
                  onPress={() => otpInputRef.current?.focus()}
                >
                  {/* Visual Cells (Non-interactive display underneath) */}
                  <View style={styles.otpBoxesRow} pointerEvents="none">
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const digit = otp[idx] || "";
                      const isCellFocused = otp.length === idx;
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.otpBox,
                            digit.length > 0 && styles.otpBoxFilled,
                            isCellFocused && styles.otpBoxActive,
                          ]}
                        >
                          <Text style={styles.otpDigitText}>{digit}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Real Transparent TextInput positioned exactly on top */}
                  <TextInput
                    ref={otpInputRef}
                    style={styles.realOtpInput}
                    value={otp}
                    onChangeText={(val) => {
                      const clean = val.replace(/[^0-9]/g, "").slice(0, 6);
                      setOtp(clean);
                    }}
                    onFocus={() => handleInputFocus("otp")}
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    selectionColor="transparent"
                  />
                </TouchableOpacity>

                {/* Resend Action */}
                <View style={styles.resendContainer}>
                  {resendTimer > 0 ? (
                    <Text style={styles.resendTimerText}>
                      Resend code in{" "}
                      <Text style={{ fontWeight: "700", color: "#09090b" }}>
                        {resendTimer}s
                      </Text>
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      disabled={isSendingOtp}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.resendActionLink}>
                        {isSendingOtp ? "Dispatching..." : "Didn't receive code? Resend Code"}
                      </Text>
                    </TouchableOpacity>
                  )}
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
                    Account activation unlocks 2 free community journey posts & real-time messaging.
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Action Footer - Positioned inside ScrollView so it is ALWAYS visible and accessible with keyboard open */}
          <View style={styles.bottomBarInline}>
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
                  {isLoading ? "Creating Firebase Account..." : "Create Account & Launch Drivemate →"}
                </Text>
              </TouchableOpacity>
            )}

            {currentStep === 1 ? (
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                style={styles.switchAuthBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.switchAuthText}>
                  Already have an account?{" "}
                  <Text style={styles.switchAuthTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.termsNotice}>
                By registering, you agree to Drivemate's Terms of Service & Privacy Policy.
              </Text>
            )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  stepCard: {
    marginBottom: 16,
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
    marginBottom: 22,
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
  devOtpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  devOtpText: {
    fontSize: 12,
    color: "#52525b",
  },
  otpInputContainer: {
    position: "relative",
    width: "100%",
    height: 58,
    marginBottom: 16,
    justifyContent: "center",
  },
  otpBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    height: 58,
  },
  otpBox: {
    flex: 1,
    height: 58,
    maxWidth: 48,
    borderRadius: 14,
    backgroundColor: "#fafafa",
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,
  },
  otpBoxFilled: {
    backgroundColor: "#ffffff",
    borderColor: "#09090b",
  },
  otpBoxActive: {
    borderColor: "#09090b",
    borderWidth: 2,
    backgroundColor: "#ffffff",
  },
  otpDigitText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#09090b",
  },
  realOtpInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: 58,
    opacity: 0.01,
    color: "transparent",
    zIndex: 10,
    fontSize: 24,
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  resendTimerText: {
    fontSize: 13,
    color: "#71717a",
  },
  resendActionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
    textDecorationLine: "underline",
  },
  perkNoticeBox: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 16,
    marginTop: 6,
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
  bottomBarInline: {
    marginTop: "auto",
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 16 : 24,
  },
  continueBtn: {
    backgroundColor: "#09090b",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  switchAuthBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 4,
  },
  switchAuthText: {
    fontSize: 13,
    color: "#71717a",
    fontWeight: "500",
  },
  switchAuthTextBold: {
    color: "#09090b",
    fontWeight: "700",
  },
  termsNotice: {
    fontSize: 11,
    color: "#a1a1aa",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 16,
  },
});
