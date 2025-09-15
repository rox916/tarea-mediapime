import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api';

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
        puntos_clave: landmarkData,
        vocal: vowel
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
        puntos_clave: landmarkData
      });
      return {
        prediction: response.data.prediccion,
        confidence: response.data.confianza,
        allProbabilities: response.data.todas_las_probabilidades
      };
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
  },

  // Eliminar datos de una vocal específica
  async deleteVowelData(vowel) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/samples/${vowel}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting data for vowel ${vowel}:`, error);
      throw error;
    }
  }
};