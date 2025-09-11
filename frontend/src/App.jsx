import React, { useState, useEffect, useRef, useCallback } from 'react';
import CameraSection from './components/CameraSection';
import ControlsSection from './components/ControlsSection';
import { useMediaPipe } from './hooks/useMediaPipe';
import { apiService } from './services/api';

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const SAMPLES_PER_VOWEL = 100;

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Estados principales
  const [isCollecting, setIsCollecting] = useState(false);
  const [currentVowel, setCurrentVowel] = useState(null);
  const [progress, setProgress] = useState({
    vocals: {},
    total: { samples: 0, max: VOWELS.length * SAMPLES_PER_VOWEL, percentage: 0 }
  });
  const [prediction, setPrediction] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  // Cargar progreso inicial al montar
  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const progressData = await apiService.getProgress();
      setProgress(progressData);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleLandmarks = useCallback(async (landmarks, vowel) => {
    try {
      await apiService.sendLandmarks(landmarks, vowel);
      await fetchProgress(); // actualizar barras
    } catch (error) {
      console.error('Error sending landmarks:', error);
      
      // Si se alcanzó el límite, detener la recolección
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('límite')) {
        stopCollecting();
        setStatusMessage(`✅ Vocal '${vowel}' completada. Se alcanzó el límite de 100 muestras.`);
      } else {
        setStatusMessage('Error al enviar datos: ' + (error.response?.data?.detail || error.message));
      }
    }
  }, []);

  const handlePredict = useCallback(async (landmarks) => {
    try {
      const result = await apiService.predictVowel(landmarks);
      setPrediction(result);
    } catch (error) {
      console.error('Error predicting vowel:', error);
    }
  }, []);

  // Inicializar MediaPipe
  const { handsRef, cameraRef, isInitialized, error } = useMediaPipe({
    videoRef,
    canvasRef,
    isCollecting,
    currentVowel,
    isModelTrained,
    isPredicting,
    onLandmarks: handleLandmarks,
    onPredict: handlePredict
  });

  // Funciones de control
  const startCollecting = (vowel) => {
    setCurrentVowel(vowel);
    setIsCollecting(true);
    setStatusMessage(`Recolectando muestras para la vocal '${vowel}'...`);
  };

  const stopCollecting = () => {
    setIsCollecting(false);
    setCurrentVowel(null);
    setStatusMessage('Recolección detenida.');
  };

  const trainModel = async () => {
    setIsTraining(true);
    setStatusMessage('Entrenando modelo... Esto puede tomar unos minutos.');

    try {
      const response = await apiService.trainModel();
      setStatusMessage(response.message || '🎉 Entrenamiento completado.');
      setIsModelTrained(true);
      setIsPredicting(true);
    } catch (error) {
      setStatusMessage(
        'Error al entrenar el modelo: ' +
          (error.response?.data?.detail || error.message)
      );
    } finally {
      setIsTraining(false);
    }
  };

  const resetData = async () => {
    try {
      await apiService.resetData();
      setProgress({
        vocals: {},
        total: { samples: 0, max: VOWELS.length * SAMPLES_PER_VOWEL, percentage: 0 }
      });
      setIsModelTrained(false);
      setIsPredicting(false);
      setPrediction('');
      setStatusMessage('Datos reiniciados correctamente.');
    } catch (error) {
      setStatusMessage(
        'Error al reiniciar datos: ' +
          (error.response?.data?.detail || error.message)
      );
    }
  };

  const togglePrediction = () => {
    setIsPredicting(!isPredicting);
    if (!isPredicting) {
      setPrediction('');
    }
  };

  // Helpers
  const getTotalSamples = () => {
    if (!progress.vocals) return 0;
    return Object.values(progress.vocals).reduce((sum, v) => sum + (v.count || 0), 0);
  };

  const getRequiredSamples = () => VOWELS.length * SAMPLES_PER_VOWEL;

  const canTrain = () => {
    if (!progress.vocals) return false;
    return VOWELS.every(
      (vowel) => (progress.vocals[vowel]?.count || 0) >= SAMPLES_PER_VOWEL
    );
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🤟 Entrenador de Vocales</h1>
        <p>Reconocimiento de gestos de manos con MediaPipe y TensorFlow</p>
      </header>

      <div className="main-content">
        <CameraSection
          videoRef={videoRef}
          canvasRef={canvasRef}
          isModelTrained={isModelTrained}
          isPredicting={isPredicting}
          prediction={prediction}
          togglePrediction={togglePrediction}
          isInitialized={isInitialized}
          error={error}
        />

        <ControlsSection
          progress={progress}
          isCollecting={isCollecting}
          currentVowel={currentVowel}
          isTraining={isTraining}
          canTrain={canTrain}
          statusMessage={statusMessage}
          startCollecting={startCollecting}
          stopCollecting={stopCollecting}
          trainModel={trainModel}
          resetData={resetData}
          getTotalSamples={getTotalSamples}
          getRequiredSamples={getRequiredSamples}
        />
      </div>
    </div>
  );
}

export default App;