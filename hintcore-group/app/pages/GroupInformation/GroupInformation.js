import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    ActivityIndicator,
    Pressable,
} from "react-native";
import moment from "moment";
import { Switch } from 'react-native';
import jwt_decode from "jwt-decode";
import * as Clipboard from "expo-clipboard";
import { useSelector } from "react-redux";
import { useRoute } from "@react-navigation/native";
import Notification from "../../components/Notification/Notification";
import HINTCORELOGO from "../../../assets/images/hintcore-group-logo.png";
import privateAxios from "../../utils/axios/privateAxios";
import Footer from "../../components/Footer/Footer";
import stylesConfig from "../../styles/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GroupInformation = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const route = useRoute();
    const groupId = route.params?.groupId;

    const [changeGroupNotificationsLoading, setChangeGroupNotificationsLoading] = useState(false);
    const [groupNotificationsEnabled, setGroupNotificationsEnabled] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({
        visible: false,
        type: "",
        message: "",
    });
    const [group, setGroup] = useState({
        name: "",
        description: "",
        imageUrl: "",
        abbreviation: "",
        memberCounter: 0,
        status: "",
        joinCode: "",
        createdBy: "",
        createdAt: "",
    });

    // Handler function outside JSX
    const handleToggleGroupNotifications = async (value) => {
        if (changeGroupNotificationsLoading) return;

        setGroupNotificationsEnabled(value); // optimistic UI update

        try {
            setChangeGroupNotificationsLoading(true);
            const response = await privateAxios.patch('/private/toggle-group-notifications', { enabled: value })
            setGroupNotificationsEnabled(response.data.notificationsEnabled); // update with actual backend value
            setNotification({
                visible: true,
                type: 'success',
                message: response.data.message || `Group notifications updated.`,
            });
            setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);

        } catch (error) {
            setNotification({
                visible: true,
                type: 'error',
                message: 'Failed to update notification settings.',
            });
            setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
        } finally {
            setChangeGroupNotificationsLoading(false);
        }
    };

    useEffect(() => {
        const loadPermissions = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                if (token) {
                    const decoded = jwt_decode(token);
                    setPermissions(decoded.permissions || []);
                }
            } catch (err) {
                if (__Dev__) console.error("Failed to load permissions:", err);
            }
        };

        loadPermissions();
    }, []);

    useEffect(() => {
        const fetchGroupInfo = async () => {
            try {
                setLoading(true);
                const response = await privateAxios.get(`/private/group-information`);

                if (response.status === 200 && response.data.group) {
                    const g = response.data.group;

                    // ✅ Set the switch value from response
                    setGroupNotificationsEnabled(response.data.groupNotificationsStatus);

                    setGroup({
                        name: g.name || "",
                        description: g.description || "",
                        imageUrl: g.imageUrl || "",
                        abbreviation: g.abbreviation || "",
                        memberCounter: g.memberCounter || 0,
                        status: g.status || "",
                        joinCode: g.joinCode || "",
                        createdBy: g.createdBy?.fullName || "",
                        createdAt: g.createdAt || "",
                    });
                }
            } catch (error) {
                if (__Dev__) console.error("Group Info Fetch Error:", error);
                setNotification({
                    visible: true,
                    type: "error",
                    message:
                        error?.response?.data?.message || "Failed to load group details.",
                });
                setTimeout(
                    () => setNotification({ visible: false, type: "", message: "" }),
                    3000
                );
            } finally {
                setLoading(false);
            }
        };

        fetchGroupInfo();
    }, [groupId]);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={{ flex: 1, backgroundColor: colors.background }}
                contentContainerStyle={{ padding: 20 }}
            >
                <Notification
                    visible={notification.visible}
                    type={notification.type}
                    message={notification.message}
                />

                {/* Header */}
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                    <Image
                        source={group.imageUrl ? { uri: group.imageUrl } : HINTCORELOGO}
                        style={{ width: 80, height: 80, marginBottom: 8 }}
                        resizeMode="contain"
                    />
                    {loading ? <ActivityIndicator size="small" color={colors.primary} /> :
                        <View style={{ alignItems: "center" }}>
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: "bold",
                                    color: colors.text,
                                    textAlign: "center",
                                }}
                            >
                                {group.name}
                            </Text>

                            {group.abbreviation ? (
                                <Text style={{ fontSize: 16, color: colors.placeholder }}>
                                    ({group.abbreviation})
                                </Text>
                            ) : null}
                        </View>
                    }
                </View>

                {/* Details Card */}

                <View
                    style={[
                        stylesConfig.CARD,
                        { borderColor: colors.border, backgroundColor: colors.secondary, flexDirection: 'column', alignItems: 'flex-start', rowGap: 10 },
                    ]}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
                        <Text style={{ color: colors.text }}>👥 Members:</Text>
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={{ fontWeight: "bold", color: colors.text }}>{group.memberCounter}</Text>
                        )}
                    </View>

                    {permissions && (permissions.includes('admin') || permissions.includes('user')) && <Text style={{ color: colors.text }}>🔑 Join Code:{" "}{loading ? <ActivityIndicator /> : <Text style={{ fontWeight: "bold" }}>{group.joinCode}</Text>}</Text>}

                    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
                        <Text style={{ color: colors.text }}>📌 Statuses:</Text>
                        <View>
                            {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ fontWeight: "bold", color: group.status === "active" ? "green" : "red", textTransform: 'capitalize' }}> {group.status}</Text>}
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
                        <Text style={{ color: colors.text, textTransform: 'capitalize' }}>👤 Created By:</Text>
                        <View>
                            {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ fontWeight: 'bold' }}>{group.createdBy || "-"}</Text>}
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
                        <Text style={{ color: colors.text }}>📅 Created On: </Text>
                        <View>
                            {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ fontWeight: 'bold' }}>{group.createdAt ? moment(group.createdAt).format('MMMM D, YYYY') : "-"}</Text>}
                        </View>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.primary, marginVertical: 8, alignSelf: "stretch", }} />
                    <View style={{ rowGap: 10 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>Group Description</Text>
                        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ color: colors.text, marginBottom: 10 }}>{group.description || "No description available."}</Text>}
                    </View>
                </View>


                <View style={{ marginBottom: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.text, fontSize: 16, flexShrink: 1, }}>
                        Get notifications from {group.name}
                    </Text>

                    {loading || changeGroupNotificationsLoading ? (
                        <ActivityIndicator />
                    ) : (
                        <Switch
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={groupNotificationsEnabled ? colors.mainButtonText : colors.placeholder}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={handleToggleGroupNotifications}
                            value={groupNotificationsEnabled}
                        />
                    )}

                </View>

                {/* Invite Button */}
                {permissions && (permissions.includes('admin') || permissions.includes('manage_members')) && (
                    <Pressable
                        style={{
                            backgroundColor: colors.primary,
                            padding: 12,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 20,
                        }}
                        onPress={async () => {
                            if (group.joinCode) {
                                await Clipboard.setStringAsync(group.joinCode);
                                setNotification({
                                    visible: true,
                                    type: "success",
                                    message: `Join code "${group.joinCode}" copied to clipboard!`,
                                });
                                setTimeout(
                                    () => setNotification({ visible: false, type: "", message: "" }),
                                    3000
                                );
                            }
                        }}
                    >
                        <Text
                            style={{
                                color: colors.mainButtonText,
                                fontWeight: "700",
                                fontSize: 16,
                            }}
                        >
                            📩 Invite Members
                        </Text>
                    </Pressable>

                )}

                {permissions && (permissions.includes('admin') || permissions.includes('manage_group')) && (
                    <Pressable
                        style={{
                            backgroundColor: colors.primary,
                            padding: 12,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 20,
                        }}
                        onPress={() => navigation.navigate('manage-edit-group-information')}
                    >
                        <Text
                            style={{
                                color: colors.mainButtonText,
                                fontWeight: "700",
                                fontSize: 16,
                            }}
                        >
                            📩 Edit Group Information
                        </Text>
                    </Pressable>

                )}
            </ScrollView>

            <Footer />
        </View>
    );
}

export default GroupInformation;