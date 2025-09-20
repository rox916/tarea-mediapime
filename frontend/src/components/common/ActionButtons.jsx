import React from 'react';
import './ActionButtons.css';

const ActionButtons = ({ 
  isCollecting, 
  canTrain, 
  isTraining, 
  stopCollecting, 
  trainModel, 
  resetData 
}) => {
  // ✅ Nos aseguramos de que canTrain sea siempre una función
  const canTrainFn = typeof canTrain === 'function' ? canTrain : () => false;

  return (
    <div className="action-buttons">
      <button
        className="action-btn train-btn"
        onClick={trainModel}
        disabled={!canTrain || isTraining}
      >
        {isTraining ? (
          <>
            <span className="loading"></span>
            Entrenando Modelo...
          </>
        ) : (
          '🧠 Entrenar Modelo'
        )}
      </button>
      
      <button className="action-btn reset-btn" onClick={resetData}>
        🔄 Reiniciar Datos
      </button>
    </div>
  );
};

export default ActionButtons;
