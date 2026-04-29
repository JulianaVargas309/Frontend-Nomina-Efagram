import { useState } from 'react';
import { Eye, Search, Trees, X, ChevronDown } from 'lucide-react';


// ── Modal de detalle ───────────────────────────────────────────────────────
function FincaDetalleModal({ isOpen, finca, onClose }) {
  if (!isOpen || !finca) return null;



  const area = finca?.area_total ?? finca?.area ?? finca?.areaTotal ?? finca?.hectareas;

  return (
    <>
      <div className="zdm-overlay" />
      <div className="zdm-panel" role="dialog" aria-modal="true">
        <button className="zdm-close" onClick={onClose} aria-label="Cerrar"><X size={15} /></button>

        <div className="zdm-header">
          <h2 className="zdm-title">Detalle de Finca</h2>
          <p className="zdm-subtitle">Información de la finca territorial</p>
        </div>

        <div className="zdm-name-card">
          <div className="zdm-pin-wrap" style={{ background: '#f0faf4', borderColor: '#16a34a', color: '#16a34a' }}>
            <Trees size={20} />
          </div>
          <div className="zdm-name-info">
            <span className="zdm-name">{finca?.nombre ?? '-'}</span>
            <span className="zdm-code">{finca?.codigo ?? '-'}</span>
          </div>
        </div>

        {finca?.nucleo && (
          <div className="zdm-estado-box" style={{ marginBottom: 8 }}>
            <span className="zdm-estado-label">Núcleo</span>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
              {typeof finca.nucleo === 'object' ? (finca.nucleo?.nombre ?? '-') : finca.nucleo}
            </span>
          </div>
        )}

        {area !== undefined && area !== null && (
          <div className="zdm-estado-box" style={{ marginBottom: 8 }}>
            <span className="zdm-estado-label">Área</span>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{area} ha</span>
          </div>
        )}

      </div>
    </>
  );
}

// ── Tabla principal ────────────────────────────────────────────────────────
export default function FincasTable({ fincas = [], nucleos = [], search = '', setSearch }) {
  const [detalleFinca, setDetalleFinca] = useState(null);
  const [nucleoFiltro, setNucleoFiltro] = useState('');

  const getId = (f) => f?._id ?? f?.id;



  const resolveNucleoId = (f) => {
    if (!f?.nucleo) return '';
    if (typeof f.nucleo === 'object') return f.nucleo?._id ?? f.nucleo?.id ?? '';
    return f.nucleo;
  };

  const getArea = (f) => f?.area_total ?? f?.area ?? f?.areaTotal ?? f?.hectareas;


  // Ordena por orden de creación antes de filtrar
  const fincasOrdenadas = [...fincas].sort((a, b) => {
    const aId = a?._id ?? a?.id ?? '';
    const bId = b?._id ?? b?.id ?? '';
    const aIsMongoId = typeof aId === 'string' && /^[a-f0-9]{24}$/i.test(aId);
    const bIsMongoId = typeof bId === 'string' && /^[a-f0-9]{24}$/i.test(bId);
    if (aIsMongoId && bIsMongoId) {
      const aTs = parseInt(aId.substring(0, 8), 16);
      const bTs = parseInt(bId.substring(0, 8), 16);
      return aTs - bTs;
    }
    if (a?.createdAt && b?.createdAt) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return 0;
  });

  const fincasFiltradas = nucleoFiltro
    ? fincasOrdenadas.filter((f) => resolveNucleoId(f) === nucleoFiltro)
    : fincasOrdenadas;

  return (
    <div className="zonas-card">

      {/* HEADER */}
      <div className="zonas-card-header">
        <h2 className="zonas-card-title">Gestión de Fincas</h2>
      </div>

      {/* BARRA DE BÚSQUEDA + FILTRO */}
      <div className="fincas-search-bar">
        <div className="fincas-search-input">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch?.(e.target.value)}
            placeholder="Buscar por codigo o nombre..."
          />
        </div>
        <div className="fincas-select-wrap">
          <select
            value={nucleoFiltro}
            onChange={(e) => setNucleoFiltro(e.target.value)}
            className="fincas-select"
          >
            <option value="">Todos los nucleos</option>
            {nucleos.map((n) => {
              const id = n?._id ?? n?.id;
              return <option key={id} value={id}>{n?.nombre ?? id}</option>;
            })}
          </select>
          <ChevronDown size={14} className="fincas-select-arrow" />
        </div>
      </div>

      {/* TABLA */}
      <div className="zonas-table-scroll">
        <table className="zonas-table-grid fincas-table">
          <thead>
            <tr>
              <th style={{ width: '110px' }}>Codigo</th>
              <th style={{ width: '180px' }}>Nombre</th>
              <th style={{ width: '160px' }}>Nucleo</th>
              <th style={{ width: '110px' }}>Area Total</th>
              <th style={{ width: '140px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {fincasFiltradas.length === 0 ? (
              <tr><td colSpan={6} className="zonas-empty">No hay fincas para mostrar</td></tr>
            ) : (
              fincasFiltradas.map((f) => {
                const id = getId(f);
                const area = getArea(f);

                return (
                  <tr key={id}>
                    <td>
                      <span className="finca-codigo-badge">{f?.codeFinca ?? '-'}</span>
                    </td>
                    <td>
                      <div className="zona-name-cell">
                        <span className="finca-tree-icon"><Trees size={14} /></span>
                        {f?.nombreFinca ?? '-'}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: '#374151' }}>
                      {typeof f?.codeNucleo === 'object'
                        ? f.codeNucleo?.nombreNucleo || '-'
                        : f?.codeNucleo || '-'}
                    </td>
                    <td style={{ fontSize: 13, color: '#374151' }}>
                      {area !== undefined && area !== null ? `${area} ha` : '-'}
                    </td>
                   
                    <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '0 16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button className="icon-btn" type="button" title="Ver detalle" onClick={() => setDetalleFinca(f)}>
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

      <FincaDetalleModal isOpen={!!detalleFinca} finca={detalleFinca} onClose={() => setDetalleFinca(null)} />



    </div>
  );
}