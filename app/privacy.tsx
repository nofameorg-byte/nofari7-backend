import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Privacy Policy</Text>

        <Text style={styles.text}>
          NOFARI is designed to respect your privacy while providing meaningful
          conversational support.
        </Text>

        <Text style={styles.section}>Information We Collect</Text>
        <Text style={styles.text}>
          NOFARI may collect limited information such as your email address and
          messages you choose to share within the app. This information is used
          only to provide core app functionality, including restoring access and
          improving user experience.
        </Text>

        <Text style={styles.section}>Use of Information</Text>
        <Text style={styles.text}>
          Information collected by NOFARI is used solely to operate and maintain
          the app. Some data may be retained for functionality of the app,
          consistent with applicable State and Federal laws and regulations.
        </Text>

        <Text style={styles.section}>Data Storage and Retention</Text>
        <Text style={styles.text}>
          NOFARI stores certain data locally on your device to support core
          functionality, including conversation continuity.
        </Text>

        <Text style={styles.text}>
          The delete account option within the app removes locally stored data
          from your device only. Data can be deleted upon request by email only.
        </Text>

        <Text style={styles.section}>Children&apos;s Privacy</Text>
        <Text style={styles.text}>
          NOFARI does not knowingly collect personal information from children
          under the age of 13. If such information is discovered, it will be
          deleted promptly or retained only with verified parental or guardian
          permission, in accordance with applicable laws.
        </Text>

        <Text style={styles.section}>Changes to This Policy</Text>
        <Text style={styles.text}>
          This Privacy Policy may be updated from time to time. Continued use of
          the app constitutes acceptance of any updates.
        </Text>

        <Text style={styles.section}>Contact</Text>
        <Text style={styles.text}>
          For privacy-related requests, including data deletion requests, please
          contact:
        </Text>

        <Text style={styles.email}>contact@nofameai.com</Text>

        <Text style={styles.footer}>
          Last Updated: December 1, 2025
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#020925",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 16,
  },
  section: {
    color: "#d6b24a",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  text: {
    color: "#e6e6e6",
    fontSize: 15,
    lineHeight: 22,
  },
  email: {
    color: "#00ffc6",
    fontSize: 16,
    marginTop: 6,
    fontWeight: "600",
  },
  footer: {
    marginTop: 30,
    color: "#8a8a8a",
    fontSize: 13,
  },
});
