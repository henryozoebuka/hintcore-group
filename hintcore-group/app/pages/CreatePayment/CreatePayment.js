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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';
import { AntDesign, Octicons } from '@expo/vector-icons';
import { MaskedTextInput } from 'react-native-mask-text';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

const CreatePayment = ({ navigation }) => {
  const { colors } = useSelector((state) => state.colors);

  const [notification, setNotification] = useState({ visible: false, type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [search, setSearch] = useState("");


  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const [showMembersModal, setShowMembersModal] = useState(false);

  const [users, setUsers] = useState([]); // list of group members
  const [selectedUsers, setSelectedUsers] = useState([]); // objects: { userId, amountPaid? }

  // Payment form data
  const [data, setData] = useState({
    title: '',
    description: '',
    type: 'required',    // default: 'required' | 'contribution' | 'donation'
    amount: '',          // string for input
    dueDate: null,
    published: false,
  });

  const paymentTypes = ['required', 'contribution', 'donation'];

  const handleChange = (value, key) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    const current = selectedDate || date;
    setDate(current);
    setData(prev => ({ ...prev, dueDate: current }));
  };

  const fetchUsers = async () => {
    if (!showMembersModal) return;

    try {
      setMembersLoading(true);
      setUsers([]); // empty before fetch
      setSelectedUsers([]); // empty selected before fetch

      const response = await privateAxios.get('/private/group-members');
      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Failed to fetch group members:", err);
      setNotification({ visible: true, type: 'error', message: "Failed to fetch group members" });
      setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [showMembersModal]);

  const handleSelectUser = (userId) => {
    // toggle select/deselect user
    const exists = selectedUsers.find(u => u.userId === userId);
    if (exists) {
      setSelectedUsers(prev => prev.filter(u => u.userId !== userId));
    } else {
      // When adding, if type is donation or contribution, allow amountPaid entry (default 0)
      setSelectedUsers(prev => [...prev, { userId, amountPaid: 0 }]);
    }
  };


  const handleSubmit = async () => {
    // Basic validation
    if (!data.title || !data.description) {
      setNotification({ visible: true, type: "error", message: "Title and description are required" });
      setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
      return;
    }

    // For required types, amount is required and >0
    if (data.type === 'required') {
      if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
        setNotification({ visible: true, type: "error", message: "Amount must be greater than 0" });
        setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
        return;
      }
    }


    // For donation or contribution, ensure selectedUsers are valid
    let membersPayload = [];
    if (selectedUsers.length > 0) {
      membersPayload = selectedUsers.map(u => {
        // For donation type, amountPaid may be >0 or zero
        // For contribution type, maybe you want require amountPaid per member or default 0?
        return {
          userId: u.userId,
          amountPaid: u.amountPaid || 0
        };
      });
    }

    try {
      setLoading(true);
      const payload = {
        title: data.title,
        description: data.description,
        type: data.type,
        amount: (data.type === 'required' || data.type === 'contribution') ? Number(data.amount) : undefined,
        dueDate: data.dueDate,
        published: data.published,
        members: membersPayload,
      };

      const response = await privateAxios.post('/private/create-payment', payload);

      if (response.status === 201) {
        setNotification({ visible: true, type: "success", message: response.data.message || "Payment created successfully" });
        setTimeout(() => {
          setNotification({ visible: false, type: "", message: "" });
          navigation.replace("manage-payments");
        }, 3000);
      } else {
        // unexpected status
        setNotification({ visible: true, type: "error", message: "Failed to create payment" });
        setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      const msg = error?.response?.data?.message || "Error occurred creating payment";
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

          <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>Create Payment</Text>

          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 80 }} style={{ flex: 1 }}>
            <View style={{ width: '100%', maxWidth: 500, backgroundColor: colors.secondary, borderRadius: 10, padding: 16 }}>

              {/* Title */}
              <View style={{ borderColor: colors.border2, borderRadius: 5, borderWidth: 1, borderStyle: 'dotted' }}>
                <TextInput
                  style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  placeholder="Enter payment title"
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

              {/* Type Selector */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: colors.text, marginBottom: 8 }}>Payment Type:</Text>
                {paymentTypes.map(typeOption => {
                  const isSelected = data.type === typeOption;
                  return (
                    <Pressable
                      key={typeOption}
                      onPress={() => handleChange(typeOption, 'type')}
                      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          marginRight: 10,
                          borderWidth: 1,
                          borderColor: colors.text,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          borderRadius: 10,
                        }}
                      />
                      <Text style={{ color: colors.text, fontSize: 16 }}>
                        {typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Amount (only for required) */}
              {data.type === 'required' && (
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
                    placeholder="Enter payment amount"
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
              )}


              {/* Due Date */}
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={[
                  stylesConfig.CARD,
                  {
                    borderStyle: 'dotted',
                    borderColor: colors.border2,
                    backgroundColor: colors.inputBackground,
                    alignItems: 'center',
                    paddingVertical: 12,
                    marginTop: 12
                  },
                ]}
              >
                <AntDesign name="calendar" size={20} color={colors.text} />
                <Text style={{ color: colors.text, marginLeft: 10 }}>Select Due Date</Text>
              </Pressable>
              {data.dueDate && (
                <Text style={{ color: colors.text, marginTop: 10 }}>
                  {new Date(data.dueDate).toDateString()}
                </Text>
              )}
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
              )}

              {/* Select Members */}
              <Pressable
                onPress={() => setShowMembersModal(true)}
                style={[stylesConfig.CARD, {
                  borderStyle: 'dotted',
                  borderColor: colors.border2,
                  backgroundColor: colors.inputBackground,
                  alignItems: 'center',
                  paddingVertical: 12,
                  marginTop: 12,
                }]}
              >
                <Octicons name="people" size={20} color={colors.text} />
                <Text style={{ color: colors.text, marginLeft: 10 }}>
                  Select Members {selectedUsers.length > 0 && `(${selectedUsers.length} selected)`}
                </Text>
              </Pressable>

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
                  {loading ? `Submitting ${data.type[0].toUpperCase() + data.type.slice(1)}...` : 'Submit'}
                </Text>
              </Pressable>

            </View>
          </ScrollView>

          {/* Members modal / selection */}
          {showMembersModal && (
            <View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 99,
            }}>
              <View style={{
                width: '90%', maxHeight: '80%',
                backgroundColor: colors.secondary,
                borderRadius: 12, padding: 20
              }}>
                <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text, fontSize: 20 }]}>
                  Select Members
                </Text>
                
                {/* Select All checkbox inside modal */}
                <Pressable
                  onPress={() => {
                    if (selectedUsers.length === users.length) {
                      // all selected → unselect all
                      setSelectedUsers([]);
                    } else {
                      // not all selected → select all
                      const allSelected = users.map(u => ({
                        userId: u._id,
                        amountPaid: 0, // default
                      }));
                      setSelectedUsers(allSelected);
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10 }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderWidth: 1,
                      borderColor: colors.text,
                      marginRight: 10,
                      backgroundColor:
                        selectedUsers.length === users.length
                          ? colors.primary // fully selected
                          : selectedUsers.length > 0
                            ? colors.border2 // partially selected (indeterminate style)
                            : 'transparent', // none selected
                    }}
                  />
                  <Text style={{ color: colors.text, fontWeight: '600' }}>Select All</Text>
                </Pressable>

                {/* Search input */}
                <TextInput
                  style={[stylesConfig.INPUT, {
                    marginTop: 10,
                    backgroundColor: colors.inputBackground,
                    color: colors.text
                  }]}
                  placeholder="Search members..."
                  placeholderTextColor={colors.placeholder}
                  value={search}
                  onChangeText={setSearch}
                />

                {membersLoading ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text, marginTop: 10 }}>Loading Members...</Text>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 300, marginTop: 10 }}>
                    {users
                      .filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()))
                      .map(u => {
                        const sel = selectedUsers.find(s => s.userId === u._id);
                        return (
                          <Pressable
                            key={u._id}
                            onPress={() => handleSelectUser(u._id)}
                            style={[stylesConfig.CARD, {
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: colors.inputBackground,
                              borderColor: colors.border2,
                              marginBottom: 6,
                              padding: 8
                            }]}
                          >
                            <View style={{
                              width: 20, height: 20,
                              borderWidth: 1, borderColor: colors.text,
                              marginRight: 10,
                              backgroundColor: sel ? colors.primary : 'transparent',
                            }} />
                            <Text style={{ color: colors.text }}>{u.fullName}</Text>
                          </Pressable>
                        );
                      })}
                  </ScrollView>
                )}

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <Pressable
                    onPress={() => {
                      setSelectedUsers([]); // clear selection
                      setShowMembersModal(false);
                    }}
                    style={[stylesConfig.BUTTON, { backgroundColor: 'red', flex: 1, marginRight: 10 }]}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowMembersModal(false)}
                    style={[stylesConfig.BUTTON, { backgroundColor: colors.primary, flex: 1 }]}
                  >
                    <Text style={{ color: colors.mainButtonText, fontWeight: '600' }}>Done</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
      <Footer />
    </View>
  );
};

export default CreatePayment;