// pages/ManageUsers/ManageUsers.js
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    ActivityIndicator,
    Alert,
    StyleSheet,
} from "react-native";
import { useSelector } from "react-redux";
import stylesConfig from "../../styles/styles";
import privateAxios from "../../utils/axios/privateAxios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ManageUsers = ({ navigation }) => {
    const [groupId, setGroupId] = useState('');

    useEffect(() => {
        const getGroupIdFromStorage = async () => {
            const fetchGroupId = await AsyncStorage.getItem('currentGroupId');
            setGroupId(fetchGroupId);
        };

        getGroupIdFromStorage();
    }, []);

    const { colors } = useSelector((state) => state.colors);

    const [searchParams, setSearchParams] = useState({
        email: "",
        fullName: "",
        role: "",
    });

    const [searchOptions, setSearchOptions] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchMode, setSearchMode] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchSetUsers = async (pageNumber) => {
        try {
            setLoading(true);
            const response = await privateAxios.get(`/private/admin-users/${groupId}?page=${pageNumber}`);
            setUsers(response.data.users);
            setTotalPages(response.data.totalPages);
            setCurrentPage(pageNumber);
        } catch (err) {
            Alert.alert("Error", "Error fetching users.");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSetSearchedUsers = async (pageNumber) => {
        try {
            setLoading(true);
            const query = new URLSearchParams({ ...searchParams, page: pageNumber });
            const response = await privateAxios.get(`/private/admin-searched-users/${groupId}?${query.toString()}`);
            setUsers(response.data.users);
            setTotalPages(response.data.totalPages);
            setCurrentPage(pageNumber);
        } catch (err) {
            Alert.alert("Error", "Error fetching search results.");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setSearchMode(true);
        fetchSetSearchedUsers(1);
    };

    const handleCheckbox = (id) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
        );
    };

    const confirmDeleteSelectedUsers = () => {
        if (!selectedUsers.length) return;
        Alert.alert(
            "Confirm Delete",
            `Delete ${selectedUsers.length} selected user(s)?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await privateAxios.post("/private/delete-users", { ids: selectedUsers });
                            setSelectedUsers([]);
                            searchMode ? fetchSetSearchedUsers(currentPage) : fetchSetUsers(currentPage);
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete selected users.");
                        }
                    },
                },
            ]
        );
    };

    const confirmDeleteSingleUser = (userId) => {
        Alert.alert("Confirm Delete", "Delete this user?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await privateAxios.delete(`/private/delete-user/${userId}`);
                        searchMode ? fetchSetSearchedUsers(currentPage) : fetchSetUsers(currentPage);
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete user.");
                    }
                },
            },
        ]);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            searchMode ? fetchSetSearchedUsers(nextPage) : fetchSetUsers(nextPage);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            searchMode ? fetchSetSearchedUsers(prevPage) : fetchSetUsers(prevPage);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchSetUsers(1);
        }
    }, [groupId]);

    return (
        <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>
                Manage Members
            </Text>

            {/* Toggle search options */}
            <Pressable
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => setSearchOptions(!searchOptions)}
            >
                <Text style={{ color: colors.mainButtonText }}>
                    {searchOptions ? "Hide Search Options" : "Show Search Options"}
                </Text>
            </Pressable>

            {/* Search fields */}
            {searchOptions && (
                <View style={{ marginVertical: 10 }}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                        placeholder="Member's name"
                        placeholderTextColor={colors.placeholder}
                        value={searchParams.fullName}
                        onChangeText={(text) => setSearchParams({ ...searchParams, fullName: text })}
                    />
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                        placeholder="Member's email"
                        placeholderTextColor={colors.placeholder}
                        value={searchParams.email}
                        onChangeText={(text) => setSearchParams({ ...searchParams, email: text })}
                    />

                    <Pressable
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleSearch}
                    >
                        <Text style={{ color: colors.mainButtonText }}>Search</Text>
                    </Pressable>
                </View>
            )}

            {/* Delete selected button */}
            <Pressable
                style={[
                    styles.button,
                    { backgroundColor: selectedUsers.length ? "#dc3545" : colors.border },
                ]}
                onPress={confirmDeleteSelectedUsers}
                disabled={!selectedUsers.length}
            >
                <Text style={{ color: "#fff" }}>Delete Selected Members</Text>
            </Pressable>

            {/* Users list */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <Pressable
                            style={[
                                styles.userCard,
                                { borderColor: colors.border, backgroundColor: colors.secondary },
                            ]}
                            onPress={() => navigation.navigate("UserProfile", { userId: item._id })}
                        >
                            <Pressable
                                onPress={() => handleCheckbox(item._id)}
                                style={[
                                    styles.checkbox,
                                    {
                                        backgroundColor: selectedUsers.includes(item._id)
                                            ? colors.primary
                                            : colors.background,
                                    },
                                ]}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.text, fontWeight: "bold" }}>{item.fullName}</Text>
                                <Text style={{ color: colors.text }}>{item.email}</Text>
                                <Text style={{ color: colors.text }}>{item.role}</Text>
                            </View>
                            <View style={{ flexDirection: "row" }}>
                                <Pressable
                                    style={[styles.smallButton, { backgroundColor: colors.primary }]}
                                    onPress={() => navigation.navigate("EditUser", { userId: item._id })}
                                >
                                    <Text style={{ color: "#fff" }}>Edit</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.smallButton, { backgroundColor: "#dc3545" }]}
                                    onPress={() => confirmDeleteSingleUser(item._id)}
                                >
                                    <Text style={{ color: "#fff" }}>Delete</Text>
                                </Pressable>
                            </View>
                        </Pressable>
                    )}
                />
            )}

            {/* Pagination */}
            <View style={styles.pagination}>
                <Pressable
                    style={[styles.pageButton, { backgroundColor: currentPage === 1 ? colors.border : colors.primary }]}
                    onPress={handlePreviousPage}
                    disabled={currentPage === 1}
                >
                    <Text style={{ color: colors.mainButtonText }}>Previous</Text>
                </Pressable>
                <Text style={{ color: colors.text }}>
                    Page {currentPage} of {totalPages}
                </Text>
                <Pressable
                    style={[
                        styles.pageButton,
                        { backgroundColor: currentPage === totalPages ? colors.border : colors.primary },
                    ]}
                    onPress={handleNextPage}
                    disabled={currentPage === totalPages}
                >
                    <Text style={{ color: colors.mainButtonText }}>Next</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    input: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    button: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: "center",
    },
    smallButton: {
        padding: 8,
        borderRadius: 6,
        marginLeft: 6,
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 1,
        marginRight: 10,
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 15,
    },
    pageButton: {
        padding: 10,
        borderRadius: 8,
    },
});

export default ManageUsers;