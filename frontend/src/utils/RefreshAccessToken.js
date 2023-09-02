import axios from 'axios';
import {GetRefreshToken, RemoveTokens, SetAccessToken} from "./AccessToken";

const RefreshAccessToken = async (apiUrl) => {
    try {
        const response = await axios.post(`${apiUrl}/auth/token/refresh/`, {
            refresh: GetRefreshToken()
        }, {
            headers: {"Content-Type": "application/json"}
        });

        if (response.status !== 200) {
            throw new Error("Error refreshing access token");
        }

        const data = response.data;
        SetAccessToken(data.access);
        return true;
    } catch (err) {
        console.error(err.message);
        RemoveTokens(); // Clear tokens if refreshing fails.
        throw err; // re-throw the error
    }
};

export default RefreshAccessToken;
