import axios from 'axios';

const FetchUserFollows = async (apiUrl, username, followType, setFollows) => {
    try {
        const response = await axios.get(`${apiUrl}/users/${username}/${followType}/`);
        setFollows(response.data);
    } catch (error) {
        console.error(error.message);
        setFollows(null); // Set follows to null if there's an error
    }
};

export default FetchUserFollows;
