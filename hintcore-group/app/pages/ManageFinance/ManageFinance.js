import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    ActivityIndicator,
    Alert,
    SafeAreaView,
} from "react-native";
import moment from "moment";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import privateAxios from "../../utils/axios/privateAxios";
import stylesConfig from "../../styles/styles";
import Notification from "../../components/Notification/Notification";
import Footer from "../../components/Footer/Footer";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";

const ManageFinances = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const [groupId, setGroupId] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [finances, setFinances] = useState([]);
    const [selectedFinances, setSelectedFinances] = useState([]);
    const [searchOptions, setSearchOptions] = useState(false);
    const [searchMode, setSearchMode] = useState(false);
    const [searchParams, setSearchParams] = useState({ titleOrContent: "", date: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: "", message: "" });

    const fetchPayments = async (pageNumber = 1) => {
        if (!groupId) return;
        try {
            setLoading(true);
            const response = await privateAxios.get(`/private/manage-payments/${groupId}?page=${pageNumber}`);
            setFinances(response.data.finances || []);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(pageNumber);
        } catch (error) {
            showError("Failed to fetch finances.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSearchedFinances = async (pageNumber = 1) => {
        try {
            setLoading(true);

            const query = new URLSearchParams({
                ...searchParams,
                page: pageNumber,
            });

            const response = await privateAxios.get(`/private/manage-search-payments/${groupId}?${query}`);
            setFinances(response.data.finances || []);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(pageNumber);
        } catch (error) {
            showError("Search failed.");
        } finally {
            setLoading(false);
        }
    };

    const onChangeDate = (event, date) => {
        setShowDatePicker(false);
        if (date) {
            const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
            setSelectedDate(formattedDate);
            setSearchParams({ ...searchParams, date: formattedDate });
        }
    };

    const handleSearch = () => {
        setSearchMode(true);
        fetchSearchedFinances(1);
    };

    const handleCheckbox = (id) => {
        setSelectedFinances((prev) =>
            prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id]
        );
    };

    const confirmDeleteSelected = () => {
        if (!selectedFinances.length) return;
        Alert.alert("Delete", `Delete ${selectedFinances.length} selected finance(s)?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await privateAxios.post("/private/delete-finances", { ids: selectedFinances });
                        setSelectedFinances([]);
                        searchMode ? fetchSearchedFinances(currentPage) : fetchPayments(currentPage);
                    } catch {
                        showError("Failed to delete finances.");
                    }
                },
            },
        ]);
    };

    const confirmDeleteSingle = (id) => {
        Alert.alert("Delete", "Delete this payement?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await privateAxios.delete(`/private/delete-finance/${id}`);
                        searchMode ? fetchSearchedFinances(currentPage) : fetchPayments(currentPage);
                    } catch {
                        showError("Failed to delete finance.");
                    }
                },
            },
        ]);
    };

    const showError = (msg) => {
        setNotification({ visible: true, type: "error", message: msg });
        setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            searchMode ? fetchSearchedFinances(nextPage) : fetchPayments(nextPage);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            searchMode ? fetchSearchedFinances(prevPage) : fetchPayments(prevPage);
        }
    };

    
    useEffect(() => {
        const fetchGroupId = async () => {
            const id = await AsyncStorage.getItem("currentGroupId");
            if (!id) {
                setNotification({ visible: true, type: "error", message: "Group ID not found." });
                return;
            }
            setGroupId(id);
        };

        fetchGroupId();
    }, []);

    useEffect(() => {
        if (groupId) {
            fetchPayments(1);
        }
    }, [groupId]);

    // Truncate title if it exceeds 20 characters
    const truncateTitle = (title) => {
        return title.length > 25 ? title.slice(0, 25) + "..." : title;
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>
                    Manage Finances
                </Text>

                {/* Create Payment Button */}
                <Pressable
                    style={[stylesConfig.BUTTON, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate("create-payment")}
                >
                    <Text style={{ color: colors.mainButtonText }}>Create Payment</Text>
                </Pressable>

                {/* Search Options */}
                {finances.length > 0 && 
                <Pressable
                    style={[stylesConfig.BUTTON, { backgroundColor: colors.primary }]}
                    onPress={() => setSearchOptions(!searchOptions)}
                >
                    <Text style={{ color: colors.mainButtonText }}>
                        {searchOptions ? "Hide Search Options" : "Show Search Options"}
                    </Text>
                </Pressable>}

                {searchOptions && (
                    <View style={{ marginVertical: 10 }}>
                        {/* Title or Content Input */}
                        <TextInput
                            style={[
                                stylesConfig.INPUT,
                                {
                                    backgroundColor: colors.inputBackground,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Title or content"
                            placeholderTextColor={colors.placeholder}
                            value={searchParams.titleOrContent}
                            onChangeText={(text) =>
                                setSearchParams({
                                    ...searchParams,
                                    titleOrContent: text,
                                })
                            }
                        />

                        {/* 📅 Date Picker + ❌ Clear Date in a row */}
                        <View style={{ flexDirection: "row", marginTop: 10, justifyContent: 'center' }}>
                            {/* Date Field */}
                            <Pressable style={[stylesConfig.INPUT, { flex: 1, backgroundColor: colors.inputBackground, borderColor: colors.inputBackground, borderWidth: 1, justifyContent: "center", paddingVertical: 12, },]} onPress={() => setShowDatePicker(true)}>
                                <Text style={{ color: selectedDate ? colors.text : colors.placeholder }}> {selectedDate || "Select Date"}</Text>
                            </Pressable>

                            {/* Clear Button - only shows if a date is selected */}
                            {selectedDate && (
                                <Pressable onPress={() => { setSelectedDate(null); setSearchParams({ ...searchParams, date: "" }); }} style={{ marginLeft: 10, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: colors.border, borderRadius: 6, marginBottom: 16 }}>
                                    <Text style={{ color: colors.text }}>Clear</Text>
                                </Pressable>
                            )}
                        </View>

                        {/* DateTimePicker Component */}
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate ? new Date(selectedDate) : new Date()}
                                mode="date"
                                display="default"
                                onChange={onChangeDate}
                            />
                        )}

                        {/* 🔍 Search Button */}
                        <Pressable
                            style={[stylesConfig.BUTTON, { backgroundColor: colors.primary, marginTop: 10, flexDirection: 'row', columnGap: 10, justifyContent: 'center' }]}
                            onPress={handleSearch}
                        >
                            {loading && <ActivityIndicator color={colors.mainButtonText} />}
                            <Text style={{ color: colors.mainButtonText }}>{loading ? 'Searching...' : 'Search'}</Text>
                        </Pressable>
                    </View>
                )}

                {/* Delete Selected Button */}
                {finances.length > 0 && <Pressable
                    style={[
                        stylesConfig.BUTTON,
                        { backgroundColor: selectedFinances.length ? "#dc3545" : colors.border },
                    ]}
                    onPress={confirmDeleteSelected}
                    disabled={!selectedFinances.length}
                >
                    <Text style={{ color: "#fff" }}>Delete Selected</Text>
                </Pressable>}

                {/* List */}
                {loading ? (
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center', }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.text, marginTop: 10 }}>Loading Finances...</Text>
                    </View>
                ) : finances.length > 0 ? (
                    <FlatList
                        data={finances}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <Pressable
                                style={[stylesConfig.CARD, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                                onPress={() => navigation.navigate("manage-payment", { id: item._id })}
                            >
                                {/* Checkbox */}
                                <Pressable
                                    onPress={() => handleCheckbox(item._id)}
                                    style={[
                                        stylesConfig.CHECKBOX,
                                        {
                                            backgroundColor: selectedFinances.includes(item._id)
                                                ? colors.primary
                                                : colors.background,
                                        },
                                    ]}
                                />

                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.text, fontWeight: "bold" }}>{truncateTitle(item.title)}</Text>
                                    <Text style={{ color: colors.text, textAlign: 'right' }}>{moment(item.createdAt).format('MMMM DD, YYYY')}</Text>

                                    {/* Unpublished Tag */}
                                    {!item.published && (
                                        <Text style={{ color: "#dc3545", fontSize: 12, marginTop: 5 }}>Unpublished</Text>
                                    )}
                                </View>

                                {/* Actions: Edit/Delete */}
                                <View style={{ flexDirection: "row" }}>
                                    <Pressable
                                        style={[stylesConfig.SMALL_BUTTON]}
                                        onPress={() => navigation.navigate("manage-edit-finance", { id: item._id })}
                                    >
                                        <Ionicons name="create-outline" size={24} color="#007bff" />
                                    </Pressable>
                                    <Pressable
                                        style={[stylesConfig.SMALL_BUTTON]}
                                        onPress={() => confirmDeleteSingle(item._id)}
                                    >
                                        <Ionicons name="trash-outline" size={24} color="red" />
                                    </Pressable>
                                </View>
                            </Pressable>
                        )}
                    />) :
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center', }}>
                        <Text style={{ color: colors.text, marginTop: 10 }}>There are no finances to display.</Text>
                    </View>
                }
                {/* Pagination */}
                {totalPages > 1 &&
                    <View style={stylesConfig.PAGINATION}>
                        <Pressable
                            style={[
                                stylesConfig.PAGE_BUTTON,
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
                                stylesConfig.PAGE_BUTTON,
                                { backgroundColor: currentPage === totalPages ? colors.border : colors.primary, minWidth: 85, alignItems: 'center' },
                            ]}
                            onPress={handleNextPage}
                            disabled={currentPage === totalPages}
                        >
                            <Text style={{ color: colors.mainButtonText }}>Next</Text>
                        </Pressable>
                    </View>
                }
            </View>
            <Footer />
        </SafeAreaView>
    );
};

export default ManageFinances;