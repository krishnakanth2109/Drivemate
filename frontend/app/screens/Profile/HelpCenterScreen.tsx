import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeftIcon,
  SearchIcon,
  WrenchIcon,
  ChevronRightIcon,
  MessageIcon,
  PhoneIcon,
} from "../../components/Icons";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    id: "f1",
    question: "How does the 2-free-posts allowance work?",
    answer:
      "All new Drivemate members receive 2 complimentary posts to share updates, route tips, and links with the community. Once those 2 free posts are used, additional posts require either a 1 Single Post Pass ($1.99) or a Drivemate Pro subscription ($9.99/mo) for unlimited publishing.",
  },
  {
    id: "f2",
    question: "How do I link my vehicle's real-time telematics?",
    answer:
      "Navigate to My Garage in your Profile, tap Add New Vehicle, and input your vehicle's 17-character VIN. Drivemate connects to your vehicle's cloud diagnostics API to sync tire pressure, battery charge, and service schedules.",
  },
  {
    id: "f3",
    question: "What emergency roadside services are dispatched?",
    answer:
      "Emergency towing within 50 miles, flat tire fixes, 12V battery jump-starts, mobile EV rapid charging, and accidental lockout assistance are included with 24/7 priority dispatch.",
  },
  {
    id: "f4",
    question: "Can I cancel my Pro subscription anytime?",
    answer:
      "Yes. You can manage or cancel your Pro subscription anytime directly from Membership & Billing with zero cancellation fees or lock-ins.",
  },
];

const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("f1");

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const handleCallHotline = () => {
    Alert.alert(
      "Dispatch Roadside Hotline",
      "Calling Drivemate 24/7 Roadside Assistance Center: +1 (800) 374-8362",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Now",
          onPress: () => {
            Linking.openURL("tel:18003748362").catch(() => {
              Alert.alert("Hotline Number", "+1 (800) 374-8362");
            });
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Emergency Hotline Banner */}
        <View style={styles.hotlineCard}>
          <View style={styles.hotlineIcon}>
            <WrenchIcon size={22} color="#ffffff" />
          </View>
          <View style={styles.hotlineInfo}>
            <Text style={styles.hotlineTitle}>24/7 Roadside Rescue Hotline</Text>
            <Text style={styles.hotlineSub}>
              Immediate dispatch for accidents, towing, or charging failure
            </Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallHotline}
            activeOpacity={0.8}
          >
            <PhoneIcon size={14} color="#09090b" />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <SearchIcon size={16} color="#71717a" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs and help topics..."
            placeholderTextColor="#a1a1aa"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqsCard}>
          {filteredFaqs.map((faq, index) => {
            const isExpanded = expandedId === faq.id;
            return (
              <View
                key={faq.id}
                style={[
                  styles.faqItem,
                  index < filteredFaqs.length - 1 && styles.faqBorder,
                ]}
              >
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() =>
                    setExpandedId(isExpanded ? null : faq.id)
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Text style={styles.expandIcon}>
                    {isExpanded ? "−" : "+"}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Support Chat Card */}
        <View style={styles.chatCard}>
          <View style={styles.chatIconBox}>
            <MessageIcon size={20} color="#09090b" />
          </View>
          <View style={styles.chatDetails}>
            <Text style={styles.chatTitle}>Still have questions?</Text>
            <Text style={styles.chatSub}>Our driver support team typically responds in under 5 minutes.</Text>
          </View>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() =>
              Alert.alert(
                "Live Chat Concierge",
                "Connecting you with a Drivemate specialist..."
              )
            }
            activeOpacity={0.85}
          >
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpCenterScreen;

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
  hotlineCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#09090b",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  hotlineIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  hotlineInfo: {
    flex: 1,
  },
  hotlineTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  hotlineSub: {
    fontSize: 11,
    color: "#a1a1aa",
    marginTop: 2,
    lineHeight: 15,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#09090b",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#09090b",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#09090b",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  faqsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  faqItem: {
    paddingVertical: 14,
  },
  faqBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
    flex: 1,
    marginRight: 10,
  },
  expandIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: "#71717a",
  },
  faqAnswer: {
    fontSize: 13,
    color: "#52525b",
    lineHeight: 20,
    marginTop: 8,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 16,
  },
  chatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  chatDetails: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  chatSub: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 2,
    lineHeight: 15,
  },
  chatBtn: {
    backgroundColor: "#09090b",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    marginLeft: 8,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
});

