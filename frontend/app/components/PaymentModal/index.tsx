import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { CloseIcon, CreditCardIcon, CheckCircleIcon, SparklesIcon } from "../Icons";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess: (plan: "single" | "pro") => void;
  freePostsUsed: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  onPaymentSuccess,
  freePostsUsed,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"single" | "pro">("pro");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("888");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onPaymentSuccess(selectedPlan);
        onClose();
        Alert.alert(
          "Payment Successful!",
          selectedPlan === "pro"
            ? "Welcome to Drivemate Pro! You now have unlimited posts and verified privileges."
            : "Single post credit added to your account! You can now publish your post."
        );
      }, 1000);
    }, 1200);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={isProcessing ? () => {} : onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Sheet Handle */}
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <SparklesIcon size={18} color="#09090b" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Post Tier Upgrade</Text>
              <Text style={styles.subtitle}>
                Free tier includes 2 posts ({freePostsUsed}/2 used)
              </Text>
            </View>
            <TouchableOpacity
              onPress={isProcessing ? undefined : onClose}
              disabled={isProcessing}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon size={18} color={isProcessing ? "#d4d4d8" : "#71717a"} />
            </TouchableOpacity>
          </View>

          {isSuccess ? (
            <View style={styles.successContainer}>
              <CheckCircleIcon size={52} color="#10b981" />
              <Text style={styles.successTitle}>Payment Verified</Text>
              <Text style={styles.successSubtitle}>
                Your posting privileges have been updated.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Notice */}
              <View style={styles.limitBanner}>
                <Text style={styles.limitBannerText}>
                  To maintain quality discussions across Drivemate, extra posts require a single pass or Pro membership.
                </Text>
              </View>

              {/* Plan Selection */}
              <Text style={styles.sectionLabel}>Select an option</Text>

              {/* Option 1: Pro Unlimited */}
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === "pro" && styles.planOptionSelected,
                ]}
                onPress={() => setSelectedPlan("pro")}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedPlan === "pro" && styles.radioOuterSelected,
                      ]}
                    >
                      {selectedPlan === "pro" && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.planDetails}>
                      <View style={styles.planTitleRow}>
                        <Text style={styles.planTitle}>Drivemate Pro</Text>
                        <View style={styles.badgePopular}>
                          <Text style={styles.badgePopularText}>BEST VALUE</Text>
                        </View>
                      </View>
                      <Text style={styles.planSub}>
                        Unlimited posts • Priority messaging • Verified badge
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.planPrice}>
                    $9.99<Text style={styles.period}>/mo</Text>
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Single Post Pass */}
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === "single" && styles.planOptionSelected,
                ]}
                onPress={() => setSelectedPlan("single")}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedPlan === "single" && styles.radioOuterSelected,
                      ]}
                    >
                      {selectedPlan === "single" && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.planDetails}>
                      <Text style={styles.planTitle}>1 Single Post Pass</Text>
                      <Text style={styles.planSub}>
                        Instant publication for 1 additional post
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.planPrice}>$1.99</Text>
                </View>
              </TouchableOpacity>

              {/* Payment Details */}
              <Text style={styles.sectionLabel}>Payment Method</Text>
              <View style={styles.cardInputWrapper}>
                <View style={styles.cardRow}>
                  <CreditCardIcon size={18} color="#09090b" />
                  <TextInput
                    style={styles.cardNumberInput}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="Card Number"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.cardMetaRow}>
                  <TextInput
                    style={styles.cardMetaInput}
                    value={expiry}
                    onChangeText={setExpiry}
                    placeholder="MM/YY"
                    placeholderTextColor="#a1a1aa"
                  />
                  <TextInput
                    style={styles.cardMetaInput}
                    value={cvv}
                    onChangeText={setCvv}
                    placeholder="CVV"
                    placeholderTextColor="#a1a1aa"
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Pay Button */}
              <TouchableOpacity
                style={[styles.payButton, isProcessing && styles.buttonDisabled]}
                onPress={handlePay}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.payButtonText}>
                    Confirm & Pay {selectedPlan === "pro" ? "$9.99" : "$1.99"}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.securityNote}>
                🔒 256-Bit SSL Encrypted • Cancel Pro anytime
              </Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default PaymentModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: "90%",
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
    paddingVertical: 8,
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
    marginBottom: 16,
  },
  headerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 1,
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
  scrollContent: {
    paddingBottom: 16,
  },
  limitBanner: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  limitBannerText: {
    color: "#52525b",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717a",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  planOption: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  planOptionSelected: {
    borderColor: "#09090b",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#09090b",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#09090b",
  },
  planDetails: {
    flex: 1,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  badgePopular: {
    backgroundColor: "#09090b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgePopularText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  planSub: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 2,
  },
  planPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: "#09090b",
    marginLeft: 8,
  },
  period: {
    fontSize: 11,
    fontWeight: "500",
    color: "#71717a",
  },
  cardInputWrapper: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    paddingBottom: 8,
    marginBottom: 8,
  },
  cardNumberInput: {
    flex: 1,
    fontSize: 13,
    color: "#09090b",
    fontWeight: "500",
  },
  cardMetaRow: {
    flexDirection: "row",
    gap: 12,
  },
  cardMetaInput: {
    flex: 1,
    fontSize: 13,
    color: "#09090b",
    fontWeight: "500",
  },
  payButton: {
    backgroundColor: "#09090b",
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  securityNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#71717a",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 36,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#09090b",
    marginTop: 14,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: "#71717a",
    textAlign: "center",
  },
});
