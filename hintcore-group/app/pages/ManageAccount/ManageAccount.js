import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    TextInput,
    FlatList,
    Pressable,
    Animated,
    Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import moment from "moment";
import privateAxios from "../../utils/axios/privateAxios";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Notification from "../../components/Notification/Notification";
import Footer from "../../components/Footer/Footer";
import stylesConfig from "../../styles/styles";

const ManageAccount = ({ navigation }) => {
    const route = useRoute();
    const { id, accountType } = route.params;

    const { colors } = useSelector((state) => state.colors);

    const [account, setAccount] = useState(null);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all"); // all | paid | unpaid
    const [selectedMembers, setSelectedMembers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingMark, setLoadingMark] = useState(false);
    const [notification, setNotification] = useState({
        visible: false,
        type: "",
        message: "",
    });
    const [confirmVisible, setConfirmVisible] = useState(false);

    const [expanded, setExpanded] = useState(false);
    const animatedHeight = useRef(new Animated.Value(100)).current;

    /** Fetch Account Details */
    const fetchAccountDetails = useCallback(async () => {
        try {
            const response = await privateAxios.get(`/private/manage-account/${id}`);
            if (response.status === 200) {
                setAccount(response.data.account);
                setFilteredMembers(response.data.account.members || []);
            }
        } catch (err) {
            setNotification({
                visible: true,
                type: "error",
                message:
                    err?.response?.data?.message || "Failed to fetch account info.",
            });
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAccountDetails();
    }, [fetchAccountDetails]);

    /** Expand / Collapse */
    const toggleExpand = () => {
        Animated.timing(animatedHeight, {
            toValue: expanded ? 100 : 300,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setExpanded(!expanded);
    };

    /** Search + Filter */
    const handleSearchAndFilter = (query, type) => {
        setSearchQuery(query);
        setFilterType(type);

        if (!account) return;

        let members = [...(account.members || [])];

        if (account?.type === "required" || account?.type === "contribution") {
            if (type === "paid") {
                members = members.filter((m) => m.paid);
            } else if (type === "unpaid") {
                members = members.filter((m) => !m.paid);
            }
        }

        if (query.trim()) {
            members = members.filter((m) =>
                (m.userId?.fullName || m.fullName || "")
                    .toLowerCase()
                    .includes(query.toLowerCase())
            );
        }

        setFilteredMembers(members);
    };

    /** Export CSV */
    const exportToCSV = async () => {
        if (!account) {
            Alert.alert("No account to export.");
            return;
        }

        // Account info header
        const accountHeader = [
            "Title",
            "Type",
            "Description",
            "Amount",
            "TotalAmountPaid",
            "DueDate",
            "Published",
            "CreatedAt",
            "CreatedBy",
        ].join(",") + "\n";

        // Account info row
        const accountRow = [
            `"${account.title}"`,
            `"${account.type}"`,
            `"${account.description}"`,
            account.amount || 0,
            account.totalAmountPaid || 0,
            account.dueDate ? moment(account.dueDate).format("YYYY-MM-DD") : "",
            account.published ? "true" : "false",
            account.createdAt
                ? moment(account.createdAt).format("YYYY-MM-DD HH:mm:ss")
                : "",
            `"${account.createdBy?.fullName || account.createdBy || ""}"`,
        ].join(",") + "\n\n";

        // Members header
        const memberHeader =
            ["FullName", "Status", "AmountPaid"].join(",") + "\n";

        // Members rows
        const memberRows = filteredMembers
            .map((m) =>
                [
                    `"${m.fullName || m.userId?.fullName || ""}"`,
                    m.paid ? "paid" : "unpaid",
                    m.amountPaid || 0,
                ].join(",")
            )
            .join("\n");

        // Final CSV (two sections)
        const csv = "Account Info\n" + accountHeader + accountRow +
            "Members\n" + memberHeader + memberRows;

        try {
            const fileUri = FileSystem.cacheDirectory + "account.csv";
            await FileSystem.writeAsStringAsync(fileUri, csv, {
                encoding: FileSystem.EncodingType.UTF8,
            });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert("Exported", "CSV saved to: " + fileUri);
            }
        } catch (err) {
            console.error("CSV Export error:", err);
            Alert.alert("Error", "Failed to export CSV.");
        }
    };

    /** UI Helpers */
    const renderMember = ({ item }) => {
        const type = account?.type;
        if (type === "donation") {
            return (
                <View
                    style={{
                        ...stylesConfig.CARD,
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                    }}
                >
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                        {item.fullName || item.userId?.fullName || "Unnamed Donor"}
                    </Text>
                    <Text style={{ color: colors.primary }}>
                        Amount Donated: ₦{(item.amountPaid || 0).toLocaleString()}
                    </Text>
                </View>
            );
        }

        return (
            <View
                style={{
                    ...stylesConfig.CARD,
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                }}
            >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                    {item.fullName || item.userId?.fullName || "Unnamed Member"}
                </Text>
                <Text style={{ color: colors.placeholder }}>
                    Status: {item.paid ? "✅ Paid" : "❌ Unpaid"}
                </Text>
                <Text style={{ color: colors.primary }}>
                    Amount Paid: ₦{(item.amountPaid || 0).toLocaleString()}
                </Text>
            </View>
        );
    };

    const renderFilterButton = (label, value) => (
        <Pressable
            onPress={() => handleSearchAndFilter(searchQuery, value)}
            style={{
                ...stylesConfig.SMALL_BUTTON,
                backgroundColor: filterType === value ? colors.primary : colors.secondary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                marginRight: 8,
            }}
        >
            <Text
                style={{
                    color: filterType === value ? colors.mainButtonText : colors.text,
                    fontWeight: "600",
                }}
            >
                {label}
            </Text>
        </Pressable>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 20,
                }}
            >
                <Text
                    style={{
                        fontSize: 22,
                        fontWeight: "bold",
                        color: colors.text,
                        flexShrink: 1,
                    }}
                >
                    {accountType[0]?.toUpperCase() + accountType?.slice(1)} Details
                </Text>
                {account && (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <Pressable
                            style={{
                                backgroundColor: colors.primary,
                                padding: 6,
                                borderRadius: 6,
                            }}
                            onPress={exportToCSV}
                        >
                            <Text style={{ color: colors.mainButtonText }}>Export this</Text>
                        </Pressable>
                    </View>
                )}
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text }}>Loading account details...</Text>
                </View>
            ) : (
                <View style={{ flex: 1, padding: 20 }}>
                    <Notification {...notification} />

                    {/* Account Info */}
                    <Animated.View
                        style={{
                            backgroundColor: colors.secondary,
                            padding: 16,
                            borderRadius: 12,
                            borderColor: colors.border,
                            borderWidth: 1,
                            marginBottom: 10,
                            overflow: "hidden",
                            height: animatedHeight,
                        }}
                    >
                        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
                            {account?.title}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 8 }}>
                            {account?.description}
                        </Text>
                        <Text style={{ color: colors.primary, fontWeight: "600" }}>
                            Amount: ₦{account?.amount?.toLocaleString() || 0}
                        </Text>
                        <Text style={{ color: colors.primary, fontWeight: "600" }}>
                            Total Paid: ₦{account?.totalAmountPaid?.toLocaleString() || 0}
                        </Text>
                        <Text style={{ color: colors.text }}>
                            Due Date:{" "}
                            {account?.dueDate
                                ? moment(account.dueDate).format("MMMM DD, YYYY")
                                : "N/A"}
                        </Text>
                        <Text style={{ color: colors.text }}>
                            Published: {account?.published ? "Yes" : "No"}
                        </Text>
                        <Text style={{ color: colors.text }}>
                            Created By: {account?.createdBy?.fullName}
                        </Text>
                        <Text style={{ color: colors.text }}>
                            Created At: {moment(account?.createdAt).format("MMMM DD, YYYY")}
                        </Text>
                    </Animated.View>

                    <Pressable onPress={toggleExpand} style={{ marginBottom: 20, alignItems: "center" }}>
                        <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                            {expanded ? "▲ Show Less" : "▼ Show More"}
                        </Text>
                    </Pressable>

                    {/* Search + Filters */}
                    <TextInput
                        style={{
                            ...stylesConfig.INPUT,
                            backgroundColor: colors.inputBackground,
                            color: colors.text,
                            borderColor: colors.border,
                            borderWidth: 1,
                            marginBottom: 12,
                        }}
                        placeholder="Search member by name"
                        placeholderTextColor={colors.placeholder}
                        value={searchQuery}
                        onChangeText={(text) => handleSearchAndFilter(text, filterType)}
                    />

                    {(account?.type === "required" || account?.type === "contribution") && (
                        <View style={{ flexDirection: "row", marginBottom: 16 }}>
                            {renderFilterButton("All", "all")}
                            {renderFilterButton("Paid", "paid")}
                            {renderFilterButton("Unpaid", "unpaid")}
                        </View>
                    )}

                    {/* Members List */}
                    <FlatList
                        data={filteredMembers}
                        keyExtractor={(item, index) => item.userId?._id || index.toString()}
                        renderItem={renderMember}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    />
                </View>
            )}

            <Footer />
        </View>
    );
};

export default ManageAccount;