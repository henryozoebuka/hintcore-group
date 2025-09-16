import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    TextInput,
    Pressable,
    Keyboard,
} from "react-native";
import moment from "moment";
import { useSelector } from "react-redux";
import privateAxios from "../../utils/axios/privateAxios";
import styles from "../../styles/styles";
import Notification from "../../components/Notification/Notification";
import Footer from "../../components/Footer/Footer";
import { Ionicons } from "@expo/vector-icons";

const Announcement = ({ route }) => {
    const { colors } = useSelector((state) => state.colors);
    const { id } = route.params;

    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({
        visible: false,
        type: "",
        message: "",
    });

    // 🔍 search states
    const [showSearch, setShowSearch] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [matches, setMatches] = useState([]);
    const [positions, setPositions] = useState([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

    const scrollRef = useRef(null);
    const matchRefs = useRef([]);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const response = await privateAxios.get(`/private/announcement/${id}`);
                setAnnouncement(response.data);
            } catch (error) {
                setNotification({
                    visible: true,
                    type: "error",
                    message: "Failed to fetch announcement.",
                });
                setTimeout(() => {
                    setNotification({ visible: false, type: "", message: "" });
                }, 3000);
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncement();
    }, [id]);

    useEffect(() => {
    // Wait for DOM to paint
    setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 1, animated: false });
        scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, 50);
}, [matches]);


    useEffect(() => {

    setPositions([]); // Clear positions

    if (announcement?.body && searchText.trim()) {
        const regex = new RegExp(searchText, "gi");
        const indices = [];
        let match;
        while ((match = regex.exec(announcement.body)) !== null) {
            indices.push(match.index);
        }
        setMatches(indices);
        setCurrentMatchIndex(0);
    } else {
        setMatches([]);
        setCurrentMatchIndex(0);
    }
}, [searchText, announcement]);



    const goToNextMatch = () => {
    if (positions.length === 0) return;

    const nextIndex = (currentMatchIndex + 1) % positions.length;
    const y = positions[nextIndex];

    if (scrollRef.current && y != null) {
        scrollRef.current.scrollTo({ y: Math.max(0, y - 80), animated: true });
        setCurrentMatchIndex(nextIndex);
    }
};

    const handleKeyPress = ({ nativeEvent }) => {
        if (nativeEvent.key === "Enter") {
            goToNextMatch();
            Keyboard.dismiss();
        }
    };

const renderHighlightedText = (text, search) => {
    if (!search.trim()) {
        return (
            <Text style={{ fontSize: 16, color: colors.text, lineHeight: 22 }}>
                {text}
            </Text>
        );
    }

    const regex = new RegExp(`(${search})`, "gi");
    const parts = text.split(regex);
    let matchCounter = -1;

    return (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {parts.map((part, index) => {
                if (regex.test(part)) {
                    matchCounter++;
                    return (
                        <Text
                            key={`match-${index}`}
                            onLayout={(e) => {
    const y = e.nativeEvent.layout.y;
    if (y != null) {
        setPositions((prev) => {
            // Only push if it's not already there (prevent duplicates)
            if (!prev.includes(y)) {
                return [...prev, y];
            }
            return prev;
        });
    }
}}

                            style={{
                                backgroundColor:
                                    currentMatchIndex === matchCounter
                                        ? "orange"
                                        : colors.primary,
                                color: "white",
                                fontSize: 16,
                                lineHeight: 22,
                            }}
                        >
                            {part}
                        </Text>
                    );
                }

                return (
                    <Text
                        key={`text-${index}`}
                        style={{ color: colors.text, fontSize: 16, lineHeight: 22 }}
                    >
                        {part}
                    </Text>
                );
            })}
        </View>
    );
};

    return (
        <View style={{ flex: 1 }}>
            {loading ? (
                <View
                    style={[
                        styles.SETTINGS_STYLES.container,
                        {
                            backgroundColor: colors.background,
                            justifyContent: "center",
                            alignItems: "center",
                        },
                    ]}
                >
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{color: colors.text}}>Loading Announcement...</Text>
                </View>
            ) : announcement ? (
                <View
                    style={[
                        styles.SETTINGS_STYLES.container,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <Notification
                        visible={notification.visible}
                        type={notification.type}
                        message={notification.message}
                    />

                    {/* Header Row with Search Toggle */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text
                            style={[
                                styles.SETTINGS_STYLES.header,
                                { color: colors.text, flex: 1 },
                            ]}
                        >
                            {announcement.title}
                        </Text>

                        <Pressable onPress={() => setShowSearch(!showSearch)}>
                            <Ionicons
                                name={showSearch ? "close" : "search"}
                                size={24}
                                color={colors.text}
                            />
                        </Pressable>
                    </View>

                    {/* Search Input */}
                    {showSearch && (
                        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
                            <TextInput
                                placeholder="Search in announcement..."
                                placeholderTextColor={colors.placeholder}
                                value={searchText}
                                onChangeText={setSearchText}
                                onKeyPress={handleKeyPress}
                                style={{
                                    flex: 1,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    borderRadius: 8,
                                    padding: 8,
                                    marginRight: 10,
                                    color: colors.text,
                                }}
                            />
                            <Pressable
                                onPress={goToNextMatch}
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    backgroundColor: colors.primary,
                                }}
                            >
                                <Ionicons name="arrow-down" size={20} color="white" />
                            </Pressable>
                        </View>
                    )}

                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            columnGap: 5,
                            borderBottomColor: colors.placeholder,
                            borderBottomWidth: 0.5,
                        }}
                    >
                        <Text style={{ fontWeight: "bold", color: colors.text }}>
                            Created On:
                        </Text>
                        <Text style={{ color: colors.placeholder, marginBottom: 10 }}>
                            {moment(announcement.createdAt).isValid()
                                ? moment(announcement.createdAt).format("MMMM D, YYYY")
                                : "Invalid Date"}
                        </Text>
                    </View>

                    <ScrollView ref={scrollRef} style={{ marginVertical: 20 }}>
                        {renderHighlightedText(
                            announcement.body || "No content available.",
                            searchText
                        )}
                    </ScrollView>
                </View>
            ) : (
                <View
                    style={[
                        styles.SETTINGS_STYLES.container,
                        {
                            backgroundColor: colors.background,
                            justifyContent: "center",
                            alignItems: "center",
                        },
                    ]}
                >
                    <Text style={{ color: colors.text }}>Announcement not found.</Text>
                </View>
            )}
            <Footer />
        </View>
    );
};

export default Announcement;