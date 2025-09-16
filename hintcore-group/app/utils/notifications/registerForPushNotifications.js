import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

const registerForPushNotificationsAsync = async () => {
    let token;

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            console.warn("Push notification permissions not granted.");
            return null;
        }

        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Expo Push Token:", token);
    } else {
        console.warn("Push notifications require a physical device.");
        return null;
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
        });
    }

    return token;
}

export default registerForPushNotificationsAsync;