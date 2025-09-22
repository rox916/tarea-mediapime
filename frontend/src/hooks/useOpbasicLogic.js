import { useState, useEffect, useCallback, useRef } from "react";
import { apiService } from "../services/api.js";

// ⚠️ Definimos operaciones en nombres "humanos"
const OPBASICS = ["division", "multiplicacion", "mas", "menos"];
const SAMPLES_PER_OPBASIC = 100;

const STATUS_MESSAGES_OPBASICS = {
  IDLE: "Inactivo. Selecciona una operación para empezar a recolectar.",
  COLLECTING: (op) => `Recolectando muestras para la operación '${op}'.`,
  TRAINING: "Entrenando modelo... Esto puede tomar unos minutos.",
  TRAINING_SUCCESS: (acc) => `Entrenamiento completado! Precisión: ${acc}%`,
  TRAINING_ERROR:
    "Error al entrenar el modelo. Asegúrate de tener al menos 2 muestras por operación.",
  TRAINING_ERROR_INSUFFICIENT:
    "No hay suficientes datos para entrenar. Recolecta al menos 2 muestras por operación.",
  RESET: "Datos reiniciados correctamente.",
  READY_TO_TRAIN: "Recolección completa. Listo para entrenar el modelo.",
  PREDICTION_ERROR:
    "Error en la predicción. Asegúrate de que el modelo esté entrenado.",
  PREDICTION_ERROR_NO_MODEL:
    "No hay modelo entrenado. Por favor, entrena el modelo primero.",
};

export const useOpbasicLogic = ({ setModalData }) => {
  const [appState, setAppState] = useState({
    isCollecting: false,
    isTraining: false,
    isModelTrained: false,
    isPredicting: false,
    currentOpbasic: null, // 👈 siempre en nombre humano ("multiplicacion")
    prediction: "",
    predictionConfidence: null,
    trainingAccuracy: null,
    statusMessage: STATUS_MESSAGES_OPBASICS.IDLE,
    opbasicProgress: {},
  });

  // --- Obtener progreso ---
  const fetchProgress = useCallback(async () => {
    try {
      const progressData = await apiService.getOpbasicProgress();
      const stats = progressData.estadisticas_operaciones || {};

      setAppState((prev) => {
        const normalizedProgress = {};

        Object.entries(stats).forEach(([op, values]) => {
          if (OPBASICS.includes(op)) {
            normalizedProgress[op] = {
              count: values.total_muestras || 0,
              max: values.cantidad_recomendada || SAMPLES_PER_OPBASIC,
              percentage: values.progreso_porcentaje || 0,
            };
          }
        });

        const totalSamples = Object.values(normalizedProgress).reduce(
          (sum, op) => sum + (op.count || 0),
          0
        );
        const totalRequired = OPBASICS.length * SAMPLES_PER_OPBASIC;
        const totalProgress = (totalSamples / totalRequired) * 100;

        const newStatusMessage =
          totalProgress >= 100
            ? STATUS_MESSAGES_OPBASICS.READY_TO_TRAIN
            : prev.statusMessage;

        return {
          ...prev,
          opbasicProgress: {
            ...normalizedProgress,
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
    async (landmarks, opbasic) => {
      if (!appState.isCollecting) return;
      const label = opbasic || appState.currentOpbasic; // 👈 siempre nombre humano
      if (!label) return;

      // Agregar este console.log para ver los landmarks antes de enviarlos
      console.log("Landmarks a enviar:", landmarks);

      // Validar el formato de los landmarks
      if (!Array.isArray(landmarks) || landmarks.length !== 21) {
        console.error("Formato de landmarks incorrecto");
        return;
      }

      // Verificar que cada landmark tenga 3 coordenadas (x, y, z)
      for (const point of landmarks) {
        if (!Array.isArray(point) || point.length !== 3) {
          console.error("Cada punto de landmark debe tener 3 coordenadas.");
          return;
        }
      }

      try {
        await apiService.sendOpbasicLandmarks(landmarks, label); // Enviamos al backend
        await fetchProgress();
      } catch (error) {
        console.error("Error al agregar muestra:", error);
      }
    },
    [appState.isCollecting, appState.currentOpbasic, fetchProgress]
  );

  // --- Predicción con throttling ---
  const lastPredictionTime = useRef(0);
  const predictionInProgress = useRef(false);
  const PREDICTION_THROTTLE_MS = 200;

  const handlePredict = useCallback(
    async (landmarks, opbasic) => {
      if (!appState.isPredicting || predictionInProgress.current) return;

      const now = Date.now();
      if (now - lastPredictionTime.current < PREDICTION_THROTTLE_MS) return;

      predictionInProgress.current = true;
      lastPredictionTime.current = now;

      try {
        const label = opbasic || appState.currentOpbasic; // 👈 siempre nombre humano
        if (!label) return;

        const result = await apiService.predictOpbasic(landmarks, label);
        setAppState((prev) => ({
          ...prev,
          prediction: result.prediction,
          predictionConfidence: result.confidence,
        }));
      } catch (error) {
        console.error("Error en la predicción:", error);
        let errorMessage = STATUS_MESSAGES_OPBASICS.PREDICTION_ERROR;
        if (error.response?.data?.detail?.includes("Modelo no entrenado")) {
          errorMessage = STATUS_MESSAGES_OPBASICS.PREDICTION_ERROR_NO_MODEL;
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
    [appState.isPredicting, appState.currentOpbasic]
  );

  // --- Entrenamiento ---
  const trainModel = useCallback(async (opbasic) => {
    setAppState((prev) => ({
      ...prev,
      isTraining: true,
      statusMessage: STATUS_MESSAGES_OPBASICS.TRAINING,
    }));
    try {
      const result = await apiService.trainOpbasic(opbasic);
      setAppState((prev) => ({
        ...prev,
        isModelTrained: true,
        trainingAccuracy: result.accuracy,
        statusMessage: STATUS_MESSAGES_OPBASICS.TRAINING_SUCCESS(
          result.accuracy
        ),
      }));
    } catch (err) {
      console.error("Error durante el entrenamiento:", err);
      setAppState((prev) => ({
        ...prev,
        statusMessage: STATUS_MESSAGES_OPBASICS.TRAINING_ERROR,
      }));
    } finally {
      setAppState((prev) => ({ ...prev, isTraining: false }));
    }
  }, []);

  // --- Reset ---
  const resetData = useCallback(
    (opbasic) => {
      setModalData({
        open: true,
        message: `¿Seguro que quieres borrar todos los datos y el modelo de '${opbasic}'?`,
        onConfirm: async () => {
          try {
            await apiService.resetOpbasicModel(opbasic);
            setAppState((prev) => ({
              ...prev,
              isModelTrained: false,
              isPredicting: false,
              prediction: "",
              predictionConfidence: null,
              trainingAccuracy: null,
              statusMessage: STATUS_MESSAGES_OPBASICS.RESET,
              opbasicProgress: {},
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

  // --- Eliminar datos ---
  const deleteOpbasicData = useCallback(
    (opbasic) => {
      setModalData({
        open: true,
        message: `¿Seguro que quieres borrar todos los datos de '${opbasic}'?`,
        onConfirm: async () => {
          try {
            await apiService.deleteOpbasicData(opbasic);
            setAppState((prev) => ({
              ...prev,
              statusMessage: `Datos de la operación '${opbasic}' eliminados correctamente.`,
            }));
          } catch (error) {
            console.error(`Error al eliminar datos de ${opbasic}:`, error);
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
      currentOpbasic: null,
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

  return {
    appState,
    handleLandmarks,
    handlePredict,
    startCollecting: (opbasic) =>
      setAppState((prev) => ({
        ...prev,
        isCollecting: true,
        currentOpbasic: opbasic, // 👈 en humano
        statusMessage: STATUS_MESSAGES_OPBASICS.COLLECTING(opbasic),
      })),
    stopCollecting: () =>
      setAppState((prev) => ({
        ...prev,
        isCollecting: false,
        currentOpbasic: null,
        statusMessage: STATUS_MESSAGES_OPBASICS.IDLE,
      })),
    trainModel,
    resetData,
    deleteOpbasicData,
    togglePrediction,
    OPBASICS,
    SAMPLES_PER_OPBASIC,
  };
};
