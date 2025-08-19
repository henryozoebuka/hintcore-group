import { createSlice } from "@reduxjs/toolkit";
import styles from "../../styles/styles.js";
const { LIGHTCOLORS, DARKCOLORS } = styles;

const initialState = {
  theme: 'light',
  colors: LIGHTCOLORS
};

const colorsSlice = createSlice({
  name: 'colors',
  initialState,
  reducers: {
    setLightMode: () => ({
      theme: 'light',
      colors: LIGHTCOLORS
    }),
    setDarkMode: () => ({
      theme: 'dark',
      colors: DARKCOLORS
    }),
    setTheme: (state, action) => {
      const theme = action.payload;
      return {
        theme,
        colors: theme === 'dark' ? DARKCOLORS : LIGHTCOLORS
      };
    },
  }
});

export const { setLightMode, setDarkMode, setTheme } = colorsSlice.actions;
export default colorsSlice.reducer;