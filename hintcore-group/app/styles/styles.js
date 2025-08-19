// styles/styles.js
const LIGHTCOLORS = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#1E90FF',
  secondary: '#E8F0FE',
  border: '#E0E0E0',
  inputBackground: '#F5F5F5',
  placeholder: '#888888',
  buttonText: '#4A90E2',
  mainButtonText: '#FFFFFF',
};

const DARKCOLORS = {
  background: '#121212',
  text: '#FFFFFF',
  primary: '#1E90FF',
  secondary: '#1E1E1E',
  border: '#333333',
  inputBackground: '#1E1E1E',
  placeholder: '#AAAAAA',
  buttonText: '#4A90E2',
  mainButtonText: '#FFFFFF',
};

// Shared styles for pages
const SETTINGS_STYLES = {
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 18,
  },
};

const INPUT = {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 16
  }

  // Add this block below existing constants

const HEADER_STYLES = {
  container: {
    width: "100%",
    height: 60,
    backgroundColor: "#1E90FF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 4,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    color: "#fff",
    marginRight: 12,
    fontSize: 16,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "500",
  },
};


export default {LIGHTCOLORS, DARKCOLORS, SETTINGS_STYLES, HEADER_STYLES, INPUT}