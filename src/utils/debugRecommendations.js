// Temporary debug file to check the structure of recommendations data
import { fetchAnimeRecommendations } from '../api/jikanApi';

// Function to test the structure of recommendations data
export const debugRecommendations = async (animeId) => {
  try {
    console.log('Fetching recommendations for anime ID:', animeId);
    const response = await fetchAnimeRecommendations(animeId, 5);
    
    console.log('Recommendations response structure:', JSON.stringify(response, null, 2));
    
    // Check if data exists and has the expected structure
    if (response.data && Array.isArray(response.data)) {
      console.log('Number of recommendations:', response.data.length);
      
      // Check the first item's structure
      if (response.data.length > 0) {
        const firstItem = response.data[0];
        console.log('First recommendation structure:', JSON.stringify(firstItem, null, 2));
        
        // Check specifically for the images.jpg property
        if (firstItem.entry) {
          console.log('Entry property exists');
          console.log('Images property:', firstItem.entry.images);
        } else {
          console.log('Entry property does not exist');
          console.log('Direct images property:', firstItem.images);
        }
      }
    } else {
      console.log('Unexpected data structure:', response);
    }
    
    return response;
  } catch (error) {
    console.error('Error in debugRecommendations:', error);
    return null;
  }
};