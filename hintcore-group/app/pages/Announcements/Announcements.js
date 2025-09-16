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

const Announcements = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const [announcements, setAnnouncements] = useState([]);
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

    const fetchAnnouncements = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const response = await privateAxios.get(`/private/announcements?page=${pageNumber}`);
            setAnnouncements(response.data.announcements || []);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(pageNumber);
        } catch (error) {
            showError("Failed to fetch announcements.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSearchedAnnouncements = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const query = new URLSearchParams({ ...searchParams, page: pageNumber });
            const response = await privateAxios.get(`/private/search-announcements?${query}`);
            setAnnouncements(response.data.announcements || []);
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
        fetchSearchedAnnouncements(1);
    };

    const showError = (msg) => {
        setNotification({ visible: true, type: "error", message: msg });
        setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            searchMode ? fetchSearchedAnnouncements(nextPage) : fetchAnnouncements(nextPage);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            searchMode ? fetchSearchedAnnouncements(prevPage) : fetchAnnouncements(prevPage);
        }
    };

    useEffect(() => {        
        fetchAnnouncements(1);
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

    // Truncate title if it exceeds 20 characters
    const truncateTitle = (title) => {
        return title.length > 40 ? title.slice(0, 40) + "..." : title;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "orange" }}>
            <View
                style={[
                    stylesConfig.SETTINGS_STYLES.container,
                    { backgroundColor: colors.background },
                ]}
            >
                <Notification
                    visible={notification.visible}
                    type={notification.type}
                    message={notification.message}
                />

                <Text
                    style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}
                >
                    Announcements
                </Text>

                {/* Search Options */}
                {announcements.length > 0 && 
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

                {loading ? (
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center', }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.text, marginTop: 10 }}>Loading Announcements...</Text>
                    </View>
                ) : announcements.length > 0 ? (
                    <FlatList
                        data={announcements}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <Pressable
                                style={[
                                    stylesConfig.CARD,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: colors.secondary,
                                    },
                                ]}
                                onPress={() =>
                                    navigation.navigate("announcement", { id: item._id })
                                }
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.text, fontWeight: "bold" }}>{truncateTitle(item.title)}</Text>
                                    <Text style={{ color: colors.text, textAlign: 'right' }}>{moment(item.createdAt).format('MMMM DD, YYYY')}</Text>
                                </View>
                            </Pressable>
                        )}
                    />
                ) :
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center', }}>
                        <Text style={{ color: colors.text, marginTop: 10 }}>There are no announcements to display.</Text>
                    </View>
                }

                {/* Pagination */}
                {totalPages > 1 &&
                    <View style={stylesConfig.PAGINATION}>
                        <Pressable
                            style={[
                                stylesConfig.PAGE_BUTTON,
                                {
                                    backgroundColor:
                                        currentPage === 1 ? colors.border : colors.primary,
                                },
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
                                        currentPage === totalPages
                                            ? colors.border
                                            : colors.primary, minWidth: 85, alignItems: 'center'
                                },
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

export default Announcements;