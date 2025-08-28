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

const ManageEditConstitution = ({ route, navigation }) => {
    const { INPUT } = stylesConfig;
    const { colors } = useSelector((state) => state.colors);

    const { id } = route.params;

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [published, setPublished] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: '', message: '', });

    // Fetch the constitution data to pre-fill the form
    useEffect(() => {
        const fetchConstitution = async () => {
            try {
                setPageLoading(true);
                const response = await privateAxios.get(`/private/manage-constitution/${id}`);

                if (response.status === 200) {
                    const constitution = response.data;
                    setTitle(constitution.title);
                    setBody(constitution.body);
                    setPublished(constitution.published);
                } else {
                    throw new Error('Constitution not found');
                }
            } catch (error) {
                setNotification({
                    visible: true,
                    type: 'error',
                    message: 'Failed to fetch constitution details.',
                });
                setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
                console.error("Error fetching constitution:", error);
            } finally {
                setPageLoading(false);
            }
        };

        fetchConstitution();
    }, [id]);

    const handleSubmit = async () => {
        if (!title || !body) {
            setNotification({
                visible: true,
                type: 'error',
                message: 'Title and body are required.',
            });
            setTimeout(() => {
                setNotification({ visible: false, type: '', message: '' });
            }, 3000);
            return;
        }

        try {
            setLoading(true);
            const response = await privateAxios.patch(`/private/update-constitution/${id}`, { title, body, published });

            if (response.status === 200) {
                setNotification({
                    visible: true,
                    type: 'success',
                    message: 'Constitution updated successfully.',
                });
                setTimeout(() => {
                    setNotification({ visible: false, type: '', message: '' });
                    navigation.navigate('manage-constitutions');
                }, 3000);
            } else {
                throw new Error('Unexpected response');
            }
        } catch (error) {
            setNotification({
                visible: true,
                type: 'error',
                message: error.response?.data?.message || 'Failed to update constitution.',
            });
            setTimeout(() => {
                setNotification({ visible: false, type: '', message: '' });
            }, 3000);
            console.error("Error updating constitution:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    // if (pageLoading) {
    //     return  <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
    // }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {pageLoading ?
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} /> :
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
                        Edit Constitution
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

                    {/* Body expands to fill */}
                    <TextInput
                        style={[
                            INPUT,
                            {
                                flex: 1, // 👈 now it expands because parent has flex
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

                    {/* Publish Toggle */}
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

                    {/* Buttons */}
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
                            {loading ? "Updating..." : "Update"}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={{
                            backgroundColor: colors.border,
                            padding: 16,
                            borderRadius: 10,
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}
                        >
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            }
            <Footer />
        </KeyboardAvoidingView>
    );
};

export default ManageEditConstitution;