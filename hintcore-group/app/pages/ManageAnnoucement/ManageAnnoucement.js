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

const ManageAnnouncement = ({ route, navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const { id } = route.params;

    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({
        visible: false,
        type: '',
        message: ''
    });
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const response = await privateAxios.get(`/private/manage-announcement/${id}`);
                setAnnouncement(response.data);
            } catch (error) {
                setNotification({
                    visible: true,
                    type: 'error',
                    message: 'Failed to fetch announcement.',
                });
                setTimeout(() => {
                    setNotification({
                        visible: false,
                        type: '',
                        message: '',
                    });
                }, 3000);
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncement();
    }, [id]);

    const handleDelete = async () => {
        setConfirmDelete(true); // Show ConfirmDialog
    };

    const confirmDeleteAction = async () => {
        try {
            await privateAxios.delete(`/private/delete-announcement/${id}`);
            setNotification({
                visible: true,
                type: 'success',
                message: 'Announcement deleted successfully.',
            });
            setTimeout(() => {
                setNotification({ visible: false, type: '', message: '' });
                navigation.navigate('manage-announcements');
            }, 3000);
        } catch (error) {
            setNotification({
                visible: true,
                type: 'error',
                message: 'Failed to delete announcement.',
            });
        } finally {
            setConfirmDelete(false); // Close ConfirmDialog
        }
    };

    const handleCancelDelete = () => {
        setConfirmDelete(false); // Close ConfirmDialog without deleting
    };

    return (
        <View style={{ flex: 1 }}>
            {loading ?
                <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View> :
                announcement ?
                    <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                        <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                        <Text style={[styles.SETTINGS_STYLES.header, { color: colors.text }]}>
                            {announcement.title}
                        </Text>

                        <View style={{ display: 'flex', flexDirection: 'row', columnGap: 5, borderBottomColor: colors.placeholder, borderBottomWidth: .5 }}>
                            <Text style={{ fontWeight: 'bold', color: colors.text  }}>Created On:</Text>
                            <Text style={{ color: colors.placeholder, marginBottom: 10 }}>{moment(announcement.createdAt).isValid() ? moment(announcement.createdAt).format('MMMM D, YYYY') : 'Invalid Date'}</Text>

                        </View>

                        <ScrollView style={{ borderBottomColor: colors.placeholder, borderBottomWidth: .5 }}>
                            <Text style={{ fontSize: 16, color: colors.text, marginVertical: 20 }}>
                                {announcement.body || "No content available."}
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
                                onPress={() => navigation.navigate("manage-edit-announcement", { id })}
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

                        {/* Confirm Dialog for Deletion */}
                        <ConfirmDialog
                            visible={confirmDelete}
                            title="Delete Announcement"
                            message="Are you sure you want to delete this announcement?"
                            onConfirm={confirmDeleteAction}
                            onCancel={handleCancelDelete}
                        />
                    </View> :

                    <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: colors.text }}>Announcement not found.</Text>
                    </View>
            }
            <Footer />
        </View>
    );
};

export default ManageAnnouncement;