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
import DateTimePicker from "@react-native-community/datetimepicker";

const Payments = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [datePickerMode, setDatePickerMode] = useState(null); // "start" or "end"
    const [payments, setPayments] = useState([]);
    const [searchOptions, setSearchOptions] = useState(false);
    const [searchMode, setSearchMode] = useState(false);
    const [searchParams, setSearchParams] = useState({ titleOrDescription: "", startDate: "", minAmount: "", maxAmount: "", endDate: "", types: [] });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: "", message: "" });

    const fetchPayments = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const response = await privateAxios.get(`/private/payments?page=${pageNumber}`);
            setInitialLoaded(true);
            setPayments(response.data.payments || []);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(pageNumber);
        } catch (error) {
            if (error?.response?.data?.message) {
                showError(error?.response?.data?.message || "Failed to fetch payments.");
            }
            if (__DEV__) console.error(error)
        } finally {
            setLoading(false);
        }
    };

    const fetchSearchedPayments = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const sanitizedParams = {
                ...searchParams,
                minAmount: searchParams.minAmount.replace(/,/g, ''),
                maxAmount: searchParams.maxAmount.replace(/,/g, ''),
                types: searchParams.types.join(","),
                page: pageNumber
            };

            const query = new URLSearchParams(sanitizedParams).toString();
            setPayments([]);
            const response = await privateAxios.get(`/private/search-payments?${query}`);
            setPayments(response.data.payments || []);
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
        fetchSearchedPayments(1);
    };

    const toggleType = (type) => {
        setSearchParams((prev) => {
            const exists = prev.types.includes(type);
            return {
                ...prev,
                types: exists ? prev.types.filter((t) => t !== type) : [...prev.types, type],
            };
        });
    };

    const showError = (msg) => {
        setNotification({ visible: true, type: "error", message: msg });
        setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            searchMode ? fetchSearchedPayments(nextPage) : fetchPayments(nextPage);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            searchMode ? fetchSearchedPayments(prevPage) : fetchPayments(prevPage);
        }
    };

    const truncateTitle = (title) => {
        return title.length > 25 ? title.slice(0, 25) + "..." : title;
    };

    const formatWithCommas = (value) => {
        const numericValue = value.replace(/,/g, '');
        if (!numericValue) return '';
        return parseFloat(numericValue).toLocaleString('en-US');
    };

    useEffect(() => {
        fetchPayments(1);
    }, []);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>Payments</Text>
                </View>

                {/* Search Options */}
                {initialLoaded &&
                    <Pressable
                        style={[stylesConfig.BUTTON, { backgroundColor: colors.primary }]}
                        onPress={() => setSearchOptions(!searchOptions)}
                    >
                        <Text style={{ color: colors.mainButtonText }}>
                            {searchOptions ? "Hide Filter Options" : "Filter Payments"}
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

                        <View style={{ marginTop: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 5 }}>
                            <Text style={{ color: colors.text, fontWeight: 'bold', marginBottom: 15 }}>Payment Type</Text>
                            <View style={{ flexDirection: "row", columnGap: 20, flexWrap: 'wrap' }}>
                                {["required", "contribution", "donation"].map((type) => (
                                    <Pressable
                                        key={type}
                                        onPress={() => toggleType(type)}
                                        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
                                    >
                                        <View
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderWidth: 1,
                                                borderRadius: 5,
                                                borderColor: colors.border,
                                                backgroundColor: searchParams.types.includes(type)
                                                    ? colors.primary
                                                    : "transparent",
                                                marginRight: 5,
                                            }}
                                        />
                                        <Text style={{ color: colors.text }}>{type === 'required' ? 'Paymemt' : type[0].toUpperCase() + type.slice(1)}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Amount Range */}
                        <View style={{ flexDirection: "row", marginTop: 10, columnGap: 10 }}>
                            <TextInput
                                style={[
                                    stylesConfig.INPUT,
                                    { flex: 1, backgroundColor: colors.inputBackground, color: colors.text },
                                ]}
                                placeholder="Min Amount"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="numeric"
                                value={searchParams.minAmount}
                                onChangeText={(text) => {
                                    const formatted = formatWithCommas(text);
                                    setSearchParams((prev) => ({ ...prev, minAmount: formatted }));
                                }}
                            />
                            <TextInput
                                style={[
                                    stylesConfig.INPUT,
                                    { flex: 1, backgroundColor: colors.inputBackground, color: colors.text },
                                ]}
                                placeholder="Max Amount"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="numeric"
                                value={searchParams.maxAmount}
                                onChangeText={(text) => {
                                    const formatted = formatWithCommas(text);
                                    setSearchParams((prev) => ({ ...prev, maxAmount: formatted }));
                                }}
                            />
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
                            disabled={loading}
                            onPress={() => { handleSearch(); setSearchOptions(false); }}
                        >
                            <Text style={{ color: colors.mainButtonText }}>{loading ? 'Searching...' : 'Search'}</Text>
                        </Pressable>
                    </View>
                )}

                {/* List */}
                {loading ? (
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center', }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.text, marginTop: 10 }}>Loading Payments...</Text>
                    </View>
                ) :
                    payments.length > 0 ? (
                        <FlatList
                            data={payments}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={[stylesConfig.CARD, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                                    onPress={() => navigation.navigate("payment", { id: item._id, paymentType: item?.type === 'required' ? 'Payment' : item?.type })}
                                >

                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: colors.text, fontWeight: "bold" }}>{truncateTitle(item.title)}</Text>
                                        <Text style={{ color: colors.text, textAlign: 'right' }}>{moment(item.createdAt).format('MMMM DD, YYYY')}</Text>
                                    </View>
                                </Pressable>
                            )}
                        />) :
                        <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center', }}>
                            <Text style={{ color: colors.text, marginTop: 10 }}>There are no payments to display.</Text>
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

export default Payments;