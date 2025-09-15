import React, { useRef } from 'react';
import { useMediaPipe } from './hooks/useMediaPipe.js';
import { useVocalLogic } from './hooks/useVocalLogic.js';
import CameraSection from './components/CameraSection.jsx';
import ControlsSection from './components/ControlsSection.jsx';
import StatusMessage from './components/StatusMessage.jsx';
import SummaryInfo from './components/SummaryInfo.jsx';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Todo el estado y la lógica de la app se extraen a este hook
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
  } = useVocalLogic();

  // El hook de MediaPipe se encarga solo de la cámara y los landmarks
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
        <h1>🎙️ Reconocimiento de Vocales</h1>
        <p>Entrena un modelo de IA para reconocer la forma de tu mano al pronunciar las vocales.</p>
      </header>

      <main className="app-main">
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
    </div>
  );
}

export default App;