import React from 'react';
import VowelControls from './VowelControls';
import SummaryInfo from "../feedback/SummaryInfo.jsx";
import StatusMessage from "../feedback/StatusMessage.jsx";

const ControlsSection = ({ 
  progress,
  isCollecting,
  currentVowel,
  isTraining,
  canTrain,
  statusMessage,
  startCollecting,
  stopCollecting,
  trainModel,
  resetData,
  deleteVowelData,
  getTotalSamples,
  getRequiredSamples
}) => {
  return (
    <div className="controls-section">
      <h2>🎛️ Controles de Entrenamiento</h2>
      
      {/* Progreso general */}
      <SummaryInfo 
        getTotalSamples={getTotalSamples}
        getRequiredSamples={getRequiredSamples}
      />

      {/* ✅ Grid de vocales + botones (todo manejado dentro de VowelControls) */}
      <VowelControls
        progress={progress}
        isCollecting={isCollecting}
        currentVowel={currentVowel}
        startCollecting={startCollecting}
        stopCollecting={stopCollecting}
        deleteVowelData={deleteVowelData}
        canTrain={canTrain}
        isTraining={isTraining}
        trainModel={trainModel}
        resetData={resetData}
      />

      {/* Mensajes de estado */}
      <StatusMessage message={statusMessage} />
    </div>
  );
};

export default ControlsSection;
