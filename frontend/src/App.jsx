import React, { useRef, useState } from 'react';

import { useMediaPipe } from './hooks/useMediaPipe.js';
import { useVocalLogic } from './hooks/useVocalLogic.js';
import CameraSection from './components/CameraSection.jsx';
import ControlsSection from './components/ControlsSection.jsx';
import StatusMessage from './components/StatusMessage.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import LeftBox from './components/LeftBox.jsx'; // 👈 nuevo componente

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Estado del modal
  const [modalData, setModalData] = useState({
    open: false,
    message: "",
    onConfirm: null
  });

  // Estado y lógica de la app
  const {
    appState,
    handleLandmarks,
    handlePredict,
    startCollecting,
    stopCollecting,
    trainModel,
    resetData,
    deleteVowelData,
    togglePrediction,
    canTrain,
    getTotalSamples,
    getRequiredSamples,
    VOWELS,
    SAMPLES_PER_VOWEL
  } = useVocalLogic({ setModalData });

  // Hook de MediaPipe
  const { isInitialized, isCameraReady, error } = useMediaPipe({
    videoRef,
    canvasRef,
    isCollecting: appState.isCollecting,
    currentVowel: appState.currentVowel,
    isModelTrained: appState.isModelTrained,
    isPredicting: appState.isPredicting,
    onLandmarks: handleLandmarks,
    onPredict: handlePredict,
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Reconocimiento de Vocales por Gestos</h1>
        <p>
          Usa la cámara para capturar la posición de tu mano, recolectar muestras
          y entrenar un modelo de IA para identificar vocales.
        </p>
      </header>

      <main className="app-main">
        {/* Cuadro largo a la izquierda */}
        <LeftBox />

        {/* Contenido principal */}
        <div className="main-content">
          <CameraSection
            videoRef={videoRef}
            canvasRef={canvasRef}
            isModelTrained={appState.isModelTrained}
            isPredicting={appState.isPredicting}
            prediction={appState.prediction}
            predictionConfidence={appState.predictionConfidence}
            togglePrediction={togglePrediction}
            isInitialized={isInitialized}
            isCameraReady={isCameraReady}
            error={error}
          />

          <div className="controls-and-info">
            <StatusMessage message={appState.statusMessage} />

            <ControlsSection
              vowels={VOWELS}
              progress={appState.vowelProgress}
              samplesPerVowel={SAMPLES_PER_VOWEL}
              isInitialized={isInitialized}
              isCollecting={appState.isCollecting}
              currentVowel={appState.currentVowel}
              isTraining={appState.isTraining}
              isPredicting={appState.isPredicting}
              canTrain={canTrain}
              getTotalSamples={getTotalSamples}
              getRequiredSamples={getRequiredSamples}
              startCollecting={startCollecting}
              stopCollecting={stopCollecting}
              trainModel={trainModel}
              resetData={resetData}
              deleteVowelData={deleteVowelData}
            />
          </div>
        </div>
      </main>

      {/* Modal global */}
      <ConfirmModal
        isOpen={modalData.open}
        message={modalData.message}
        onConfirm={() => {
          modalData.onConfirm?.();
          setModalData({ open: false, message: "", onConfirm: null });
        }}
        onCancel={() =>
          setModalData({ open: false, message: "", onConfirm: null })
        }
      />
    </div>
  );
}

export default App;
