const LIGHTCOLORS = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#1E90FF',
  secondary: '#E8F0FE',
  border: '#E0E0E0',
  border2: '#E0E0E0',
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
  border2: '#FFFFFF',
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

const MODAL_OVERLAY = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}


const BUTTON = {
  padding: 8,
  borderRadius: 8,
  marginBottom: 10,
  alignItems: 'center',
};

const SMALL_BUTTON = {
  padding: 8,
  borderRadius: 6,
  marginLeft: 0,
};

const INPUT = {
  width: '100%',
  padding: 14,
  borderRadius: 10,
  fontSize: 16,
  marginBottom: 16,
};

const CARD = {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 5,
  borderWidth: 1,
  borderRadius: 10,
  marginBottom: 10,
};

const CHECKBOX = {
  width: 22,
  height: 22,
  borderRadius: 4,
  borderWidth: 1,
  marginRight: 10,
};

const PAGINATION = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 15,
};

const PAGE_BUTTON = {
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 8,
};

// New Header styles
const HEADER_STYLES = {
  container: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#fff',
    marginRight: 12,
    fontSize: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
};

// New Header styles
const FOOTER_STYLES = {
  container: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
};

export default {
  LIGHTCOLORS,
  DARKCOLORS,
  SETTINGS_STYLES,
  HEADER_STYLES,
  FOOTER_STYLES,
  BUTTON,
  SMALL_BUTTON,
  MODAL_OVERLAY,
  INPUT,
  CARD,
  CHECKBOX,
  PAGINATION,
  PAGE_BUTTON,
};