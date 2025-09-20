import { Link } from "react-router-dom";

export default function Training() {
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>🎛️ Menú de Entrenamientos</h1>
      <p>Selecciona qué deseas entrenar:</p>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/training/words">
          <button
            style={{ margin: "1rem", padding: "1rem 2rem", fontSize: "1.2rem" }}
          >
            📖 Palabras
          </button>
        </Link>

        <Link to="/training/algorithms">
          <button
            style={{ margin: "1rem", padding: "1rem 2rem", fontSize: "1.2rem" }}
          >
            ⚙️ Algoritmos
          </button>
        </Link>
      </div>
    </div>
  );
}
