import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api.js';

const OPBASICS = ['division', 'multiplication', 'mas', 'menos'];
const SAMPLES_PER_OPBASIC = 100;

// Mensajes de estado centralizados para operaciones básicas
const STATUS_MESSAGES_OPBASICS = {
  IDLE: 'Inactivo. Selecciona una operación para empezar a recolectar.',
  COLLECTING: (op) => `Recolectando muestras para la operación '${op}'.`,
  TRAINING: 'Entrenando modelo... Esto puede tomar unos minutos.',
  TRAINING_SUCCESS: (acc) => `Entrenamiento completado! Precisión: ${acc}%`,
  TRAINING_ERROR: 'Error al entrenar el modelo. Asegúrate de tener al menos 2 muestras por operación.',
  TRAINING_ERROR_INSUFFICIENT: 'No hay suficientes datos para entrenar. Recolecta al menos 2 muestras para cada operación.',
  RESET: 'Datos reiniciados correctamente.',
  READY_TO_TRAIN: 'Recolección completa. Listo para entrenar el modelo.',
  PREDICTION_ERROR: 'Error en la predicción. Asegúrate de que el modelo esté entrenado.',
  PREDICTION_ERROR_NO_MODEL: 'No hay modelo entrenado. Por favor, entrena el modelo primero.',
};

export const useOpbasicLogic = ({ setModalData }) => {
  const [appState, setAppState] = useState({
    isCollecting: false,
    isTraining: false,
    isModelTrained: false,
    isPredicting: false,
    currentOpbasic: null,
    prediction: '',
    predictionConfidence: null,
    trainingAccuracy: null,
    statusMessage: STATUS_MESSAGES_OPBASICS.IDLE,
    opbasicProgress: {},
  });

  // --- Funciones de comunicación con el backend ---
  const fetchProgress = useCallback(async () => {
    try {
      const progressData = await apiService.getProgress();
      setAppState(prev => {
        const totalSamples = OPBASICS.reduce((sum, op) => sum + (progressData.operaciones_basicas[op]?.cantidad || 0), 0);
        const totalRequired = OPBASICS.length * SAMPLES_PER_OPBASIC;
        const totalProgress = (totalSamples / totalRequired) * 100;

        const newStatusMessage = totalProgress >= 100 ? STATUS_MESSAGES_OPBASICS.READY_TO_TRAIN : prev.statusMessage;

        const normalizedOpbasicProgress = {};
        Object.keys(progressData.operaciones_basicas).forEach(opbasic => {
          normalizedOpbasicProgress[opbasic] = {
            count: progressData.operaciones_basicas[opbasic].cantidad,
            max: progressData.operaciones_basicas[opbasic].max,
            percentage: progressData.operaciones_basicas[opbasic].porcentaje
          };
        });

        return {
          ...prev,
          opbasicProgress: {
            ...normalizedOpbasicProgress,
            total: { samples: totalSamples, max: totalRequired, percentage: totalProgress }
          },
          statusMessage: newStatusMessage
        };
      });
    } catch (error) {
      console.error('Error al obtener el progreso:', error);
    }
  }, []);

  const handleLandmarks = useCallback(async (landmarks, opbasic) => {
    if (!appState.isCollecting) return;
    try {
      await apiService.sendLandmarks(landmarks, opbasic);
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
      const result = await apiService.predictOpbasic(landmarks);

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
      let errorMessage = STATUS_MESSAGES_OPBASICS.PREDICTION_ERROR;
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (detail.includes('Modelo no entrenado')) {
          errorMessage = STATUS_MESSAGES_OPBASICS.PREDICTION_ERROR_NO_MODEL;
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
    const { opbasicProgress } = appState;
    return OPBASICS.every(op => (opbasicProgress[op]?.count || 0) >= 2);
  }, [appState.opbasicProgress]);

  const getInsufficientOpbasics = useCallback(() => {
    const { opbasicProgress } = appState;
    return OPBASICS.filter(op => (opbasicProgress[op]?.count || 0) < 2);
  }, [appState.opbasicProgress]);

  // --- Funciones de control ---
  const startCollecting = useCallback((opbasic) => {
    if (appState.isTraining || appState.isPredicting) return;
    setAppState(prev => ({
      ...prev,
      isCollecting: true,
      currentOpbasic: opbasic,
      statusMessage: STATUS_MESSAGES_OPBASICS.COLLECTING(opbasic),
    }));
  }, [appState.isTraining, appState.isPredicting]);

  const stopCollecting = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      isCollecting: false,
      currentOpbasic: null,
      statusMessage: STATUS_MESSAGES_OPBASICS.IDLE,
    }));
    fetchProgress();
  }, [fetchProgress]);

  const trainModel = useCallback(async () => {
    if (!canTrainMinimal()) {
      const insufficientOpbasics = getInsufficientOpbasics();
      const message = `Faltan datos para: ${insufficientOpbasics.join(', ')}. Necesitas al menos 2 muestras por operación.`;
      setAppState(prev => ({ ...prev, statusMessage: message }));
      return;
    }

    setAppState(prev => ({ ...prev, isTraining: true, statusMessage: STATUS_MESSAGES_OPBASICS.TRAINING }));
    try {
      const result = await apiService.trainModel();
      setAppState(prev => ({
        ...prev,
        isModelTrained: true,
        trainingAccuracy: result.accuracy,
        statusMessage: STATUS_MESSAGES_OPBASICS.TRAINING_SUCCESS(result.accuracy),
      }));
    } catch (err) {
      console.error('Error durante el entrenamiento:', err);
      let errorMessage = STATUS_MESSAGES_OPBASICS.TRAINING_ERROR;

      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (detail.includes('Datos insuficientes')) {
          errorMessage = STATUS_MESSAGES_OPBASICS.TRAINING_ERROR_INSUFFICIENT;
        } else {
          errorMessage = `Error: ${detail}`;
        }
      }

      setAppState(prev => ({ ...prev, statusMessage: errorMessage }));
    } finally {
      setAppState(prev => ({ ...prev, isTraining: false }));
    }
  }, [canTrainMinimal, getInsufficientOpbasics]);

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
            statusMessage: STATUS_MESSAGES_OPBASICS.RESET,
            opbasicProgress: {},
          }));
        } catch (error) {
          console.error('Error al reiniciar datos:', error);
        } finally {
          fetchProgress();
        }
      }
    });
  }, [fetchProgress, setModalData]);

  const deleteOpbasicData = useCallback((opbasic) => {
    setModalData({
      open: true,
      message: `¿Estás seguro de que quieres borrar todos los datos de la operación '${opbasic}'?`,
      onConfirm: async () => {
        try {
          await apiService.deleteOpbasicData(opbasic);
          setAppState(prev => ({
            ...prev,
            statusMessage: `Datos de la operación '${opbasic}' eliminados correctamente.`,
          }));
        } catch (error) {
          console.error(`Error al eliminar datos de la operación ${opbasic}:`, error);
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
      currentOpbasic: null,
      isPredicting: !prev.isPredicting,
      prediction: '',
      predictionConfidence: null,
    }));
  }, [appState.isModelTrained]);

  const canTrain = useCallback(() => {
    const { opbasicProgress } = appState;
    return OPBASICS.every(op => (opbasicProgress[op]?.count || 0) >= SAMPLES_PER_OPBASIC);
  }, [appState.opbasicProgress]);

  const getTotalSamples = useCallback(() => {
    const { opbasicProgress } = appState;
    return OPBASICS.reduce((sum, op) => sum + (opbasicProgress[op]?.count || 0), 0);
  }, [appState.opbasicProgress]);

  const getRequiredSamples = useCallback(() => {
    return OPBASICS.length * SAMPLES_PER_OPBASIC;
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
    deleteOpbasicData,
    togglePrediction,
    canTrain,
    canTrainMinimal,
    getInsufficientOpbasics,
    getTotalSamples,
    getRequiredSamples,
    OPBASICS,
    SAMPLES_PER_OPBASIC
  };
};