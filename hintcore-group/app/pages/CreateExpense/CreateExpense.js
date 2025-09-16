import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import privateAxios from "../../utils/axios/privateAxios";
import Notification from "../../components/Notification/Notification";
import { useSelector } from 'react-redux';
import { MaskedTextInput } from 'react-native-mask-text';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

const CreateExpense = ({ navigation }) => {
  const { colors } = useSelector((state) => state.colors);

  const [notification, setNotification] = useState({ visible: false, type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Expense form data
  const [data, setData] = useState({
    title: '',
    description: '',
    amount: '',
    published: false,
  });

  const handleChange = (value, key) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!data.title || !data.description) {
      setNotification({ visible: true, type: "error", message: "Title and description are required" });
      setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: data.title,
        description: data.description,
        amount: data.amount,
        published: data.published,
      };

      const response = await privateAxios.post('/private/create-expense', payload);

      if (response.status === 201) {
        setNotification({ visible: true, type: "success", message: response.data.message || "Expense created successfully" });
        setTimeout(() => {
          setNotification({ visible: false, type: "", message: "" });
          navigation.replace("manage-expenses");
        }, 3000);
      } else {
        // unexpected status
        setNotification({ visible: true, type: "error", message: "Failed to create expense" });
        setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      const msg = error?.response?.data?.message || "Error occurred creating expense";
      setNotification({ visible: true, type: "error", message: msg });
      setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
          <Notification visible={notification.visible} type={notification.type} message={notification.message} />

          <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>Create Expense</Text>

          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 80 }} style={{ flex: 1 }}>
            <View style={{ width: '100%', maxWidth: 500, backgroundColor: colors.secondary, borderRadius: 10, padding: 16 }}>

              {/* Title */}
              <View style={{ borderColor: colors.border2, borderRadius: 5, borderWidth: 1, borderStyle: 'dotted' }}>
                <TextInput
                  style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  placeholder="Enter expense title"
                  placeholderTextColor={colors.placeholder}
                  onChangeText={value => handleChange(value, 'title')}
                  value={data.title}
                />
              </View>

              {/* Description */}
              <View style={{ borderColor: colors.border2, borderRadius: 5, borderWidth: 1, borderStyle: 'dotted', marginTop: 12 }}>
                <TextInput
                  multiline
                  numberOfLines={4}
                  style={[
                    stylesConfig.INPUT,
                    {
                      textAlignVertical: 'top',
                      height: 150,
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Type description here..."
                  placeholderTextColor={colors.placeholder}
                  onChangeText={value => handleChange(value, 'description')}
                  value={data.description}
                />
              </View>

              {/* Amount */}
              <View style={{ borderColor: colors.border2, borderRadius: 5, borderWidth: 1, borderStyle: 'dotted', marginTop: 12 }}>
                <MaskedTextInput
                  type="currency"
                  options={{
                    prefix: '₦ ',
                    decimalSeparator: '.',
                    groupSeparator: ',',
                    precision: 0,
                  }}
                  style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  keyboardType="numeric"
                  placeholder="Enter expense amount"
                  placeholderTextColor={colors.placeholder}
                  value={data.amount}
                  onChangeText={(masked, raw) => {
                    setData(prev => ({
                      ...prev,
                      amount: raw === 'NaN' || raw === null ? '' : raw
                    }));
                  }}
                />
              </View>

              {/* Toggle Publish */}
              <Pressable
                onPress={() => handleChange(!data.published, 'published')}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 1,
                    borderColor: colors.text,
                    marginRight: 8,
                    backgroundColor: data.published ? colors.primary : 'transparent',
                  }}
                />
                <Text style={{ color: colors.text, fontSize: 16 }}>Publish Now</Text>
              </Pressable>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                style={{
                  marginTop: 24,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  flexDirection: 'row',
                  columnGap: 10,
                  justifyContent: 'center'
                }}
                disabled={loading}
              >
                {loading && <ActivityIndicator color={colors.mainButtonText} />}
                <Text style={{ color: colors.mainButtonText }}>
                  {loading ? `Submitting...` : 'Submit'}
                </Text>
              </Pressable>

            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <Footer />
    </View>
  );
};

export default CreateExpense;