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

const ManageAccounts = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [datePickerMode, setDatePickerMode] = useState(null); // "start" or "end"
    const [dueStart, setDueStart] = useState(null);
    const [dueEnd, setDueEnd] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [searchOptions, setSearchOptions] = useState(true);
    const [searchMode, setSearchMode] = useState(false);
    const [searchParams, setSearchParams] = useState({
        titleOrContent: "",
        startDate: "",
        endDate: "",
        types: [],
        minAmount: "",
        maxAmount: "",
        published: "",
        dueStart: "",
        dueEnd: "",
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

    const fetchSearchedAccounts = async (pageNumber = 1) => {
        try {
            setLoading(true);
            setSearchOptions(false);
            setAccounts([]);
            const query = new URLSearchParams({
                ...searchParams,
                types: searchParams.types.join(","),
                page: pageNumber,
            });
            const response = await privateAxios.get(`/private/manage-search-accounts?${query}`);
            setAccounts(response.data.payments || []);
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
        setSearchMode(true);
        fetchSearchedAccounts(1);
    };

    const toggleType = (type) => {
        setSearchParams((prev) => {
            const exists = prev.types.includes(type);
            return {
                ...prev,
                types: exists
                    ? prev.types.filter((t) => t !== type)
                    : [...prev.types, type],
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
            searchMode ? fetchSearchedAccounts(nextPage) : fetchAccounts(nextPage);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            searchMode ? fetchSearchedAccounts(prevPage) : fetchAccounts(prevPage);
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
            if (lowerKey === "duedate") return "Due Date";
            if (lowerKey === "createdby") return "Created By";
            if (lowerKey === "updatedat") return "Updated At";
            if (lowerKey === "totalpaidmembers") return "Total Paid Members";
            if (lowerKey === "totalunpaidmembers") return "Total Unpaid Members";
            if (lowerKey === "totalamountpaid") return "Total Amount Paid";

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
        const fileUri = FileSystem.cacheDirectory + "accounts.csv";
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
                            {searchOptions ? "Hide Filter" : "Filter Account"}
                        </Text>
                    </Pressable>


                    {/* Search Form */}
                    {searchOptions && (
                        <View style={{ marginVertical: 10 }}>
                            {/* Title / Content */}
                            <TextInput
                                style={[
                                    stylesConfig.INPUT,
                                    { backgroundColor: colors.inputBackground, color: colors.text },
                                ]}
                                placeholder="Title or content"
                                placeholderTextColor={colors.placeholder}
                                value={searchParams.titleOrContent}
                                onChangeText={(text) =>
                                    setSearchParams((prev) => ({ ...prev, titleOrContent: text }))
                                }
                            />

                            {/* Payment Type (existing) */}
                            <View
                                style={{
                                    marginTop: 10,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    borderRadius: 5,
                                    padding: 10,
                                }}
                            >
                                <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 10 }}>
                                    Payment Type
                                </Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                    {["required", "contribution", "donation"].map((type) => (
                                        <Pressable
                                            key={type}
                                            onPress={() => toggleType(type)}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                marginRight: 15,
                                                marginBottom: 8,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    borderRadius: 5,
                                                    backgroundColor: searchParams.types.includes(type)
                                                        ? colors.primary
                                                        : "transparent",
                                                    marginRight: 5,
                                                }}
                                            />
                                            <Text style={{ color: colors.text }}>{`${type[0].toUpperCase() + type.slice(1)}`}</Text>
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
                                    onChangeText={(text) =>
                                        setSearchParams((prev) => ({ ...prev, minAmount: text }))
                                    }
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
                                    onChangeText={(text) =>
                                        setSearchParams((prev) => ({ ...prev, maxAmount: text }))
                                    }
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

                            {/* Due Date Range */}
                            <View style={{ marginTop: 10 }}>
                                <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 5 }}>
                                    Due Date
                                </Text>
                                <View style={{ flexDirection: "row", columnGap: 10 }}>
                                    {/* Due Start */}
                                    <Pressable
                                        style={[stylesConfig.INPUT, { flex: 1, justifyContent: "center", backgroundColor: colors.inputBackground }]}
                                        onPress={() => {
                                            setDatePickerMode("dueStart");
                                            setShowDatePicker(true);
                                        }}
                                    >
                                        <Text style={{ color: colors.text }}>{dueStart || "Select Due Start"}</Text>
                                    </Pressable>

                                    {/* Due End */}
                                    <Pressable
                                        style={[stylesConfig.INPUT, { flex: 1, justifyContent: "center", backgroundColor: colors.inputBackground }]}
                                        onPress={() => {
                                            setDatePickerMode("dueEnd");
                                            setShowDatePicker(true);
                                        }}
                                    >
                                        <Text style={{ color: colors.text }}>{dueEnd || "Select Due End"}</Text>
                                    </Pressable>
                                    {/* Clear Due Date */}
                                {(dueStart || dueEnd) && (
                                    <Pressable
                                        onPress={() => {
                                            setDueStart(null);
                                            setDueEnd(null);
                                            setSearchParams((prev) => ({ ...prev, dueStart: "", dueEnd: "" }));
                                        }}
                                        style={[stylesConfig.BUTTON, { marginBottom: 15, justifyContent: 'center', backgroundColor: colors.border }]}
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

                            {/* Group ID */}
                            {/* <TextInput
                                style={[
                                    stylesConfig.INPUT,
                                    { marginTop: 10, backgroundColor: colors.inputBackground, color: colors.text },
                                ]}
                                placeholder="Group ID"
                                placeholderTextColor={colors.placeholder}
                                value={searchParams.groupId}
                                onChangeText={(text) =>
                                    setSearchParams((prev) => ({ ...prev, groupId: text }))
                                }
                            /> */}

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
                                onPress={handleSearch}
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
        <Pressable
            style={[
                stylesConfig.CARD,
                { borderColor: colors.border, backgroundColor: colors.secondary },
            ]}
            onPress={() => navigation.navigate('manage-account', { id: item._id, accountType: item.type })}
        >
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
        </Pressable>
    );

    const ListEmptyComponent = () => {
        if (loading) {
            return (
                <View style={{ alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text, marginTop: 10 }}>
                        Loading Accounts...
                    </Text>
                </View>
            );
        }
        return (
            <View style={{ alignItems: "center", justifyContent: "center", padding: 20 }}>
                <Text style={{ color: colors.text, marginTop: 10 }}>
                    There are no accounts to display.
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
                        <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>
                            Manage Accounts
                        </Text>
                        <Pressable
                            style={{
                                backgroundColor: colors.primary,
                                borderRadius: 5,
                                justifyContent: "center",
                                alignItems: "center",
                                padding: 5,
                                height: 30,
                            }}
                            onPress={() => exportToCSV(accounts)}
                        >
                            <Text style={{ color: colors.mainButtonText }}>Export This Record</Text>
                        </Pressable>
                    </View>
                </View>

                <FlatList
                    data={accounts}
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

export default ManageAccounts;
