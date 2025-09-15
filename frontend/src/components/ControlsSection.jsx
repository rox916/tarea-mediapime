import React from 'react';
import VowelControls from './VowelControls';
import SummaryInfo from './SummaryInfo';
import ActionButtons from './ActionButtons';
import StatusMessage from './StatusMessage';

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

      {/* Controles por cada vocal */}
      <VowelControls
        progress={progress}
        isCollecting={isCollecting}
        currentVowel={currentVowel}
        startCollecting={startCollecting}
        stopCollecting={stopCollecting}
        deleteVowelData={deleteVowelData}
      />

      {/* Botones de acción */}
      <ActionButtons
        isCollecting={isCollecting}
        canTrain={canTrain}
        isTraining={isTraining}
        stopCollecting={stopCollecting}
        trainModel={trainModel}
        resetData={resetData}
      />

      {/* Mensajes de estado */}
      <StatusMessage statusMessage={statusMessage} />
    </div>
  );
};

export default ControlsSection;
