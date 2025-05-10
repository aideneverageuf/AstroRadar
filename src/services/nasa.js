import axios from 'axios';

const API_KEY = import.meta.env.VITE_NASA_API_KEY;
const BASE_URL = 'https://api.nasa.gov/neo/rest/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const responseCache = new Map();

const fetchWithRetry = async (url, params, retries = MAX_RETRIES) => {
  const cacheKey = `${url}-${JSON.stringify(params)}`;
  
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  try {
    const response = await axios.get(url, {
      params,
      timeout: 10000,
      validateStatus: (status) => status < 500
    });

    if (response.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, params, retries - 1);
    }

    if (response.status !== 200) {
      throw new Error(`API error: ${response.status}`);
    }

    responseCache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('API request failed:', error.message);
    throw error;
  }
};

export const fetchNeoFeed = async (startDate, endDate) => {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > today || end > today) {
    throw new Error('NASA API only supports dates up to current date');
  }

  try {
    const data = await fetchWithRetry(`${BASE_URL}/feed`, {
      start_date: startDate,
      end_date: endDate,
      api_key: API_KEY
    });

    if (!data.near_earth_objects) {
      throw new Error('Unexpected API response format');
    }

    return data.near_earth_objects;
  } catch (error) {
    console.error('NASA API Error:', {
      message: error.message,
      dates: { startDate, endDate }
    });
    throw error;
  }
};

export const fetchNeoDetail = async (id) => {
  try {
    return await fetchWithRetry(`${BASE_URL}/neo/${id}`, {
      api_key: API_KEY
    });
  } catch (error) {
    console.error('Error fetching NEO details:', error);
    throw error;
  }
};