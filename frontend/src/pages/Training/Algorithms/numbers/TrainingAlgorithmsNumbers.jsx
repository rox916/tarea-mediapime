import { Link } from "react-router-dom";
import { FaSortNumericDown } from "react-icons/fa";
import "../../../../styles/SelectionGrid.css";

export default function TrainingAlgorithmsNumbers() {
  const numbers = Array.from({ length: 10 }, (_, i) => i); // 0–9

  return (
    <div className="selection-container">
      {/* Título */}
      <h2>
        <FaSortNumericDown style={{ color: "#0072ff" }} />
        Entrenamiento de Números
      </h2>
      <p>Aquí podrás entrenar modelos para los números del 0 al 9:</p>

      {/* Grid */}
      <div className="selection-grid">
        {numbers.map((n) => (
          <Link
            key={n}
            to={`/training/algorithms/numbers/${n}`}
            style={{ textDecoration: "none" }}
          >
            <div className="selection-card">
              <div className="icon">{n}</div>
              <span>{n}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="selection-footer">
        👉 Selecciona un número para comenzar tu entrenamiento
      </div>
    </div>
  );
}
