import axios from 'axios';

const API_BASE_URL = 'http://localhost:8002/api';

export const apiService = {
  // Obtener progreso de recolección
  async getProgress() {
    try {
      const response = await axios.get(`${API_BASE_URL}/progress`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  },

  // Enviar landmarks para una vocal
  async sendLandmarks(landmarks, vowel) {
    try {
      const landmarkData = landmarks.map(point => [point.x, point.y, point.z]);
      await axios.post(`${API_BASE_URL}/samples`, {
        landmarks: landmarkData,
        vowel: vowel
      });
    } catch (error) {
      console.error('Error sending landmarks:', error);
      throw error;
    }
  },

  // Predecir vocal basada en landmarks
  async predictVowel(landmarks) {
    try {
      const landmarkData = landmarks.map(point => [point.x, point.y, point.z]);
      const response = await axios.post(`${API_BASE_URL}/predict`, {
        landmarks: landmarkData
      });
      return response.data.prediction;
    } catch (error) {
      console.error('Error predicting vowel:', error);
      throw error;
    }
  },

  // Entrenar el modelo
  async trainModel() {
    try {
      const response = await axios.post(`${API_BASE_URL}/train`);
      return response.data;
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  },

  // Reiniciar datos
  async resetData() {
    try {
      await axios.post(`${API_BASE_URL}/reset`);
    } catch (error) {
      console.error('Error resetting data:', error);
      throw error;
    }
  }
};