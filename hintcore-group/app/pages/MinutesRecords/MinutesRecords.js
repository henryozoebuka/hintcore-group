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
import moment from 'moment';
import { useSelector } from "react-redux";
import privateAxios from "../../utils/axios/privateAxios";
import stylesConfig from "../../styles/styles";
import Notification from "../../components/Notification/Notification";
import Footer from "../../components/Footer/Footer";
import DateTimePicker from "@react-native-community/datetimepicker";

const MinutesRecords = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const [minutesRecords, setMinutesRecords] = useState([]);
    const [searchOptions, setSearchOptions] = useState(false);
    const [searchMode, setSearchMode] = useState(false);
    const [searchParams, setSearchParams] = useState({ titleOrDescription: "", date: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: "", message: "" });

    // Date picker states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const fetchMinutesRecords = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const response = await privateAxios.get(`/private/minutes-records?page=${pageNumber}`);
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
            const query = new URLSearchParams({ ...searchParams, page: pageNumber });
            const response = await privateAxios.get(`/private/search-minutes-records?${query}`);
            setMinutesRecords(response.data.minutesRecords || []);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(pageNumber);
        } catch (error) {
            showError("Search failed.");
        } finally {
            setLoading(false);
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
            searchMode ? fetchSearchedMinutesRRecords(prevPage) : fetchMinutesRecords(prevPage);
        }
    };

    useEffect(() => {
        fetchMinutesRecords(1);
    }, []);

    // Date change handler
    const onChangeDate = (event, date) => {
        setShowDatePicker(false);
        if (date) {
            const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
            setSelectedDate(formattedDate);
            setSearchParams({ ...searchParams, date: formattedDate });
        }
    };

    // Truncate title if it exceeds 40 characters
    const truncateTitle = (title) => {
        return title.length > 40 ? title.slice(0, 40) + "..." : title;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "orange" }}>
            <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>
                    Minutes Records
                </Text>

                {minutesRecords.length > 0 &&
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
                        <TextInput
                            style={[stylesConfig.INPUT, {
                                backgroundColor: colors.inputBackground,
                                color: colors.text,
                            }]}
                            placeholder="Title or description"
                            placeholderTextColor={colors.placeholder}
                            value={searchParams.titleOrDescription}
                            onChangeText={(text) =>
                                setSearchParams({ ...searchParams, titleOrDescription: text })
                            }
                        />

                        <View style={{ flexDirection: "row", marginTop: 10, justifyContent: 'center' }}>
                            <Pressable
                                style={[stylesConfig.INPUT, {
                                    flex: 1,
                                    backgroundColor: colors.inputBackground,
                                    borderColor: colors.inputBackground,
                                    borderWidth: 1,
                                    justifyContent: "center",
                                    paddingVertical: 12,
                                }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={{ color: selectedDate ? colors.text : colors.placeholder }}>
                                    {selectedDate || "Select Date"}
                                </Text>
                            </Pressable>

                            {selectedDate && (
                                <Pressable
                                    onPress={() => {
                                        setSelectedDate(null);
                                        setSearchParams({ ...searchParams, date: "" });
                                    }}
                                    style={{
                                        marginLeft: 10,
                                        paddingVertical: 12,
                                        paddingHorizontal: 12,
                                        backgroundColor: colors.border,
                                        borderRadius: 6,
                                        marginBottom: 16,
                                    }}
                                >
                                    <Text style={{ color: colors.text }}>Clear</Text>
                                </Pressable>
                            )}
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate ? new Date(selectedDate) : new Date()}
                                mode="date"
                                display="default"
                                onChange={onChangeDate}
                            />
                        )}

                        <Pressable
                            style={[stylesConfig.BUTTON, {
                                backgroundColor: colors.primary,
                                marginTop: 10,
                                flexDirection: 'row',
                                columnGap: 10,
                                justifyContent: 'center',
                            }]}
                            onPress={handleSearch}
                        >
                            {loading && <ActivityIndicator color={colors.mainButtonText} />}
                            <Text style={{ color: colors.mainButtonText }}>
                                {loading ? 'Searching...' : 'Search'}
                            </Text>
                        </Pressable>
                    </View>
                )}

                {loading ? (
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.text, marginTop: 10 }}>Loading minutes records...</Text>
                    </View>
                ) : minutesRecords.length > 0 ? (
                    <FlatList
                        data={minutesRecords}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <Pressable
                                style={[stylesConfig.CARD, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.secondary,
                                }]}
                                onPress={() => navigation.navigate("minutes", { id: item._id })}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.text, fontWeight: "bold" }}>
                                        {truncateTitle(item.title)}
                                    </Text>
                                    <Text style={{ color: colors.text, textAlign: 'right' }}>
                                        {moment(item.createdAt).format('MMMM DD, YYYY')}
                                    </Text>
                                </View>
                            </Pressable>
                        )}
                    />
                ) : (
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: colors.text, marginTop: 10 }}>
                            There are no minutes records to display.
                        </Text>
                    </View>
                )}

                {totalPages > 1 && (
                    <View style={stylesConfig.PAGINATION}>
                        <Pressable
                            style={[stylesConfig.PAGE_BUTTON, {
                                backgroundColor: currentPage === 1 ? colors.border : colors.primary,
                            }]}
                            onPress={handlePreviousPage}
                            disabled={currentPage === 1}
                        >
                            <Text style={{ color: colors.mainButtonText }}>Previous</Text>
                        </Pressable>

                        <Text style={{ color: colors.text }}>
                            Page {currentPage} of {totalPages}
                        </Text>

                        <Pressable
                            style={[stylesConfig.PAGE_BUTTON, {
                                backgroundColor: currentPage === totalPages ? colors.border : colors.primary,
                                minWidth: 85,
                                alignItems: 'center',
                            }]}
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