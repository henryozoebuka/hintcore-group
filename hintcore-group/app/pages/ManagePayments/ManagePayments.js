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

const ManagePayments = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [datePickerMode, setDatePickerMode] = useState(null); // "start" or "end"
    const [payments, setPayments] = useState([]);
    const [selectedPayments, setSelectedPayments] = useState([]);
    const [searchOptions, setSearchOptions] = useState(false);
    const [searchMode, setSearchMode] = useState(false);
    const [searchParams, setSearchParams] = useState({ titleOrContent: "", startDate: "", endDate: "", types: [] });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: "", message: "" });

    const fetchPayments = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const response = await privateAxios.get(`/private/manage-payments?page=${pageNumber}`);
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

            const query = new URLSearchParams({
                ...searchParams,
                types: searchParams.types.join(','),
                page: pageNumber,
            });

            const response = await privateAxios.get(`/private/manage-search-payments?${query}`);
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

    const handleCheckbox = (id) => {
        setSelectedPayments((prev) =>
            prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id]
        );
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

    const confirmDeleteSelected = () => {
        if (!selectedPayments.length) return;
        Alert.alert("Delete", `Delete ${selectedPayments.length} selected payment${selectedPayments.length > 1 ? 's' : ''}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        setActionLoading(true);
                        await privateAxios.post("/private/manage-delete-payments", { ids: selectedPayments });
                        setSelectedPayments([]);
                        searchMode ? fetchSearchedPayments(currentPage) : fetchPayments(currentPage);
                    } catch (error) {
                        if (error?.response?.data?.message) {
                            showError(error?.response?.data?.message || "Failed to fetch payments.");
                        }
                        if (__DEV__) console.error(error)
                    } finally {
                        setActionLoading(false);
                    }
                },
            },
        ]);
    };

    const confirmDeleteSingle = (id) => {
        Alert.alert("Delete", "Delete this payment?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        setSelectedPayments([]);
                        setActionLoading(true);
                        await privateAxios.delete(`/private/manage-delete-payment/${id}`);
                        searchMode ? fetchSearchedPayments(currentPage) : fetchPayments(currentPage);
                    } catch {
                        showError("Failed to delete payment.");
                    } finally {
                        setActionLoading(false);
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

    useEffect(() => {
        fetchPayments(1);
    }, []);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>Manage Payments</Text>
                </View>

                <Pressable
                    style={[stylesConfig.BUTTON, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate("create-payment")}
                >
                    <Text style={{ color: colors.mainButtonText }}>Create Payment</Text>
                </Pressable>

                {/* Search Options */}
                {payments.length > 0 &&
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

                        {/* DateTimePicker Component */}
                        <View>
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
                            disabled={loading || actionLoading}
                            onPress={handleSearch}
                        >
                            <Text style={{ color: colors.mainButtonText }}>{loading ? 'Searching...' : 'Search'}</Text>
                        </Pressable>
                    </View>
                )}

                {/* Delete Selected Button */}
                {payments.length > 0 && <Pressable
                    style={[
                        stylesConfig.BUTTON,
                        { backgroundColor: selectedPayments.length ? "#dc3545" : colors.border },
                    ]}
                    onPress={confirmDeleteSelected}
                    disabled={!selectedPayments.length}
                >
                    <Text style={{ color: "#fff" }}>Delete Selected</Text>
                </Pressable>}

                {/* List */}
                {loading ? (
                    <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center', }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.text, marginTop: 10 }}>Loading Payments...</Text>
                    </View>
                ) :
                    actionLoading ?
                        (<View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 99,
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: colors.secondary,
                                    padding: 20,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                }}
                            >
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={{ color: colors.text, marginTop: 10 }}>
                                    Deleting {`payment${selectedPayments.length > 1 ? 's' : ''}...`}
                                </Text>
                            </View>
                        </View>) :
                        payments.length > 0 ? (
                            <FlatList
                                data={payments}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={[stylesConfig.CARD, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                                        onPress={() => navigation.navigate("manage-payment", { id: item._id, paymentType: item?.type === 'required' ? 'Payment' : item?.type })}
                                    >
                                        {/* Checkbox */}
                                        <Pressable
                                            onPress={() => handleCheckbox(item._id)}
                                            style={[
                                                stylesConfig.CHECKBOX,
                                                {
                                                    backgroundColor: selectedPayments.includes(item._id)
                                                        ? colors.primary
                                                        : colors.background,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                        />

                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: colors.text, fontWeight: "bold" }}>{truncateTitle(item.title)}</Text>
                                            <Text style={{ color: colors.text, textAlign: 'right' }}>{moment(item.createdAt).format('MMMM DD, YYYY')}</Text>

                                            <View style={{ flexDirection: 'row', columnGap: 10 }}>
                                                {!item.published && (
                                                    <Text style={{ color: "#dc3545", fontSize: 12, marginTop: 5 }}>Unpublished</Text>
                                                )}
                                                {!item.published && item.type && (
                                                    <Text style={{ color: "#dc3545", fontSize: 12, marginTop: 5 }}>|</Text>
                                                )}
                                                {/* {item.required && ( */}
                                                <Text style={{ color: "#dc3545", fontSize: 12, marginTop: 5, }}> {item.type[0].toUpperCase() + item.type.slice(1)}</Text>
                                                {/* )} */}
                                            </View>
                                        </View>

                                        {/* Actions: Edit/Delete */}
                                        <View style={{ flexDirection: "row" }}>
                                            <Pressable
                                                style={[stylesConfig.SMALL_BUTTON]}
                                                onPress={() => navigation.navigate("manage-edit-payment", { id: item._id, paymentType: item.type === 'required' ? 'Payment' : item.type })}
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
                                <Text style={{ color: colors.text, marginTop: 10 }}>There are no payments to display.</Text>
                            </View>
                }
                {/* Pagination */}
                {totalPages > 1 &&
                    <View style={stylesConfig.PAGINATION}>
                        <Pressable
                            style={[
                                stylesConfig.PAGE_BUTTON,
                                { backgroundColor: currentPage === 1 || actionLoading ? colors.border : colors.primary },
                            ]}
                            onPress={handlePreviousPage}
                            disabled={currentPage === 1 || actionLoading}
                        >
                            <Text style={{ color: colors.mainButtonText }}>Previous</Text>
                        </Pressable>
                        <Text style={{ color: colors.text }}>
                            Page {currentPage} of {totalPages}
                        </Text>
                        <Pressable
                            style={[
                                stylesConfig.PAGE_BUTTON,
                                { backgroundColor: currentPage === totalPages || actionLoading ? colors.border : colors.primary, minWidth: 85, alignItems: 'center' },
                            ]}
                            onPress={handleNextPage}
                            disabled={currentPage === totalPages || actionLoading}
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

export default ManagePayments;