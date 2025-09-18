import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    Pressable,
    ScrollView,
} from "react-native";
import moment from 'moment';
import { useSelector } from "react-redux";
import privateAxios from "../../utils/axios/privateAxios";
import styles from "../../styles/styles";
import Notification from '../../components/Notification/Notification';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import Footer from "../../components/Footer/Footer";

const ManageMinutes = ({ route, navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const { id } = route.params;

    const [minutes, setMinutes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [notification, setNotification] = useState({
        visible: false,
        type: '',
        message: ''
    });
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        const fetchMinutes = async () => {
            try {
                const response = await privateAxios.get(`/private/manage-minutes/${id}`);
                setMinutes(response.data);
            } catch (error) {
                setNotification({
                    visible: true,
                    type: 'error',
                    message: 'Failed to fetch minutes record.',
                });
                setTimeout(() => {
                    setNotification({ visible: false, type: '', message: '' });
                }, 3000);
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchMinutes();
    }, [id]);

    const handleDelete = async () => {
        setConfirmDelete(true);
    };

    const confirmDeleteAction = async () => {
        try {
            setDeleteLoading(true);
            const response = await privateAxios.delete(`/private/delete-minutes/${id}`);
            setNotification({
                visible: true,
                type: 'success',
                message: response.data.message || 'Minutes record deleted successfully.',
            });
            setTimeout(() => {
                setNotification({ visible: false, type: '', message: '' });
                navigation.navigate('manage-minutes-records');
            }, 3000);
        } catch (error) {
            setNotification({
                visible: true,
                type: 'error',
                message: 'Failed to delete minutes record.',
            });
        } finally {
            setDeleteLoading(false);
            setConfirmDelete(false);
        }
    };
    const handleCancelDelete = () => {
        setConfirmDelete(false);
    };

    return (
        <View style={{ flex: 1 }}>
            {loading ? (
                <View style={{ backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text, marginTop: 10 }}>Loading minutes record...</Text>
                </View>
            ) : minutes ? (
                <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                    <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                    <Text style={[styles.SETTINGS_STYLES.header, { color: colors.text }]}>
                        {minutes.title}
                    </Text>

                    <View style={{ flexDirection: 'row', columnGap: 5, borderBottomColor: colors.placeholder, borderBottomWidth: 0.5 }}>
                        <Text style={{ fontWeight: 'bold', color: colors.text }}>Created On:</Text>
                        <Text style={{ color: colors.placeholder, marginBottom: 10 }}>
                            {moment(minutes.createdAt).isValid() ? moment(minutes.createdAt).format('MMMM D, YYYY') : 'Invalid Date'}
                        </Text>
                    </View>

                    <ScrollView style={{ borderBottomColor: colors.placeholder, borderBottomWidth: 0.5 }}>
                        <Text style={{ fontSize: 16, color: colors.text, marginVertical: 20 }}>
                            {minutes.body || "No content available."}
                        </Text>
                    </ScrollView>

                    <View style={{ marginTop: 20, flexDirection: "row", justifyContent: "space-between" }}>
                        <Pressable
                            style={{
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor: colors.primary,
                                alignItems: "center",
                                flex: 0.48,
                            }}
                            onPress={() => navigation.navigate("manage-edit-minutes", { id })}
                        >
                            <Text style={{ color: colors.mainButtonText }}>Edit</Text>
                        </Pressable>

                        <Pressable
                            style={{
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor: "#dc3545",
                                alignItems: "center",
                                flex: 0.48,
                            }}
                            onPress={handleDelete}
                        >
                            <Text style={{ color: "#fff" }}>Delete</Text>
                        </Pressable>
                    </View>

                    <ConfirmDialog
                        visible={confirmDelete}
                        title="Delete Minutes Record"
                        message={deleteLoading ? `Deleting ${minutes.title[0].toUpperCase() + minutes.title.slice(1)}` : `Are you sure you want to delete ${minutes.title[0].toUpperCase() + minutes.title.slice(1)}?`}
                        onConfirm={confirmDeleteAction}
                        onCancel={handleCancelDelete}
                    />
                </View>
            ) : (
                <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: colors.text }}>Minutes record not found.</Text>
                </View>
            )}
            <Footer />
        </View>
    );
};

export default ManageMinutes;