import axios from 'axios';

const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';

export const fetchAnimeList = async (page = 1) => {
    try {
        const response = await axios.get(`${JIKAN_API_BASE_URL}/anime`, {
            params: { page }
        });
        return response.data;
    } catch (error) {
        throw new Error('Error fetching anime list: ' + error.message);
    }
};

export const fetchAnimeDetails = async (animeId) => {
    try {
        const response = await axios.get(`${JIKAN_API_BASE_URL}/anime/${animeId}`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching anime details: ' + error.message);
    }
};

export const fetchSuggestions = async (query) => {
    try {
        const response = await axios.get(`${JIKAN_API_BASE_URL}/anime`, {
            params: { q: query }
        });
        return response.data;
    } catch (error) {
        throw new Error('Error fetching suggestions: ' + error.message);
    }
};