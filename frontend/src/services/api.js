// src/services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8001/api";

export const apiService = {
  // ================= VOCAL =================
  async getVowelProgress() {
    const response = await axios.get(`${API_BASE_URL}/vocales/estadisticas`);
    return response.data;
  },

  async sendVowelLandmarks(landmarks, vowel) {
    const landmarkData = landmarks.map((point) => [point.x, point.y, point.z]);
    await axios.post(
      `${API_BASE_URL}/vocales/recolectar/${vowel.toLowerCase()}`,
      { puntos_clave: landmarkData }
    );
  },

  // 🔹 Predicción para una vocal específica
  async predictVowel(landmarks, vowel) {
    const landmarkData = landmarks.map((point) => [point.x, point.y, point.z]);
    const response = await axios.post(
      `${API_BASE_URL}/vocales/prediccion/${vowel.toLowerCase()}`,
      { puntos_clave: landmarkData }
    );

    console.log("📡 predictVowel response:", response.data);

    const pred = response.data.prediccion || {};
    return {
      prediction: pred.clase_predicha || null,
      confidence: pred.confianza ?? null,
      allProbabilities: pred.todas_las_probabilidades || null,
    };
  },

  // 🔹 Predicción general (el backend decide la vocal)
  async predictVowelGeneral(landmarks) {
    const landmarkData = landmarks.map((point) => [point.x, point.y, point.z]);
    const response = await axios.post(
      `${API_BASE_URL}/vocales/prediccion`,
      { puntos_clave: landmarkData }
    );

    console.log("📡 predictVowelGeneral response:", response.data);

    const pred = response.data.prediccion || {};
    return {
      prediction: pred.clase_predicha || null,
      confidence: pred.confianza ?? null,
      allProbabilities: pred.todas_las_probabilidades || null,
    };
  },

  async trainVowel(vowel) {
    const response = await axios.post(
      `${API_BASE_URL}/vocales/entrenar/${vowel.toLowerCase()}`
    );
    const data = response.data;

    return {
      success: data.resultado?.exito ?? false,
      accuracy: data.resultado?.precision_validacion ?? 0,
      loss: data.resultado?.perdida_validacion ?? null,
      epochs: data.resultado?.epocas ?? null,
      raw: data,
    };
  },

  async deleteVowelData(vowel) {
    const response = await axios.delete(
      `${API_BASE_URL}/vocales/datos/${vowel.toLowerCase()}`
    );
    return response.data;
  },

  async resetVowelModel(vowel) {
    const response = await axios.delete(
      `${API_BASE_URL}/vocales/modelo/${vowel.toLowerCase()}`
    );
    return response.data;
  },

  // ================= NUMBERS =================
  async getNumberProgress() {
    const response = await axios.get(`${API_BASE_URL}/numeros/estadisticas`);
    return response.data;
  },

  async sendNumberLandmarks(landmarks, number) {
    const landmarkData = landmarks.map((point) => [point.x, point.y, point.z]);
    await axios.post(`${API_BASE_URL}/numeros/recolectar/${number}`, {
      puntos_clave: landmarkData,
    });
  },

  async predictNumber(landmarks, number) {
    const landmarkData = landmarks.map((point) => [point.x, point.y, point.z]);
    const response = await axios.post(
      `${API_BASE_URL}/numeros/prediccion/${number}`,
      { puntos_clave: landmarkData }
    );

    console.log("📡 predictNumber response:", response.data);

    const pred = response.data.prediccion || {};
    return {
      prediction: pred.clase_predicha || null,
      confidence: pred.confianza ?? null,
      allProbabilities: pred.todas_las_probabilidades || null,
    };
  },

  async trainNumber(number) {
    const response = await axios.post(
      `${API_BASE_URL}/numeros/entrenar/${number}`
    );
    return response.data;
  },

  async deleteNumberData(number) {
    const response = await axios.delete(
      `${API_BASE_URL}/numeros/datos/${number}`
    );
    return response.data;
  },

  async resetNumberModel(number) {
    const response = await axios.delete(
      `${API_BASE_URL}/numeros/modelo/${number}`
    );
    return response.data;
  },

  // ================= OPERACIONES =================
  async getOpbasicProgress() {
    const response = await axios.get(
      `${API_BASE_URL}/operaciones/estadisticas`
    );
    return response.data;
  },

  async sendOpbasicLandmarks(landmarks, op) {
    await axios.post(`${API_BASE_URL}/operaciones/recolectar/${op}`, {
      puntos_clave: landmarks,
    });
  },

  async predictOpbasic(landmarks, op) {
    const response = await axios.post(
      `${API_BASE_URL}/operaciones/prediccion/${op}`,
      { puntos_clave: landmarks }
    );

    console.log("📡 predictOpbasic response:", response.data);

    const pred = response.data.prediccion || {};
    return {
      prediction: pred.clase_predicha || null,
      confidence: pred.confianza ?? null,
      allProbabilities: pred.todas_las_probabilidades || null,
    };
  },

  async trainOpbasic(op) {
    const response = await axios.post(
      `${API_BASE_URL}/operaciones/entrenar/${op}`
    );
    return response.data;
  },

  async deleteOpbasicData(op) {
    const response = await axios.delete(
      `${API_BASE_URL}/operaciones/datos/${op}`
    );
    return response.data;
  },

  async resetOpbasicModel(op) {
    const response = await axios.delete(
      `${API_BASE_URL}/operaciones/modelo/${op}`
    );
    return response.data;
  },
};
