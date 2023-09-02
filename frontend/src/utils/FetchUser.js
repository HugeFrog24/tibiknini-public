import axios from 'axios';
import {GetAccessToken} from "./AccessToken";

const FetchUser = async (apiUrl, onLogin, RefreshAccessToken) => {
    try {
        const response = await axios.get(`${apiUrl}/users/me/`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GetAccessToken()}`,
            },
        });

        if (response.status === 200) {
            const userData = response.data;
            onLogin(userData);
        } else {
            throw new Error("Error fetching user data");
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            const refreshed = await RefreshAccessToken(apiUrl);
            if (refreshed) {
                return FetchUser(apiUrl, onLogin, RefreshAccessToken);
            }
        }
        console.error(error.message);
        throw error;
    }
};

export default FetchUser;
