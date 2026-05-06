import { useState } from 'react';
import { Eye, Plus, Search, MapPin, X } from 'lucide-react';


function ZonaDetalleModal({ isOpen, zona, onClose }) {
  if (!isOpen || !zona) return null;

  let isActive = false;
  const raw = zona?.activa ?? zona?.estado;
  if (typeof raw === 'boolean') isActive = raw;
  else if (typeof raw === 'string') {
    const v = raw.toLowerCase().trim();
    isActive = v === 'activa' || v === 'active' || v === 'true' || v === '1';
  } else if (typeof raw === 'number') isActive = raw === 1;

  return (
    <>
      <div className="zdm-overlay" />
      <div className="zdm-panel" role="dialog" aria-modal="true">
        <button className="zdm-close" onClick={onClose} aria-label="Cerrar"><X size={15} /></button>
        <div className="zdm-header">
          <h2 className="zdm-title">Detalle de Zona</h2>
          <p className="zdm-subtitle">Informacion de la zona territorial</p>
        </div>
        <div className="zdm-name-card">
          <div className="zdm-pin-wrap"><MapPin size={20} /></div>
          <div className="zdm-name-info">
            <span className="zdm-name">{zona?.nombreZona ?? '-'}</span>
            <span className="zdm-code">{zona?.codeZona ?? '-'}</span>
          </div>
        </div>
        <div className="zdm-estado-box">
          <span className="zdm-estado-label">Estado</span>
          <span className={isActive ? 'zdm-badge active' : 'zdm-badge inactive'}>
            {isActive ? '⊙ Activa' : '⊗ Inactiva'}
          </span>
        </div>
      </div>
    </>
  );
}

export default function ZonasTable({ zonas = [], search = '', setSearch, onAdd, onUpdate }) {
  const [openCreate, setOpenCreate] = useState(false);
  const [editZona, setEditZona] = useState(null);
  const [detalleZona, setDetalleZona] = useState(null);

  const getId = (z) => z?._id ?? z?.id;

  return (
    <div className="zonas-card">

      {/* HEADER */}
      <div className="zonas-card-header">
        <h2 className="zonas-card-title">Zonas Territoriales</h2>
        <div className="zonas-card-actions">
          <div className="zonas-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch?.(e.target.value)}
              placeholder="Buscar zona..."
            />
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="zonas-table-scroll">
        <table className="zonas-table-grid">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Codigo</th>
              <th style={{ width: '200px' }}>Nombre</th>
              <th style={{ width: '140px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {zonas.length === 0 ? (
              <tr>
                <td colSpan={4} className="zonas-empty">No hay zonas para mostrar</td>
              </tr>
            ) : (
              zonas.map((z) => {
                const id = getId(z);

                // ✅ POR ESTO (una sola línea)
                const raw = z?.activa ?? z?.estado;
                const isActive = (raw === undefined || raw === null) ? true : Boolean(raw);
                
                return (
                  <tr key={id}>
                    <td>{z?.codeZona ?? '-'}</td>
                    <td>
                      <div className="zona-name-cell">
                        <span className="zona-pin-icon"><MapPin size={13} /></span>
                        {z?.nombreZona ?? '-'}
                      </div>
                    </td>
                    
                    <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '0 16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button className="icon-btn" type="button" title="Ver detalle" onClick={() => setDetalleZona(z)}>
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

      <ZonaDetalleModal isOpen={!!detalleZona} zona={detalleZona} onClose={() => setDetalleZona(null)} />

   

      
    </div>
  );
}



