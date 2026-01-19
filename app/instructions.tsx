import React from "react";
import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InstructionsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Instructions</Text>

        <Text style={styles.sectionTitle}>Using NOFARI</Text>
        <Text style={styles.text}>
          NOFARI is here to support you through conversation, voice, and guidance.
          You can type or speak naturally—just say what&apos;s on your mind.
        </Text>

        <Text style={styles.sectionTitle}>Language</Text>
        <Text style={styles.text}>
          If you want NOFARI to speak your language just tell her in the CHAT.
        </Text>

        <Text style={styles.sectionTitle}>Voice Features</Text>
        <Text style={styles.text}>
          NOFARI supports text-to-speech and speech-to-text.
        </Text>

        <Text style={styles.text}>
          If you do not see the microphone on your iPhone keyboard:
          {"\n\n"}
          1. Open iPhone Settings{"\n"}
          2. Go to General → Keyboard{"\n"}
          3. Turn on Enable Dictation
          {"\n\n"}
          Return to the app and try again.
        </Text>

        <Text style={styles.sectionTitle}>Log Out vs Delete</Text>
        <Text style={styles.text}>
          Logging out keeps your messages on this device.
          {"\n\n"}
          Deleting removes all NOFARI data stored on this device.
        </Text>

        <View style={styles.footer}>
          <Text
            style={styles.link}
            onPress={() => Linking.openURL("https://www.nofame.org")}
          >
            www.nofame.org
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020925" },
  container: { padding: 20, paddingBottom: 60 },
  title: {
    color: "#d6b24a",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#d6b24a",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 10,
  },
  text: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  link: {
    color: "#d6b24a",
    fontSize: 16,
    fontWeight: "600",
  },
});
