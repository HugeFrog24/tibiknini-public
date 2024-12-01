import api from './api';

const FetchUser = async (onLogin) => {
    try {
        const response = await api.get('/users/me/');

        if (response.status === 200) {
            const userData = response.data;
            onLogin(userData);
        } else {
            throw new Error("Error fetching user data");
        }
    } catch (error) {
        console.error(error.message);
        throw error; // simply throw the error and let higher-level logic handle it
    }
};

export default FetchUser;
