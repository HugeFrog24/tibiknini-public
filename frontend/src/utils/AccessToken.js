import axios from 'axios';

// Getters
export const getAccessToken = () => {
  return localStorage.getItem("access_token");
};

export const getRefreshToken = () => {
  return localStorage.getItem("refresh_token");
};

// Setters
export const setAccessToken = (token) => {
  localStorage.setItem("access_token", token);
};

export const setRefreshToken = (token) => {
  localStorage.setItem("refresh_token", token);
};

// Remove Tokens
export const removeTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.reload();
};

// Refresh Access Token
export const refreshAccessToken = async (apiUrl) => {
    try {
        const response = await axios.post(`${apiUrl}/auth/token/refresh/`, {
            refresh: getRefreshToken()
        }, {
            headers: {"Content-Type": "application/json"}
        });

        if (response.status !== 200) {
            throw new Error("Error refreshing access token");
        }

        const data = response.data;
        setAccessToken(data.access);
        return true;
    } catch (err) {
        console.error(err.message);
        removeTokens(); // Clear tokens if refreshing fails.
        throw err; // re-throw the error
    }
};
