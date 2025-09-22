// src/hooks/useNumberLogic.js
import { useState, useEffect, useCallback, useRef } from "react";
import { apiService } from "../services/api.js";

const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const SAMPLES_PER_NUMBER = 100;

// Mensajes de estado centralizados para números
const STATUS_MESSAGES_NUMBERS = {
  IDLE: "Inactivo. Selecciona un número para empezar a recolectar.",
  COLLECTING: (n) => `Recolectando muestras para el número '${n}'.`,
  TRAINING: "Entrenando modelo... Esto puede tomar unos minutos.",
  TRAINING_SUCCESS: (acc) => `Entrenamiento completado! Precisión: ${acc}%`,
  TRAINING_ERROR:
    "Error al entrenar el modelo. Asegúrate de tener al menos 2 muestras por número.",
  TRAINING_ERROR_INSUFFICIENT:
    "No hay suficientes datos para entrenar. Recolecta al menos 2 muestras para cada número.",
  RESET: "Datos reiniciados correctamente.",
  READY_TO_TRAIN: "Recolección completa. Listo para entrenar el modelo.",
  PREDICTION_ERROR:
    "Error en la predicción. Asegúrate de que el modelo esté entrenado.",
  PREDICTION_ERROR_NO_MODEL:
    "No hay modelo entrenado. Por favor, entrena el modelo primero.",
};

export const useNumberLogic = ({ setModalData }) => {
  const [appState, setAppState] = useState({
    isCollecting: false,
    isTraining: false,
    isModelTrained: false,
    isPredicting: false,
    currentNumber: null,
    prediction: "",
    predictionConfidence: null,
    trainingAccuracy: null,
    statusMessage: STATUS_MESSAGES_NUMBERS.IDLE,
    numberProgress: {},
  });

  // --- Obtener progreso ---
  const fetchProgress = useCallback(async () => {
    try {
      const progressData = await apiService.getNumberProgress();
      setAppState((prev) => {
        const statsNumbers = progressData.estadisticas_numeros || {};

        const normalizedNumberProgress = {};
        NUMBERS.forEach((num) => {
          const stats = statsNumbers[num] || {};
          normalizedNumberProgress[num] = {
            count: stats.total_muestras || 0,
            max: stats.cantidad_recomendada || SAMPLES_PER_NUMBER,
            percentage: stats.progreso_porcentaje || 0,
          };
        });

        const totalSamples = NUMBERS.reduce(
          (sum, n) => sum + (statsNumbers[n]?.total_muestras || 0),
          0
        );
        const totalRequired = NUMBERS.length * SAMPLES_PER_NUMBER;
        const totalProgress = (totalSamples / totalRequired) * 100;

        const newStatusMessage =
          totalProgress >= 100
            ? STATUS_MESSAGES_NUMBERS.READY_TO_TRAIN
            : prev.statusMessage;

        return {
          ...prev,
          numberProgress: {
            ...normalizedNumberProgress,
            total: {
              samples: totalSamples,
              max: totalRequired,
              percentage: totalProgress,
            },
          },
          statusMessage: newStatusMessage,
        };
      });
    } catch (error) {
      console.error("Error al obtener el progreso:", error);
    }
  }, []);

  // --- Guardar landmarks ---
  const handleLandmarks = useCallback(
    async (landmarks, number) => {
      if (!appState.isCollecting) return;
      try {
        await apiService.sendNumberLandmarks(landmarks, number);
        await fetchProgress();
      } catch (error) {
        console.error("Error al agregar muestra:", error);
      }
    },
    [appState.isCollecting, fetchProgress]
  );

  // --- Predicción con throttling ---
  const lastPredictionTime = useRef(0);
  const predictionInProgress = useRef(false);
  const PREDICTION_THROTTLE_MS = 200;

  const handlePredict = useCallback(
    async (landmarks, number) => {
      if (!appState.isPredicting || predictionInProgress.current) return;

      const now = Date.now();
      if (now - lastPredictionTime.current < PREDICTION_THROTTLE_MS) return;

      predictionInProgress.current = true;
      lastPredictionTime.current = now;

      try {
        const result = await apiService.predictNumber(landmarks, number);
        setAppState((prev) => ({
          ...prev,
          prediction: result.prediction,
          predictionConfidence: result.confidence,
        }));
      } catch (error) {
        console.error("Error en la predicción:", error);
        let errorMessage = STATUS_MESSAGES_NUMBERS.PREDICTION_ERROR;
        if (error.response?.data?.detail?.includes("Modelo no entrenado")) {
          errorMessage = STATUS_MESSAGES_NUMBERS.PREDICTION_ERROR_NO_MODEL;
        }
        setAppState((prev) => ({
          ...prev,
          isPredicting: false,
          statusMessage: errorMessage,
        }));
      } finally {
        predictionInProgress.current = false;
      }
    },
    [appState.isPredicting]
  );

  // --- Entrenamiento ---
  const trainModel = useCallback(async (number) => {
    setAppState((prev) => ({
      ...prev,
      isTraining: true,
      statusMessage: STATUS_MESSAGES_NUMBERS.TRAINING,
    }));
    try {
      const result = await apiService.trainNumber(number);
      setAppState((prev) => ({
        ...prev,
        isModelTrained: true,
        trainingAccuracy: result.accuracy,
        statusMessage: STATUS_MESSAGES_NUMBERS.TRAINING_SUCCESS(
          result.accuracy
        ),
      }));
    } catch (err) {
      console.error("Error durante el entrenamiento:", err);
      setAppState((prev) => ({
        ...prev,
        statusMessage: STATUS_MESSAGES_NUMBERS.TRAINING_ERROR,
      }));
    } finally {
      setAppState((prev) => ({ ...prev, isTraining: false }));
    }
  }, []);

  // --- Reset de datos ---
  const resetData = useCallback(
    (number) => {
      setModalData({
        open: true,
        message: `¿Seguro que quieres borrar todos los datos y el modelo del número '${number}'?`,
        onConfirm: async () => {
          try {
            await apiService.deleteNumberData(number);
            await apiService.resetNumberModel(number);
            setAppState((prev) => ({
              ...prev,
              isModelTrained: false,
              isPredicting: false,
              prediction: "",
              predictionConfidence: null,
              trainingAccuracy: null,
              statusMessage: STATUS_MESSAGES_NUMBERS.RESET,
              numberProgress: {},
            }));
          } catch (error) {
            console.error("Error al reiniciar datos:", error);
          } finally {
            fetchProgress();
          }
        },
      });
    },
    [fetchProgress, setModalData]
  );

  // --- Eliminar datos de un número ---
  const deleteNumberData = useCallback(
    (number) => {
      setModalData({
        open: true,
        message: `¿Estás seguro de que quieres borrar todos los datos del número '${number}'?`,
        onConfirm: async () => {
          try {
            await apiService.deleteNumberData(number);
            setAppState((prev) => ({
              ...prev,
              statusMessage: `Datos del número '${number}' eliminados correctamente.`,
            }));
          } catch (error) {
            console.error(`Error al eliminar datos del número ${number}:`, error);
          } finally {
            fetchProgress();
          }
        },
      });
    },
    [fetchProgress, setModalData]
  );

  // --- Toggle predicción ---
  const togglePrediction = useCallback(() => {
    if (!appState.isModelTrained) {
      console.warn("Modelo no entrenado. Por favor, entrena el modelo primero.");
      return;
    }
    setAppState((prev) => ({
      ...prev,
      isCollecting: false,
      currentNumber: null,
      isPredicting: !prev.isPredicting,
      prediction: "",
      predictionConfidence: null,
    }));
  }, [appState.isModelTrained]);

  // --- Ciclo de refresco ---
  useEffect(() => {
    fetchProgress();
    const interval = setInterval(
      fetchProgress,
      appState.isCollecting ? 1000 : 3000
    );
    return () => clearInterval(interval);
  }, [fetchProgress, appState.isCollecting]);

  // 👇 Ya es booleano
  const canTrain = Object.values(appState.numberProgress || {}).some(
    (n) => n.count >= 2
  );

  return {
    appState,
    handleLandmarks,
    handlePredict,
    startCollecting: (number) =>
      setAppState((prev) => ({
        ...prev,
        isCollecting: true,
        currentNumber: number,
        statusMessage: STATUS_MESSAGES_NUMBERS.COLLECTING(number),
      })),
    stopCollecting: () =>
      setAppState((prev) => ({
        ...prev,
        isCollecting: false,
        currentNumber: null,
        statusMessage: STATUS_MESSAGES_NUMBERS.IDLE,
      })),
    trainModel,
    resetData,
    deleteNumberData,
    togglePrediction,
    NUMBERS,
    SAMPLES_PER_NUMBER,
    canTrain,
  };
};
