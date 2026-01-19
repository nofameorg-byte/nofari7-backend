import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";

import {
  scheduleDailyCheckIn,
  cancelDailyCheckIn,
} from "../services/checkinNotifications";

type Message = {
  id: string;
  role: "user" | "nofari";
  text: string;
};

const STORAGE_KEY = "nofari_messages";
const BACKEND_URL = `${process.env.EXPO_PUBLIC_API_URL}/nofari`;

export default function NofariScreen() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const glowAnim = useRef(new Animated.Value(1)).current;
  const listenAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  /* 🔒 Keep screen awake ONLY on chat screen */
  useEffect(() => {
    activateKeepAwake();
    return () => {
      deactivateKeepAwake();
    };
  }, []);

  /* 🔊 Audio mode */
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });
  }, []);

  /* 🔁 Restore messages */
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setMessages(JSON.parse(saved));
    });
  }, []);

  /* 💾 Persist messages */
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  /* 🌟 Face glow */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  /* 🎧 Listening bar animation */
  useEffect(() => {
    if (isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(listenAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(listenAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      listenAnim.stopAnimation();
      listenAnim.setValue(0);
    }
  }, [isSpeaking]);

  /* 🔊 Play MP3 */
  async function playAudioFromUrl(url: string) {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true }
    );

    soundRef.current = sound;
    setIsSpeaking(true);

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        setIsSpeaking(false);
        sound.unloadAsync();
        soundRef.current = null;
      }
    });

    await sound.playAsync();
  }

  /* 📤 Send message */
  const sendMessage = async () => {
    if (!input.trim() || isSpeaking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
    };

    setMessages((prev) => [userMessage, ...prev]);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMessage.text }),
      });

      const data = await res.json();

      // 🔔 DAILY CHECK-IN HANDLING (SAFE + OPTIONAL)
      if (data.checkInEnabled === true) {
        await scheduleDailyCheckIn();
      }

      if (data.checkInEnabled === false) {
        await cancelDailyCheckIn();
      }

      setMessages((prev) => [
        {
          id: `${Date.now()}-n`,
          role: "nofari",
          text: data.reply,
        },
        ...prev,
      ]);

      if (data.audioUrl) {
        await playAudioFromUrl(
          `https://nofari7-backend.onrender.com${data.audioUrl}`
        );
      }
    } catch (err) {
      console.error("NOFARI frontend error:", err);
    } finally {
      setThinking(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.nofariBubble,
          isUser ? styles.right : styles.left,
        ]}
      >
        <Text style={styles.bubbleText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Animated.View
          style={[styles.glow, { transform: [{ scale: glowAnim }] }]}
        />
        <Image
          source={require("../assets/images/nofari2-logo.png")}
          style={styles.logo}
        />
      </View>

      {isSpeaking && (
        <Animated.View
          style={[
            styles.listeningBar,
            {
              opacity: listenAnim,
              transform: [
                {
                  scaleX: listenAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
      )}

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chatContent}
        />

        {thinking && <Text style={styles.thinking}>•••</Text>}

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Talk to NOFARI..."
            placeholderTextColor="#6fdcc8"
            style={styles.input}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, isSpeaking && { opacity: 0.5 }]}
            onPress={sendMessage}
            disabled={isSpeaking}
          >
            <Text style={styles.sendText}>
              {isSpeaking ? "LISTENING…" : "CHAT"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <SafeAreaView edges={["bottom"]} style={styles.bottomSafe}>
        <View style={styles.bottomBar}>
          <Text style={styles.bottomText}>NOFARI</Text>
          <TouchableOpacity onPress={() => router.push("/settings")}>
            <Ionicons name="settings-outline" size={34} color="#00ffc6" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020925" },
  header: { alignItems: "center", paddingVertical: 12 },
  glow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#00ffc6",
    opacity: 0.22,
  },
  logo: { width: 90, height: 90 },
  listeningBar: {
    height: 6,
    backgroundColor: "#00ffc6",
    marginHorizontal: 40,
    borderRadius: 6,
    marginBottom: 6,
  },
  keyboardArea: { flex: 1 },
  chatContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  bubble: {
    maxWidth: "75%",
    padding: 14,
    borderRadius: 18,
    marginVertical: 6,
  },
  userBubble: { backgroundColor: "#00ffc6" },
  nofariBubble: { backgroundColor: "#102a38" },
  bubbleText: { color: "#ffffff", fontSize: 16, lineHeight: 22 },
  right: { alignSelf: "flex-end" },
  left: { alignSelf: "flex-start" },
  thinking: { color: "#6fdcc8", fontSize: 28, paddingLeft: 20 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#0c2a3a",
  },
  input: {
    flex: 1,
    backgroundColor: "#071d2b",
    borderRadius: 20,
    padding: 10,
    color: "#fff",
  },
  sendBtn: {
    backgroundColor: "#00ffc6",
    borderRadius: 22,
    paddingHorizontal: 18,
    justifyContent: "center",
    marginLeft: 8,
    height: 44,
  },
  sendText: { color: "#021e19", fontWeight: "bold" },
  bottomSafe: { backgroundColor: "#020925" },
  bottomBar: {
    height: 58,
    borderTopWidth: 0.6,
    borderTopColor: "#0c2a3a",
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomText: { color: "#ffffff", fontWeight: "600", fontSize: 16 },
});
