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
import privateAxios from "../../utils/axios/privateAxios";
import stylesConfig from "../../styles/styles";
import Notification from "../../components/Notification/Notification";
import Footer from "../../components/Footer/Footer";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";

const ManageMinutesRecords = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [minutesRecords, setMinutesRecords] = useState([]);
    const [selectedMinutesRecords, setSelectedMinutesRecords] = useState([]);
    const [searchOptions, setSearchOptions] = useState(false);
    const [searchMode, setSearchMode] = useState(false);
    const [searchParams, setSearchParams] = useState({ titleOrDescription: "", startDate: "", endDate: "", published: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: "", message: "" });

    const fetchMinutesRecords = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const response = await privateAxios.get(`/private/manage-minutes-records?page=${pageNumber}`);
            setInitialLoaded(true);
            setMinutesRecords(response.data.minutesRecords || []);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(pageNumber);
        } catch (error) {
            showError("Failed to fetch minutes records.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSearchedMinutesRecords = async (pageNumber = 1) => {
        try {
            setLoading(true);

            const query = new URLSearchParams({
                ...searchParams,
                page: pageNumber,
            });

            const response = await privateAxios.get(`/private/manage-search-minutes-records?${query}`);
            setMinutesRecords(response.data.minutesRecords || []);
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
            const formattedDate = date.toISOString().split("T")[0];
            if (datePickerMode === "start") {
                setStartDate(formattedDate);
                setSearchParams(prev => ({ ...prev, startDate: formattedDate }));
            } else if (datePickerMode === "end") {
                setEndDate(formattedDate);
                setSearchParams(prev => ({ ...prev, endDate: formattedDate }));
            }
        }
    };

    const handleSearch = () => {
        setSearchMode(true);
        fetchSearchedMinutesRecords(1);
    };

    const handleCheckbox = (id) => {
        setSelectedMinutesRecords((prev) =>
            prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id]
        );
    };

    const confirmDeleteSelected = () => {
        if (!selectedMinutesRecords.length) return;
        Alert.alert("Delete", `Delete ${selectedMinutesRecords.length} selected minutes record${selectedMinutesRecords > 1 ? 's' : ''}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await privateAxios.post("/private/delete-minutes-records", { ids: selectedMinutesRecords });
                        setSelectedMinutesRecords([]);
                        searchMode ? fetchSearchedMinutesRecords(currentPage) : fetchMinutesRecords(currentPage);
                    } catch {
                        showError("Failed to delete minutes records.");
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    const confirmDeleteSingle = (id) => {
        Alert.alert("Delete", "Delete this minutes records?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    try {
                        await privateAxios.delete(`/private/delete-minutes/${id}`);
                        searchMode ? fetchSearchedMinutesRecords(currentPage) : fetchMinutesRecords(currentPage);
                    } catch {
                        showError("Failed to delete minutes records.");
                    } finally {
                        setLoading(false);
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
            searchMode ? fetchSearchedMinutesRecords(nextPage) : fetchMinutesRecords(nextPage);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            searchMode ? fetchSearchedMinutesRecords(prevPage) : fetchMinutesRecords(prevPage);
        }
    };

    useEffect(() => {
        fetchMinutesRecords(1);
    }, []);

    // Truncate title if it exceeds 20 characters
    const truncateTitle = (title) => {
        return title.length > 25 ? title.slice(0, 25) + "..." : title;
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>
                    Manage Minutes Records
                </Text>

                {/* Create Minutes Records Button */}
                <Pressable
                    style={[stylesConfig.BUTTON, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate("create-minutes")}
                >
                    <Text style={{ color: colors.mainButtonText }}>Create Minutes</Text>
                </Pressable>

                {/* Search Options */}
                {initialLoaded &&
                    <Pressable
                        style={[stylesConfig.BUTTON, { backgroundColor: colors.primary }]}
                        onPress={() => setSearchOptions(!searchOptions)}
                    >
                        <Text style={{ color: colors.mainButtonText }}>
                            {searchOptions ? "Hide Filter" : "Filter Minutes Records"}
                        </Text>
                    </Pressable>}

                {searchOptions && (
                    <View style={{ marginVertical: 10 }}>
                        {/* Title or description Input */}
                        <TextInput
                            style={[
                                stylesConfig.INPUT,
                                {
                                    backgroundColor: colors.inputBackground,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Title or description"
                            placeholderTextColor={colors.placeholder}
                            value={searchParams.titleOrDescription}
                            onChangeText={(text) =>
                                setSearchParams({
                                    ...searchParams,
                                    titleOrDescription: text,
                                })
                            }
                        />

                        {/* Published Status */}
                        <View style={{ marginTop: 10 }}>
                            <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 5 }}>
                                Published Status
                            </Text>
                            {["", "true", "false"].map((val) => (
                                <Pressable
                                    key={val}
                                    onPress={() =>
                                        setSearchParams((prev) => ({ ...prev, published: val }))
                                    }
                                    style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}
                                >
                                    <View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderRadius: 5,
                                            backgroundColor: searchParams.published === val
                                                ? colors.primary
                                                : "transparent",
                                            marginRight: 5,
                                        }}
                                    />
                                    <Text style={{ color: colors.text }}>
                                        {val === ""
                                            ? "All"
                                            : val === "true"
                                                ? "Published"
                                                : "Unpublished"}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* DateTimePicker Component */}
                        <View>
                            <Text style={{ fontWeight: 'bold', color: colors.text }}>Date Created</Text>
                            {/* 📅 Date Range */}
                            <View style={{ flexDirection: "row", marginTop: 10, columnGap: 10, alignItems: "center" }}>
                                {/* Start Date */}
                                <Pressable
                                    style={{
                                        flex: 1,
                                        backgroundColor: colors.inputBackground,
                                        borderColor: colors.inputBackground,
                                        borderWidth: 1,
                                        borderRadius: 10,
                                        justifyContent: "center",
                                        paddingVertical: 12,
                                    }}
                                    onPress={() => { setDatePickerMode("start"); setShowDatePicker(true); }}
                                >
                                    <Text style={{ color: startDate ? colors.text : colors.placeholder, textAlign: 'center' }}>
                                        {startDate || "Start Date"}
                                    </Text>
                                </Pressable>

                                {/* End Date */}
                                <Pressable
                                    style={{
                                        flex: 1,
                                        backgroundColor: colors.inputBackground,
                                        borderColor: colors.inputBackground,
                                        borderWidth: 1,
                                        justifyContent: "center",
                                        paddingVertical: 12,
                                        borderRadius: 10,
                                    }}
                                    onPress={() => { setDatePickerMode("end"); setShowDatePicker(true); }}
                                >
                                    <Text style={{ color: endDate ? colors.text : colors.placeholder, textAlign: 'center' }}>
                                        {endDate || "End Date"}
                                    </Text>
                                </Pressable>

                                {/* Clear */}
                                {(startDate || endDate) && (
                                    <Pressable
                                        onPress={() => {
                                            setStartDate(null);
                                            setEndDate(null);
                                            setSearchParams(prev => ({ ...prev, startDate: "", endDate: "" }));
                                        }}
                                        style={{
                                            paddingVertical: 12,
                                            paddingHorizontal: 12,
                                            backgroundColor: colors.border,
                                            borderRadius: 6,
                                            alignSelf: "center",
                                        }}
                                    >
                                        <Text style={{ color: colors.text }}>Clear</Text>
                                    </Pressable>
                                )}
                            </View>

                            {/* Date Picker Component */}
                            {showDatePicker && (
                                <DateTimePicker
                                    value={
                                        (datePickerMode === "start" && startDate
                                            ? new Date(startDate)
                                            : datePickerMode === "end" && endDate
                                                ? new Date(endDate)
                                                : new Date())
                                    }
                                    mode="date"
                                    display="default"
                                    onChange={onChangeDate}
                                />
                            )}

                        </View>

                        {/* 🔍 Search Button */}
                        <Pressable
                            style={[stylesConfig.BUTTON, { backgroundColor: loading ? colors.border : colors.primary, marginTop: 10, flexDirection: 'row', columnGap: 10, justifyContent: 'center' }]}
                            onPress={() => {handleSearch(); setSearchOptions(false);}}
                            disabled={loading}
                        >
                            <Text style={{ color: colors.mainButtonText }}>{loading ? 'Searching...' : 'Search'}</Text>
                        </Pressable>
                    </View>
                )}

                {/* Delete Selected Button */}
                {minutesRecords.length > 0 && <Pressable
                    style={[
                        stylesConfig.BUTTON,
                        { backgroundColor: selectedMinutesRecords.length ? "#dc3545" : colors.border },
                    ]}
                    onPress={confirmDeleteSelected}
                    disabled={!selectedMinutesRecords.length}
                >
                    <Text style={{ color: "#fff" }}>Delete Selected</Text>
                </Pressable>}

                {/* List */}
                {loading ? (
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center', }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.text, marginTop: 10 }}>Loading Minutes Records...</Text>
                    </View>
                ) : minutesRecords.length > 0 ? (
                    <FlatList
                        data={minutesRecords}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <Pressable
                                style={[stylesConfig.CARD, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                                onPress={() => navigation.navigate("manage-minutes", { id: item._id })}
                            >
                                {/* Checkbox */}
                                <Pressable
                                    onPress={() => handleCheckbox(item._id)}
                                    style={[
                                        stylesConfig.CHECKBOX,
                                        {
                                            backgroundColor: selectedMinutesRecords.includes(item._id)
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
                                        onPress={() => navigation.navigate("manage-edit-minutes", { id: item._id })}
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
                        <Text style={{ color: colors.text, marginTop: 10 }}>There are no minutes records to display.</Text>
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

export default ManageMinutesRecords;