import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
} from "react-native";
import moment from "moment";
import { useSelector } from "react-redux";
import privateAxios from "../../utils/axios/privateAxios";
import stylesConfig from "../../styles/styles";
import Notification from "../../components/Notification/Notification";
import Footer from "../../components/Footer/Footer";
import DateTimePicker from "@react-native-community/datetimepicker";

const MinutesRecords = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [datePickerMode, setDatePickerMode] = useState(null); // "start" or "end"
    const [minutesRecords, setMinutesRecords] = useState([]);
    const [searchOptions, setSearchOptions] = useState(false);
    const [searchMode, setSearchMode] = useState(false);
    const [searchParams, setSearchParams] = useState({ titleOrDescription: "", startDate: "", endDate: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: "", message: "" });

    const fetchMinutesRecords = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const response = await privateAxios.get(`/private/minutes-records?page=${pageNumber}`);
            setInitialLoaded(true);
            let list = response.data.minutesRecords || [];

            setMinutesRecords(list);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(pageNumber);
        } catch (error) {
            showError(error?.response?.data?.message || "Failed to fetch minutes records.");
            if (__DEV__) console.error(error);
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

            const response = await privateAxios.get(`/private/search-minutes-records?${query}`);
            let list = response.data.minutesRecords || [];

            setMinutesRecords(list);
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

    const truncateTitle = (title) => {
        return title.length > 25 ? title.slice(0, 25) + "..." : title;
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>Minutes Records</Text>

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
                        {/* Title Input */}
                        <TextInput
                            style={[
                                stylesConfig.INPUT,
                                { backgroundColor: colors.inputBackground, color: colors.text },
                            ]}
                            placeholder="Title or description"
                            placeholderTextColor={colors.placeholder}
                            value={searchParams.titleOrDescription}
                            onChangeText={(text) =>
                                setSearchParams({ ...searchParams, titleOrDescription: text })
                            }
                        />

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

                        {/* Search Btn */}
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
                            disabled={loading}
                            onPress={() => { handleSearch(); setSearchOptions(false) }}
                        >
                            <Text style={{ color: colors.mainButtonText }}>
                                {loading ? "Searching..." : "Search"}
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* List */}
                {loading ? (
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.text, marginTop: 10 }}>Loading Minutes Records...</Text>
                    </View>
                ) : minutesRecords.length > 0 ? (
                    <FlatList
                        data={minutesRecords}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <Pressable
                                style={[
                                    stylesConfig.CARD,
                                    { borderColor: colors.border, backgroundColor: colors.secondary },
                                ]}
                                onPress={() => navigation.navigate("minutes", { id: item._id })}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: colors.text, fontWeight: "bold" }}>
                                            {truncateTitle(item.title)}
                                        </Text>
                                        <Text style={{ color: colors.text, textAlign: "right" }}>
                                            {moment(item.createdAt).format("MMMM DD, YYYY")}
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        )}
                    />
                ) : (
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: colors.text, marginTop: 10 }}>There are no minutes records to display.</Text>
                    </View>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
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
        </SafeAreaView>
    );
};

export default MinutesRecords;