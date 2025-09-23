import { Link } from "react-router-dom";
import "../../styles/Training.css";

export default function Training() {
  return (
    <div className="training-container">
      <div className="training-card">
        <h2 className="training-title">🎛️ Menú de Entrenamientos</h2>
        <p className="training-subtitle">
          Selecciona qué deseas entrenar:
        </p>

        <div className="training-grid">
          <Link to="/training/words" className="training-option">
            <span className="icon">📖</span>
            <span>Palabras</span>
          </Link>

          <Link to="/training/algorithms" className="training-option">
            <span className="icon">⚙️</span>
            <span>Algoritmos</span>
          </Link>
        </div>

        <div className="training-footer">
          👉 Selecciona una opción para comenzar tu entrenamiento
        </div>
      </div>
    </div>
  );
}
