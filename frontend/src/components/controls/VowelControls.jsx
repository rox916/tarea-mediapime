import React from 'react';
import './VowelControls.css';
import ActionButtons from "../common/ActionButtons.jsx";

const VOWELS = ['a', 'e', 'i', 'o', 'u'];   // 👈 ahora minúsculas
const SAMPLES_PER_VOWEL = 100;

const VowelControls = ({ 
  progress, 
  isCollecting, 
  currentVowel, 
  startCollecting, 
  stopCollecting,
  deleteVowelData,
  // props para ActionButtons
  canTrain,
  isTraining,
  trainModel,
  resetData
}) => {
  return (
    <div className="vowel-controls">
      {VOWELS.map(vowel => {
        const vowelProgress = progress[vowel] || { count: 0, max: SAMPLES_PER_VOWEL, percentage: 0 };
        const count = vowelProgress.count;
        const percentage = vowelProgress.percentage;
        const isComplete = count >= SAMPLES_PER_VOWEL;
        const isCurrentlyCollecting = isCollecting && currentVowel === vowel;
        
        return (
          <div key={vowel} className="vowel-item">
            <div className="vowel-header">
              <span className="vowel-label">Vocal '{vowel.toUpperCase()}'</span>
              <span className="sample-count">
                {count}/{SAMPLES_PER_VOWEL}
                {isComplete && ' ✅'}
              </span>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <button
              className={`collect-btn 
                ${isCurrentlyCollecting ? 'active' : ''} 
                ${isComplete ? 'complete' : ''}`}
              onClick={() => {
                if (!isComplete) {
                  isCurrentlyCollecting ? stopCollecting() : startCollecting(vowel);
                }
              }}
              disabled={isComplete}
            >
              {isComplete
                ? `Vocal '${vowel.toUpperCase()}' Completa`
                : isCurrentlyCollecting
                  ? `Detener Recolección '${vowel.toUpperCase()}'`
                  : `Recolectar '${vowel.toUpperCase()}' (${count}/${SAMPLES_PER_VOWEL})`}
            </button>
            
            {count > 0 && (
              <button
                className="delete-btn"
                onClick={() => deleteVowelData(vowel)}
                disabled={isCurrentlyCollecting && !isComplete}  
                title={`Eliminar datos de la vocal '${vowel.toUpperCase()}'`}
              >
                🗑️ Eliminar '{vowel.toUpperCase()}'
              </button>
            )}
          </div>
        );
      })}

      {/* 👇 Tarjeta de botones dentro del mismo grid */}
      <div className="vowel-item action-buttons-wrapper">
        <ActionButtons
          isCollecting={isCollecting}
          canTrain={canTrain()}  
          isTraining={isTraining}
          stopCollecting={stopCollecting}
          trainModel={trainModel}
          resetData={resetData}
        />
      </div>
    </div>
  );
};

export default VowelControls;
