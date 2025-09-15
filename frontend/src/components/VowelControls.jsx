import React from 'react';

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const SAMPLES_PER_VOWEL = 100;

const VowelControls = ({ 
  progress, 
  isCollecting, 
  currentVowel, 
  startCollecting, 
  stopCollecting,
  deleteVowelData 
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
              <span className="vowel-label">Vocal '{vowel}'</span>
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
              className={`collect-btn ${isCurrentlyCollecting ? 'active' : ''}`}
              onClick={() => isCurrentlyCollecting ? stopCollecting() : startCollecting(vowel)}
              disabled={isComplete && !isCurrentlyCollecting}
            >
              {isCurrentlyCollecting 
                ? `Detener Recolección '${vowel}'` 
                : isComplete 
                  ? `Vocal '${vowel}' Completa` 
                  : `Recolectar '${vowel}' (${count}/${SAMPLES_PER_VOWEL})`
              }
            </button>
            
            {count > 0 && (
              <button
                className="delete-btn"
                onClick={() => deleteVowelData(vowel)}
                disabled={isCurrentlyCollecting}
                title={`Eliminar datos de la vocal '${vowel}'`}
              >
                🗑️ Eliminar '{vowel}'
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VowelControls;