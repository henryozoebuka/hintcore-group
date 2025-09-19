// import React, { useEffect, useState } from "react";
// import { View } from "react-native";
// import PhoneInput from "react-native-international-phone-number";
// import * as Localization from "expo-localization";
// import { useSelector } from "react-redux";

// const PhoneNumberPicker = ({ value, onChange }) => {
//   const { colors } = useSelector((state) => state.colors);
//   const [defaultCountry, setDefaultCountry] = useState("US");

//   // Ensure state value is always a string
//   const safeValue = typeof value === "string" ? value : "";

//   useEffect(() => {
//     if (Localization.region) {
//       setDefaultCountry(Localization.region);
//     }
//   }, []);

//   const handleChange = (phoneNumber) => {
//     // phoneNumber may be undefined or something not a string
//     if (typeof phoneNumber !== "string") {
//       // optional: you could keep previous value if that makes sense
//       onChange(safeValue);
//       return;
//     }

//     // Don’t force `+` until user enters something meaningful,
//     // because entering “0” first might be part of local number input
//     let newNumber = phoneNumber;

//     // If it doesn't start with + and user tries to enter +XX, maybe allow
//     // But only force if explicit + or phoneNumber already has country prefix inferred
//     if (newNumber && !newNumber.startsWith("+")) {
//       // Optionally you might check if defaultCountry's dial code is known and prepend it
//       // But for now just leave as is
//       // newNumber = `+${newNumber}`;  // *remove* this forced + for now
//     }

//     // Clean up non-digit/non-plus characters
//     newNumber = newNumber.replace(/[^\d+]/g, "");

//     onChange(newNumber);
//   };

//   const handleChangeSelectedCountry = (country) => {
//     // optional: for example, switch to include country code, or adjust value
//     // console.log("Selected country:", country);
//   };

//   return (
//     <View style={{ marginVertical: 10 }}>
//       <PhoneInput
//         value={safeValue}
//         defaultCountry={defaultCountry}
//         onChangePhoneNumber={handleChange}
//         onChangeSelectedCountry={handleChangeSelectedCountry}
//         placeholder="Enter phone number"
//         allowZeroAfterCallingCode={true}  // if library supports this prop
//         // maybe there’s a prop for showing country code/dial code explicitly
//         phoneInputStyles={{
//           container: {
//             backgroundColor: colors.inputBackground,
//             borderRadius: 8,
//             width: "100%",
//             paddingHorizontal: 10,
//           },
//           input: {
//             color: colors.text,
//           },
//           flagContainer: {
//             backgroundColor: colors.inputBackground,
//             borderRadius: 8,
//           },
//           callingCode: {
//             color: colors.text,
//           },
//         }}
//       />
//     </View>
//   );
// };

// export default PhoneNumberPicker;
