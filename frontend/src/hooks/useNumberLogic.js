import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api.js';

const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const SAMPLES_PER_NUMBER = 100;

// Mensajes de estado centralizados para números
const STATUS_MESSAGES_NUMBERS = {
  IDLE: 'Inactivo. Selecciona un número para empezar a recolectar.',
  COLLECTING: (n) => `Recolectando muestras para el número '${n}'.`,
  TRAINING: 'Entrenando modelo... Esto puede tomar unos minutos.',
  TRAINING_SUCCESS: (acc) => `Entrenamiento completado! Precisión: ${acc}%`,
  TRAINING_ERROR: 'Error al entrenar el modelo. Asegúrate de tener al menos 2 muestras por número.',
  TRAINING_ERROR_INSUFFICIENT: 'No hay suficientes datos para entrenar. Recolecta al menos 2 muestras para cada número.',
  RESET: 'Datos reiniciados correctamente.',
  READY_TO_TRAIN: 'Recolección completa. Listo para entrenar el modelo.',
  PREDICTION_ERROR: 'Error en la predicción. Asegúrate de que el modelo esté entrenado.',
  PREDICTION_ERROR_NO_MODEL: 'No hay modelo entrenado. Por favor, entrena el modelo primero.',
};

export const useNumberLogic = ({ setModalData }) => {
  const [appState, setAppState] = useState({
    isCollecting: false,
    isTraining: false,
    isModelTrained: false,
    isPredicting: false,
    currentNumber: null,
    prediction: '',
    predictionConfidence: null,
    trainingAccuracy: null,
    statusMessage: STATUS_MESSAGES_NUMBERS.IDLE,
    numberProgress: {},
  });

  // --- Funciones de comunicación con el backend ---
  const fetchProgress = useCallback(async () => {
    try {
      const progressData = await apiService.getProgress();
      setAppState(prev => {
        const totalSamples = NUMBERS.reduce((sum, n) => sum + (progressData.numeros[n]?.cantidad || 0), 0);
        const totalRequired = NUMBERS.length * SAMPLES_PER_NUMBER;
        const totalProgress = (totalSamples / totalRequired) * 100;

        const newStatusMessage = totalProgress >= 100 ? STATUS_MESSAGES_NUMBERS.READY_TO_TRAIN : prev.statusMessage;

        const normalizedNumberProgress = {};
        Object.keys(progressData.numeros).forEach(number => {
          normalizedNumberProgress[number] = {
            count: progressData.numeros[number].cantidad,
            max: progressData.numeros[number].max,
            percentage: progressData.numeros[number].porcentaje
          };
        });

        return {
          ...prev,
          numberProgress: {
            ...normalizedNumberProgress,
            total: { samples: totalSamples, max: totalRequired, percentage: totalProgress }
          },
          statusMessage: newStatusMessage
        };
      });
    } catch (error) {
      console.error('Error al obtener el progreso:', error);
    }
  }, []);

  const handleLandmarks = useCallback(async (landmarks, number) => {
    if (!appState.isCollecting) return;
    try {
      await apiService.sendLandmarks(landmarks, number);
      await fetchProgress();
    } catch (error) {
      console.error('Error al agregar muestra:', error);
    }
  }, [appState.isCollecting, fetchProgress]);

  // Throttling para predicciones
  const lastPredictionTime = useRef(0);
  const predictionInProgress = useRef(false);
  const PREDICTION_THROTTLE_MS = 200;

  const handlePredict = useCallback(async (landmarks) => {
    if (!appState.isPredicting || predictionInProgress.current) return;

    const now = Date.now();
    if (now - lastPredictionTime.current < PREDICTION_THROTTLE_MS) {
      return;
    }

    predictionInProgress.current = true;
    lastPredictionTime.current = now;

    try {
      const result = await apiService.predictNumber(landmarks);

      setAppState(prev => {
        const confidenceChanged = Math.abs((prev.predictionConfidence || 0) - result.confidence) > 0.05;
        const predictionChanged = prev.prediction !== result.prediction;

        if (predictionChanged || confidenceChanged) {
          return {
            ...prev,
            prediction: result.prediction,
            predictionConfidence: result.confidence
          };
        }

        return prev;
      });
    } catch (error) {
      console.error('Error en la predicción:', error);
      let errorMessage = STATUS_MESSAGES_NUMBERS.PREDICTION_ERROR;
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (detail.includes('Modelo no entrenado')) {
          errorMessage = STATUS_MESSAGES_NUMBERS.PREDICTION_ERROR_NO_MODEL;
        } else {
          errorMessage = `Error: ${detail}`;
        }
      }

      setAppState(prev => ({ ...prev, isPredicting: false, statusMessage: errorMessage }));
    } finally {
      predictionInProgress.current = false;
    }
  }, [appState.isPredicting]);

  // --- Funciones auxiliares ---
  const canTrainMinimal = useCallback(() => {
    const { numberProgress } = appState;
    return NUMBERS.every(n => (numberProgress[n]?.count || 0) >= 2);
  }, [appState.numberProgress]);

  const getInsufficientNumbers = useCallback(() => {
    const { numberProgress } = appState;
    return NUMBERS.filter(n => (numberProgress[n]?.count || 0) < 2);
  }, [appState.numberProgress]);

  // --- Funciones de control ---
  const startCollecting = useCallback((number) => {
    if (appState.isTraining || appState.isPredicting) return;
    setAppState(prev => ({
      ...prev,
      isCollecting: true,
      currentNumber: number,
      statusMessage: STATUS_MESSAGES_NUMBERS.COLLECTING(number),
    }));
  }, [appState.isTraining, appState.isPredicting]);

  const stopCollecting = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      isCollecting: false,
      currentNumber: null,
      statusMessage: STATUS_MESSAGES_NUMBERS.IDLE,
    }));
    fetchProgress();
  }, [fetchProgress]);

  const trainModel = useCallback(async () => {
    if (!canTrainMinimal()) {
      const insufficientNumbers = getInsufficientNumbers();
      const message = `Faltan datos para: ${insufficientNumbers.join(', ')}. Necesitas al menos 2 muestras por número.`;
      setAppState(prev => ({ ...prev, statusMessage: message }));
      return;
    }

    setAppState(prev => ({ ...prev, isTraining: true, statusMessage: STATUS_MESSAGES_NUMBERS.TRAINING }));
    try {
      const result = await apiService.trainModel();
      setAppState(prev => ({
        ...prev,
        isModelTrained: true,
        trainingAccuracy: result.accuracy,
        statusMessage: STATUS_MESSAGES_NUMBERS.TRAINING_SUCCESS(result.accuracy),
      }));
    } catch (err) {
      console.error('Error durante el entrenamiento:', err);
      let errorMessage = STATUS_MESSAGES_NUMBERS.TRAINING_ERROR;

      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (detail.includes('Datos insuficientes')) {
          errorMessage = STATUS_MESSAGES_NUMBERS.TRAINING_ERROR_INSUFFICIENT;
        } else {
          errorMessage = `Error: ${detail}`;
        }
      }

      setAppState(prev => ({ ...prev, statusMessage: errorMessage }));
    } finally {
      setAppState(prev => ({ ...prev, isTraining: false }));
    }
  }, [canTrainMinimal, getInsufficientNumbers]);

  const resetData = useCallback(() => {
    setModalData({
      open: true,
      message: "¿Estás seguro de que quieres borrar todos los datos y el modelo?",
      onConfirm: async () => {
        try {
          await apiService.resetData();
          setAppState(prev => ({
            ...prev,
            isModelTrained: false,
            isPredicting: false,
            prediction: '',
            predictionConfidence: null,
            trainingAccuracy: null,
            statusMessage: STATUS_MESSAGES_NUMBERS.RESET,
            numberProgress: {},
          }));
        } catch (error) {
          console.error('Error al reiniciar datos:', error);
        } finally {
          fetchProgress();
        }
      }
    });
  }, [fetchProgress, setModalData]);

  const deleteNumberData = useCallback((number) => {
    setModalData({
      open: true,
      message: `¿Estás seguro de que quieres borrar todos los datos del número '${number}'?`,
      onConfirm: async () => {
        try {
          await apiService.deleteNumberData(number);
          setAppState(prev => ({
            ...prev,
            statusMessage: `Datos del número '${number}' eliminados correctamente.`,
          }));
        } catch (error) {
          console.error(`Error al eliminar datos del número ${number}:`, error);
        } finally {
          fetchProgress();
        }
      }
    });
  }, [fetchProgress, setModalData]);

  const togglePrediction = useCallback(() => {
    if (!appState.isModelTrained) {
      console.warn("Modelo no entrenado. Por favor, entrena el modelo primero.");
      return;
    }
    setAppState(prev => ({
      ...prev,
      isCollecting: false,
      currentNumber: null,
      isPredicting: !prev.isPredicting,
      prediction: '',
      predictionConfidence: null,
    }));
  }, [appState.isModelTrained]);

  const canTrain = useCallback(() => {
    const { numberProgress } = appState;
    return NUMBERS.every(n => (numberProgress[n]?.count || 0) >= SAMPLES_PER_NUMBER);
  }, [appState.numberProgress]);

  const getTotalSamples = useCallback(() => {
    const { numberProgress } = appState;
    return NUMBERS.reduce((sum, n) => sum + (numberProgress[n]?.count || 0), 0);
  }, [appState.numberProgress]);

  const getRequiredSamples = useCallback(() => {
    return NUMBERS.length * SAMPLES_PER_NUMBER;
  }, []);

  // Cargar progreso al inicio
  useEffect(() => {
    fetchProgress();
    const interval = setInterval(() => {
      fetchProgress();
    }, appState.isCollecting ? 1000 : 3000);

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
    deleteNumberData,
    togglePrediction,
    canTrain,
    canTrainMinimal,
    getInsufficientNumbers,
    getTotalSamples,
    getRequiredSamples,
    NUMBERS,
    SAMPLES_PER_NUMBER
  };
};