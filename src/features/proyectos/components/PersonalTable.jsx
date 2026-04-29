import { useState } from 'react';
import { Eye, Search, User, X } from 'lucide-react';



function PersonalDetalleModal({ isOpen, persona, onClose }) {
  if (!isOpen || !persona) return null;

  const isActive = persona?.estado === 'ACTIVO';
  const nombreCompleto = `${persona?.nombres ?? ''} ${persona?.apellidos ?? ''}`.trim();

  return (
    <>
      <div className="zdm-overlay" />
      <div className="zdm-panel" role="dialog" aria-modal="true">
        <button className="zdm-close" onClick={onClose} aria-label="Cerrar">
          <X size={15} />
        </button>
        <div className="zdm-header">
          <h2 className="zdm-title">Detalle de Personal</h2>
          <p className="zdm-subtitle">Información del empleado</p>
        </div>

        <div className="zdm-name-card">
          <div className="zdm-pin-wrap">
            <User size={20} />
          </div>
          <div className="zdm-name-info">
            <span className="zdm-name">{nombreCompleto || '-'}</span>
            <span className="zdm-code">{persona?.num_doc ?? '-'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          <div className="zdm-estado-box">
            <span className="zdm-estado-label">Cargo</span>
            <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
              {persona?.cargo ?? '-'}
            </span>
          </div>
          <div className="zdm-estado-box">
            <span className="zdm-estado-label">Finca</span>
            <span style={{ fontSize: '14px', color: '#374151' }}>
              {persona?.finca?.nombre ?? '-'}
            </span>
          </div>
          <div className="zdm-estado-box">
            <span className="zdm-estado-label">Proceso</span>
            <span style={{ fontSize: '14px', color: '#374151' }}>
              {persona?.proceso?.nombre ?? '-'}
            </span>
          </div>
          <div className="zdm-estado-box">
            <span className="zdm-estado-label">Supervisor</span>
            <span style={{ fontSize: '14px', color: '#374151' }}>
              {persona?.supervisor
                ? `${persona.supervisor.nombres ?? ''} ${persona.supervisor.apellidos ?? ''}`.trim()
                : 'N/A'}
            </span>
          </div>
          {persona?.telefono && (
            <div className="zdm-estado-box">
              <span className="zdm-estado-label">Teléfono</span>
              <span style={{ fontSize: '14px', color: '#374151' }}>{persona.telefono}</span>
            </div>
          )}
          {persona?.email && (
            <div className="zdm-estado-box">
              <span className="zdm-estado-label">Email</span>
              <span style={{ fontSize: '14px', color: '#374151' }}>{persona.email}</span>
            </div>
          )}
          <div className="zdm-estado-box">
            <span className="zdm-estado-label">Tipo Contrato</span>
            <span style={{ fontSize: '14px', color: '#374151' }}>
              {persona?.tipo_contrato ?? '-'}
            </span>
          </div>
        </div>

        <div className="zdm-estado-box">
          <span className="zdm-estado-label">Estado</span>
          <span className={isActive ? 'zdm-badge active' : 'zdm-badge inactive'}>
            {isActive ? '⊙ Activo' : '⊗ Inactivo'}
          </span>
        </div>
      </div>
    </>
  );
}

export default function PersonalTable({
  personal = [],
  search = '',
  setSearch,
}) {
 
  const [detallePersona, setDetallePersona] = useState(null);

  const getId = (p) => p?._id ?? p?.id;

  const supervisorLabel = (p) => {
    const sup = p?.supervisorId?.name;
    if (!sup) return 'N/A';
    if (typeof sup === 'string') return 'N/A';
    return `${sup.nombres ?? ''} ${sup.apellidos ?? ''}`.trim() || 'N/A';
  };

  return (
    <div className="zonas-card">
      {/* HEADER */}
      <div className="zonas-card-header">
        <h2 className="zonas-card-title">Catálogo de Personal</h2>
      </div>

      {/* BARRA DE BÚSQUEDA + BOTÓN */}
      <div style={{ display: 'flex', gap: '12px', padding: '0 0 16px 0', alignItems: 'center' }}>
        <div className="zonas-search" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch?.(e.target.value)}
            placeholder="Buscar por cédula, nombre o cargo..."
          />
        </div>
        
      </div>

      {/* TABLA */}
      <div className="zonas-table-scroll">
        <table className="zonas-table-grid">
          <thead>
            <tr>
              <th>Cedula</th>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Finca</th>
              <th>Proceso</th>
              <th>Supervisor</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {personal.length === 0 ? (
              <tr>
                <td colSpan={8} className="zonas-empty">
                  No hay personal para mostrar
                </td>
              </tr>
            ) : (
              personal.map((p) => {
                const id = getId(p);
                const isActive = p?.estado === 'Activo';

                return (
                  <tr key={id}>
                    <td style={{ fontSize: '13px', color: '#374151' }}>
                      {p?.cc ?? '-'}
                    </td>
                    <td>
                      <div className="zona-name-cell">
                        <span className="zona-pin-icon">
                          <User size={13} />
                        </span>
                        {p?.name || '-'}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: '#374151' }}>
                      {p?.cargo ?? '-'}
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>
                      {p?.codeFinca?.nombreFinca ?? '-'}
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>
                      {p?.proceso?.proceso ?? '-'}
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>
                      {p.supervisorId?.name ?? '-'}
                    </td>
                    <td>
                      <span className={isActive ? 'badge-active' : 'badge-inactive'}>
                        {p.estado === 'Activo' ? '⊙ Activo' : '⊗ Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '0 16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="icon-btn"
                          type="button"
                          title="Ver detalle"
                          onClick={() => setDetallePersona(p)}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODALES */}
      <PersonalDetalleModal
        isOpen={!!detallePersona}
        persona={detallePersona}
        onClose={() => setDetallePersona(null)}
      />

    </div>
  );
}