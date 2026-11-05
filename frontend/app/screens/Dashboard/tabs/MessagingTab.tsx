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
  Image,
  Modal,
  Linking,
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
  CameraIcon,
  MapPinIcon,
  MicIcon,
  PaperclipIcon,
  PlayIcon,
  PauseIcon,
  FileTextIcon,
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
  msgType?: "text" | "photo" | "location" | "voice" | "pdf";
  mediaUrl?: string;
  locationData?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  fileMeta?: {
    fileName?: string;
    fileSize?: string;
    mimeType?: string;
    duration?: string;
  };
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

  // Media Attachment State
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // Voice recording simulation state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Custom Input State
  const [customPhotoUrl, setCustomPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [customAddress, setCustomAddress] = useState("");

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

  // Recording Timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

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

  const togglePlayVoice = (msgId: string) => {
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msgId);
      setTimeout(() => {
        setPlayingVoiceId((curr) => (curr === msgId ? null : curr));
      }, 5000);
    }
  };

  const handleSendRichMessage = async (payload: {
    msgType: "text" | "photo" | "location" | "voice" | "pdf";
    text?: string;
    mediaUrl?: string;
    locationData?: { latitude: number; longitude: number; address: string };
    fileMeta?: { fileName?: string; fileSize?: string; mimeType?: string; duration?: string };
  }) => {
    if (!activeConversation) return;

    const senderName = userProfile?.fullName || "Drivemate Driver";
    const senderTag = userProfile?.username ? `@${userProfile.username}` : "@driver";
    const senderId = userProfile?.uid || "my_user_id";
    const roomId = activeConversation.roomId;

    let defaultText = payload.text || "";
    if (!defaultText) {
      if (payload.msgType === "photo") defaultText = "📷 Shared a photo";
      else if (payload.msgType === "location") defaultText = `📍 ${payload.locationData?.address || "Shared location pin"}`;
      else if (payload.msgType === "voice") defaultText = "🎙️ Voice note";
      else if (payload.msgType === "pdf") defaultText = `📄 ${payload.fileMeta?.fileName || "Shared PDF document"}`;
    }

    const localMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      senderId,
      senderName,
      senderTag,
      text: defaultText,
      msgType: payload.msgType,
      mediaUrl: payload.mediaUrl,
      locationData: payload.locationData,
      fileMeta: payload.fileMeta,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      roomId,
      status: "sent",
    };

    setMessages((prev) => [...prev, localMsg]);
    setIsAttachmentMenuOpen(false);
    setIsPhotoModalOpen(false);
    setIsLocationModalOpen(false);
    setIsVoiceModalOpen(false);
    setIsPdfModalOpen(false);
    setIsRecording(false);
    setCustomPhotoUrl("");
    setPhotoCaption("");
    setCustomAddress("");

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 60);

    const socket = getSocket();
    socket.emit("send_message", {
      ...payload,
      text: defaultText,
      senderName,
      senderTag,
      senderId,
      roomId,
    });

    try {
      await messagesAPI.sendMessage(
        {
          roomId,
          text: defaultText,
          msgType: payload.msgType,
          mediaUrl: payload.mediaUrl,
          locationData: payload.locationData,
          fileMeta: payload.fileMeta,
        },
        roomId
      );

      setConversations((prev) =>
        prev.map((c) =>
          c.roomId === roomId
            ? { ...c, lastMessage: defaultText, lastTime: "Just now" }
            : c
        )
      );
    } catch (err: any) {
      console.warn("Error persisting rich message:", err.message);
    }
  };

  // Send message in current active room
  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || !activeConversation) return;

    setInputText("");
    await handleSendRichMessage({
      msgType: "text",
      text: textToSend,
    });
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

                      {/* 1. Photo Message */}
                      {item.msgType === "photo" && item.mediaUrl ? (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => setZoomPhotoUrl(item.mediaUrl!)}
                          style={styles.bubbleMediaContainer}
                        >
                          <Image
                            source={{ uri: item.mediaUrl }}
                            style={styles.bubblePhoto}
                            resizeMode="cover"
                          />
                          {item.text && item.text !== "📷 Shared a photo" ? (
                            <Text style={[styles.bubbleCaption, isMe && styles.bubbleCaptionMe]}>
                              {item.text}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      ) : item.msgType === "location" ? (
                        /* 2. Location Message */
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            const lat = item.locationData?.latitude || 37.7749;
                            const lon = item.locationData?.longitude || -122.4194;
                            Linking.openURL(`https://maps.google.com/?q=${lat},${lon}`).catch(() => {
                              Alert.alert("Waypoint Location", item.locationData?.address || "Pinned waypoint");
                            });
                          }}
                          style={[styles.locationCard, isMe && styles.locationCardMe]}
                        >
                          <View style={styles.locationHeaderRow}>
                            <MapPinIcon size={15} color={isMe ? "#ffffff" : "#09090b"} />
                            <Text style={[styles.locationBadge, isMe && styles.locationBadgeMe]}>
                              LIVE WAYPOINT PIN
                            </Text>
                          </View>
                          <Text style={[styles.locationAddress, isMe && styles.locationAddressMe]}>
                            {item.locationData?.address || item.text}
                          </Text>
                          {item.locationData?.latitude && item.locationData?.longitude ? (
                            <Text style={[styles.locationCoords, isMe && styles.locationCoordsMe]}>
                              {item.locationData.latitude.toFixed(4)}° N, {item.locationData.longitude.toFixed(4)}° W
                            </Text>
                          ) : null}
                          <View style={[styles.locationActionPill, isMe && styles.locationActionPillMe]}>
                            <Text style={[styles.locationActionText, isMe && styles.locationActionTextMe]}>
                              Open in Maps ↗
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : item.msgType === "voice" ? (
                        /* 3. Voice Memo Message */
                        <View style={[styles.voiceCard, isMe && styles.voiceCardMe]}>
                          <TouchableOpacity
                            style={[styles.playButton, isMe && styles.playButtonMe]}
                            onPress={() => togglePlayVoice(item.id)}
                            activeOpacity={0.8}
                          >
                            {playingVoiceId === item.id ? (
                              <PauseIcon size={13} color={isMe ? "#09090b" : "#ffffff"} />
                            ) : (
                              <PlayIcon size={13} color={isMe ? "#09090b" : "#ffffff"} />
                            )}
                          </TouchableOpacity>
                          <View style={styles.waveformContainer}>
                            <View style={styles.waveformBars}>
                              {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50, 85].map((h, idx) => (
                                <View
                                  key={idx}
                                  style={[
                                    styles.waveBar,
                                    { height: (h / 100) * 20 },
                                    isMe && styles.waveBarMe,
                                    playingVoiceId === item.id && styles.waveBarActive,
                                  ]}
                                />
                              ))}
                            </View>
                            <View style={styles.voiceMetaRow}>
                              <Text style={[styles.voiceDuration, isMe && styles.voiceDurationMe]}>
                                {item.fileMeta?.duration || "0:14"}
                              </Text>
                              <Text style={[styles.voiceLabel, isMe && styles.voiceLabelMe]}>
                                {playingVoiceId === item.id ? "Playing Voice Memo..." : "Voice Memo"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ) : item.msgType === "pdf" ? (
                        /* 4. PDF Document Message */
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            Alert.alert(
                              "PDF Document",
                              `Viewing: ${item.fileMeta?.fileName || "Document.pdf"}\nSize: ${item.fileMeta?.fileSize || "180 KB"}\nVerified by Drivemate.`
                            );
                          }}
                          style={[styles.pdfCard, isMe && styles.pdfCardMe]}
                        >
                          <View style={styles.pdfIconBadge}>
                            <FileTextIcon size={18} color="#ef4444" />
                          </View>
                          <View style={styles.pdfInfo}>
                            <Text style={[styles.pdfName, isMe && styles.pdfNameMe]} numberOfLines={1}>
                              {item.fileMeta?.fileName || "Document.pdf"}
                            </Text>
                            <Text style={[styles.pdfMeta, isMe && styles.pdfMetaMe]}>
                              {item.fileMeta?.fileSize || "180 KB"} • PDF Document
                            </Text>
                          </View>
                          <View style={[styles.pdfActionPill, isMe && styles.pdfActionPillMe]}>
                            <Text style={[styles.pdfActionText, isMe && styles.pdfActionTextMe]}>
                              View ↗
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        /* Standard Text Message */
                        <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
                          {item.text}
                        </Text>
                      )}

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

        {/* Attachment Options Drawer */}
        {isAttachmentMenuOpen && (
          <View style={styles.attachmentBar}>
            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => {
                setIsAttachmentMenuOpen(false);
                setIsPhotoModalOpen(true);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.attachmentIconCircle}>
                <CameraIcon size={18} color="#09090b" />
              </View>
              <Text style={styles.attachmentOptionText}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => {
                setIsAttachmentMenuOpen(false);
                setIsLocationModalOpen(true);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.attachmentIconCircle}>
                <MapPinIcon size={18} color="#09090b" />
              </View>
              <Text style={styles.attachmentOptionText}>Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => {
                setIsAttachmentMenuOpen(false);
                setIsVoiceModalOpen(true);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.attachmentIconCircle}>
                <MicIcon size={18} color="#09090b" />
              </View>
              <Text style={styles.attachmentOptionText}>Voice Memo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => {
                setIsAttachmentMenuOpen(false);
                setIsPdfModalOpen(true);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.attachmentIconCircle}>
                <FileTextIcon size={18} color="#09090b" />
              </View>
              <Text style={styles.attachmentOptionText}>PDF Doc</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.attachButton, isAttachmentMenuOpen && styles.attachButtonActive]}
            onPress={() => setIsAttachmentMenuOpen((prev) => !prev)}
            activeOpacity={0.75}
          >
            <PaperclipIcon size={18} color={isAttachmentMenuOpen ? "#09090b" : "#71717a"} />
          </TouchableOpacity>

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

        {/* Photo Selection Modal */}
        <Modal
          visible={isPhotoModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsPhotoModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardContainer}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalCardTitle}>Share Photo</Text>
                <TouchableOpacity
                  onPress={() => setIsPhotoModalOpen(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <CloseIcon size={18} color="#09090b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Select Cloudinary Road Photo or provide image URL:
              </Text>

              {/* Photo Presets Grid */}
              <View style={styles.photoGrid}>
                {[
                  {
                    title: "Rocklin Supercharger",
                    url: "https://res.cloudinary.com/djl2x1rhf/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800",
                  },
                  {
                    title: "Donner Snow Highway",
                    url: "https://res.cloudinary.com/djl2x1rhf/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=800",
                  },
                  {
                    title: "Rivian Mountain Run",
                    url: "https://res.cloudinary.com/djl2x1rhf/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
                  },
                  {
                    title: "Pacific Coast Highway",
                    url: "https://res.cloudinary.com/djl2x1rhf/image/fetch/f_auto,q_auto,w_800/https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800",
                  },
                ].map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.photoCardChoice}
                    onPress={() => {
                      handleSendRichMessage({
                        msgType: "photo",
                        mediaUrl: item.url,
                        text: photoCaption.trim() || `📷 ${item.title}`,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.url }} style={styles.photoCardThumbnail} />
                    <Text style={styles.photoCardChoiceText} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Optional photo caption..."
                placeholderTextColor="#a1a1aa"
                value={photoCaption}
                onChangeText={setPhotoCaption}
              />
            </View>
          </View>
        </Modal>

        {/* Location Waypoint Modal */}
        <Modal
          visible={isLocationModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsLocationModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardContainer}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalCardTitle}>Share Location Pin</Text>
                <TouchableOpacity
                  onPress={() => setIsLocationModalOpen(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <CloseIcon size={18} color="#09090b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Select verified Carpool meeting waypoint:
              </Text>

              <View style={styles.locationPresetsList}>
                {[
                  {
                    address: "SF Bay Bridge Carpool Point",
                    region: "San Francisco, CA",
                    latitude: 37.7955,
                    longitude: -122.3937,
                  },
                  {
                    address: "Seattle Pioneer Square Hub",
                    region: "Seattle, WA",
                    latitude: 47.6022,
                    longitude: -122.3338,
                  },
                  {
                    address: "Austin Tech Ridge Park & Ride",
                    region: "Austin, TX",
                    latitude: 30.3957,
                    longitude: -97.6834,
                  },
                  {
                    address: "Tahoe Donner Summit Rest Area",
                    region: "Truckee, CA",
                    latitude: 39.3153,
                    longitude: -120.3297,
                  },
                ].map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.locationPresetItem}
                    onPress={() => {
                      handleSendRichMessage({
                        msgType: "location",
                        locationData: {
                          address: `${item.address}, ${item.region}`,
                          latitude: item.latitude,
                          longitude: item.longitude,
                        },
                        text: `📍 Waypoint: ${item.address}`,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.locationItemIconCircle}>
                      <MapPinIcon size={16} color="#09090b" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locationPresetTitle}>{item.address}</Text>
                      <Text style={styles.locationPresetSub}>{item.region}</Text>
                    </View>
                    <Text style={styles.locationSendArrow}>Send ↗</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Voice Note Modal */}
        <Modal
          visible={isVoiceModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsVoiceModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardContainer}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalCardTitle}>Voice Memo Dispatch</Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsVoiceModalOpen(false);
                    setIsRecording(false);
                  }}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <CloseIcon size={18} color="#09090b" />
                </TouchableOpacity>
              </View>

              {/* Record Mic Area */}
              <View style={styles.voiceRecorderArea}>
                <TouchableOpacity
                  style={[styles.bigMicButton, isRecording && styles.bigMicButtonRecording]}
                  onPress={() => setIsRecording((prev) => !prev)}
                  activeOpacity={0.85}
                >
                  <MicIcon size={28} color="#ffffff" />
                </TouchableOpacity>

                <Text style={styles.recordingTimerText}>
                  {isRecording
                    ? `Recording: 0:${recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}`
                    : "Tap microphone to record road dispatch"}
                </Text>

                {isRecording && (
                  <TouchableOpacity
                    style={styles.voiceDispatchSendBtn}
                    onPress={() => {
                      const duration = `0:${recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}`;
                      handleSendRichMessage({
                        msgType: "voice",
                        fileMeta: {
                          duration,
                          fileName: "Live_Road_Dispatch.m4a",
                          fileSize: "96 KB",
                        },
                        text: `🎙️ Voice Memo (${duration})`,
                      });
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.voiceDispatchSendBtnText}>Stop & Send Voice Memo</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.modalSubtitle}>Or choose quick voice alert:</Text>
              <View style={styles.quickVoiceList}>
                {[
                  { title: "Donner Pass Snow & Chain Alert", duration: "0:14" },
                  { title: "Carpool Pickup: Arriving in 5 Mins", duration: "0:09" },
                  { title: "Highway Traffic Moving Smoothly", duration: "0:18" },
                ].map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickVoiceItem}
                    onPress={() => {
                      handleSendRichMessage({
                        msgType: "voice",
                        fileMeta: {
                          duration: item.duration,
                          fileName: `${item.title.replace(/\s+/g, "_")}.m4a`,
                          fileSize: "112 KB",
                        },
                        text: `🎙️ ${item.title}`,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <PlayIcon size={14} color="#09090b" />
                    <Text style={styles.quickVoiceItemText} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.quickVoiceItemDuration}>{item.duration}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* PDF Document Modal */}
        <Modal
          visible={isPdfModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsPdfModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardContainer}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalCardTitle}>Attach PDF Document</Text>
                <TouchableOpacity
                  onPress={() => setIsPdfModalOpen(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <CloseIcon size={18} color="#09090b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Select verified vehicle document or route manifest:
              </Text>

              <View style={styles.pdfList}>
                {[
                  {
                    name: "Tahoe_Carpool_Route_Manifest.pdf",
                    size: "245 KB",
                    desc: "Certified Route & Stop Schedule",
                  },
                  {
                    name: "Vehicle_Safety_Inspection_Certificate.pdf",
                    size: "180 KB",
                    desc: "Annual 50-Point Road Inspection",
                  },
                  {
                    name: "EV_Supercharging_Tax_Invoice.pdf",
                    size: "95 KB",
                    desc: "Official Tesla Charging Receipt",
                  },
                  {
                    name: "Rideshare_Commercial_Insurance_Proof.pdf",
                    size: "310 KB",
                    desc: "Active Commercial Coverage Policy",
                  },
                ].map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.pdfListItem}
                    onPress={() => {
                      handleSendRichMessage({
                        msgType: "pdf",
                        fileMeta: {
                          fileName: item.name,
                          fileSize: item.size,
                          mimeType: "application/pdf",
                        },
                        text: `📄 ${item.name}`,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.pdfItemIconCircle}>
                      <FileTextIcon size={18} color="#ef4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pdfItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.pdfItemDesc}>
                        {item.size} • {item.desc}
                      </Text>
                    </View>
                    <Text style={styles.pdfSendArrow}>Attach ↗</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Full Image Preview Zoom Modal */}
        <Modal
          visible={Boolean(zoomPhotoUrl)}
          transparent
          animationType="fade"
          onRequestClose={() => setZoomPhotoUrl(null)}
        >
          <View style={styles.zoomModalOverlay}>
            <TouchableOpacity
              style={styles.zoomCloseBtn}
              onPress={() => setZoomPhotoUrl(null)}
              activeOpacity={0.8}
            >
              <CloseIcon size={20} color="#ffffff" />
            </TouchableOpacity>
            {zoomPhotoUrl && (
              <Image
                source={{ uri: zoomPhotoUrl }}
                style={styles.zoomFullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>
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
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  attachButtonActive: {
    backgroundColor: "#e4e4e7",
    borderColor: "#09090b",
  },
  attachmentBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  attachmentOption: {
    alignItems: "center",
    gap: 4,
  },
  attachmentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fafafa",
    borderWidth: 1.2,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentOptionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#52525b",
  },
  bubbleMediaContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 4,
    maxWidth: 240,
  },
  bubblePhoto: {
    width: 240,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#e4e4e7",
  },
  bubbleCaption: {
    fontSize: 13,
    color: "#18181b",
    marginTop: 6,
    lineHeight: 18,
  },
  bubbleCaptionMe: {
    color: "#ffffff",
  },
  locationCard: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    minWidth: 200,
    maxWidth: 250,
    marginVertical: 4,
  },
  locationCardMe: {
    backgroundColor: "#18181b",
    borderColor: "#27272a",
  },
  locationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  locationBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: 0.8,
  },
  locationBadgeMe: {
    color: "#e4e4e7",
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 4,
  },
  locationAddressMe: {
    color: "#ffffff",
  },
  locationCoords: {
    fontSize: 11,
    color: "#71717a",
    marginBottom: 8,
  },
  locationCoordsMe: {
    color: "#a1a1aa",
  },
  locationActionPill: {
    backgroundColor: "#09090b",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  locationActionPillMe: {
    backgroundColor: "#ffffff",
  },
  locationActionText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  locationActionTextMe: {
    color: "#09090b",
  },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
    minWidth: 180,
  },
  voiceCardMe: {
    //
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonMe: {
    backgroundColor: "#ffffff",
  },
  waveformContainer: {
    flex: 1,
  },
  waveformBars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 22,
    marginBottom: 4,
  },
  waveBar: {
    width: 3,
    backgroundColor: "#a1a1aa",
    borderRadius: 2,
  },
  waveBarMe: {
    backgroundColor: "#71717a",
  },
  waveBarActive: {
    backgroundColor: "#10b981",
  },
  voiceMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  voiceDuration: {
    fontSize: 10,
    fontWeight: "700",
    color: "#52525b",
  },
  voiceDurationMe: {
    color: "#e4e4e7",
  },
  voiceLabel: {
    fontSize: 10,
    color: "#a1a1aa",
  },
  voiceLabelMe: {
    color: "#a1a1aa",
  },
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    gap: 10,
    minWidth: 210,
    maxWidth: 260,
    marginVertical: 4,
  },
  pdfCardMe: {
    backgroundColor: "#18181b",
    borderColor: "#27272a",
  },
  pdfIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfInfo: {
    flex: 1,
  },
  pdfName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 2,
  },
  pdfNameMe: {
    color: "#ffffff",
  },
  pdfMeta: {
    fontSize: 10,
    color: "#71717a",
  },
  pdfMetaMe: {
    color: "#a1a1aa",
  },
  pdfActionPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  pdfActionPillMe: {
    backgroundColor: "#27272a",
  },
  pdfActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#09090b",
  },
  pdfActionTextMe: {
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalCardContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: "80%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#09090b",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#71717a",
    marginBottom: 14,
  },
  modalInput: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#09090b",
    backgroundColor: "#fafafa",
    marginTop: 12,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  photoCardChoice: {
    width: "48%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fafafa",
    paddingBottom: 6,
  },
  photoCardThumbnail: {
    width: "100%",
    height: 85,
    backgroundColor: "#e4e4e7",
  },
  photoCardChoiceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#09090b",
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  locationPresetsList: {
    gap: 8,
  },
  locationPresetItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fafafa",
    gap: 10,
  },
  locationItemIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
  },
  locationPresetTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  locationPresetSub: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 1,
  },
  locationSendArrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#09090b",
  },
  voiceRecorderArea: {
    alignItems: "center",
    paddingVertical: 18,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 16,
  },
  bigMicButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  bigMicButtonRecording: {
    backgroundColor: "#ef4444",
  },
  recordingTimerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#09090b",
  },
  voiceDispatchSendBtn: {
    marginTop: 12,
    backgroundColor: "#09090b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  voiceDispatchSendBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  quickVoiceList: {
    gap: 8,
  },
  quickVoiceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fafafa",
    gap: 10,
  },
  quickVoiceItemText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#09090b",
  },
  quickVoiceItemDuration: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717a",
  },
  pdfList: {
    gap: 8,
  },
  pdfListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fafafa",
    gap: 10,
  },
  pdfItemIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfItemName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
  },
  pdfItemDesc: {
    fontSize: 10,
    color: "#71717a",
    marginTop: 1,
  },
  pdfSendArrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#09090b",
  },
  zoomModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  zoomCloseBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  zoomFullImage: {
    width: "92%",
    height: "75%",
  },
});
