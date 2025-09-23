import { Link } from "react-router-dom";
import "../../styles/Predictions.css";

export default function Predictions() {
  return (
    <div className="predictions-container">
      <div className="predictions-card">
        <h2 className="predictions-title">🔮 Predicciones</h2>
        <p className="predictions-subtitle">
          Aquí podrás probar los modelos entrenados para reconocer tus gestos:
        </p>

        <div className="predictions-grid">
          <Link to="/predictions/words" className="pred-card">
            <span className="icon">📝</span>
            <span>Palabras</span>
          </Link>

          <Link to="/predictions/algorithms" className="pred-card">
            <span className="icon">⚙️</span>
            <span>Algoritmos</span>
          </Link>
        </div>

        <div className="predictions-footer">
          👉 Selecciona una opción para comenzar tus pruebas
        </div>
      </div>
    </div>
  );
}
