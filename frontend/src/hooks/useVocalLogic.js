import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.js';

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const SAMPLES_PER_VOWEL = 100;

// Mensajes de estado centralizados
const STATUS_MESSAGES = {
  IDLE: 'Inactivo. Selecciona una vocal para empezar a recolectar.',
  COLLECTING: (v) => `Recolectando muestras para la vocal '${v}'.`,
  TRAINING: 'Entrenando modelo... Esto puede tomar unos minutos.',
  TRAINING_SUCCESS: (acc) => `🎉 ¡Entrenamiento completado! Precisión: ${acc}%`,
  TRAINING_ERROR: 'Error al entrenar el modelo. Por favor, revisa la consola.',
  RESET: 'Datos reiniciados correctamente.',
  READY_TO_TRAIN: 'Recolección completa. Listo para entrenar el modelo.',
  PREDICTION_ERROR: 'Error en la predicción. Asegúrate de que el modelo esté entrenado.',
};

export const useVocalLogic = () => {
  const [appState, setAppState] = useState({
    isCollecting: false,
    isTraining: false,
    isModelTrained: false,
    isPredicting: false,
    currentVowel: null,
    prediction: '',
    predictionConfidence: null,
    trainingAccuracy: null,
    statusMessage: STATUS_MESSAGES.IDLE,
    vowelProgress: {},
  });

  // --- Funciones de comunicación con el backend ---
  const fetchProgress = useCallback(async () => {
    try {
      const progressData = await apiService.getProgress();
      setAppState(prev => {
        const totalSamples = VOWELS.reduce((sum, v) => sum + (progressData.vocales[v]?.cantidad || 0), 0);
        const totalRequired = VOWELS.length * SAMPLES_PER_VOWEL;
        const totalProgress = (totalSamples / totalRequired) * 100;

        const newStatusMessage = totalProgress >= 100 ? STATUS_MESSAGES.READY_TO_TRAIN : prev.statusMessage;
        
        // Normalizar la estructura de datos para que el frontend use 'count'
        const normalizedVowelProgress = {};
        Object.keys(progressData.vocales).forEach(vowel => {
          normalizedVowelProgress[vowel] = {
            count: progressData.vocales[vowel].cantidad,
            max: progressData.vocales[vowel].max,
            percentage: progressData.vocales[vowel].porcentaje
          };
        });
        
        return {
          ...prev,
          vowelProgress: {
            ...normalizedVowelProgress,
            total: { samples: totalSamples, max: totalRequired, percentage: totalProgress }
          },
          statusMessage: newStatusMessage
        };
      });
    } catch (error) {
      console.error('Error al obtener el progreso:', error);
    }
  }, []);

  const handleLandmarks = useCallback(async (landmarks, vowel) => {
    if (!appState.isCollecting) return;
    try {
      await apiService.sendLandmarks(landmarks, vowel);
      // Actualizar inmediatamente después de enviar la muestra
      await fetchProgress();
    } catch (error) {
      console.error('Error al agregar muestra:', error);
    }
  }, [appState.isCollecting, fetchProgress]);

  const handlePredict = useCallback(async (landmarks) => {
    if (!appState.isPredicting) return;
    try {
      const result = await apiService.predictVowel(landmarks);
      setAppState(prev => ({ 
        ...prev, 
        prediction: result.prediction,
        predictionConfidence: result.confidence
      }));
    } catch (error) {
      console.error('Error en la predicción:', error);
      setAppState(prev => ({ ...prev, isPredicting: false, statusMessage: STATUS_MESSAGES.PREDICTION_ERROR }));
    }
  }, [appState.isPredicting]);

  // --- Funciones de control ---
  const startCollecting = useCallback((vowel) => {
    if (appState.isTraining || appState.isPredicting) return;
    setAppState(prev => ({
      ...prev,
      isCollecting: true,
      currentVowel: vowel,
      statusMessage: STATUS_MESSAGES.COLLECTING(vowel),
    }));
  }, [appState.isTraining, appState.isPredicting]);

  const stopCollecting = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      isCollecting: false,
      currentVowel: null,
      statusMessage: STATUS_MESSAGES.IDLE,
    }));
    fetchProgress();
  }, [fetchProgress]);

  const trainModel = useCallback(async () => {
    setAppState(prev => ({ ...prev, isTraining: true, statusMessage: STATUS_MESSAGES.TRAINING }));
    try {
      const result = await apiService.trainModel();
      setAppState(prev => ({
        ...prev,
        isModelTrained: true,
        trainingAccuracy: result.accuracy,
        statusMessage: STATUS_MESSAGES.TRAINING_SUCCESS(result.accuracy),
      }));
    } catch (err) {
      console.error('Error durante el entrenamiento:', err);
      setAppState(prev => ({ ...prev, statusMessage: STATUS_MESSAGES.TRAINING_ERROR }));
    } finally {
      setAppState(prev => ({ ...prev, isTraining: false }));
    }
  }, []);

  const resetData = useCallback(async () => {
    if (window.confirm("¿Estás seguro de que quieres borrar todos los datos y el modelo?")) {
      try {
        await apiService.resetData();
        setAppState(prev => ({
          ...prev,
          isModelTrained: false,
          isPredicting: false,
          prediction: '',
          predictionConfidence: null,
          trainingAccuracy: null,
          statusMessage: STATUS_MESSAGES.RESET,
          vowelProgress: {},
        }));
      } catch (error) {
        console.error('Error al reiniciar datos:', error);
      } finally {
        fetchProgress();
      }
    }
  }, [fetchProgress]);

  const togglePrediction = useCallback(() => {
    if (!appState.isModelTrained) {
      console.warn("Modelo no entrenado. Por favor, entrena el modelo primero.");
      return;
    }
    setAppState(prev => ({
      ...prev,
      isPredicting: !prev.isPredicting,
      prediction: '',
      predictionConfidence: null,
    }));
  }, [appState.isModelTrained]);

  const canTrain = useCallback(() => {
    const { vowelProgress } = appState;
    return VOWELS.every(v => (vowelProgress[v]?.count || 0) >= SAMPLES_PER_VOWEL);
  }, [appState.vowelProgress]);

  const getTotalSamples = useCallback(() => {
    const { vowelProgress } = appState;
    return VOWELS.reduce((sum, v) => sum + (vowelProgress[v]?.count || 0), 0);
  }, [appState.vowelProgress]);

  const getRequiredSamples = useCallback(() => {
    return VOWELS.length * SAMPLES_PER_VOWEL;
  }, []);
  
  // Cargar el progreso al inicio y configurar polling automático
  useEffect(() => {
    fetchProgress();
    
    // Configurar polling automático cada 2 segundos
    // Actualizar más frecuentemente cuando se está recolectando
    const interval = setInterval(() => {
      fetchProgress();
    }, appState.isCollecting ? 1000 : 3000); // 1s si está recolectando, 3s si no
    
    // Limpiar el interval al desmontar el componente
    return () => clearInterval(interval);
  }, [fetchProgress, appState.isCollecting]);

  return {
    appState,
    handleLandmarks,
    handlePredict,
    startCollecting,
    stopCollecting,
    trainModel,
    resetData,
    togglePrediction,
    canTrain,
    getTotalSamples,
    getRequiredSamples,
    VOWELS,
    SAMPLES_PER_VOWEL
  };
};
