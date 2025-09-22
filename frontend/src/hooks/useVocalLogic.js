import { useState, useEffect, useCallback, useRef } from "react";
import { apiService } from "../services/api.js";

const VOWELS = ["a", "e", "i", "o", "u"];
const SAMPLES_PER_VOWEL = 100;

const STATUS_MESSAGES = {
  IDLE: "Inactivo. Selecciona una vocal para empezar a recolectar.",
  COLLECTING: (v) => `Recolectando muestras para la vocal '${v}'.`,
  TRAINING: "Entrenando modelo... Esto puede tomar unos minutos.",
  TRAINING_SUCCESS: (acc) => `Entrenamiento completado! Precisión: ${acc}%`,
  TRAINING_ERROR:
    "Error al entrenar el modelo. Asegúrate de tener al menos 2 muestras por vocal.",
  RESET: "Datos reiniciados correctamente.",
  READY_TO_TRAIN: "Recolección completa. Listo para entrenar el modelo.",
  PREDICTION_ERROR:
    "Error en la predicción. Asegúrate de que el modelo esté entrenado.",
  PREDICTION_ERROR_NO_MODEL:
    "No hay modelo entrenado. Por favor, entrena el modelo primero.",
};

export const useVocalLogic = ({ setModalData }) => {
  const [appState, setAppState] = useState({
    isCollecting: false,
    isTraining: false,
    isModelTrained: false,
    isPredicting: false,
    currentVowel: null,
    prediction: "",
    predictionConfidence: null,
    trainingAccuracy: null,
    statusMessage: STATUS_MESSAGES.IDLE,
    vowelProgress: {},
  });

  // --- Obtener progreso ---
  const fetchProgress = useCallback(async () => {
    try {
      const progressData = await apiService.getVowelProgress();
      setAppState((prev) => {
        const totalSamples = VOWELS.reduce(
          (sum, v) =>
            sum +
            (progressData.estadisticas_vocales?.[v]?.total_muestras || 0),
          0
        );
        const totalRequired =
          VOWELS.length *
          (progressData.configuracion?.samples_recomendados ||
            SAMPLES_PER_VOWEL);
        const totalProgress = (totalSamples / totalRequired) * 100;

        const newStatusMessage =
          totalProgress >= 100
            ? STATUS_MESSAGES.READY_TO_TRAIN
            : prev.statusMessage;

        const normalizedVowelProgress = {};
        VOWELS.forEach((v) => {
          const stats = progressData.estadisticas_vocales?.[v] || {};
          const total =
            (stats.total_muestras || 0) + (stats.muestras_en_cola || 0);

          normalizedVowelProgress[v] = {
            count: total,
            max: stats.cantidad_recomendada || SAMPLES_PER_VOWEL,
            percentage: Math.min(
              100,
              (total / (stats.cantidad_recomendada || SAMPLES_PER_VOWEL)) * 100
            ),
          };
        });

        // 👇 Marcar modelo como entrenado si alguno existe
        const someModelTrained = VOWELS.some(
          (v) => progressData.estadisticas_vocales?.[v]?.tiene_modelo
        );

        return {
          ...prev,
          vowelProgress: {
            ...normalizedVowelProgress,
            total: {
              samples: totalSamples,
              max: totalRequired,
              percentage: totalProgress,
            },
          },
          statusMessage: newStatusMessage,
          isModelTrained: someModelTrained,
        };
      });
    } catch (error) {
      console.error("Error al obtener el progreso:", error);
    }
  }, []);

  // --- Guardar landmarks ---
  const handleLandmarks = useCallback(
    async (landmarks, vowel) => {
      if (!appState.isCollecting) return;

      // 🔎 Verificar si ya está al 100%
      const progress = appState.vowelProgress?.[vowel]?.percentage || 0;
      if (progress >= 100) {
        console.log(`⚠️ La vocal '${vowel}' ya alcanzó el 100%, auto-stop.`);
        setAppState((prev) => ({
          ...prev,
          isCollecting: false,
          currentVowel: null,
          statusMessage: `La vocal '${vowel}' ya completó la recolección.`,
        }));
        return;
      }

      try {
        await apiService.sendVowelLandmarks(landmarks, vowel.toLowerCase());

        // ⚡ Actualizamos estado local rápidamente
        setAppState((prev) => {
          const current = prev.vowelProgress[vowel] || {
            count: 0,
            max: SAMPLES_PER_VOWEL,
            percentage: 0,
          };

          const newCount = current.count + 1;
          const newPercentage = Math.min(
            100,
            (newCount / (current.max || SAMPLES_PER_VOWEL)) * 100
          );

          return {
            ...prev,
            vowelProgress: {
              ...prev.vowelProgress,
              [vowel]: {
                ...current,
                count: newCount,
                percentage: newPercentage,
              },
            },
          };
        });

        // 🔄 Refrescar en background
        fetchProgress();
      } catch (error) {
        console.error("Error al agregar muestra:", error);
      }
    },
    [appState.isCollecting, appState.vowelProgress, fetchProgress]
  );

  // --- Predicción ---
  const lastPredictionTime = useRef(0);
  const predictionInProgress = useRef(false);
  const PREDICTION_THROTTLE_MS = 200;

  const handlePredict = useCallback(
    async (landmarks) => {
      if (!appState.isPredicting || predictionInProgress.current) {
        return;
      }

      const now = Date.now();
      if (now - lastPredictionTime.current < PREDICTION_THROTTLE_MS) return;

      predictionInProgress.current = true;
      lastPredictionTime.current = now;

      try {
        const result = await apiService.predictVowelGeneral(landmarks);

        setAppState((prev) => ({
          ...prev,
          prediction: result.prediction,
          predictionConfidence: result.confidence,
        }));
      } catch (error) {
        console.error("❌ Error en la predicción:", error);
        let errorMessage = STATUS_MESSAGES.PREDICTION_ERROR;
        if (error.response?.data?.detail?.includes("No hay modelo entrenado")) {
          errorMessage = STATUS_MESSAGES.PREDICTION_ERROR_NO_MODEL;
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
  const trainModel = useCallback(async (vowel) => {
    setAppState((prev) => ({
      ...prev,
      isTraining: true,
      statusMessage: STATUS_MESSAGES.TRAINING,
    }));
    try {
      const result = await apiService.trainVowel(vowel.toLowerCase());
      const acc = result.resultado?.precision_validacion ?? 0;

      setAppState((prev) => ({
        ...prev,
        isModelTrained: true,
        trainingAccuracy: acc,
        statusMessage: STATUS_MESSAGES.TRAINING_SUCCESS(acc),
      }));
    } catch (err) {
      console.error("Error durante el entrenamiento:", err);
      setAppState((prev) => ({
        ...prev,
        statusMessage: STATUS_MESSAGES.TRAINING_ERROR,
      }));
    } finally {
      setAppState((prev) => ({ ...prev, isTraining: false }));
    }
  }, []);

  // --- Reset de datos ---
  const resetData = useCallback(
    (vowel) => {
      setModalData({
        open: true,
        message:
          "¿Estás seguro de que quieres borrar todos los datos y el modelo?",
        onConfirm: async () => {
          try {
            await apiService.deleteVowelData(vowel.toLowerCase());
            await apiService.resetVowelModel(vowel.toLowerCase());
            setAppState((prev) => ({
              ...prev,
              isModelTrained: false,
              isPredicting: false,
              prediction: "",
              predictionConfidence: null,
              trainingAccuracy: null,
              statusMessage: STATUS_MESSAGES.RESET,
              vowelProgress: {},
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
  const deleteVowelData = useCallback(
    (vowel) => {
      setModalData({
        open: true,
        message: `¿Estás seguro de que quieres borrar todos los datos de la vocal '${vowel}'?`,
        onConfirm: async () => {
          try {
            await apiService.deleteVowelData(vowel.toLowerCase());
            setAppState((prev) => ({
              ...prev,
              statusMessage: `Datos de la vocal '${vowel}' eliminados correctamente.`,
            }));
          } catch (error) {
            console.error(
              `Error al eliminar datos de la vocal ${vowel}:`,
              error
            );
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
    setAppState((prev) => ({
      ...prev,
      isCollecting: false,
      currentVowel: null,
      isPredicting: !prev.isPredicting,
      prediction: "",
      predictionConfidence: null,
    }));
  }, []);

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
    startCollecting: (vowel) => {
      const progress = appState.vowelProgress?.[vowel]?.percentage || 0;
      if (progress >= 100) {
        console.log(`⛔ No se puede recolectar '${vowel}', ya está al 100%.`);
        return;
      }
      setAppState((prev) => ({
        ...prev,
        isCollecting: true,
        currentVowel: vowel.toLowerCase(),
        statusMessage: STATUS_MESSAGES.COLLECTING(vowel.toLowerCase()),
      }));
    },
    stopCollecting: () =>
      setAppState((prev) => ({
        ...prev,
        isCollecting: false,
        currentVowel: null,
        statusMessage: STATUS_MESSAGES.IDLE,
      })),
    trainModel,
    resetData,
    deleteVowelData,
    togglePrediction,
    VOWELS,
    SAMPLES_PER_VOWEL,
  };
};
