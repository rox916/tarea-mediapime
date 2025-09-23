import "../../styles/Predictions.css";
import { Link } from "react-router-dom";

export default function PredictionsWords() {
  return (
    <div className="predictions-container">
      <div className="predictions-card">
        <h2 className="predictions-title">📖 Predicción de Palabras</h2>
        <p className="predictions-subtitle">
          Selecciona qué tipo de palabras quieres probar:
        </p>

        <div className="predictions-grid">
          {/* Vocales */}
          <Link to="/predictions/words/vowels" className="pred-card">
            <span className="icon">🔤</span>
            <span>Vocales</span>
          </Link>

          {/* Cosas (Próximamente) */}
          <div className="pred-card" style={{ opacity: 0.6, cursor: "not-allowed" }}>
            <span className="icon">📦</span>
            <span>Cosas</span>
          </div>
        </div>

        <div className="predictions-footer">
          ✨ Escoge un tipo de palabra para comenzar tus pruebas
        </div>
      </div>
    </div>
  );
}
