import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function BottomBar() {
  return (
    <View style={styles.bar}>
      <Text style={styles.left}>NOFARI</Text>
      <TouchableOpacity>
        <Text style={styles.right}>⚙︎</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#0a1a3a",
    backgroundColor: "#020925",
  },
  left: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  right: {
    color: "#ffffff",
    fontSize: 18,
  },
});
