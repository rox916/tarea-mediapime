import React from 'react';
import "./SummaryInfo.css";

const SummaryInfo = ({ getTotalSamples, getRequiredSamples }) => {
  const total = getTotalSamples();
  const required = getRequiredSamples();
  const missing = required - total;
  const percent = Math.round((total / required) * 100);

  // Determinar clase para el porcentaje
  const getPercentClass = () => {
    if (percent === 0) return "stat-neutral";
    if (percent === 100) return "stat-ok";
    return "stat-warning";
  };

  return (
    <div className="summary-info">
      <h3>Progreso General</h3>
      <div className="summary-stats">

        {/* Recolectadas */}
        <div className="stat-item">
          <div className="stat-number stat-ok">{total}</div>
          <div className="stat-label">Muestras Recolectadas</div>
        </div>

        {/* Faltantes */}
        <div className="stat-item">
          <div className={`stat-number ${missing > 0 ? "stat-warning" : "stat-neutral"}`}>
            {missing}
          </div>
          <div className="stat-label">Muestras Faltantes</div>
        </div>

        {/* Completado */}
        <div className="stat-item">
          <div className={`stat-number ${getPercentClass()}`}>
            {percent}%
          </div>
          <div className="stat-label">Completado</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryInfo;