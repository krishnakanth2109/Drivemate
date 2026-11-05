import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { CloseIcon, LinkIcon, SparklesIcon, CarIcon } from "../Icons";

export interface PostItem {
  id: string;
  userId?: string;
  author: string;
  authorTag: string;
  timeAgo: string;
  content: string;
  fromCity?: string;
  toCity?: string;
  departureTime?: string;
  availableSeats?: number;
  pricePerSeat?: string;
  link?: string;
  linkTitle?: string;
  tag?: string;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
}

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitPost: (post: {
    content: string;
    fromCity?: string;
    toCity?: string;
    departureTime?: string;
    availableSeats?: number;
    pricePerSeat?: string;
    link?: string;
    linkTitle?: string;
    tag?: string;
  }) => void;
  onOpenPaymentModal: () => void;
  freePostsUsed: number;
  maxFreePosts: number;
  isProUser: boolean;
  singlePasses?: number;
  userName?: string;
}

const CATEGORIES = [
  "#Carpool",
  "#RoadTrip",
  "#Commute",
  "#TrafficAlert",
  "#Maintenance",
  "#EVCharging",
];

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onSubmitPost,
  onOpenPaymentModal,
  freePostsUsed,
  maxFreePosts,
  isProUser,
  singlePasses = 0,
  userName = "Alex Morgan",
}) => {
  const [content, setContent] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [availableSeats, setAvailableSeats] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("$30");
  const [showRideFields, setShowRideFields] = useState(true);

  const [link, setLink] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [selectedTag, setSelectedTag] = useState("#Carpool");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isLimitReached = !isProUser && singlePasses <= 0 && freePostsUsed >= maxFreePosts;

  const handlePublish = () => {
    if (!content.trim()) {
      Alert.alert("Empty Post", "Please write something before publishing.");
      return;
    }

    if (isLimitReached) {
      onOpenPaymentModal();
      return;
    }

    let cleanLink = link.trim();
    if (cleanLink && !cleanLink.startsWith("http://") && !cleanLink.startsWith("https://")) {
      cleanLink = `https://${cleanLink}`;
    }

    onSubmitPost({
      content: content.trim(),
      fromCity: fromCity.trim() || undefined,
      toCity: toCity.trim() || undefined,
      departureTime: departureTime.trim() || undefined,
      availableSeats: availableSeats.trim() ? Number(availableSeats) : undefined,
      pricePerSeat: pricePerSeat.trim() || undefined,
      link: cleanLink || undefined,
      linkTitle: linkTitle.trim() || undefined,
      tag: selectedTag,
    });

    // Reset fields
    setContent("");
    setFromCity("");
    setToCity("");
    setDepartureTime("");
    setLink("");
    setLinkTitle("");
    setShowLinkInput(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandleContainer}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Create Journey Post</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <CloseIcon size={18} color="#71717a" />
              </TouchableOpacity>
            </View>

            {/* Author & Free Tier Counter */}
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{userName}</Text>
                <View style={styles.tierPill}>
                  <SparklesIcon size={11} color="#09090b" />
                  <Text style={styles.tierPillText}>
                    {isProUser
                      ? "Pro Unlimited"
                      : singlePasses > 0
                      ? `Single Pass Active (${singlePasses} left)`
                      : `Free Tier: ${freePostsUsed}/${maxFreePosts} used`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Limit Warning if 2 free posts used */}
            {isLimitReached && (
              <TouchableOpacity
                style={styles.limitAlertBox}
                onPress={onOpenPaymentModal}
                activeOpacity={0.8}
              >
                <Text style={styles.limitAlertTitle}>
                  ⚠️ 2 Free Posts Limit Reached
                </Text>
                <Text style={styles.limitAlertSub}>
                  Publishing this post requires an upgrade or pass. Tap here to unlock.
                </Text>
              </TouchableOpacity>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Trip Route Details (From / To / Departure) */}
              <View style={styles.rideSection}>
                <View style={styles.rideHeaderRow}>
                  <CarIcon size={16} color="#09090b" />
                  <Text style={styles.rideSectionTitle}>Trip & Route Coordinates</Text>
                </View>

                <View style={styles.citiesRow}>
                  <View style={styles.cityField}>
                    <Text style={styles.fieldLabel}>Origin (From)</Text>
                    <TextInput
                      style={styles.cityInput}
                      placeholder="e.g. San Francisco, CA"
                      placeholderTextColor="#a1a1aa"
                      value={fromCity}
                      onChangeText={setFromCity}
                    />
                  </View>
                  <View style={styles.cityField}>
                    <Text style={styles.fieldLabel}>Destination (To)</Text>
                    <TextInput
                      style={styles.cityInput}
                      placeholder="e.g. Los Angeles, CA"
                      placeholderTextColor="#a1a1aa"
                      value={toCity}
                      onChangeText={setToCity}
                    />
                  </View>
                </View>

                <View style={styles.citiesRow}>
                  <View style={styles.cityField}>
                    <Text style={styles.fieldLabel}>Timing / Date</Text>
                    <TextInput
                      style={styles.cityInput}
                      placeholder="Today • 04:30 PM"
                      placeholderTextColor="#a1a1aa"
                      value={departureTime}
                      onChangeText={setDepartureTime}
                    />
                  </View>
                  <View style={[styles.cityField, { flex: 0.5 }]}>
                    <Text style={styles.fieldLabel}>Seats</Text>
                    <TextInput
                      style={styles.cityInput}
                      placeholder="3"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="numeric"
                      value={availableSeats}
                      onChangeText={setAvailableSeats}
                    />
                  </View>
                </View>
              </View>

              {/* Text Input */}
              <Text style={styles.fieldLabel}>Trip Notes & Description</Text>
              <TextInput
                style={[styles.textArea, isFocused && styles.textAreaFocused]}
                placeholder="Share departure details, luggage space, EV charging stops, or ride guidelines..."
                placeholderTextColor="#a1a1aa"
                multiline
                numberOfLines={3}
                value={content}
                onChangeText={setContent}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                textAlignVertical="top"
              />

              {/* Tag Selector */}
              <Text style={styles.tagLabel}>Topic Tag</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsContainer}
              >
                {CATEGORIES.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagChip,
                        isSelected && styles.tagChipSelected,
                      ]}
                      onPress={() => setSelectedTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tagChipText,
                          isSelected && styles.tagChipTextSelected,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Link Input Section */}
              <TouchableOpacity
                style={styles.linkToggleBtn}
                onPress={() => setShowLinkInput(!showLinkInput)}
                activeOpacity={0.7}
              >
                <LinkIcon size={16} color="#09090b" />
                <Text style={styles.linkToggleText}>
                  {showLinkInput ? "Remove attached link" : "Attach route map / URL link"}
                </Text>
              </TouchableOpacity>

              {showLinkInput && (
                <View style={styles.linkBox}>
                  <TextInput
                    style={styles.linkInput}
                    placeholder="https://maps.google.com/routes/..."
                    placeholderTextColor="#a1a1aa"
                    value={link}
                    onChangeText={setLink}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    style={[styles.linkInput, { marginTop: 8 }]}
                    placeholder="Link Title (e.g. Scenic Coastal Route Map)"
                    placeholderTextColor="#a1a1aa"
                    value={linkTitle}
                    onChangeText={setLinkTitle}
                  />
                </View>
              )}
            </ScrollView>

            {/* Submit Action */}
            <TouchableOpacity
              style={[
                styles.publishBtn,
                isLimitReached && styles.publishBtnUpgrade,
              ]}
              onPress={handlePublish}
              activeOpacity={0.88}
            >
              <Text style={styles.publishBtnText}>
                {isLimitReached ? "Unlock to Publish ($1.99 / Pro)" : "Publish Journey Post"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreatePostModal;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: "92%",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetHandleContainer: {
    alignItems: "center",
    paddingVertical: 6,
    marginBottom: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e4e4e7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  tierPillText: {
    fontSize: 11,
    color: "#71717a",
    fontWeight: "600",
  },
  limitAlertBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  limitAlertTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 2,
  },
  limitAlertSub: {
    fontSize: 12,
    color: "#b45309",
    lineHeight: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  rideSection: {
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 14,
  },
  rideHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  rideSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: 0.3,
  },
  citiesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  cityField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#71717a",
    marginBottom: 4,
  },
  cityInput: {
    height: 38,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 10,
    fontSize: 13,
    color: "#09090b",
  },
  textArea: {
    height: 80,
    backgroundColor: "#fafafa",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#e4e4e7",
    padding: 12,
    fontSize: 14,
    color: "#09090b",
    lineHeight: 20,
    marginBottom: 12,
  },
  textAreaFocused: {
    borderColor: "#09090b",
    backgroundColor: "#ffffff",
  },
  tagLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717a",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  tagChipSelected: {
    backgroundColor: "#09090b",
    borderColor: "#09090b",
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#52525b",
  },
  tagChipTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  linkToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 6,
  },
  linkToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#09090b",
  },
  linkBox: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 12,
  },
  linkInput: {
    height: 38,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 10,
    fontSize: 12,
    color: "#09090b",
  },
  publishBtn: {
    height: 48,
    backgroundColor: "#09090b",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  publishBtnUpgrade: {
    backgroundColor: "#d97706",
  },
  publishBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
