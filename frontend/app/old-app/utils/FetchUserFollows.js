import api from './api';

const FetchUserFollows = async (username, followType, setFollows) => {
    try {
        const response = await api.get(`/users/${username}/${followType}/`);
        setFollows(response.data);
    } catch (error) {
        console.error(error.message);
        setFollows(null); // Set follows to null if there's an error
    }
};

export default FetchUserFollows;
