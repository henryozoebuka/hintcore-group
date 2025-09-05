import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSelector } from "react-redux";
import privateAxios from "../../utils/axios/privateAxios";
import stylesConfig from "../../styles/styles";
import Notification from "../../components/Notification/Notification";
import Footer from "../../components/Footer/Footer";

const CreateMinutes = ({ navigation }) => {
  const { INPUT } = stylesConfig;
  const { colors } = useSelector((state) => state.colors);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: "",
    message: "",
  });

  const handleSubmit = async () => {
    if (!title || !body) {
      setNotification({
        visible: true,
        type: "error",
        message: "Title and body are required.",
      });
      setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
      return;
    }

    try {
      setLoading(true);
      const response = await privateAxios.post(`/private/create-minutes`, {
        title,
        body,
        published,
      });

      if (response.status === 201) {
        setTitle("");
        setBody("");
        setPublished(false);

        setNotification({
          visible: true,
          type: "success",
          message: response.data.message || "Minutes created successfully.",
        });
        setTimeout(() => {
          setNotification({ visible: false, type: "", message: "" });
          navigation.navigate("manage-minutes-records");
        }, 3000);
      } else {
        throw new Error("Unexpected response");
      }
    } catch (error) {
      setNotification({
        visible: true,
        type: "error",
        message:
          error.response?.data?.message || "Failed to create minutes.",
      });
      setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
      console.error("Error creating minutes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, padding: 20 }}>
        <Notification
          visible={notification.visible}
          type={notification.type}
          message={notification.message}
        />

        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 20,
            color: colors.text,
          }}
        >
          Create Minutes
        </Text>

        {/* Title */}
        <TextInput
          style={[
            INPUT,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 20,
            },
          ]}
          placeholder="Title"
          placeholderTextColor={colors.placeholder}
          value={title}
          onChangeText={setTitle}
        />

        {/* Body expands */}
        <TextInput
          style={[
            INPUT,
            {
              flex: 1,
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
              textAlignVertical: "top",
              paddingVertical: 10,
            },
          ]}
          placeholder="Body"
          placeholderTextColor={colors.placeholder}
          value={body}
          onChangeText={setBody}
          multiline
        />

        {/* Publish toggle */}
        <Pressable
          onPress={() => setPublished(!published)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 16,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderWidth: 1,
              borderColor: colors.text,
              marginRight: 8,
              backgroundColor: published ? colors.primary : "transparent",
            }}
          />
          <Text style={{ color: colors.text, fontSize: 16 }}>Publish Now</Text>
        </Pressable>

        {/* Create button */}
        <Pressable
          onPress={handleSubmit}
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: 10,
            alignItems: "center",
            marginBottom: 10,
            flexDirection: "row",
            justifyContent: "center",
          }}
          disabled={loading}
        >
          {loading && (
            <ActivityIndicator
              color={colors.mainButtonText}
              size="small"
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={{
              color: colors.mainButtonText,
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            {loading ? "Creating..." : "Create"}
          </Text>
        </Pressable>

        {/* Cancel button */}
        <Pressable
          onPress={handleCancel}
          style={{
            backgroundColor: colors.border,
            padding: 16,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
            Cancel
          </Text>
        </Pressable>
      </View>

      <Footer />
    </KeyboardAvoidingView>
  );
};

export default CreateMinutes;