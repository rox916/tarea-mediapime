import "../../styles/Predictions.css";
import { Link } from "react-router-dom";

export default function PredictionsWords() {
  return (
    <div className="predictions-container">
      <h2>📖 Predicción de Palabras</h2>
      <p>Selecciona qué tipo de palabras quieres probar:</p>

      <div className="prediction-options">
        <Link to="/predictions/words/vowels" className="prediction-btn">
          Vocales
        </Link>
        <button className="prediction-btn" disabled>
          Cosas (Próximamente)
        </button>
      </div>
    </div>
  );
}
