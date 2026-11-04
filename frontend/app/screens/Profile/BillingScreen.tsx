import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  SparklesIcon,
  CheckCircleIcon,
  FileTextIcon,
} from "../../components/Icons";

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  description: string;
  amount: string;
  status: "Paid" | "Pending";
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: "1",
    invoiceNo: "INV-2026-004",
    date: "Oct 28, 2026",
    description: "Drivemate Pro • 1 Month",
    amount: "$9.99",
    status: "Paid",
  },
  {
    id: "2",
    invoiceNo: "INV-2026-003",
    date: "Sep 28, 2026",
    description: "Drivemate Pro • 1 Month",
    amount: "$9.99",
    status: "Paid",
  },
  {
    id: "3",
    invoiceNo: "INV-2026-002",
    date: "Aug 15, 2026",
    description: "1 Single Post Pass",
    amount: "$1.99",
    status: "Paid",
  },
  {
    id: "4",
    invoiceNo: "INV-2026-001",
    date: "Jul 01, 2026",
    description: "Drivemate Free Tier Activation",
    amount: "$0.00",
    status: "Paid",
  },
];

const BillingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isPro, setIsPro] = useState(true);

  const handleDownloadInvoice = (inv: Invoice) => {
    Alert.alert("Invoice Download", `Invoice ${inv.invoiceNo} receipt has been sent to alex@drivemate.com`);
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
        <Text style={styles.headerTitle}>Membership & Billing</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Active Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planBadgeText}>ACTIVE MEMBERSHIP</Text>
              <Text style={styles.planTitle}>
                {isPro ? "Drivemate Pro" : "Drivemate Free"}
              </Text>
            </View>
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>
                {isPro ? "$9.99" : "$0.00"}
              </Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
          </View>

          <Text style={styles.planDescription}>
            {isPro
              ? "You have full unlimited community posting, 24/7 roadside rescue concierge, and telemetry syncing."
              : "Free tier with 2 complimentary community posts. Upgrade anytime for unlimited posting."}
          </Text>

          {/* Perks list */}
          <View style={styles.perksList}>
            <View style={styles.perkRow}>
              <CheckCircleIcon size={14} color="#10b981" />
              <Text style={styles.perkText}>
                {isPro ? "Unlimited community discussion posts" : "2 complimentary community posts"}
              </Text>
            </View>
            <View style={styles.perkRow}>
              <CheckCircleIcon size={14} color="#10b981" />
              <Text style={styles.perkText}>Real-time OBD telemetry and vehicle scan</Text>
            </View>
            <View style={styles.perkRow}>
              <CheckCircleIcon size={14} color="#10b981" />
              <Text style={styles.perkText}>High-speed EV supercharge route planner</Text>
            </View>
          </View>

          <View style={styles.planActionRow}>
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() =>
                Alert.alert(
                  "Subscription Status",
                  "Your Drivemate Pro subscription is active and renews on Nov 28, 2026."
                )
              }
            >
              <Text style={styles.manageBtnText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.cardContainer}>
          <View style={styles.cardRow}>
            <View style={styles.cardIconBox}>
              <CreditCardIcon size={20} color="#09090b" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>Visa ending in 4242</Text>
              <Text style={styles.cardExpiry}>Expires 12/28 • Default</Text>
            </View>
            <View style={styles.defaultPill}>
              <Text style={styles.defaultPillText}>DEFAULT</Text>
            </View>
          </View>
        </View>

        {/* Invoices List */}
        <Text style={styles.sectionTitle}>Billing Invoices & Receipts</Text>
        <View style={styles.invoicesCard}>
          {MOCK_INVOICES.map((inv, index) => (
            <TouchableOpacity
              key={inv.id}
              style={[
                styles.invoiceItem,
                index < MOCK_INVOICES.length - 1 && styles.invoiceBorder,
              ]}
              onPress={() => handleDownloadInvoice(inv)}
              activeOpacity={0.7}
            >
              <View style={styles.invoiceIconBox}>
                <FileTextIcon size={18} color="#71717a" />
              </View>

              <View style={styles.invoiceDetails}>
                <Text style={styles.invoiceDesc}>{inv.description}</Text>
                <Text style={styles.invoiceDate}>
                  {inv.date} • {inv.invoiceNo}
                </Text>
              </View>

              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceAmount}>{inv.amount}</Text>
                <Text style={styles.invoiceStatus}>{inv.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BillingScreen;

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
  planCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#09090b",
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#71717a",
    letterSpacing: 0.6,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#09090b",
    marginTop: 2,
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#09090b",
  },
  pricePeriod: {
    fontSize: 11,
    color: "#71717a",
    marginLeft: 2,
  },
  planDescription: {
    fontSize: 13,
    color: "#52525b",
    lineHeight: 19,
    marginBottom: 16,
  },
  perksList: {
    gap: 8,
    marginBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 14,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  perkText: {
    fontSize: 13,
    color: "#18181b",
    fontWeight: "500",
  },
  planActionRow: {
    marginTop: 4,
  },
  manageBtn: {
    backgroundColor: "#09090b",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  manageBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#09090b",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 16,
    marginBottom: 24,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  cardExpiry: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  defaultPill: {
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#18181b",
    letterSpacing: 0.5,
  },
  invoicesCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  invoiceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  invoiceBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  invoiceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  invoiceDetails: {
    flex: 1,
  },
  invoiceDesc: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  invoiceDate: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: "flex-end",
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  invoiceStatus: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "600",
    marginTop: 2,
  },
});

