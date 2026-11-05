import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import {
  MessageIcon,
  SparklesIcon,
  UserIcon,
  CheckCircleIcon,
  CloseIcon,
  PlusIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from "../../../components/Icons";
import { getSocket } from "../../../services/socket";
import {
  messagesAPI,
  DriverProfile,
  ConnectionRequestItem,
  ConversationItem,
} from "../../../services/api";
import { getUserProfile, StoredUserProfile } from "../../../services/storage";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderTag: string;
  text: string;
  time: string;
  roomId?: string;
  status?: string;
}

type TabMode = "chats" | "requests" | "discover";

const MessagingTab: React.FC = () => {
  const [activeTabMode, setActiveTabMode] = useState<TabMode>("chats");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);

  // Messages in active conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);

  // Requests state
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequestItem[]>([]);
  const [isRespondingId, setIsRespondingId] = useState<string | null>(null);

  // Drivers directory
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [isSendingToUid, setIsSendingToUid] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const scrollViewRef = useRef<any>(null);

  // Load User Profile
  useEffect(() => {
    getUserProfile().then((p) => {
      if (p) setUserProfile(p);
    });
  }, []);

  // Fetch Conversations and Requests
  const loadConversationsAndRequests = useCallback(async () => {
    try {
      // 1. Fetch Conversations
      const convRes = await messagesAPI.getConversations();
      if (convRes.success && Array.isArray(convRes.conversations)) {
        setConversations(convRes.conversations);
      }

      // 2. Fetch Requests
      const reqRes = await messagesAPI.getRequests();
      if (reqRes.success) {
        setIncomingRequests(reqRes.incoming || []);
        setOutgoingRequests(reqRes.outgoing || []);
      }

      // 3. Fetch Discoverable Drivers
      const driversRes = await messagesAPI.getDrivers();
      if (driversRes.success && Array.isArray(driversRes.drivers)) {
        setDrivers(driversRes.drivers);
      }
    } catch (err: any) {
      console.warn("⚠️ [MessagingTab] Data load warning:", err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversationsAndRequests();
  }, [loadConversationsAndRequests]);

  // Load Messages whenever an active conversation is opened
  useEffect(() => {
    if (!activeConversation) return;

    let isMounted = true;
    const socket = getSocket();
    const currentRoom = activeConversation.roomId;

    setIsLoadingMessages(true);
    messagesAPI
      .getMessages(currentRoom)
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.messages)) {
          setMessages(res.messages);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });

    // Join room
    socket.emit("join_room", currentRoom);

    // Socket listener for incoming messages
    const handleNewMessage = (incoming: ChatMessage) => {
      if (incoming.roomId === currentRoom && isMounted) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      isMounted = false;
      socket.off("new_message", handleNewMessage);
    };
  }, [activeConversation]);

  // Listen to Socket connection status
  useEffect(() => {
    const socket = getSocket();
    if (socket.connected) setIsSocketConnected(true);

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConversationsAndRequests();
  };

  // Send message in current active room
  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || !activeConversation) return;

    setInputText("");

    const senderName = userProfile?.fullName || "Drivemate Driver";
    const senderTag = userProfile?.username ? `@${userProfile.username}` : "@driver";
    const senderId = userProfile?.uid || "my_user_id";
    const roomId = activeConversation.roomId;

    const localMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      senderId,
      senderName,
      senderTag,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      roomId,
      status: "sent",
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, localMsg]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 60);

    // Broadcast via socket
    const socket = getSocket();
    socket.emit("send_message", {
      text: textToSend,
      senderName,
      senderTag,
      senderId,
      roomId,
    });

    // Persist via REST
    try {
      await messagesAPI.sendMessage(textToSend, roomId);
      // Update snippet in conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c.roomId === roomId
            ? { ...c, lastMessage: textToSend, lastTime: "Just now" }
            : c
        )
      );
    } catch {}
  };

  // Send Connection Request to Driver
  const handleSendConnectionRequest = async (targetUserId: string) => {
    setIsSendingToUid(targetUserId);
    try {
      const res = await messagesAPI.sendRequest(targetUserId);
      if (res.success) {
        Alert.alert("Request Dispatched", res.message || "Connection request sent!");
        // Update local driver item to pending
        setDrivers((prev) =>
          prev.map((d) =>
            d.uid === targetUserId ? { ...d, connectionStatus: "pending", isSender: true } : d
          )
        );
        loadConversationsAndRequests();
      } else {
        Alert.alert("Unable to send", res.error || "Please try again later.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Network error sending request.");
    } finally {
      setIsSendingToUid(null);
    }
  };

  // Accept or Decline incoming request
  const handleRespondRequest = async (requestId: string, action: "accept" | "decline") => {
    setIsRespondingId(requestId);
    try {
      const res = await messagesAPI.respondRequest(requestId, action);
      if (res.success) {
        Alert.alert(
          action === "accept" ? "Connection Accepted!" : "Request Declined",
          res.message
        );
        // Remove from incoming requests list
        setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
        // Refresh conversations to reveal new chat room
        loadConversationsAndRequests();
      } else {
        Alert.alert("Response Failed", res.error || "Unable to update request status.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Network communication failed.");
    } finally {
      setIsRespondingId(null);
    }
  };

  // ================= VIEW 1: ACTIVE CHAT THREAD =================
  if (activeConversation) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        style={styles.container}
      >
        {/* Chat Thread Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveConversation(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <ArrowLeftIcon size={18} color="#09090b" />
          </TouchableOpacity>

          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle} numberOfLines={1}>
              {activeConversation.name}
            </Text>
            <Text style={styles.chatHeaderSub} numberOfLines={1}>
              {activeConversation.tag} • {activeConversation.isGroup ? "Group Feed" : "Direct Message"}
            </Text>
          </View>

          <View style={styles.socketPill}>
            <View
              style={[
                styles.socketDot,
                { backgroundColor: isSocketConnected ? "#10b981" : "#eab308" },
              ]}
            />
            <Text style={styles.socketPillText}>
              {isSocketConnected ? "LIVE" : "SYNCING"}
            </Text>
          </View>
        </View>

        {/* Message Stream */}
        {isLoadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#09090b" />
            <Text style={styles.loadingText}>Loading conversation history...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyChatBox}>
                <MessageIcon size={28} color="#a1a1aa" />
                <Text style={styles.emptyChatTitle}>No messages yet</Text>
                <Text style={styles.emptyChatSub}>
                  Send the first message to start the conversation!
                </Text>
              </View>
            ) : (
              messages.map((item) => {
                const isMe =
                  item.senderId === userProfile?.uid ||
                  item.senderTag === (userProfile?.username ? `@${userProfile.username}` : "");

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.messageBubbleContainer,
                      isMe && styles.messageBubbleContainerMe,
                    ]}
                  >
                    {!isMe && (
                      <View style={styles.senderAvatar}>
                        <Text style={styles.senderAvatarText}>
                          {item.senderName ? item.senderName.charAt(0).toUpperCase() : "D"}
                        </Text>
                      </View>
                    )}

                    <View style={[styles.bubble, isMe && styles.bubbleMe]}>
                      {!isMe && (
                        <View style={styles.senderHeader}>
                          <Text style={styles.senderName}>{item.senderName}</Text>
                          <Text style={styles.senderTag}>{item.senderTag}</Text>
                        </View>
                      )}

                      <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
                        {item.text}
                      </Text>

                      <Text style={[styles.timestamp, isMe && styles.timestampMe]}>
                        {item.time}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder={`Message ${activeConversation.name}...`}
            placeholderTextColor="#a1a1aa"
            value={inputText}
            onChangeText={setInputText}
            multiline={false}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ================= VIEW 2: TABS (CHATS, REQUESTS, DISCOVER) =================
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Messages</Text>
          <View style={styles.socketPill}>
            <View
              style={[
                styles.socketDot,
                { backgroundColor: isSocketConnected ? "#10b981" : "#eab308" },
              ]}
            />
            <Text style={styles.socketPillText}>
              {isSocketConnected ? "CONNECTED" : "OFFLINE"}
            </Text>
          </View>
        </View>

        {/* Segment Tabs */}
        <View style={styles.tabSegments}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTabMode === "chats" && styles.segmentBtnActive]}
            onPress={() => setActiveTabMode("chats")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTabMode === "chats" && styles.segmentBtnTextActive,
              ]}
            >
              Chats ({conversations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTabMode === "requests" && styles.segmentBtnActive]}
            onPress={() => setActiveTabMode("requests")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTabMode === "requests" && styles.segmentBtnTextActive,
              ]}
            >
              Requests {incomingRequests.length > 0 ? `(${incomingRequests.length})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTabMode === "discover" && styles.segmentBtnActive]}
            onPress={() => setActiveTabMode("discover")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTabMode === "discover" && styles.segmentBtnTextActive,
              ]}
            >
              Find Drivers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#09090b" />
        }
      >
        {/* ================= TAB 1: CHATS LIST ================= */}
        {activeTabMode === "chats" && (
          <View>
            <Text style={styles.listSectionTitle}>Active Conversations</Text>
            {conversations.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <MessageIcon size={26} color="#71717a" />
                <Text style={styles.emptyStateTitle}>No direct chats yet</Text>
                <Text style={styles.emptyStateSub}>
                  Send a connection request to other drivers to start chatting!
                </Text>
                <TouchableOpacity
                  style={styles.actionPillBtn}
                  onPress={() => setActiveTabMode("discover")}
                  activeOpacity={0.8}
                >
                  <PlusIcon size={13} color="#ffffff" />
                  <Text style={styles.actionPillBtnText}>Find & Connect with Drivers</Text>
                </TouchableOpacity>
              </View>
            ) : (
              conversations.map((item) => (
                <TouchableOpacity
                  key={item.roomId}
                  style={styles.conversationCard}
                  onPress={() => setActiveConversation(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.convAvatar}>
                    <Text style={styles.convAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.convDetails}>
                    <View style={styles.convTopRow}>
                      <Text style={styles.convName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.convTime}>{item.lastTime}</Text>
                    </View>
                    <Text style={styles.convTag}>{item.tag}</Text>
                    <Text style={styles.convSnippet} numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                  </View>

                  <ChevronRightIcon size={16} color="#a1a1aa" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ================= TAB 2: REQUESTS ================= */}
        {activeTabMode === "requests" && (
          <View>
            {/* Incoming Requests */}
            <Text style={styles.listSectionTitle}>Incoming Requests</Text>
            {incomingRequests.length === 0 ? (
              <View style={styles.emptySubState}>
                <Text style={styles.emptySubText}>No pending incoming requests.</Text>
              </View>
            ) : (
              incomingRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.requestInfoRow}>
                    <View style={styles.reqAvatar}>
                      <Text style={styles.reqAvatarText}>
                        {req.fromUserName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.reqTextCol}>
                      <Text style={styles.reqName}>{req.fromUserName}</Text>
                      <Text style={styles.reqTag}>{req.fromUserTag}</Text>
                      <Text style={styles.reqHint}>wants to connect and message with you.</Text>
                    </View>
                  </View>

                  {/* Accept / Decline actions */}
                  <View style={styles.reqActionsRow}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleRespondRequest(req.id, "accept")}
                      disabled={isRespondingId === req.id}
                      activeOpacity={0.8}
                    >
                      {isRespondingId === req.id ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <CheckCircleIcon size={14} color="#ffffff" />
                          <Text style={styles.acceptBtnText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => handleRespondRequest(req.id, "decline")}
                      disabled={isRespondingId === req.id}
                      activeOpacity={0.8}
                    >
                      <CloseIcon size={14} color="#71717a" />
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Outgoing Requests */}
            <Text style={[styles.listSectionTitle, { marginTop: 24 }]}>Sent Requests</Text>
            {outgoingRequests.length === 0 ? (
              <View style={styles.emptySubState}>
                <Text style={styles.emptySubText}>No pending sent requests.</Text>
              </View>
            ) : (
              outgoingRequests.map((req) => (
                <View key={req.id} style={styles.outgoingCard}>
                  <View style={styles.reqAvatar}>
                    <Text style={styles.reqAvatarText}>
                      {req.toUserName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.reqTextCol}>
                    <Text style={styles.reqName}>{req.toUserName}</Text>
                    <Text style={styles.reqTag}>{req.toUserTag}</Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= TAB 3: DISCOVER DRIVERS ================= */}
        {activeTabMode === "discover" && (
          <View>
            <Text style={styles.listSectionTitle}>Discover Registered Drivers</Text>
            <Text style={styles.listSectionSub}>
              Send a request to start a conversation and plan rides.
            </Text>

            {drivers.map((d) => {
              const isPending = d.connectionStatus === "pending";
              const isAccepted = d.connectionStatus === "accepted";
              const isSending = isSendingToUid === d.uid;

              return (
                <View key={d.uid} style={styles.driverCard}>
                  <View style={styles.driverAvatar}>
                    <Text style={styles.driverAvatarText}>
                      {d.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.driverDetails}>
                    <Text style={styles.driverName}>{d.fullName}</Text>
                    <Text style={styles.driverTag}>@{d.username}</Text>
                    <Text style={styles.driverMeta}>
                      🚗 {d.vehicleName} • 📍 {d.location}
                    </Text>
                  </View>

                  {/* Connect Button or Status */}
                  {isAccepted ? (
                    <TouchableOpacity
                      style={styles.connectedBtn}
                      onPress={() => {
                        // Find matching conversation and open chat
                        const conv = conversations.find(
                          (c) => c.partnerId === d.uid || c.name === d.fullName
                        );
                        if (conv) {
                          setActiveConversation(conv);
                        } else {
                          setActiveTabMode("chats");
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.connectedBtnText}>Chat →</Text>
                    </TouchableOpacity>
                  ) : isPending ? (
                    <View style={styles.pendingBtn}>
                      <Text style={styles.pendingBtnText}>Pending</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.connectBtn}
                      onPress={() => handleSendConnectionRequest(d.uid)}
                      disabled={isSending}
                      activeOpacity={0.8}
                    >
                      {isSending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <PlusIcon size={12} color="#ffffff" />
                          <Text style={styles.connectBtnText}>Connect</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MessagingTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    backgroundColor: "#ffffff",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.4,
  },
  socketPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  socketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  socketPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: 0.5,
  },
  tabSegments: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  segmentBtnTextActive: {
    color: "#09090b",
    fontWeight: "800",
  },
  scrollList: {
    padding: 18,
    paddingBottom: 32,
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#09090b",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  listSectionSub: {
    fontSize: 12,
    color: "#71717a",
    marginBottom: 14,
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  convAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  convAvatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  convDetails: {
    flex: 1,
    marginRight: 8,
  },
  convTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  convName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  convTime: {
    fontSize: 11,
    color: "#a1a1aa",
  },
  convTag: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 1,
  },
  convSnippet: {
    fontSize: 13,
    color: "#52525b",
    marginTop: 4,
  },
  emptyStateCard: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#09090b",
  },
  emptyStateSub: {
    fontSize: 13,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 240,
  },
  actionPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#09090b",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  actionPillBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  emptySubState: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f4f4f5",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 12,
    color: "#a1a1aa",
    textAlign: "center",
  },
  requestCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  requestInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reqAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reqAvatarText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  reqTextCol: {
    flex: 1,
  },
  reqName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  reqTag: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 1,
  },
  reqHint: {
    fontSize: 12,
    color: "#52525b",
    marginTop: 3,
  },
  reqActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#09090b",
    paddingVertical: 9,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingVertical: 9,
    borderRadius: 10,
  },
  declineBtnText: {
    color: "#71717a",
    fontSize: 13,
    fontWeight: "600",
  },
  outgoingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  pendingBadge: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717a",
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  driverAvatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  driverDetails: {
    flex: 1,
    marginRight: 8,
  },
  driverName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  driverTag: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 1,
  },
  driverMeta: {
    fontSize: 11,
    color: "#52525b",
    marginTop: 3,
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#09090b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  connectBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  pendingBtn: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pendingBtnText: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "700",
  },
  connectedBtn: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#09090b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  connectedBtnText: {
    color: "#09090b",
    fontSize: 12,
    fontWeight: "700",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    gap: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#09090b",
  },
  chatHeaderSub: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: "#71717a",
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  emptyChatBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyChatTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#09090b",
  },
  emptyChatSub: {
    fontSize: 12,
    color: "#71717a",
    textAlign: "center",
  },
  messageBubbleContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
    maxWidth: "85%",
  },
  messageBubbleContainerMe: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  senderAvatarText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  bubble: {
    backgroundColor: "#f4f4f5",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: "#09090b",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  senderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  senderName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#09090b",
  },
  senderTag: {
    fontSize: 10,
    color: "#71717a",
  },
  messageText: {
    fontSize: 14,
    color: "#18181b",
    lineHeight: 20,
  },
  messageTextMe: {
    color: "#ffffff",
  },
  timestamp: {
    fontSize: 10,
    color: "#a1a1aa",
    marginTop: 4,
    textAlign: "right",
  },
  timestampMe: {
    color: "#a1a1aa",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#e4e4e7",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#09090b",
  },
  sendButton: {
    height: 42,
    backgroundColor: "#09090b",
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
