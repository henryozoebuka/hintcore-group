// pages/CreateAnnouncement/CreateAnnouncement.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";
import privateAxios from "../../utils/axios/privateAxios";
import stylesConfig from "../../styles/styles";

const CreateAnnouncement = ({ navigation }) => {
  const { LIGHTCOLORS, DARKCOLORS, INPUT } = stylesConfig;
  const isDarkMode = useSelector((state) => state.colors.isDarkMode);
  const colors = isDarkMode ? DARKCOLORS : LIGHTCOLORS;

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [published, setPublished] = useState(false);

  const handleSubmit = async () => {
    if (!title || !body) {
      return Alert.alert("Validation Error", "Title and body are required.");
    }

    try {
      const payload = {
        title,
        body,
        category,
        tags: tags.split(",").map((tag) => tag.trim()),
        thumbnail,
        published,
      };

      await privateAxios.post("/announcements", payload);
      Alert.alert("Success", "Announcement created successfully.");
      navigation.goBack();
    } catch (error) {
      console.error("Error creating announcement:", error);
      Alert.alert("Error", "Failed to create announcement. Try again.");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          marginBottom: 20,
          color: colors.text,
        }}
      >
        Create Announcement
      </Text>

      <TextInput
        style={[INPUT, { backgroundColor: colors.inputBackground, color: colors.text, borderWidth: 1, borderColor: colors.border }]}
        placeholder="Title"
        placeholderTextColor={colors.placeholder}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[
          INPUT,
          {
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
            height: 120,
            textAlignVertical: "top",
          },
        ]}
        placeholder="Body"
        placeholderTextColor={colors.placeholder}
        value={body}
        onChangeText={setBody}
        multiline
      />

      <TextInput
        style={[INPUT, { backgroundColor: colors.inputBackground, color: colors.text, borderWidth: 1, borderColor: colors.border }]}
        placeholder="Category (e.g., News, Event)"
        placeholderTextColor={colors.placeholder}
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        style={[INPUT, { backgroundColor: colors.inputBackground, color: colors.text, borderWidth: 1, borderColor: colors.border }]}
        placeholder="Tags (comma separated)"
        placeholderTextColor={colors.placeholder}
        value={tags}
        onChangeText={setTags}
      />

      <TextInput
        style={[INPUT, { backgroundColor: colors.inputBackground, color: colors.text, borderWidth: 1, borderColor: colors.border }]}
        placeholder="Thumbnail URL (optional)"
        placeholderTextColor={colors.placeholder}
        value={thumbnail}
        onChangeText={setThumbnail}
      />

      <TouchableOpacity
        onPress={() => setPublished(!published)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
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
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: colors.primary,
          padding: 16,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.mainButtonText, fontSize: 16, fontWeight: "bold" }}>
          Create
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreateAnnouncement;
