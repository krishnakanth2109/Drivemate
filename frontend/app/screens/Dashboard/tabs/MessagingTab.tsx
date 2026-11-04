import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { MessageIcon, SparklesIcon } from "../../../components/Icons";
import { getSocket } from "../../../services/socket";
import { messagesAPI } from "../../../services/api";
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

const MessagingTab: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    const socket = getSocket();

    // 1. Load user profile
    getUserProfile().then((p) => {
      if (isMounted) setUserProfile(p);
    });

    // 2. Fetch recent messages from backend REST API
    async function fetchInitialMessages() {
      try {
        const res = await messagesAPI.getMessages("drivemate-hq");
        console.log("💬 [MessagingTab fetchInitialMessages] Loaded messages:", res.messages?.length || 0, res.messages);
        if (isMounted && res.success && Array.isArray(res.messages)) {
          setMessages(res.messages);
        }
      } catch (err) {
        console.warn("[MessagingTab] fetchInitialMessages note:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchInitialMessages();

    // 3. Socket.io setup & room join
    if (socket.connected) {
      setIsSocketConnected(true);
    }

    socket.on("connect", () => {
      console.log("💬 [MessagingTab Socket Connected] Joined room drivemate-hq");
      if (isMounted) setIsSocketConnected(true);
      socket.emit("join_room", "drivemate-hq");
    });

    socket.on("disconnect", () => {
      console.log("💬 [MessagingTab Socket Disconnected]");
      if (isMounted) setIsSocketConnected(false);
    });

    socket.emit("join_room", "drivemate-hq");

    // 4. Real-time incoming message listener
    socket.on("new_message", (incoming: ChatMessage) => {
      console.log("💬 [MessagingTab Live Message Received]", incoming);
      if (isMounted) {
        setMessages((prev) => {
          // Avoid duplicate messages if sender also added locally
          if (prev.some((m) => m.id === incoming.id)) {
            return prev;
          }
          return [...prev, incoming];
        });
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      isMounted = false;
      socket.off("new_message");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;

    setInputText("");

    const senderName = userProfile?.fullName || "Drivemate Driver";
    const senderTag = userProfile?.username ? `@${userProfile.username}` : "@driver";
    const senderId = userProfile?.uid || "my_user_id";

    const localMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      senderId,
      senderName,
      senderTag,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    // Optimistic UI update
    console.log("💬 [MessagingTab handleSendMessage] Dispatching chat message:", localMsg);
    setMessages((prev) => [...prev, localMsg]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);

    // Broadcast via Socket.io
    const socket = getSocket();
    socket.emit("send_message", {
      text: textToSend,
      senderName,
      senderTag,
      senderId,
      roomId: "drivemate-hq",
    });

    // Also persist via REST API
    try {
      await messagesAPI.sendMessage(textToSend, "drivemate-hq");
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Driver Comms</Text>
          <View style={styles.socketPill}>
            <View
              style={[
                styles.socketDot,
                isSocketConnected ? styles.socketDotLive : styles.socketDotOffline,
              ]}
            />
            <Text style={styles.socketPillText}>
              {isSocketConnected ? "SOCKETS LIVE" : "CONNECTING..."}
            </Text>
          </View>
        </View>
        <Text style={styles.channelSub}>
          Live road conditions, carpool alerts, and driver dispatch
        </Text>
      </View>

      {/* Messages Stream */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#09090b" />
          <Text style={styles.loadingText}>Syncing live driver comms...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((item) => {
            const isMe = userProfile && item.senderId === userProfile.uid;

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
          })}
        </ScrollView>
      )}

      {/* Real-time Message Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Broadcast road update or message..."
          placeholderTextColor="#a1a1aa"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
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
    backgroundColor: "#fafafa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  socketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  socketDotLive: {
    backgroundColor: "#10b981",
  },
  socketDotOffline: {
    backgroundColor: "#f59e0b",
  },
  socketPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: 0.5,
  },
  channelSub: {
    fontSize: 12,
    color: "#71717a",
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
