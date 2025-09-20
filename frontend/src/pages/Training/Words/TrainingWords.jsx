import { Link } from "react-router-dom";

export default function TrainingWords() {
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>📖 Entrenamiento de Palabras</h1>
      <p>Selecciona qué tipo de palabras deseas entrenar:</p>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/training/words/vowels">
          <button style={{ margin: "1rem", padding: "1rem 2rem" }}>Vocales</button>
        </Link>

        <Link to="/training/words/things">
          <button style={{ margin: "1rem", padding: "1rem 2rem" }}>Cosas</button>
        </Link>
      </div>
    </div>
  );
}
