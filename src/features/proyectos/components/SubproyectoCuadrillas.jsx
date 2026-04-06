const SubproyectoCuadrillas = ({ subproyecto, resumen = [] }) => {
  if (!subproyecto?.cuadrillas?.length) {
    return <span style={{ color: '#cbd5e1' }}>Sin cuadrillas</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {subproyecto.cuadrillas.map((c) => {
        const r = resumen.find(x => x.cuadrilla === c._id);

        return (
          <div key={c._id} style={{
            background: '#f8fafc',
            border: '1px solid #e6e8ef',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12
          }}>
            <div style={{ fontWeight: 700 }}>
              {c.nombre}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: '#1f8f57' }}>
                ⏱️ {r?.horas_trabajadas ?? 0}h
              </span>
              <span style={{ color: '#dc2626' }}>
                🚫 {r?.horas_no_trabajadas ?? 0}h
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubproyectoCuadrillas;