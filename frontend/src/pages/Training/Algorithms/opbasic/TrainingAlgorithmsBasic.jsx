import { Link } from "react-router-dom"; // ← Importa Link

export default function TrainingAlgorithmsBasic() {
  const opbasic = [
    { name: "Multiplicación", key: "multipl", icon: "✖️" },
    { name: "División", key: "division", icon: "➗" },
    { name: "Resta", key: "menos", icon: "➖" },
    { name: "Suma", key: "mas", icon: "➕" },
  ];

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>➗ Operaciones Básicas</h1>
      <p>Aquí podrás entrenar modelos para:</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {opbasic.map((op) => (
          <li key={op.key}>{op.icon} {op.name}</li>
        ))}
      </ul>
      <div style={{ marginTop: "2rem" }}>
        {opbasic.map((op) => (
          <Link
            key={op.key}
            to={`/training/algorithms/opbasic/${op.key}`}
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                margin: "0.5rem",
                padding: "1rem 2rem",
                fontSize: "1.2rem",
              }}
            >
              {op.name}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}