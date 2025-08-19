import React, { useState, useRef, useEffect } from 'react';
import PhoneInput from 'react-native-phone-number-input';
import * as Localization from 'expo-localization';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

const PhoneNumberPicker = ({ value, onChange }) => {
  const { colors } = useSelector((state) => state.colors);
  const phoneInputRef = useRef(null);
  const [defaultCode, setDefaultCode] = useState('US');

  useEffect(() => {
    if (Localization.region) {
      setDefaultCode(Localization.region);
    }
  }, []);

  const handleFormattedChange = (formatted) => {
    if (!formatted) {
      onChange('');
      return;
    }

    // Remove spaces, parentheses, dashes, etc.
    let cleanNumber = formatted.replace(/[^\d+]/g, '');

    // Ensure it starts with "+"
    if (!cleanNumber.startsWith('+')) {
      cleanNumber = `+${cleanNumber}`;
    }

    // Remove leading zeros after country code
    cleanNumber = cleanNumber.replace(/^(\+\d+?)0+/, '$1');

    onChange(cleanNumber);
  };

  return (
    <View style={{ marginVertical: 10 }}>
      <PhoneInput
        ref={phoneInputRef}
        defaultValue={value}
        defaultCode={defaultCode}
        layout="first"
        onChangeFormattedText={handleFormattedChange}
        containerStyle={{
          backgroundColor: colors.inputBackground,
          borderRadius: 8,
          width: '100%',
        }}
        textContainerStyle={{
          backgroundColor: colors.inputBackground,
        }}
        textInputStyle={{
          color: colors.text,
        }}
        codeTextStyle={{
          color: colors.text,
        }}
        countryPickerButtonStyle={{
          backgroundColor: colors.inputBackground,
        }}
        withDarkTheme={colors.background === '#000'}
        withShadow
        autoFocus={false}
      />
    </View>
  );
};

export default PhoneNumberPicker;