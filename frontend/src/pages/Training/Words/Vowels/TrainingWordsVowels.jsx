import { Link } from "react-router-dom";

export default function TrainingWordsVowels() {
  const vowels = ["A", "E", "I", "O", "U"];

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>🔡 Entrenamiento de Vocales</h1>
      <p>Selecciona la vocal que deseas entrenarr:</p>

      <div style={{ marginTop: "2rem" }}>
        {vowels.map((v) => (
          <Link
            key={v}
            to={`/training/words/vowels/${v.toLowerCase()}`}
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                margin: "0.5rem",
                padding: "1rem 2rem",
                fontSize: "1.2rem",
              }}
            >
              {v}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
