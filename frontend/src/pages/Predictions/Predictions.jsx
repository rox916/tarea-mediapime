import { Link } from "react-router-dom";

export default function Predictions() {
  return (
    <div className="predictions-container" style={{ textAlign: "center", padding: "2rem" }}>
      <h1>🔮 Predicciones</h1>
      <p>Selecciona qué deseas probar con el modelo entrenado:</p>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/predictions/words">
          <button style={{ margin: "1rem", padding: "1rem 2rem", fontSize: "1.2rem" }}>
            Palabras
          </button>
        </Link>

        <Link to="/predictions/algorithms">
          <button style={{ margin: "1rem", padding: "1rem 2rem", fontSize: "1.2rem" }}>
            Algoritmos
          </button>
        </Link>
      </div>
    </div>
  );
}
