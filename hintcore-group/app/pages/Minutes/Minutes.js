import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import moment from 'moment';
import { useSelector } from "react-redux";
import privateAxios from "../../utils/axios/privateAxios";
import styles from "../../styles/styles";
import Notification from '../../components/Notification/Notification';
import Footer from "../../components/Footer/Footer";

const Minutes = ({ route, navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const { id } = route.params;

    const [minutes, setMinutes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({
        visible: false,
        type: '',
        message: ''
    });

    useEffect(() => {
        const fetchMinutes = async () => {
            try {
                const response = await privateAxios.get(`/private/minutes/${id}`);
                setMinutes(response.data);
            } catch (error) {
                setNotification({
                    visible: true,
                    type: 'error',
                    message: 'Failed to fetch minutes.',
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

        fetchMinutes();
    }, [id]);

    return (
        <View style={{ flex: 1 }}>
            {loading ?
                <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View> :
                minutes ?
                    <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                        <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                        <Text style={[styles.SETTINGS_STYLES.header, { color: colors.text }]}>
                            {minutes.title}
                        </Text>

                        <View style={{ display: 'flex', flexDirection: 'row', columnGap: 5, borderBottomColor: colors.placeholder, borderBottomWidth: 0.5 }}>
                            <Text style={{ fontWeight: 'bold', color: colors.text }}>Created On:</Text>
                            <Text style={{ color: colors.placeholder, marginBottom: 10 }}>
                                {moment(minutes.createdAt).isValid() ? moment(minutes.createdAt).format('MMMM D, YYYY') : 'Invalid Date'}
                            </Text>
                        </View>

                        <ScrollView>
                            <Text style={{ fontSize: 16, color: colors.text, marginVertical: 20 }}>
                                {minutes.body || "No content available."}
                            </Text>
                        </ScrollView>
                    </View> :

                    <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: colors.text }}>Minutes not found.</Text>
                    </View>
            }
            <Footer />
        </View>
    );
};

export default Minutes;