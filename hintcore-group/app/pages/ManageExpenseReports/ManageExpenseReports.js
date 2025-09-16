import React, { useMemo, useState } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import Footer from "../../components/Footer/Footer";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const ManageExpenseReports = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [datePickerMode, setDatePickerMode] = useState(null); // "start" or "end"
    const [dueStart, setDueStart] = useState(null);
    const [dueEnd, setDueEnd] = useState(null);
    const [expenseReports, setExpenseReports] = useState([]);
    const [searchOptions, setSearchOptions] = useState(true);
    const [searchParams, setSearchParams] = useState({
        titleOrDescription: "",
        startDate: "",
        endDate: "",
        minAmount: "",
        maxAmount: "",
        published: "",
        createdBy: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({
        visible: false,
        type: "",
        message: "",
    });

    const fetchSearchedExpenseReports = async (pageNumber = 1) => {
        try {
            setLoading(true);
            setSearchOptions(false);
            setExpenseReports([]);

            // Remove commas from numeric values before sending to backend
            const sanitizedParams = {
                ...searchParams,
                minAmount: searchParams.minAmount.replace(/,/g, ''),
                maxAmount: searchParams.maxAmount.replace(/,/g, ''),
                page: pageNumber
            };

            const query = new URLSearchParams(sanitizedParams);

            const response = await privateAxios.get(`/private/manage-search-expense-reports?${query}`);
            setExpenseReports(response.data.expenses || []);
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
                setSearchParams((prev) => ({ ...prev, startDate: formattedDate }));
            } else if (datePickerMode === "end") {
                setEndDate(formattedDate);
                setSearchParams((prev) => ({ ...prev, endDate: formattedDate }));
            } else if (datePickerMode === "dueStart") {
                setDueStart(formattedDate);
                setSearchParams((prev) => ({ ...prev, dueStart: formattedDate }));
            } else if (datePickerMode === "dueEnd") {
                setDueEnd(formattedDate);
                setSearchParams((prev) => ({ ...prev, dueEnd: formattedDate }));
            }
        }
    };

    const handleSearch = () => {
        fetchSearchedExpenseReports(1);
    };

    const showError = (msg) => {
        setNotification({ visible: true, type: "error", message: msg });
        setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            fetchSearchedExpenseReports(nextPage);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            fetchSearchedExpenseReports(prevPage);
        }
    };

    const exportToCSV = async (data) => {
        if (!data || data.length === 0) {
            alert("No records to export.");
            return;
        }

        // Collect all unique keys from all records, but exclude "_id"
        const allKeys = Array.from(
            new Set(data.flatMap((obj) => Object.keys(obj)))
        ).filter((key) => key !== "_id");

        // Transform headers
        const formattedHeaders = allKeys.map((key) => {
            const lowerKey = key.toLowerCase();

            if (lowerKey === "createdat") return "Created At";
            if (lowerKey === "createdby") return "Created By";
            if (lowerKey === "updatedat") return "Updated At";

            // Generic: convert camelCase → "Camel Case"
            return key
                .replace(/([a-z])([A-Z])/g, "$1 $2")
                .replace(/^./, (str) => str.toUpperCase());
        });

        // Build header row
        const header = formattedHeaders.join(",") + "\n";

        // Build rows
        const rows = data.map((obj) =>
            allKeys
                .map((key) => {
                    let val = obj[key];

                    // Handle objects (e.g., createdBy)
                    if (val && typeof val === "object" && !Array.isArray(val)) {
                        if (val.fullName) {
                            val = val.fullName;
                        } else if (val.email) {
                            val = val.email;
                        } else {
                            val = JSON.stringify(val);
                        }
                    }

                    // Format only if it's an actual Date or ISO string
                    if (
                        val &&
                        (val instanceof Date ||
                            moment(val, moment.ISO_8601, true).isValid()) &&
                        (key.toLowerCase().includes("date") ||
                            key.toLowerCase().endsWith("at"))
                    ) {
                        val = moment(val).format("YYYY-MM-DD HH:mm:ss");
                    }

                    // Escape commas/quotes in text
                    if (typeof val === "string") {
                        val = `"${val.replace(/"/g, '""')}"`;
                    }

                    return val !== undefined && val !== null ? val : "";
                })
                .join(",")
        );

        const csv = header + rows.join("\n");

        // Save to file
        const fileUri = FileSystem.cacheDirectory + "Expense-Reports.csv";
        await FileSystem.writeAsStringAsync(fileUri, csv, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        // Share or show path
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        } else {
            alert("Exported to: " + fileUri);
        }
    };

    const truncateTitle = (title) => {
        return title.length > 25 ? title.slice(0, 25) + "..." : title;
    };

    const formatWithCommas = (value) => {
        const numericValue = value.replace(/,/g, ''); // remove existing commas
        if (!numericValue) return '';
        return parseFloat(numericValue).toLocaleString('en-US');
    };


    const memoizedRenderListSearch = useMemo(() => {
        return (
            <View style={[{ backgroundColor: colors.background, paddingBottom: 20 }]}>
                <View>
                    {/* Search Options Toggle */}

                    <Pressable
                        style={[stylesConfig.BUTTON, { backgroundColor: colors.primary, marginTop: 10 }]}
                        onPress={() => setSearchOptions(!searchOptions)}
                    >
                        <Text style={{ color: colors.mainButtonText }}>
                            {searchOptions ? "Hide Filter" : "Filter Expense Reports"}
                        </Text>
                    </Pressable>


                    {/* Search Form */}
                    {searchOptions && (
                        <View style={{ marginVertical: 10 }}>
                            {/* Title / Description */}
                            <TextInput
                                style={[
                                    stylesConfig.INPUT,
                                    { backgroundColor: colors.inputBackground, color: colors.text },
                                ]}
                                placeholder="Title or description"
                                placeholderTextColor={colors.placeholder}
                                value={searchParams.titleOrDescription}
                                onChangeText={(text) =>
                                    setSearchParams((prev) => ({ ...prev, titleOrDescription: text }))
                                }
                            />

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

                            {/* CreatedAt Date Range */}
                            <View style={{ marginTop: 10 }}>
                                <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 5 }}>
                                    Created At
                                </Text>
                                <View style={{ flexDirection: "row", columnGap: 10 }}>
                                    {/* Start Date */}
                                    <Pressable
                                        style={[stylesConfig.INPUT, { flex: 1, justifyContent: "center", backgroundColor: colors.inputBackground }]}
                                        onPress={() => {
                                            setDatePickerMode("start");
                                            setShowDatePicker(true);
                                        }}
                                    >
                                        <Text style={{ color: colors.text }}>{startDate || "Select Start"}</Text>
                                    </Pressable>

                                    {/* End Date */}
                                    <Pressable
                                        style={[stylesConfig.INPUT, { flex: 1, justifyContent: "center", backgroundColor: colors.inputBackground }]}
                                        onPress={() => {
                                            setDatePickerMode("end");
                                            setShowDatePicker(true);
                                        }}
                                    >
                                        <Text style={{ color: colors.text }}>{endDate || "Select End"}</Text>
                                    </Pressable>

                                    {/* Clear CreatedAt */}
                                    {(startDate || endDate) && (
                                        <Pressable
                                            onPress={() => {
                                                setStartDate(null);
                                                setEndDate(null);
                                                setSearchParams((prev) => ({ ...prev, startDate: "", endDate: "" }));
                                            }}
                                            style={[stylesConfig.BUTTON, { backgroundColor: colors.border, marginBottom: 15, justifyContent: 'center' }]}
                                        >
                                            <Text style={{ color: colors.text }}>Clear</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>

                            {/* Created By */}
                            <TextInput
                                style={[
                                    stylesConfig.INPUT,
                                    { marginTop: 10, backgroundColor: colors.inputBackground, color: colors.text },
                                ]}
                                placeholder="Created By (Name)"
                                placeholderTextColor={colors.placeholder}
                                value={searchParams.createdBy}
                                onChangeText={(text) =>
                                    setSearchParams((prev) => ({ ...prev, createdBy: text }))
                                }
                            />

                            {/* Search Button */}
                            <Pressable
                                style={[
                                    stylesConfig.BUTTON,
                                    {
                                        backgroundColor: loading
                                            ? colors.border
                                            : colors.primary,
                                        marginTop: 15,
                                    },
                                ]}
                                disabled={loading}
                                onPress={() => { handleSearch(); setSearchOptions(false); }}
                            >
                                <Text style={{ color: colors.mainButtonText }}>
                                    {loading ? "Searching..." : "Search"}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        );
    }, [searchOptions, searchParams, loading, colors]);

    // Footer component: pagination & footer
    const renderListFooter = () => (
        <View style={{ backgroundColor: colors.background }}>
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
                    <Text style={{ color: colors.text, marginHorizontal: 10 }}>
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
    );

    const renderItem = ({ item }) => (
        <View style={[stylesConfig.CARD, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "bold" }}>
                    {truncateTitle(item.title)}
                </Text>
                <Text style={{ color: colors.text, textAlign: "right" }}>
                    {moment(item.createdAt).format("MMMM DD, YYYY")}
                </Text>

                <View style={{ flexDirection: "row", columnGap: 10, marginTop: 5 }}>
                    {!item.published && (
                        <Text style={{ color: "#dc3545", fontSize: 12 }}>Unpublished</Text>
                    )}
                    {!item.published && item.type && (
                        <Text style={{ color: "#dc3545", fontSize: 12 }}>|</Text>
                    )}
                    {item.type && (
                        <Text style={{ color: "#dc3545", fontSize: 12 }}>
                            {item.type[0].toUpperCase() + item.type.slice(1)}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );

    const ListEmptyComponent = () => {
        if (loading) {
            return (
                <View style={{ alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text, marginTop: 10 }}>
                        Loading Expense Reports...
                    </Text>
                </View>
            );
        }
        return (
            <View style={{ alignItems: "center", justifyContent: "center", padding: 20 }}>
                <Text style={{ color: colors.text, marginTop: 10 }}>
                    There are no expense reports to display.
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[stylesConfig.SETTINGS_STYLES.container, { flex: 1, backgroundColor: colors.background, }]}>
                <View>
                    <Notification
                        visible={notification.visible}
                        type={notification.type}
                        message={notification.message}
                    />

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text, flexShrink: 1 }]}>Manage Expense Reports</Text>
                        <Pressable
                            style={{
                                backgroundColor: colors.primary,
                                borderRadius: 5,
                                justifyContent: "center",
                                alignItems: "center",
                                padding: 5,
                                height: 30,
                            }}
                            onPress={() => exportToCSV(expenseReports)}
                        >
                            <Text style={{ color: colors.mainButtonText }}>Export This Record</Text>
                        </Pressable>
                    </View>
                </View>

                <FlatList
                    data={expenseReports}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    ListHeaderComponent={memoizedRenderListSearch}
                    ListFooterComponent={renderListFooter}
                    ListEmptyComponent={ListEmptyComponent}
                    contentContainerStyle={{ flexGrow: 1 }}
                // flexGrow:1 ensures that empty case's centering works
                />
                {showDatePicker && (
                    <DateTimePicker
                        value={new Date()}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                    />
                )}

            </View>
            <Footer />
        </SafeAreaView>
    );
};

export default ManageExpenseReports;