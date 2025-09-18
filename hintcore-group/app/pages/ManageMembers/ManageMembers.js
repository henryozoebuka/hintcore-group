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
import { Ionicons } from '@expo/vector-icons';
import Footer from "../../components/Footer/Footer";

const ManageMembers = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);

    const [searchParams, setSearchParams] = useState({
        email: "",
        fullName: "",
        memberNumber: "",
        permissions: [],
    });
    const [searchOptions, setSearchOptions] = useState(false);
    const [members, setMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchMode, setSearchMode] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [partialLoading, setPartialLoading] = useState(false);
    const [loadingInfo, setLoadingInfo] = useState("");

    const fetchSetMembers = async (pageNumber) => {
        try {
            setLoading(true);
            const response = await privateAxios.get(`/private/manage-members?page=${pageNumber}`);
            setInitialLoaded(true);
            setMembers(response.data.members);
            setPermissions(response.data.permissions);
            setTotalPages(response.data.totalPages);
            setCurrentPage(pageNumber);
        } catch (err) {
            Alert.alert("Error", "Error fetching members.");
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSetSearchedMembers = async (pageNumber) => {
        try {
            setPartialLoading(true);
            setLoadingInfo("Searching for Member...");

            const queryObj = {
                ...searchParams,
                page: pageNumber,
            };

            if (searchParams.permissions.length > 0) {
                queryObj.permissions = searchParams.permissions.join(",");
            }

            const query = new URLSearchParams(queryObj);
            setMembers([]);
            const response = await privateAxios.get(`/private/manage-searched-members?${query.toString()}`);

            setMembers(response.data.members);
            setTotalPages(response.data.totalPages);
            setCurrentPage(pageNumber);
        } catch (err) {
            Alert.alert("Error", "Error fetching search results.");
            setMembers([]);
        } finally {
            setPartialLoading(false);
            setLoadingInfo();
        }
    };

    const handlePermissionToggle = (perm) => {
        setSearchParams((prev) => {
            const alreadySelected = prev.permissions.includes(perm);
            return {
                ...prev,
                permissions: alreadySelected
                    ? prev.permissions.filter((p) => p !== perm)
                    : [...prev.permissions, perm],
            };
        });
    };

    const handleSearch = () => {
        setSearchMode(true);
        fetchSetSearchedMembers(1);
    };

    const handleCheckbox = (id) => {
        setSelectedMembers((prev) =>
            prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
        );
    };

    const confirmRemoveSelectedMembers = () => {
        if (!selectedMembers.length) return;
        Alert.alert(
            "Confirm Remove",
            `Remove ${selectedMembers.length} selected member${selectedMembers.length > 1 ? "s" : ""}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setPartialLoading(true);
                            setLoadingInfo(`Removing ${selectedMembers.length} member${selectedMembers.length > 1 ? "s" : ""}...`);
                            await privateAxios.post("/private/manage-remove-members", { ids: selectedMembers });
                            setSelectedMembers([]);
                            searchMode ? fetchSetSearchedMembers(currentPage) : fetchSetMembers(currentPage);
                        } catch (error) {
                            Alert.alert("Error", "Failed to remove selected members.");
                        } finally {
                            setPartialLoading(false);
                            setLoadingInfo("");
                        }
                    },
                },
            ]
        );
    };

    const confirmRemoveSingleMember = (memberId) => {
        Alert.alert("Confirm Remove", "Remove this member?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: "destructive",
                onPress: async () => {
                    try {
                        setPartialLoading(true);
                        setLoadingInfo("Removing Member...");
                        await privateAxios.post(`/private/manage-remove-member/${memberId}`);
                        searchMode ? fetchSetSearchedMembers(currentPage) : fetchSetMembers(currentPage);
                    } catch (error) {
                        Alert.alert("Error", "Failed to remove member.");
                    } finally {
                        setPartialLoading(false);
                        setLoadingInfo("");
                    }
                },
            },
        ]);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            searchMode ? fetchSetSearchedMembers(nextPage) : fetchSetMembers(nextPage);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            searchMode ? fetchSetSearchedMembers(prevPage) : fetchSetMembers(prevPage);
        }
    };

    const formatPermissionLabel = (perm) => {
        return perm
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    useEffect(() => {
        fetchSetMembers(1);
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>
                    Manage Members
                </Text>

                {initialLoaded && (
                    <Pressable
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={() => setSearchOptions(!searchOptions)}
                    >
                        <Text style={{ color: colors.mainButtonText }}>
                            {searchOptions ? "Hide Filter" : "Filter Members"}
                        </Text>
                    </Pressable>
                )}

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
                            placeholder="Member's ID"
                            placeholderTextColor={colors.placeholder}
                            value={searchParams.memberNumber}
                            onChangeText={(text) => setSearchParams({ ...searchParams, memberNumber: text })}
                        />
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                            placeholder="Member's email"
                            placeholderTextColor={colors.placeholder}
                            value={searchParams.email}
                            onChangeText={(text) => setSearchParams({ ...searchParams, email: text })}
                        />

                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ color: colors.text, marginBottom: 5 }}>Permissions:</Text>
                            {permissions.length > 0 &&
                                permissions.map((perm) => (
                                    <Pressable
                                        key={perm}
                                        onPress={() => handlePermissionToggle(perm)}
                                        style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
                                    >
                                        <View
                                            style={[
                                                styles.checkbox,
                                                {
                                                    backgroundColor: searchParams.permissions.includes(perm)
                                                        ? colors.primary
                                                        : colors.background,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                        />
                                        <Text style={{ color: colors.text, marginLeft: 8 }}>
                                            {formatPermissionLabel(perm)}
                                        </Text>
                                    </Pressable>
                                ))}
                        </View>

                        <Pressable
                            style={[
                                stylesConfig.BUTTON,
                                {
                                    backgroundColor: loading ? colors.border : colors.primary,
                                    marginTop: 10,
                                    flexDirection: "row",
                                    columnGap: 10,
                                    justifyContent: "center",
                                },
                            ]}
                            onPress={() => {
                                handleSearch();
                                setSearchOptions(false);
                            }}
                            disabled={loading}
                        >
                            <Text style={{ color: colors.mainButtonText }}>
                                {loading ? "Searching..." : "Search"}
                            </Text>
                        </Pressable>
                    </View>
                )}

                {members.length > 0 && (
                    <Pressable
                        style={[
                            styles.button,
                            { backgroundColor: selectedMembers.length ? "#dc3545" : colors.border },
                        ]}
                        onPress={confirmRemoveSelectedMembers}
                        disabled={!selectedMembers.length}
                    >
                        <Text style={{ color: "#fff" }}>Remove Selected Members</Text>
                    </Pressable>
                )}

                {partialLoading ? (
                    <View style={{ flex: 1, marginBottom: 10, flexDirection: "row", columnGap: 10, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator />
                        <Text style={{ color: colors.text }}>{loadingInfo}</Text>
                    </View>
                ) : loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.text }}>Fetching members...</Text>
                    </View>
                ) : members.length > 0 ? (
                    <FlatList
                        data={members}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <View
                                style={[
                                    styles.memberCard,
                                    { flex: 1, borderColor: colors.border, backgroundColor: colors.secondary },
                                ]}
                            >
                                <Pressable
                                    onPress={() => handleCheckbox(item._id)}
                                    style={[
                                        styles.checkbox,
                                        {
                                            backgroundColor: selectedMembers.includes(item._id)
                                                ? colors.primary
                                                : colors.background,
                                        },
                                    ]}
                                />
                                <Pressable onPress={() => handleCheckbox(item._id)} style={{ flex: 1 }}>
                                    <Text style={{ color: colors.text, fontWeight: "bold" }}>{item.fullName}</Text>
                                    <Text style={{ color: colors.text, fontWeight: "bold" }}>{item.memberNumber}</Text>
                                </Pressable>
                                <View style={{ flexDirection: "row" }}>
                                    <Pressable
                                        style={[styles.smallButton]}
                                        onPress={() => confirmRemoveSingleMember(item._id)}
                                    >
                                        <Ionicons name="trash-outline" size={24} color="red" />
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    />
                ) : (
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: colors.text, marginTop: 10 }}>There are no members to display.</Text>
                    </View>
                )}

                {totalPages > 1 && (
                    <View style={styles.pagination}>
                        <Pressable
                            style={[
                                styles.pageButton,
                                { backgroundColor: currentPage === 1 ? colors.border : colors.primary },
                            ]}
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
                                {
                                    backgroundColor:
                                        currentPage === totalPages ? colors.border : colors.primary,
                                    minWidth: 85,
                                    alignItems: "center",
                                },
                            ]}
                            onPress={handleNextPage}
                            disabled={currentPage === totalPages}
                        >
                            <Text style={{ color: colors.mainButtonText }}>Next</Text>
                        </Pressable>
                    </View>
                )}
            </View>
            <Footer />
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
    memberCard: {
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

export default ManageMembers;