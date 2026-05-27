import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import SubproyectoModal from '../components/SubproyectoModal';
import { getSubproyectos, deleteSubproyecto } from '../services/subproyectosService';
import { getProyectos } from '../services/proyectosService';
import {
  FolderGit2, Plus, Pencil, Trash2, MapPin, Users,
  Settings, Search, ChevronDown, ChevronUp, Folder,
  AlertCircle, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import '../../../assets/styles/proyectos.css';
import SubproyectoCuadrillas from '../components/SubproyectoCuadrillas';
import GestionarSubproyectoModal from './GestionarSubproyectoModal';
import { getResumenHorasSubproyecto } from '../services/horasService';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtMonto = (n) =>
  n != null && n !== 0 ? '$ ' + Number(n).toLocaleString('es-CO') : null;

const getText = (value, fallback = '—') => {
  if (!value) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(
    value.nombre ?? value.name ?? value.razon_social ??
    value.nombre_comercial ?? value.codigo ?? fallback
  );
};

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id ?? value.id ?? '');
};

const normalizeList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

// ── Estado colors ─────────────────────────────────────────────────────────────

const ESTADO_SUB = {
  ACTIVO:   { bg: '#f0faf4', color: '#1f8f57', border: '#bbf7d0', icon: CheckCircle2 },
  CERRADO:  { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', icon: XCircle },
  CANCELADO:{ bg: '#fee2e2', color: '#dc2626', border: '#fecaca', icon: AlertCircle },
};

const ESTADO_PROY = {
  ACTIVO:       { bg: 'rgba(31,143,87,0.1)',  border: 'rgba(31,143,87,0.3)',  color: '#1f8f57' },
  PLANEADO:     { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: '#3b82f6' },
  FINALIZADO:   { bg: 'rgba(100,116,139,0.1)',border: 'rgba(100,116,139,0.3)',color: '#64748b' },
  SUSPENDIDO:   { bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.3)',  color: '#ca8a04' },
  CERRADO:      { bg: 'rgba(100,116,139,0.1)',border: 'rgba(100,116,139,0.3)',color: '#64748b' },
  EN_NEGOCIACION:{ bg: 'rgba(168,85,247,0.1)',border: 'rgba(168,85,247,0.3)', color: '#7c3aed' },
  CANCELADO:    { bg: 'rgba(220,38,38,0.1)',  border: 'rgba(220,38,38,0.3)',  color: '#dc2626' },
};

const ESTADO_LABEL = {
  ACTIVO: 'Activo', PLANEADO: 'Planeado', FINALIZADO: 'Finalizado',
  SUSPENDIDO: 'Suspendido', CERRADO: 'Cerrado',
  EN_NEGOCIACION: 'En negociación', CANCELADO: 'Cancelado',
};

// ── Subcomponente: tarjeta de subproyecto ─────────────────────────────────────

const SubproyectoCard = ({ sub, onEditar, onEliminar, onGestionar }) => {
  const est = ESTADO_SUB[sub.estado] ?? ESTADO_SUB.CERRADO;
  const IconEstado = est.icon;
  const porcentaje = Math.round(sub.porcentaje_distribuido ?? 0);
  const pColor = porcentaje >= 100 ? '#dc2626' : porcentaje >= 75 ? '#e67e22' : '#1f8f57';

  const supervisor = sub.supervisor
    ? `${sub.supervisor.nombres ?? ''} ${sub.supervisor.apellidos ?? ''}`.trim()
    : null;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e6e8ef',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Cabecera tarjeta */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {sub.codigo}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              border: `1.5px solid ${est.border}`, background: est.bg, color: est.color,
            }}>
              <IconEstado size={11} />
              {sub.estado}
            </span>
          </div>
          <h4 style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            {sub.nombre}
          </h4>
        </div>
      </div>

      {/* Datos del subproyecto */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {supervisor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
            <Users size={13} color="#94a3b8" />
            <span>{supervisor}</span>
          </div>
        )}
        {sub.zona && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
            <MapPin size={13} color="#94a3b8" />
            <span>{getText(sub.zona)}</span>
          </div>
        )}
      </div>

      {/* Barra porcentaje distribuido */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            % Distribuido
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: pColor }}>
            {porcentaje}%
          </span>
        </div>
        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(porcentaje, 100)}%`,
            background: porcentaje >= 100
              ? 'linear-gradient(90deg,#dc2626,#ef4444)'
              : porcentaje >= 75
              ? 'linear-gradient(90deg,#e67e22,#f39c12)'
              : 'linear-gradient(90deg,#1f8f57,#2bb673)',
            borderRadius: 999,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f0f2f5' }}>
        <button
          title="Gestionar cuadrillas y horas"
          onClick={() => onGestionar(sub)}
          style={{
            background: '#eff6ff', border: '1.5px solid #bfdbfe', color: '#2563eb',
            width: 34, height: 34, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Settings size={15} />
        </button>
        <button
          title="Editar subproyecto"
          onClick={() => onEditar(sub)}
          style={{
            background: '#f0faf4', border: '1.5px solid #bbf7d0', color: '#1f8f57',
            width: 34, height: 34, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(31,143,87,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Pencil size={15} />
        </button>
        <button
          title="Eliminar subproyecto"
          onClick={() => onEliminar(sub._id)}
          style={{
            background: '#fee2e2', border: '1.5px solid #fecaca', color: '#dc2626',
            width: 34, height: 34, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};

// ── Subcomponente: sección de un proyecto con sus subproyectos ────────────────

const ProyectoSeccion = ({ proyecto, subs, loadingSubs, onNuevo, onEditar, onEliminar, onGestionar }) => {
  const [collapsed, setCollapsed] = useState(false);
  const estado = proyecto.estado?.toUpperCase();
  const estadoStyle = ESTADO_PROY[estado] ?? { bg: '#f8fafc', border: '#e6e8ef', color: '#475569' };
  const clienteTexto = getText(proyecto.cliente, 'Sin cliente');
  const activos = subs.filter((s) => s.estado === 'ACTIVO').length;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e6e8ef',
      borderRadius: 18,
      overflow: 'hidden',
    }}>
      {/* Header del proyecto */}
      <div
        style={{
          padding: '18px 22px',
          borderBottom: collapsed ? 'none' : '1px solid #f0f2f5',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        {/* Icono proyecto */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: '#e8f5ee', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Folder size={22} color="#1f8f57" />
        </div>

        {/* Info proyecto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              {proyecto.nombre}
            </h3>
            <span style={{
              padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              border: `1.5px solid ${estadoStyle.border}`,
              background: estadoStyle.bg, color: estadoStyle.color,
            }}>
              {ESTADO_LABEL[estado] ?? proyecto.estado}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 5, fontSize: 13, color: '#64748b' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>{proyecto.codigo}</span>
            <span>{clienteTexto}</span>
            {proyecto.zona && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {getText(proyecto.zona)}</span>}
          </div>
        </div>

        {/* Badges resumen + botón nuevo + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Badge total subs */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e6e8ef',
            borderRadius: 8, padding: '5px 12px', textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{loadingSubs ? '…' : subs.length}</p>
          </div>
          {/* Badge activos */}
          <div style={{
            background: '#f0faf4', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: '5px 12px', textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 10, color: '#1f8f57', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Activos</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1f8f57' }}>{loadingSubs ? '…' : activos}</p>
          </div>

          {/* Botón nuevo subproyecto */}
          <button
            onClick={(e) => { e.stopPropagation(); onNuevo(proyecto); }}
            style={{
              background: '#1f8f57', color: '#fff', border: 'none',
              padding: '9px 16px', borderRadius: 10, fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(31,143,87,0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} /> Nuevo
          </button>

          {/* Toggle collapse */}
          <div style={{ color: '#94a3b8' }}>
            {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>
      </div>

      {/* Cuerpo: tarjetas de subproyectos */}
      {!collapsed && (
        <div style={{ padding: '20px 22px' }}>
          {loadingSubs ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 14 }}>
              Cargando subproyectos...
            </div>
          ) : subs.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '28px 16px',
              background: '#f8fafc', borderRadius: 12,
              border: '2px dashed #e2e8f0', color: '#94a3b8',
            }}>
              <FolderGit2 size={28} color="#cbd5e1" style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14 }}>Este proyecto no tiene subproyectos aún</p>
              <button
                onClick={() => onNuevo(proyecto)}
                style={{
                  marginTop: 12, background: '#1f8f57', color: '#fff',
                  border: 'none', padding: '8px 16px', borderRadius: 8,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <Plus size={13} /> Crear primer subproyecto
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {subs.map((sub) => (
                <SubproyectoCard
                  key={sub._id}
                  sub={sub}
                  onEditar={onEditar}
                  onEliminar={onEliminar}
                  onGestionar={(s) => onGestionar(s)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────

const SubproyectosPage = () => {
  const [searchParams] = useSearchParams();
  const proyectoIdParam = searchParams.get('proyecto');

  const [proyectos, setProyectos] = useState([]);
  // subsByProyecto: { [proyectoId]: SubproyectoObj[] }
  const [subsByProyecto, setSubsByProyecto] = useState({});
  // loadingByProyecto: { [proyectoId]: boolean }
  const [loadingByProyecto, setLoadingByProyecto] = useState({});
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [modalState, setModalState] = useState({ open: false, sub: null, proyecto: null });
  const [gestionarModal, setGestionarModal] = useState({ open: false, sub: null });

  // ── Cargar subproyectos de un proyecto concreto ──
  const cargarSubsDeProyecto = useCallback(async (proyectoId) => {
    setLoadingByProyecto((prev) => ({ ...prev, [proyectoId]: true }));
    try {
      const res = await getSubproyectos({ proyecto: proyectoId });
      const subs = res?.data?.data ?? res?.data ?? [];
      setSubsByProyecto((prev) => ({ ...prev, [proyectoId]: subs }));
    } catch (err) {
      console.error(`Error cargando subproyectos de ${proyectoId}:`, err);
      setSubsByProyecto((prev) => ({ ...prev, [proyectoId]: [] }));
    } finally {
      setLoadingByProyecto((prev) => ({ ...prev, [proyectoId]: false }));
    }
  }, []);

  // ── Cargar todos los proyectos y luego sus subproyectos en paralelo ──
  const cargarTodo = useCallback(async () => {
    setLoadingProyectos(true);
    try {
      const res = await getProyectos();
      const data = normalizeList(res);
      setProyectos(data);

      // Inicializar estado de carga para todos
      const loadingInit = {};
      data.forEach((p) => { loadingInit[p._id] = true; });
      setLoadingByProyecto(loadingInit);

      // Cargar subproyectos de todos en paralelo
      await Promise.all(
        data.map(async (p) => {
          try {
            const r = await getSubproyectos({ proyecto: p._id });
            const subs = r?.data?.data ?? r?.data ?? [];
            setSubsByProyecto((prev) => ({ ...prev, [p._id]: subs }));
          } catch {
            setSubsByProyecto((prev) => ({ ...prev, [p._id]: [] }));
          } finally {
            setLoadingByProyecto((prev) => ({ ...prev, [p._id]: false }));
          }
        })
      );
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    } finally {
      setLoadingProyectos(false);
    }
  }, []);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  // ── Handlers ──
  const handleNuevo = (proyecto) => {
    setModalState({ open: true, sub: null, proyecto });
  };

  const handleEditar = (sub) => {
    // Encontrar el proyecto al que pertenece el sub
    const proyectoId = getId(sub.proyecto_id ?? sub.proyecto);
    const proyecto = proyectos.find((p) => p._id === proyectoId) ?? null;
    setModalState({ open: true, sub, proyecto });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este subproyecto?')) return;
    try {
      await deleteSubproyecto(id);
      // Remover de todos los proyectos sin recargar todo
      setSubsByProyecto((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((pid) => {
          next[pid] = next[pid].filter((s) => s._id !== id);
        });
        return next;
      });
    } catch (e) {
      alert(e?.response?.data?.message ?? 'No se pudo eliminar');
    }
  };

  const handleGestionar = (sub) => {
    setGestionarModal({ open: true, sub });
  };

  const handleSuccess = () => {
    // Recargar subproyectos del proyecto afectado
    if (modalState.proyecto?._id) {
      cargarSubsDeProyecto(modalState.proyecto._id);
    } else {
      cargarTodo();
    }
    setModalState({ open: false, sub: null, proyecto: null });
  };

  // ── Filtro búsqueda ──
  const proyectosFiltrados = proyectos.filter((p) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(q) ||
      p.codigo?.toLowerCase().includes(q) ||
      getText(p.cliente, '').toLowerCase().includes(q)
    );
  });

  // ── Stats globales ──
  const totalSubs = Object.values(subsByProyecto).reduce((acc, arr) => acc + arr.length, 0);
  const totalActivos = Object.values(subsByProyecto).reduce(
    (acc, arr) => acc + arr.filter((s) => s.estado === 'ACTIVO').length, 0
  );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{
              margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)',
              }}>
                <FolderGit2 size={20} color="#6366f1" />
              </span>
              Subproyectos
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
              Gestiona los subproyectos y la asignación de actividades
            </p>
          </div>
        </div>

        {/* ── STATS GLOBALES ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Proyectos', value: proyectos.length, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
            { label: 'Total subproyectos', value: totalSubs, color: '#3b82f6', bg: '#eff6ff', border: 'rgba(59,130,246,0.2)' },
            { label: 'Activos', value: totalActivos, color: '#1f8f57', bg: '#f0faf4', border: 'rgba(31,143,87,0.2)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: s.bg, border: `1.5px solid ${s.border}`,
              borderRadius: 12, padding: '16px 20px',
            }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {s.label}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 900, color: s.color }}>
                {loadingProyectos ? '…' : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── BUSCADOR ── */}
        <div style={{
          background: '#fff', border: '1px solid #e6e8ef',
          borderRadius: 12, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por nombre de proyecto, código o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, color: '#0f172a', background: 'transparent',
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
            >
              ×
            </button>
          )}
        </div>

        {/* ── LOADING INICIAL ── */}
        {loadingProyectos && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>
            Cargando proyectos y subproyectos...
          </div>
        )}

        {/* ── LISTA DE PROYECTOS CON SUS SUBPROYECTOS ── */}
        {!loadingProyectos && proyectosFiltrados.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: '#fff', border: '2px dashed #e2e8f0',
            borderRadius: 16, color: '#94a3b8',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 28 }}>📂</p>
            <p style={{ margin: 0, fontSize: 14 }}>
              {busqueda ? 'No hay proyectos que coincidan con la búsqueda' : 'No hay proyectos registrados'}
            </p>
          </div>
        )}

        {!loadingProyectos && proyectosFiltrados.map((proyecto) => (
          <ProyectoSeccion
            key={proyecto._id}
            proyecto={proyecto}
            subs={subsByProyecto[proyecto._id] ?? []}
            loadingSubs={loadingByProyecto[proyecto._id] ?? false}
            onNuevo={handleNuevo}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
            onGestionar={handleGestionar}
          />
        ))}

      </div>

      {/* ── MODALES (sin tocar) ── */}
      <SubproyectoModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, sub: null, proyecto: null })}
        onSuccess={handleSuccess}
        subproyecto={modalState.sub}
        proyecto={modalState.proyecto}
        subproyectosActuales={
          modalState.proyecto ? (subsByProyecto[modalState.proyecto._id] ?? []) : []
        }
      />

      <GestionarSubproyectoModal
        isOpen={gestionarModal.open}
        onClose={() => setGestionarModal({ open: false, sub: null })}
        onSuccess={() => cargarTodo()}
        subproyecto={gestionarModal.sub}
      />
    </DashboardLayout>
  );
};

export default SubproyectosPage;