import { message } from "antd";

const isBrowser = typeof window !== "undefined"; // Check if running in the browser

export const getToken = () => {
  return isBrowser ? localStorage.getItem("tpq_token") : null;
};

export const clearToken = () => {
  isBrowser && localStorage.removeItem("tpq_token");
};

export const deauthUser = () => {
	message.loading("Please wait...", 1).then(async () => {
	try {
        clearToken();
        localStorage.removeItem('tpq_token');
        localStorage.removeItem('tpq_user');
        localStorage.removeItem('tpq_typeUser');
        localStorage.removeItem('tpq_id');
        localStorage.removeItem('tpq_userData');
        window.location.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
	})
}

export const isAuthenticated = () => {
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem("tpq_token");
    return !!token;
  } else {
    // Handle the case where localStorage is not available
    return false;
  }  
};