import { useEffect, useState, useCallback } from 'react';
import {
  FileText, MapPin, Layers, Wrench, Users,
  Search, X, Plus, Calendar, GitBranch, DollarSign,
  AlertCircle, UserCheck, UserX, ChevronDown,
} from 'lucide-react';
import {
  getFincas,
  getLotesPorFinca,
  getSubproyectos,
  getActividadesDisponiblesSubproyecto,
  createContrato,
  updateContrato,
} from '../services/contratosService';
import httpClient from '../../../core/api/httpClient';

// ── helpers ───────────────────────────────────────────────────────
const normalizeList = (res) => {
  if (Array.isArray(res))             return res;
  if (Array.isArray(res?.data))       return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const toDateInput = (iso) => (iso ? iso.slice(0, 10) : '');

const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Barra de progreso de cantidad disponible ──────────────────────
const BarraCantidad = ({ disponible, total }) => {
  const pct   = total > 0 ? Math.min(100, Math.round(((total - disponible) / total) * 100)) : 0;
  const color = disponible <= 0 ? '#dc2626' : disponible / total < 0.2 ? '#e67e22' : '#1f8f57';
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
        <span>Comprometido: {fmt(total - disponible)}</span>
        <span style={{ color }}>Disponible: {fmt(disponible)}</span>
      </div>
    </div>
  );
};

// ── InfoRow para modo ver ─────────────────────────────────────────
const InfoRow = ({ icon, label, children }) => {
  const Icon = icon;
  return (
    <div className="info-row">
      <div className="info-icon-wrap"><Icon size={15} color="#64748b" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="info-label">{label}</p>
        <div className="info-value">{children}</div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
export default function ContratoModal({ isOpen, onClose, onSuccess, contrato = null, modo = 'crear' }) {

  // ── Catálogos ──
  const [fincas,       setFincas]       = useState([]);
  const [lotes,        setLotes]        = useState([]);
  const [subproyectos, setSubproyectos] = useState([]);

  // ── Formulario principal ──
  const [form, setForm] = useState({
    codigo: '', subproyecto: '', finca: '', lotes: [],
    fecha_inicio: '', fecha_fin: '', observaciones: '', estado: 'ACTIVO',
  });

  // ── Actividades disponibles del subproyecto ──
  const [actividadesDisponibles, setActividadesDisponibles] = useState([]);
  const [loadingActividades,     setLoadingActividades]     = useState(false);
  const [actividadesSel,         setActividadesSel]         = useState([]);

  // ── Cuadrilla: datos que se crearán ──
  const [cuadrillaNombre,  setCuadrillaNombre]  = useState('');
  const [cuadrillaCodigo,  setCuadrillaCodigo]  = useState('');
  // miembros seleccionados: array de objetos persona completos
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState([]);
  // supervisor seleccionado: objeto persona
  const [supervisorSel, setSupervisorSel] = useState(null);

  // ── Lista de personas ──
  const [todasPersonas,    setTodasPersonas]    = useState([]);  // lista completa activas
  const [loadingPersonas,  setLoadingPersonas]  = useState(false);
  const [busquedaPersona,  setBusquedaPersona]  = useState('');  // filtro local

  // ── Para editar: cuadrilla existente (solo lectura) ──
  const [cuadrillaExistente, setCuadrillaExistente] = useState(null);

  // ── Control modal ──
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [tab,    setTab]    = useState('datos'); // 'datos' | 'actividades' | 'cuadrilla'

  // ── Cargar catálogos al abrir ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [fRes, sRes] = await Promise.all([getFincas(), getSubproyectos()]);
        setFincas(normalizeList(fRes));
        setSubproyectos(normalizeList(sRes));
      } catch (e) { console.error('Error cargando catálogos:', e); }
    })();
  }, [isOpen]);

  // ── Cargar TODAS las personas activas al abrir tab cuadrilla ──
  const cargarTodasPersonas = useCallback(async () => {
    if (todasPersonas.length > 0) return; // ya cargadas
    try {
      setLoadingPersonas(true);
      const res = await httpClient.get('/personas', { params: { estado: 'ACTIVO' } });
      setTodasPersonas(normalizeList(res?.data));
    } catch (e) { console.error('Error cargando personas:', e); }
    finally { setLoadingPersonas(false); }
  }, [todasPersonas.length]);

  useEffect(() => {
    if (tab === 'cuadrilla') cargarTodasPersonas();
  }, [tab, cargarTodasPersonas]);

  // ── Pre-llenar al editar / ver ────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (contrato && (modo === 'editar' || modo === 'ver')) {
      const fincaId = contrato.finca?._id  ?? contrato.finca  ?? '';
      const subId   = contrato.subproyecto?._id ?? contrato.subproyecto ?? '';

      setForm({
        codigo:        contrato.codigo        ?? '',
        subproyecto:   subId,
        finca:         fincaId,
        lotes:         (contrato.lotes ?? []).map(l => l._id ?? l),
        fecha_inicio:  toDateInput(contrato.fecha_inicio),
        fecha_fin:     toDateInput(contrato.fecha_fin),
        observaciones: contrato.observaciones ?? '',
        estado:        contrato.estado ?? 'ACTIVO',
      });

      // Actividades previas
      const actsPrevias = (contrato.actividades ?? []).map(a => ({
        asignacion_id:      a.asignacion_subproyecto?._id ?? a.asignacion_subproyecto ?? null,
        actividad_id:       a.actividad?._id ?? a.actividad ?? '',
        nombre:             a.actividad?.nombre ?? '—',
        unidad:             a.actividad?.unidad_medida ?? '',
        cantidad_disponible: null,
        cantidad:           String(a.cantidad ?? ''),
        precio_unitario:    String(a.precio_unitario ?? ''),
      }));
      setActividadesSel(actsPrevias);

      // Cuadrilla existente solo lectura
      if (contrato.cuadrilla && typeof contrato.cuadrilla === 'object') {
        setCuadrillaExistente(contrato.cuadrilla);
      }

      if (fincaId) fetchLotes(fincaId);
      if (subId) cargarActividadesDisponibles(subId, contrato._id ?? contrato.id);
    } else {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contrato, modo]);

  const resetForm = () => {
    setForm({ codigo:'', subproyecto:'', finca:'', lotes:[],
              fecha_inicio:'', fecha_fin:'', observaciones:'', estado:'ACTIVO' });
    setLotes([]);
    setActividadesDisponibles([]);
    setActividadesSel([]);
    setCuadrillaNombre('');
    setCuadrillaCodigo('');
    setMiembrosSeleccionados([]);
    setSupervisorSel(null);
    setCuadrillaExistente(null);
    setBusquedaPersona('');
    setTodasPersonas([]);
    setError(null);
    setTab('datos');
  };

  // ── Lotes ─────────────────────────────────────────────────────
  const fetchLotes = useCallback(async (fincaId) => {
    if (!fincaId) { setLotes([]); return; }
    try {
      const res = await getLotesPorFinca(fincaId);
      setLotes(normalizeList(res).filter(l => l.activo));
    } catch (e) { console.error(e); }
  }, []);

  const handleFincaChange = (fincaId) => {
    setForm(p => ({ ...p, finca: fincaId, lotes: [] }));
    fetchLotes(fincaId);
  };

  const toggleLote = (id) => {
    setForm(p => ({
      ...p,
      lotes: p.lotes.includes(id) ? p.lotes.filter(l => l !== id) : [...p.lotes, id],
    }));
  };

  // ── Subproyecto → cargar actividades disponibles ──────────────
  const cargarActividadesDisponibles = async (subId, excludeId = null) => {
    if (!subId) { setActividadesDisponibles([]); return; }
    try {
      setLoadingActividades(true);
      const res = await getActividadesDisponiblesSubproyecto(subId, excludeId);
      setActividadesDisponibles(normalizeList(res));
    } catch (e) { console.error(e); setActividadesDisponibles([]); }
    finally { setLoadingActividades(false); }
  };

  const handleSubproyectoChange = (subId) => {
    setForm(p => ({ ...p, subproyecto: subId }));
    setActividadesSel([]);
    cargarActividadesDisponibles(subId, contrato?._id ?? contrato?.id ?? null);
  };

  // ── Actividades ───────────────────────────────────────────────
  const agregarActividad = (disp) => {
    const actId = disp.actividad?._id ?? '';
    if (actividadesSel.some(a => a.actividad_id === actId)) return;
    setActividadesSel(prev => [...prev, {
      asignacion_id:      disp.asignacion_id,
      actividad_id:       actId,
      nombre:             disp.actividad?.nombre ?? '—',
      unidad:             disp.unidad ?? disp.actividad?.unidad_medida ?? '',
      cantidad_disponible: disp.cantidad_disponible,
      cantidad:           '',
      precio_unitario:    String(disp.precio_unitario_referencia ?? ''),
    }]);
  };

  const quitarActividad = (idx) =>
    setActividadesSel(prev => prev.filter((_, i) => i !== idx));

  const actualizarCampoActividad = (idx, campo, valor) =>
    setActividadesSel(prev => prev.map((a, i) => i === idx ? { ...a, [campo]: valor } : a));

  const errorCantidad = (item) => {
    const cant = Number(item.cantidad);
    if (!item.cantidad || cant <= 0) return 'Requerida';
    if (item.cantidad_disponible !== null && cant > item.cantidad_disponible)
      return `Máx: ${fmt(item.cantidad_disponible)}`;
    return null;
  };

  // ── Cuadrilla: personas filtradas según búsqueda ──────────────
  const personasFiltradas = busquedaPersona.trim().length === 0
    ? todasPersonas
    : todasPersonas.filter(p => {
        const q = busquedaPersona.trim().toLowerCase();
        const nombre = `${p.nombres ?? ''} ${p.apellidos ?? ''}`.toLowerCase();
        const doc    = (p.num_doc ?? '').toLowerCase();
        return nombre.includes(q) || doc.includes(q);
      });

  // Personas que aún no están en la cuadrilla ni son supervisor
  const personasDisponibles = personasFiltradas.filter(p => {
    const pid = p._id ?? p.id;
    const yaEsMiembro    = miembrosSeleccionados.some(m => (m._id ?? m.id) === pid);
    const yaEsSupervisor = supervisorSel && (supervisorSel._id ?? supervisorSel.id) === pid;
    return !yaEsMiembro && !yaEsSupervisor;
  });

  const agregarMiembro = (persona) => {
    setMiembrosSeleccionados(prev => [...prev, persona]);
  };

  const quitarMiembro = (pid) => {
    setMiembrosSeleccionados(prev => prev.filter(m => (m._id ?? m.id) !== pid));
  };

  const seleccionarSupervisor = (persona) => {
    // Si ya estaba como miembro, lo sacamos
    const pid = persona._id ?? persona.id;
    setMiembrosSeleccionados(prev => prev.filter(m => (m._id ?? m.id) !== pid));
    setSupervisorSel(persona);
  };

  const quitarSupervisor = () => setSupervisorSel(null);

  // ── Guardar ───────────────────────────────────────────────────
  const handleSave = async () => {
    setError(null);

    // Validaciones básicas
    if (!form.codigo.trim())         return setError('El código del contrato es obligatorio');
    if (!form.subproyecto)           return setError('Selecciona un subproyecto');
    if (!form.finca)                 return setError('Selecciona una finca');
    if (form.lotes.length === 0)     return setError('Selecciona al menos un lote');
    if (actividadesSel.length === 0) return setError('Agrega al menos una actividad');
    if (!form.fecha_inicio)          return setError('La fecha de inicio es obligatoria');

    // Validar actividades
    for (const a of actividadesSel) {
      const err = errorCantidad(a);
      if (err && err !== 'Requerida') return setError(`${a.nombre}: ${err}`);
      if (!a.cantidad || Number(a.cantidad) <= 0) return setError(`Ingresa una cantidad válida para "${a.nombre}"`);
      if (a.precio_unitario === '' || Number(a.precio_unitario) < 0) return setError(`Ingresa un precio válido para "${a.nombre}"`);
    }

    // Validar cuadrilla (solo en crear)
    let cuadrillaId = contrato?.cuadrilla?._id ?? contrato?.cuadrilla ?? null;

    if (modo === 'crear') {
      if (!cuadrillaNombre.trim()) return setError('El nombre de la cuadrilla es obligatorio');
      if (!cuadrillaCodigo.trim()) return setError('El código de la cuadrilla es obligatorio');
      if (!supervisorSel)          return setError('Debes seleccionar un supervisor para la cuadrilla');
      if (miembrosSeleccionados.length === 0) return setError('Agrega al menos un trabajador a la cuadrilla');
    }

    try {
      setSaving(true);

      // Paso 1: crear cuadrilla si es modo crear
      if (modo === 'crear') {
        const cuadrillaRes = await httpClient.post('/cuadrillas', {
          codigo:      cuadrillaCodigo.trim().toUpperCase(),
          nombre:      cuadrillaNombre.trim(),
          supervisor:  supervisorSel._id ?? supervisorSel.id,
          miembros:    miembrosSeleccionados.map(m => m._id ?? m.id),
          observaciones: '',
        });
        cuadrillaId = cuadrillaRes?.data?.data?._id ?? cuadrillaRes?.data?._id;

        if (!cuadrillaId) throw new Error('No se pudo obtener el ID de la cuadrilla creada');
      }

      // Paso 2: crear/editar el contrato
      const payload = {
        codigo:       form.codigo.trim().toUpperCase(),
        subproyecto:  form.subproyecto,
        finca:        form.finca,
        lotes:        form.lotes,
        actividades:  actividadesSel.map(a => ({
          actividad:       a.actividad_id,
          cantidad:        Number(a.cantidad),
          precio_unitario: Number(a.precio_unitario),
        })),
        cuadrilla:     cuadrillaId,
        fecha_inicio:  form.fecha_inicio,
        fecha_fin:     form.fecha_fin || null,
        observaciones: form.observaciones.trim(),
        estado:        form.estado,
      };

      if (modo === 'editar' && contrato) {
        await updateContrato(contrato._id ?? contrato.id, payload);
      } else {
        await createContrato(payload);
      }

      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al guardar el contrato');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const esVer    = modo === 'ver';
  const valorTotal = actividadesSel.reduce(
    (s, a) => s + (Number(a.cantidad) || 0) * (Number(a.precio_unitario) || 0), 0
  );

  // ══ MODO VER ══════════════════════════════════════════════════
  if (esVer) {
    const c = contrato;
    const miembrosVer = (c.cuadrilla?.miembros ?? [])
      .filter(m => m.activo)
      .map(m => m.persona ?? m);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-contrato" onClick={e => e.stopPropagation()}>
          <div className="modal-contrato-header">
            <h3>📋 Detalle del Contrato</h3>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <InfoRow icon={FileText}   label="Código">{c.codigo}</InfoRow>
            <InfoRow icon={GitBranch}  label="Subproyecto">
              {c.subproyecto?.nombre ?? '—'} <span style={{ color:'#94a3b8', fontSize:12 }}>({c.subproyecto?.codigo})</span>
            </InfoRow>
            <InfoRow icon={MapPin}     label="Finca">
              {c.finca?.nombre ?? '—'} <span style={{ color:'#94a3b8', fontSize:12 }}>({c.finca?.codigo})</span>
            </InfoRow>
            <InfoRow icon={Layers}     label="Lotes">
              <div className="chips-wrap">
                {(c.lotes ?? []).map(l => <span key={l._id ?? l} className="chip">{l.nombre ?? l.codigo ?? l}</span>)}
              </div>
            </InfoRow>
            <InfoRow icon={Wrench}     label="Actividades">
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {(c.actividades ?? []).map((a, i) => (
                  <div key={i} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 12px' }}>
                    <p style={{ margin:0, fontWeight:700, fontSize:13 }}>{a.actividad?.nombre ?? '—'}</p>
                    <p style={{ margin:'2px 0 0', fontSize:12, color:'#64748b' }}>
                      Cant: <strong>{fmt(a.cantidad)} {a.actividad?.unidad_medida ?? ''}</strong>
                      &nbsp;·&nbsp;Precio: <strong>${fmt(a.precio_unitario)}</strong>
                      &nbsp;·&nbsp;Total: <strong>${fmt((a.cantidad??0)*(a.precio_unitario??0))}</strong>
                    </p>
                  </div>
                ))}
                <p style={{ margin:'4px 0 0', fontSize:13, fontWeight:700, color:'#1f8f57', textAlign:'right' }}>
                  Valor total: ${fmt(c.actividades?.reduce((s,a)=>s+(a.cantidad??0)*(a.precio_unitario??0),0)??0)}
                </p>
              </div>
            </InfoRow>
            <InfoRow icon={Users}      label={`Cuadrilla · ${miembrosVer.length} miembros`}>
              <p style={{ margin:0, fontWeight:600 }}>{c.cuadrilla?.nombre ?? '—'}</p>
              {miembrosVer.length > 0 && (
                <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:4 }}>
                  {miembrosVer.map(p => (
                    <span key={p._id??p} className="chip">{p.nombres} {p.apellidos}</span>
                  ))}
                </div>
              )}
            </InfoRow>
            <InfoRow icon={Calendar}   label="Vigencia">
              {c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString('es-CO') : '—'}
              {c.fecha_fin ? ` → ${new Date(c.fecha_fin).toLocaleDateString('es-CO')}` : ''}
            </InfoRow>
          </div>
          <div className="modal-footer">
            <button className="btn-cancelar" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  // ══ MODO CREAR / EDITAR ════════════════════════════════════════
  const TABS = [
    { key: 'datos',       label: '📋 Datos' },
    { key: 'actividades', label: `🔧 Actividades${actividadesSel.length > 0 ? ` (${actividadesSel.length})` : ''}` },
    { key: 'cuadrilla',   label: `👥 Cuadrilla${miembrosSeleccionados.length > 0 ? ` (${miembrosSeleccionados.length})` : ''}` },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contrato" onClick={e => e.stopPropagation()} style={{ maxWidth: 820, width: '100%' }}>

        {/* Header */}
        <div className="modal-contrato-header">
          <h3>{modo === 'editar' ? '✏️ Editar Contrato' : '➕ Nuevo Contrato'}</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #e6e8ef', padding:'0 24px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding:'11px 18px', border:'none', background:'none', cursor:'pointer',
              fontSize:13, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? '#1f8f57' : '#64748b',
              borderBottom: tab === t.key ? '2.5px solid #1f8f57' : '2.5px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && <div className="contratos-error" style={{ marginBottom:12 }}>{error}</div>}

          {/* ══ TAB DATOS ══════════════════════════════════════════ */}
          {tab === 'datos' && (
            <>
              {/* Subproyecto */}
              <div className="form-section">
                <p className="form-section-title">🗂️ Subproyecto *</p>
                <div className="form-field">
                  <select value={form.subproyecto} onChange={e => handleSubproyectoChange(e.target.value)}>
                    <option value="">— Selecciona un subproyecto —</option>
                    {subproyectos.map(s => (
                      <option key={s._id??s.id} value={s._id??s.id}>
                        {s.codigo} · {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Datos básicos */}
              <div className="form-section">
                <p className="form-section-title">📋 Datos básicos</p>
                <div className="form-row">
                  <div className="form-field">
                    <label>Código *</label>
                    <input placeholder="Ej: CON-001" value={form.codigo}
                      onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label>Estado</label>
                    <select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}>
                      <option value="ACTIVO">Activo</option>
                      <option value="BORRADOR">Borrador</option>
                      <option value="CERRADO">Cerrado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Fecha inicio *</label>
                    <input type="date" value={form.fecha_inicio}
                      onChange={e => setForm(p => ({ ...p, fecha_inicio: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label>Fecha fin</label>
                    <input type="date" value={form.fecha_fin}
                      onChange={e => setForm(p => ({ ...p, fecha_fin: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="form-section">
                <p className="form-section-title">📍 Ubicación</p>
                <div className="form-field">
                  <label>Finca *</label>
                  <select value={form.finca} onChange={e => handleFincaChange(e.target.value)}>
                    <option value="">— Selecciona una finca —</option>
                    {fincas.map(f => (
                      <option key={f._id??f.id} value={f._id??f.id}>{f.nombre} ({f.codigo})</option>
                    ))}
                  </select>
                </div>
                {form.finca && (
                  <div className="form-field" style={{ marginTop:12 }}>
                    <label>Lotes * — {form.lotes.length} seleccionado(s)</label>
                    {lotes.length === 0
                      ? <p style={{ margin:0, fontSize:13, color:'#94a3b8' }}>Esta finca no tiene lotes activos.</p>
                      : (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                          {lotes.map(l => {
                            const lid = l._id ?? l.id;
                            const sel = form.lotes.includes(lid);
                            return (
                              <label key={lid} className={`actividad-checkbox ${sel ? 'selected' : ''}`} style={{ minWidth:'unset', padding:'7px 12px' }}>
                                <input type="checkbox" checked={sel} onChange={() => toggleLote(lid)} />
                                <span className="act-nombre">{l.nombre} <span className="act-cat">({l.codigo})</span></span>
                              </label>
                            );
                          })}
                        </div>
                      )
                    }
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div className="form-section">
                <div className="form-field">
                  <label>Observaciones</label>
                  <textarea placeholder="Notas adicionales..." value={form.observaciones}
                    onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))} />
                </div>
              </div>
            </>
          )}

          {/* ══ TAB ACTIVIDADES ════════════════════════════════════ */}
          {tab === 'actividades' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {!form.subproyecto ? (
                <div style={{ textAlign:'center', padding:'32px 20px', background:'#f8fafc', border:'2px dashed #e2e8f0', borderRadius:12, color:'#94a3b8' }}>
                  <p style={{ margin:0, fontSize:22 }}>📂</p>
                  <p style={{ margin:'6px 0 0', fontSize:13 }}>Selecciona primero un subproyecto en la pestaña "Datos"</p>
                </div>
              ) : loadingActividades ? (
                <div style={{ textAlign:'center', padding:32, color:'#64748b' }}>Cargando actividades...</div>
              ) : (
                <>
                  {/* Disponibles */}
                  <div>
                    <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.4px' }}>
                      Actividades disponibles en el subproyecto
                    </p>
                    {actividadesDisponibles.length === 0 ? (
                      <div style={{ padding:16, background:'#fef9c3', border:'1px solid #fde68a', borderRadius:10, fontSize:13, color:'#92400e', display:'flex', alignItems:'center', gap:8 }}>
                        <AlertCircle size={15} /> El subproyecto no tiene actividades disponibles.
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {actividadesDisponibles.map(disp => {
                          const actId     = disp.actividad?._id ?? '';
                          const yaAgregada = actividadesSel.some(a => a.actividad_id === actId);
                          const sinDisp    = disp.cantidad_disponible <= 0;
                          return (
                            <div key={disp.asignacion_id} style={{
                              background: sinDisp ? '#f8fafc' : '#fff',
                              border: `1.5px solid ${sinDisp ? '#e2e8f0' : yaAgregada ? '#1f8f57' : '#e2e8f0'}`,
                              borderRadius:10, padding:'12px 14px', opacity: sinDisp ? 0.65 : 1,
                            }}>
                              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                                <div style={{ flex:1 }}>
                                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#0f172a' }}>{disp.actividad?.nombre ?? '—'}</p>
                                  <p style={{ margin:'2px 0 4px', fontSize:12, color:'#64748b' }}>
                                    {disp.actividad?.codigo} · {disp.unidad}
                                    &nbsp;·&nbsp;Precio ref: <strong>${fmt(disp.precio_unitario_referencia)}</strong>
                                  </p>
                                  <BarraCantidad disponible={disp.cantidad_disponible} total={disp.cantidad_asignada_subproyecto} />
                                </div>
                                <div style={{ flexShrink:0 }}>
                                  {yaAgregada
                                    ? <span style={{ fontSize:11, background:'#f0faf4', color:'#1f8f57', padding:'3px 10px', borderRadius:999, fontWeight:700 }}>✅ Agregada</span>
                                    : sinDisp
                                      ? <span style={{ fontSize:11, background:'#fee2e2', color:'#dc2626', padding:'3px 10px', borderRadius:999, fontWeight:700 }}>Sin disponible</span>
                                      : (
                                        <button onClick={() => agregarActividad(disp)} style={{ background:'#f0faf4', border:'1.5px solid #1f8f57', color:'#1f8f57', padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                                          <Plus size={12} /> Agregar
                                        </button>
                                      )
                                  }
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Seleccionadas con cantidad y precio */}
                  {actividadesSel.length > 0 && (
                    <div>
                      <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:'#0f172a', textTransform:'uppercase', letterSpacing:'0.4px' }}>
                        📝 Cantidades y precios del contrato
                      </p>
                      {/* Cabecera */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 150px 150px 90px 32px', gap:8, padding:'8px 14px', background:'#f8fafc', borderRadius:'10px 10px 0 0', border:'1px solid #e2e8f0', borderBottom:'none', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase' }}>
                        <span>Actividad</span><span>Cantidad</span><span>Precio unitario</span><span>Total</span><span></span>
                      </div>
                      <div style={{ border:'1px solid #e2e8f0', borderRadius:'0 0 10px 10px', overflow:'hidden' }}>
                        {actividadesSel.map((a, i) => {
                          const errCant = errorCantidad(a);
                          const total   = (Number(a.cantidad)||0) * (Number(a.precio_unitario)||0);
                          return (
                            <div key={i} style={{
                              display:'grid', gridTemplateColumns:'1fr 150px 150px 90px 32px',
                              gap:8, padding:'10px 14px', alignItems:'center',
                              borderBottom: i < actividadesSel.length - 1 ? '1px solid #f0f2f5' : 'none',
                              background: errCant && errCant !== 'Requerida' ? '#fff5f5' : '#fff',
                            }}>
                              <div>
                                <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#0f172a' }}>{a.nombre}</p>
                                <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>
                                  {a.cantidad_disponible !== null ? `Disponible: ${fmt(a.cantidad_disponible)} ${a.unidad}` : a.unidad}
                                </p>
                              </div>
                              <div>
                                <input type="number" min="0.01" step="0.01"
                                  placeholder={a.cantidad_disponible !== null ? `Máx ${fmt(a.cantidad_disponible)}` : '0'}
                                  value={a.cantidad}
                                  onChange={e => actualizarCampoActividad(i, 'cantidad', e.target.value)}
                                  style={{ width:'100%', padding:'7px 10px', fontSize:13, border:`1.5px solid ${errCant && errCant !== 'Requerida' ? '#dc2626' : '#e6e8ef'}`, borderRadius:8 }}
                                />
                                {errCant && errCant !== 'Requerida' && (
                                  <p style={{ margin:'2px 0 0', fontSize:10, color:'#dc2626' }}>{errCant}</p>
                                )}
                              </div>
                              <div style={{ position:'relative' }}>
                                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#94a3b8' }}>$</span>
                                <input type="number" min="0" step="0.01" placeholder="0.00"
                                  value={a.precio_unitario}
                                  onChange={e => actualizarCampoActividad(i, 'precio_unitario', e.target.value)}
                                  style={{ width:'100%', padding:'7px 10px 7px 20px', fontSize:13, border:'1.5px solid #e6e8ef', borderRadius:8 }}
                                />
                              </div>
                              <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#1f8f57', textAlign:'right' }}>${fmt(total)}</p>
                              <button onClick={() => quitarActividad(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <X size={15} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {/* Total */}
                      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
                        <div style={{ background:'#f0faf4', border:'1.5px solid #1f8f57', borderRadius:10, padding:'8px 18px', display:'flex', alignItems:'center', gap:8 }}>
                          <DollarSign size={15} color="#1f8f57" />
                          <span style={{ fontSize:13, fontWeight:700, color:'#1f8f57' }}>
                            Valor total: ${fmt(valorTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══ TAB CUADRILLA ══════════════════════════════════════ */}
          {tab === 'cuadrilla' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Si es editar, mostrar cuadrilla actual como lectura */}
              {modo === 'editar' && cuadrillaExistente && (
                <div style={{ background:'#f0faf4', border:'1.5px solid #1f8f57', borderRadius:12, padding:'14px 16px' }}>
                  <p style={{ margin:'0 0 6px', fontSize:13, fontWeight:700, color:'#1f8f57' }}>✅ Cuadrilla asignada actualmente</p>
                  <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#0f172a' }}>{cuadrillaExistente.nombre}</p>
                  <p style={{ margin:'2px 0 0', fontSize:12, color:'#64748b' }}>
                    {(cuadrillaExistente.miembros ?? []).filter(m => m.activo).length} miembro(s) activo(s)
                  </p>
                </div>
              )}

              {modo === 'crear' && (
                <>
                  {/* Nombre y código de la cuadrilla */}
                  <div className="form-section" style={{ margin:0 }}>
                    <p className="form-section-title">📋 Datos de la cuadrilla</p>
                    <div className="form-row">
                      <div className="form-field">
                        <label>Nombre de la cuadrilla *</label>
                        <input placeholder="Ej: Cuadrilla Norte"
                          value={cuadrillaNombre}
                          onChange={e => setCuadrillaNombre(e.target.value)} />
                      </div>
                      <div className="form-field">
                        <label>Código *</label>
                        <input placeholder="Ej: CUA-001"
                          value={cuadrillaCodigo}
                          onChange={e => setCuadrillaCodigo(e.target.value.toUpperCase())} />
                      </div>
                    </div>
                  </div>

                  {/* Supervisor seleccionado */}
                  {supervisorSel && (
                    <div style={{ background:'#eff6ff', border:'1.5px solid #3b82f6', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:'0.4px' }}>⭐ Supervisor</p>
                        <p style={{ margin:'2px 0 0', fontSize:14, fontWeight:700, color:'#0f172a' }}>
                          {supervisorSel.nombres} {supervisorSel.apellidos}
                        </p>
                        <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{supervisorSel.tipo_doc} {supervisorSel.num_doc}</p>
                      </div>
                      <button onClick={quitarSupervisor} style={{ background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', color:'#dc2626', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Miembros seleccionados */}
                  {miembrosSeleccionados.length > 0 && (
                    <div>
                      <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:700, color:'#475569' }}>
                        👷 Trabajadores en la cuadrilla ({miembrosSeleccionados.length})
                      </p>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {miembrosSeleccionados.map(p => {
                          const pid = p._id ?? p.id;
                          return (
                            <div key={pid} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 12px' }}>
                              <div>
                                <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#0f172a' }}>{p.nombres} {p.apellidos}</p>
                                <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>{p.tipo_doc} {p.num_doc} {p.cargo ? `· ${p.cargo}` : ''}</p>
                              </div>
                              <button onClick={() => quitarMiembro(pid)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', display:'flex', alignItems:'center' }}>
                                <UserX size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Buscador + lista de personas */}
                  <div>
                    <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.4px' }}>
                      Personas disponibles
                    </p>

                    {/* Buscador */}
                    <div style={{ position:'relative', marginBottom:12 }}>
                      <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
                      <input
                        placeholder="Buscar por nombre o cédula..."
                        value={busquedaPersona}
                        onChange={e => setBusquedaPersona(e.target.value)}
                        style={{ width:'100%', padding:'9px 12px 9px 36px', border:'1.5px solid #e6e8ef', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box' }}
                      />
                    </div>

                    {loadingPersonas ? (
                      <div style={{ textAlign:'center', padding:24, color:'#64748b' }}>Cargando personas...</div>
                    ) : personasDisponibles.length === 0 ? (
                      <div style={{ textAlign:'center', padding:20, color:'#94a3b8', fontSize:13 }}>
                        {busquedaPersona ? 'Sin resultados para esa búsqueda' : 'Todas las personas ya fueron agregadas'}
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:320, overflowY:'auto' }}>
                        {personasDisponibles.map(p => {
                          const pid = p._id ?? p.id;
                          return (
                            <div key={pid} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 12px' }}>
                              <div>
                                <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#0f172a' }}>
                                  {p.nombres} {p.apellidos}
                                </p>
                                <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>
                                  {p.tipo_doc} {p.num_doc} {p.cargo ? `· ${p.cargo}` : ''}
                                </p>
                              </div>
                              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                                {/* Botón supervisor */}
                                <button
                                  title="Asignar como supervisor"
                                  onClick={() => seleccionarSupervisor(p)}
                                  style={{ background:'#eff6ff', border:'1.5px solid #3b82f6', color:'#1d4ed8', padding:'5px 10px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}
                                >
                                  <UserCheck size={12} /> Supervisor
                                </button>
                                {/* Botón agregar miembro */}
                                <button
                                  title="Agregar a la cuadrilla"
                                  onClick={() => agregarMiembro(p)}
                                  style={{ background:'#f0faf4', border:'1.5px solid #1f8f57', color:'#1f8f57', padding:'5px 10px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}
                                >
                                  <Plus size={12} /> Agregar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
          <button className="btn-guardar" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : modo === 'editar' ? 'Guardar cambios' : 'Crear contrato'}
          </button>
        </div>

      </div>
    </div>
  );
}