import { ORANGE } from "@/constants/theme";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";


export default function Welcome({}) {
    return (
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.appTitle}>Welcome{"\n"}to{"\n"}BrainHop</Text>
        <Pressable style={styles.loginButton} onPress={() => router.push("/login")}>
            <Text style={styles.loginText}>Log in</Text>
        </Pressable>
        <Pressable style={styles.createAccountButton} onPress={() => router.push("/signup")}>
            <Text style={styles.createAccountText}>Create an account</Text>
        </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },
  appTitle: {
    color: ORANGE,
    fontSize: 44,
    lineHeight: 54,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 180,
  },
  loginButton: {
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: ORANGE,
    boxShadow: "0 6px 16px rgba(201, 76, 0, 0.25)",
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  createAccountButton: {
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "#FFFFFF",
    marginTop: 10,
  },
  createAccountText: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: "700",
  }
});