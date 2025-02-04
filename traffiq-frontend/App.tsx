import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import axios from "axios";

interface UserPreference {
  user_id: string;
  preferred_transport: string;
}

export default function App() {
  const [data, setData] = useState<UserPreference[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<UserPreference[]>("http://10.20.30.29:8000/api/preferences/")
      .then((response) => {
        console.log("API Response:", response.data);
        setData(response.data);
        setError(null); // Clear any previous errors
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
      })
      .finally(() => {
        setLoading(false); // Stop loading regardless of success or failure
      });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>TraffiQ App</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : data && data.length > 0 ? (
        data.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.text}>
              {`User: ${item.user_id}, Prefers: ${item.preferred_transport}`}
            </Text>
          </View>
        ))
      ) : (
        <Text>No data available.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  item: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    width: "100%",
  },
  text: {
    fontSize: 18,
  },
  error: {
    color: "red",
    fontSize: 18,
  },
});