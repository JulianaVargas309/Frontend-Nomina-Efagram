import { useEffect, useMemo, useState } from 'react';
import { Eye, CheckCircle, XCircle, ScrollText, Clock } from 'lucide-react';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import ContratoModal from '../components/ContratoModal';
import { getContratos, updateContrato } from '../services/contratosService';
import '../../../assets/styles/contratos.css';

// ── helpers ──────────────────────────────────────────────────────
const normalizeList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const fmtFecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ESTADO_LABEL = { PENDIENTE: 'Pendiente', RECHAZADO: 'Rechazado', ACTIVO: 'Activo', CANCELADO: 'Cancelado', CERRADO: 'Cerrado' };

const StatCard = ({ icon, label, value, color, bg }) => {
  const Icon = icon;
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );
};

export default function ContratosPorAprobarPage() {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [procesando, setProcesando] = useState(null);

  const [modal, setModal] = useState({ open: false, modo: 'ver', contrato: null });

  const abrirVer = (c) => setModal({ open: true, modo: 'ver', contrato: c });
  const cerrarModal = () => setModal(prev => ({ ...prev, open: false }));

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getContratos();
      const lista = normalizeList(res);
      // Filtrar solo los PENDIENTE
      const pendientes = lista.filter(c => c.estado === 'PENDIENTE');
      setContratos(pendientes);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los contratos por aprobar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // ── APROBAR: cambiar estado a ACTIVO ──────────────────────────
  const handleAprobar = async (c) => {
    if (!window.confirm(`¿Aprobar el contrato "${c.codigo}"? Pasará a estado ACTIVO.`)) return;
    try {
      setProcesando(c._id ?? c.id);
      await updateContrato(c._id ?? c.id, { estado: 'ACTIVO' });
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.message ?? 'No se pudo aprobar el contrato');
    } finally {
      setProcesando(null);
    }
  };

  // ── RECHAZAR: cambiar estado a CANCELADO ──────────────────────
  const handleRechazar = async (c) => {
    if (!window.confirm(`¿Rechazar el contrato "${c.codigo}"? Pasará a estado CANCELADO.`)) return;
    try {
      setProcesando(c._id ?? c.id);
      await updateContrato(c._id ?? c.id, { estado: 'CANCELADO' });
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.message ?? 'No se pudo rechazar el contrato');
    } finally {
      setProcesando(null);
    }
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return contratos;
    return contratos.filter(c => {
      const cod = (c.codigo ?? '').toLowerCase();
      const finca = (c.finca?.nombre ?? '').toLowerCase();
      const cuads = (c.cuadrillas ?? []).map(cu => (cu?.nombre ?? '').toLowerCase()).join(' ');
      return cod.includes(q) || finca.includes(q) || cuads.includes(q);
    });
  }, [contratos, busqueda]);

  const Chips = ({ items, getLabel }) => {
    const MAX = 2;
    const visible = items.slice(0, MAX);
    const extra = items.length - MAX;
    return (
      <div className="chips-wrap">
        {visible.map((it, i) => (
          <span key={i} className="chip">{getLabel(it)}</span>
        ))}
        {extra > 0 && <span className="chip chip-more">+{extra}</span>}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="contratos-container">

        <div className="contratos-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'rgba(234,179,8,0.12)' }}>
                <Clock size={20} color="#ca8a04" />
              </span>
              Contratos por Aprobar
            </h2>
            <p>Contratos en estado PENDIENTE esperando aprobación</p>
          </div>
        </div>

        <div className="contratos-stats">
          <StatCard icon={Clock} label="Por Aprobar" value={contratos.length} color="#ca8a04" bg="rgba(234,179,8,0.1)" />
        </div>

        <div className="contratos-toolbar">
          <input
            className="contratos-search"
            placeholder="Buscar por código, finca o cuadrilla..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {error && <div className="contratos-error">{error}</div>}

        {loading ? (
          <div className="contratos-empty">
            <div className="empty-icon">⏳</div>
            <h3>Cargando contratos...</h3>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="contratos-empty">
            <div className="empty-icon">✅</div>
            <h3>{busqueda ? 'Sin resultados' : 'No hay contratos pendientes'}</h3>
            <p>{busqueda ? `Ningún contrato coincide con "${busqueda}"` : 'Todos los contratos han sido procesados.'}</p>
          </div>
        ) : (
          <div className="contratos-table-wrap">
            <table className="contratos-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Finca</th>
                  <th>Lotes</th>
                  <th>Actividades</th>
                  <th>Cuadrillas</th>
                  <th>Fecha inicio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => {
                  const cid = c._id ?? c.id;
                  const cuadrillas = c.cuadrillas ?? [];
                  const totalMiembros = cuadrillas.reduce(
                    (sum, cu) => sum + (cu?.miembros ?? []).filter(m => m.activo).length,
                    0
                  );
                  const procesandoEste = procesando === cid;

                  return (
                    <tr key={cid}>
                      <td><strong>{c.codigo}</strong></td>
                      <td>{c.finca?.nombre ?? '—'}</td>

                      <td>
                        <Chips
                          items={c.lotes ?? []}
                          getLabel={l => l.nombre ?? `#${l.codigo}`}
                        />
                      </td>

                      <td>
                        <Chips
                          items={c.actividades ?? []}
                          getLabel={a => a.actividad?.nombre ?? a.nombre ?? '?'}
                        />
                      </td>

                      <td>
                        {cuadrillas.length === 0 ? '—' : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {cuadrillas.slice(0, 2).map((cu, i) => (
                              <span key={cu?._id ?? i} style={{ fontSize: 13 }}>
                                {cu?.nombre ?? '—'}
                              </span>
                            ))}
                            {cuadrillas.length > 2 && (
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                +{cuadrillas.length - 2} más
                              </span>
                            )}
                            {totalMiembros > 0 && (
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                {totalMiembros} 👷
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td>{fmtFecha(c.fecha_inicio)}</td>
                      
                      <td>
                        <div className="row-actions" style={{ gap: 8 }}>
                          <button 
                            className="btn-icon" 
                            title="Ver detalle" 
                            onClick={() => abrirVer(c)}
                            disabled={procesandoEste}
                          >
                            <Eye size={15} color="#3b82f6" />
                          </button>
                          <button
                            className="btn-icon"
                            title="✅ Aprobar"
                            style={{
                              background: 'rgba(31,143,87,0.1)',
                              borderRadius: 8,
                              border: '1px solid rgba(31,143,87,0.3)',
                              padding: 8,
                              cursor: procesandoEste ? 'not-allowed' : 'pointer',
                              opacity: procesandoEste ? 0.6 : 1,
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!procesandoEste) {
                                e.currentTarget.style.background = 'rgba(31,143,87,0.2)';
                                e.currentTarget.style.borderColor = 'rgba(31,143,87,0.5)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(31,143,87,0.1)';
                              e.currentTarget.style.borderColor = 'rgba(31,143,87,0.3)';
                            }}
                            disabled={procesandoEste}
                            onClick={() => handleAprobar(c)}
                          >
                            <CheckCircle size={15} color="#1f8f57" />
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            title="❌ Rechazar"
                            style={{
                              background: 'rgba(220,38,38,0.1)',
                              borderRadius: 8,
                              border: '1px solid rgba(220,38,38,0.3)',
                              padding: 8,
                              cursor: procesandoEste ? 'not-allowed' : 'pointer',
                              opacity: procesandoEste ? 0.6 : 1,
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!procesandoEste) {
                                e.currentTarget.style.background = 'rgba(220,38,38,0.2)';
                                e.currentTarget.style.borderColor = 'rgba(220,38,38,0.5)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(220,38,38,0.1)';
                              e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)';
                            }}
                            disabled={procesandoEste}
                            onClick={() => handleRechazar(c)}
                          >
                            <XCircle size={15} color="#dc2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ContratoModal
        isOpen={modal.open}
        modo={modal.modo}
        contrato={modal.contrato}
        onClose={cerrarModal}
        onSuccess={cargar}
      />
    </DashboardLayout>
  );
}
