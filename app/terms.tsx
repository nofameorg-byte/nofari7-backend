import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Terms of Service</Text>

        <Text style={styles.text}>
          By using the NOFARI application, you agree to the following Terms of
          Service. If you do not agree with these terms, please do not use the
          app.
        </Text>

        <Text style={styles.section}>Purpose of NOFARI</Text>
        <Text style={styles.text}>
          NOFARI is an AI-powered conversational assistant designed to provide
          supportive dialogue and general informational responses. NOFARI is not
          a medical professional, therapist, or emergency service.
        </Text>

        <Text style={styles.section}>User Responsibility</Text>
        <Text style={styles.text}>
          You are responsible for how you use NOFARI and for any information you
          choose to share within the app. You agree not to use the app for
          unlawful, harmful, or abusive purposes.
        </Text>

        <Text style={styles.section}>No Emergency Use</Text>
        <Text style={styles.text}>
          NOFARI is not intended for emergency situations. If you are in danger
          or experiencing a crisis, contact local emergency services
          immediately.
        </Text>

        <Text style={styles.section}>Data and Functionality</Text>
        <Text style={styles.text}>
          Some data may be retained for functionality of the app, consistent
          with applicable State and Federal laws and regulations.
        </Text>

        <Text style={styles.text}>
          The delete button within the app removes local data stored on your
          device only and does not guarantee immediate deletion of any data that
          may be retained for lawful, security, or operational purposes.
        </Text>

        <Text style={styles.section}>Service Availability</Text>
        <Text style={styles.text}>
          NOFARI is provided on an “as is” and “as available” basis. We do not
          guarantee uninterrupted access or error-free operation.
        </Text>

        <Text style={styles.section}>Limitation of Liability</Text>
        <Text style={styles.text}>
          NOFARI and its operators are not liable for any damages, losses, or
          decisions resulting from use of the app.
        </Text>

        <Text style={styles.section}>Changes to These Terms</Text>
        <Text style={styles.text}>
          These Terms of Service may be updated at any time. Continued use of the
          app constitutes acceptance of the updated terms.
        </Text>

        <Text style={styles.section}>Contact</Text>
        <Text style={styles.text}>
          Questions regarding these terms or data deletion requests must be
          submitted by email only:
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
