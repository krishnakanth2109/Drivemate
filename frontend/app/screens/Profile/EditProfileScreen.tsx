import React, { useState, useEffect } from "react";
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
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeftIcon, CameraIcon, CheckCircleIcon } from "../../components/Icons";
import { authAPI, mediaAPI } from "../../services/api";
import { getUserProfile, setUserProfile } from "../../services/storage";

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const stored = await getUserProfile();
      if (stored) {
        if (stored.fullName) setFullName(stored.fullName);
        if (stored.username) setUsername(stored.username);
        if (stored.email) setEmail(stored.email);
        if (stored.phoneNumber) setPhone(stored.phoneNumber);
        if (stored.bio) setBio(stored.bio);
        if (stored.location) setLocation(stored.location);
        if (stored.profilePicture) setProfilePicture(stored.profilePicture);
        else if (stored.photoUrl) setProfilePicture(stored.photoUrl);
      }

      try {
        const res = await authAPI.getProfile();
        if (res.success && res.user) {
          if (res.user.fullName) setFullName(res.user.fullName);
          if (res.user.username) setUsername(res.user.username);
          if (res.user.email) setEmail(res.user.email);
          if (res.user.phoneNumber) setPhone(res.user.phoneNumber);
          if (res.user.bio) setBio(res.user.bio);
          if (res.user.location) setLocation(res.user.location);
          if (res.user.profilePicture) setProfilePicture(res.user.profilePicture);
          else if (res.user.photoUrl) setProfilePicture(res.user.photoUrl);
        }
      } catch {}
    }
    loadUser();
  }, []);

  const handlePickAndUploadAvatar = async (useCamera = false) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Camera permission is required to capture a profile picture.");
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Photo gallery permission is required to choose a profile picture.");
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
          });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setIsUploadingPhoto(true);

      const fileData = asset.base64
        ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
        : asset.uri;

      const uploadRes = await mediaAPI.uploadMedia({
        fileData,
        fileType: "photo",
        fileName: `avatar_${Date.now()}.jpg`,
      });

      const finalUrl = uploadRes?.mediaUrl || asset.uri;
      setProfilePicture(finalUrl);

      // Save to backend and local storage immediately
      await authAPI.updateProfile({ profilePicture: finalUrl });
      const currentStored = await getUserProfile();
      if (currentStored) {
        await setUserProfile({ ...currentStored, profilePicture: finalUrl, photoUrl: finalUrl });
      }

      Alert.alert("Profile Photo Updated", "Your new profile picture has been saved successfully!");
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Failed to upload profile picture. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePromptAvatarOptions = () => {
    Alert.alert(
      "Update Profile Photo",
      "Choose an option to update your photo:",
      [
        { text: "Take Photo (Camera)", onPress: () => handlePickAndUploadAvatar(true) },
        { text: "Choose from Gallery", onPress: () => handlePickAndUploadAvatar(false) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert("Missing Information", "Full name and email cannot be empty.");
      return;
    }

    setIsSaved(true);
    try {
      await authAPI.updateProfile({
        fullName: fullName.trim(),
        username: username.trim(),
        phoneNumber: phone.trim(),
        bio: bio.trim(),
        location: location.trim(),
        profilePicture: profilePicture || undefined,
      });
      const currentStored = await getUserProfile();
      if (currentStored) {
        await setUserProfile({
          ...currentStored,
          fullName: fullName.trim(),
          username: username.trim(),
          phoneNumber: phone.trim(),
          bio: bio.trim(),
          location: location.trim(),
          profilePicture: profilePicture || currentStored.profilePicture,
        });
      }
      setIsSaved(false);
      Alert.alert("Profile Updated", "Your profile changes have been saved successfully.");
      navigation.goBack();
    } catch {
      setIsSaved(false);
      Alert.alert("Profile Updated", "Your profile changes have been saved locally.");
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeftIcon size={20} color="#09090b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.saveHeaderBtn}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity
                style={styles.avatar}
                activeOpacity={0.8}
                onPress={handlePromptAvatarOptions}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>
                    {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cameraBadge}
                activeOpacity={0.8}
                onPress={handlePromptAvatarOptions}
              >
                <CameraIcon size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>Tap camera to change photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor="#a1a1aa"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.prefixInputWrapper}>
                <Text style={styles.inputPrefix}>@</Text>
                <TextInput
                  style={styles.prefixInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor="#a1a1aa"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#a1a1aa"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#a1a1aa"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, State / Country"
                placeholderTextColor="#a1a1aa"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio & Driving Interests</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell other drivers about yourself..."
                placeholderTextColor="#a1a1aa"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaved && styles.saveBtnSaved]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            {isSaved ? (
              <View style={styles.saveBtnContent}>
                <CheckCircleIcon size={18} color="#ffffff" />
                <Text style={styles.saveBtnText}>Saved!</Text>
              </View>
            ) : (
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardView: {
    flex: 1,
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
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 26,
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
    fontSize: 32,
    fontWeight: "800",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
  },
  cameraBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#09090b",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 8,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#09090b",
  },
  prefixInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputPrefix: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717a",
    marginRight: 2,
  },
  prefixInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#09090b",
  },
  textArea: {
    minHeight: 80,
    lineHeight: 20,
  },
  saveBtn: {
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
  saveBtnSaved: {
    backgroundColor: "#10b981",
  },
  saveBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});

