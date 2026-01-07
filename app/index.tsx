import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IndexScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔒 Restore session on load (BLOCKED after logout/delete)
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const blockRestore = await AsyncStorage.getItem(
          "nofari_block_restore"
        );

        // 🚫 If user intentionally came here, do NOT auto-restore
        if (blockRestore === "true") {
          await AsyncStorage.removeItem("nofari_block_restore");
          return;
        }

        const saved = await supabase.from("users").select("email").limit(1);

        if (saved.data && saved.data.length > 0) {
          router.replace("/nofari");
        }
      } catch (err) {
        console.error("Restore failed:", err);
      }
    };

    restoreUser();
  }, []);

  const handleTapIn = async () => {
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("users")
      .upsert({ email }, { onConflict: "email" });

    setLoading(false);

    if (error) {
      setError("Unable to continue. Try again.");
      return;
    }

    router.replace("/nofari");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Image
            source={require("../assets/images/app-icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>NOFARI</Text>

          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="#9aa4c7"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleTapIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#020925" />
            ) : (
              <Text style={styles.buttonText}>TAP IN</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020925" },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  logo: { width: 140, height: 140, marginBottom: 16 },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 40,
  },
  input: {
    width: "100%",
    backgroundColor: "#04122b",
    color: "#ffffff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  button: {
    width: "100%",
    backgroundColor: "#00ffc6",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontWeight: "800",
    color: "#020925",
    fontSize: 16,
  },
  error: { color: "#ff6b6b", marginBottom: 10 },
});
