import React, { useRef, useState } from "react";
import { useMediaPipe } from "../../../../hooks/useMediaPipe.js";
import { useVocalLogic } from "../../../../hooks/useVocalLogic.js";
import CameraSection from "../../../../components/camera/CameraSection.jsx";
import SingleopbasicControls from "../../../../components/controls/SingleopbasicControls.jsx";
import StatusMessage from "../../../../components/feedback/StatusMessage.jsx";
import ConfirmModal from "../../../../components/modals/ConfirmModal.jsx";
import LeftBox from "../../../../components/layout/LeftBox.jsx";

export default function TrainingAlgorithmsBasicMas() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [modalData, setModalData] = useState({
    open: false,
    message: "",
    onConfirm: null,
  });

  const {
    appState,
    handleLandmarks,
    handlePredict,
    startCollecting,
    stopCollecting,
    trainModel,
    resetData,
    deleteopbasicData,
    togglePrediction,
    canTrain,
  } = useVocalLogic({ setModalData });

  const { isInitialized, isCameraReady, error } = useMediaPipe({
    videoRef,
    canvasRef,
    isCollecting: appState.isCollecting,
    currentopbasic: appState.currentopbasic,
    isModelTrained: appState.isModelTrained,
    isPredicting: appState.isPredicting,
    onLandmarks: handleLandmarks,
    onPredict: handlePredict,
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🔡 Entrenamiento de la Suma</h1>
        <p>Recolecta datos para entrenar el modelo con la operacion Suma</p>
      </header>

      <main className="app-main">
        <LeftBox />

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

            {/* 👇 Solo mostramos el progreso de la vocal A */}
            <SingleopbasicControls
              opbasic="mas"
              progress={appState.opbasicProgress}
              isCollecting={appState.isCollecting}
              currentopbasic={appState.currentopbasic}
              startCollecting={startCollecting}
              stopCollecting={stopCollecting}
              deleteopbasicData={deleteopbasicData}
              canTrain={canTrain}
              isTraining={appState.isTraining}
              trainModel={trainModel}
              resetData={resetData}
              statusMessage={appState.statusMessage}
            />

          </div>
        </div>
      </main>

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
