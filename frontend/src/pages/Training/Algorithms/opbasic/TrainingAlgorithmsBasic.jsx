export default function TrainingAlgorithmsBasic() {

  const opbasic = ["mas", "menos", "division", "multipl"];

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>➗ Operaciones Básicas</h1>
      <p>Aquí podrás entrenar modelos para:</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>✖️ Multiplicación</li>
        <li>➗ División</li>
        <li>➖ Resta</li>
        <li>➕ Suma</li>
      </ul>
      <div style={{ marginTop: "2rem" }}>
        {opbasic.map((v) => (
          <Link
            key={v}
            to={`/training/algorithms/opbasic/${v.toLowerCase()}`}
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
