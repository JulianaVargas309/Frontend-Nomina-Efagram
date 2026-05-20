import { useEffect, useState, useCallback, useRef } from 'react';
import {
  FileText, MapPin, Layers, Wrench, Users,
  Search, X, Plus, PlusCircle, Pencil, Calendar, GitBranch, DollarSign,
  AlertCircle, UserCheck, UserX, ChevronDown, ChevronUp, Trash2,
  ClipboardList, Settings2, UsersRound, FolderOpen, LayoutList, TrendingUp,
} from 'lucide-react';
import {
  getFincas,
  getSubproyectos,
  getActividadesDisponiblesSubproyecto,
  createContrato,
  updateContrato,
} from '../services/contratosService';
import SearchableSelect from "../../proyectos/components/SearchableSelect";
import { getPersonal } from '../../proyectos/services/personalService';
import httpClient from '../../../core/api/httpClient';

// ══════════════════════════════════════════════════════════════════
// ✅ HELPERS DE NORMALIZACIÓN (AGREGADOS)
// ══════════════════════════════════════════════════════════════════

const getPersonaId = (persona) =>
  persona?._id ??
  persona?.id ??
  persona?.value ??
  persona?.cc ??
  persona?.documento ??
  persona?.num_doc ??
  persona?.cedula ??
  '';

const normalizarPersonaParaCuadrilla = (persona) => {
  if (!persona || typeof persona !== 'object') return null;

  const cc = String(
    persona.cc ??
    persona.documento ??
    persona.num_doc ??
    persona.cedula ??
    persona.identificacion ??
    ''
  ).trim();

  const name = String(
    persona.name ??
    persona.nombre ??
    persona.nombres ??
    persona.nombre_completo ??
    [persona.primer_nombre, persona.primer_apellido].filter(Boolean).join(' ') ??
    ''
  ).trim();

  if (!cc || !name) return null;

  return {
    cc,
    name,
    cargo: persona.cargo ? String(persona.cargo).trim() : null,
    nombrefinca: persona.nombrefinca
      ? String(persona.nombrefinca).trim()
      : persona.nombreFinca
        ? String(persona.nombreFinca).trim()
        : null,
    proceso: persona.proceso ? String(persona.proceso).trim() : null,
  };
};

const getFincaId = (finca) =>
  finca?._id ??
  finca?.id ??
  finca?.value ??
  finca?.codigo ??
  finca?.code ??
  '';

const normalizarFincaParaContrato = (finca) => {
  if (!finca || typeof finca !== 'object') return null;

  const nombre = String(
    finca.nombre ??
    finca.name ??
    finca.nombreFinca ??
    finca.nombre_finca ??
    finca.descripcion ??
    ''
  ).trim();

  if (!nombre) return null;

  return {
    id: String(
      finca._id ??
      finca.id ??
      finca.value ??
      finca.codigo ??
      finca.code ??
      ''
    ).trim(),
    codigo: String(
      finca.codigo ??
      finca.code ??
      finca.codeFinca ??
      finca.cod_finca ??
      ''
    ).trim(),
    nombre,
  };
};

// ── helpers originales ────────────────────────────────────────────
const normalizeList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.fincas)) return res.fincas;
  if (Array.isArray(res?.zonas)) return res.zonas;
  if (Array.isArray(res?.nucleos)) return res.nucleos;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const toDateInput = (iso) => (iso ? iso.slice(0, 10) : '');
const formatIsoToDisplay = (iso) => {
  if (!iso) return '';
  const [yyyy, mm, dd] = iso.slice(0, 10).split('-');
  return `${dd}/${mm}/${yyyy}`;
};
const parseDisplayToIso = (value) => {
  const parts = value.split('/').map((p) => p.trim());
  if (parts.length !== 3) return '';
  const [dd, mm, yyyy] = parts;
  if (!/^[0-9]{1,2}$/.test(dd) || !/^[0-9]{1,2}$/.test(mm) || !/^[0-9]{4}$/.test(yyyy)) return '';
  return `${yyyy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
};
const fmt = (n) => Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const generarCodigoContrato = (contratos = []) => {
  if (!Array.isArray(contratos) || contratos.length === 0) {
    return "CON-001";
  }

  let max = 0;
  contratos.forEach((c) => {
    const codigo = String(c.codigo || "").trim();
    if (!codigo.startsWith("CON-")) return;
    const numero = parseInt(codigo.replace("CON-", ""), 10);
    if (!isNaN(numero) && numero > max) {
      max = numero;
    }
  });

  const siguiente = max + 1;
  return `CON-${String(siguiente).padStart(3, "0")}`;
};

const nuevaCuadrillaVacia = (idx) => ({
  _key: Date.now() + idx,
  nombre: '',
  codigo: '',
  supervisor: null,
  miembros: [],
  expandida: true,
});

const BarraCantidad = ({ disponible, total }) => {
  const totalNum = Number(total) || 0;
  const dispNum = Number(disponible) || 0;
  const pct = totalNum > 0 ? Math.min(100, Math.round(((totalNum - dispNum) / totalNum) * 100)) : 0;
  const color = dispNum <= 0 ? '#dc2626' : dispNum / totalNum < 0.2 ? '#e67e22' : '#1f8f57';
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
        <span>Comprometido: {fmt(totalNum - dispNum)}</span>
        <span style={{ color }}>Disponible: {fmt(dispNum)}</span>
      </div>
    </div>
  );
};

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

  const [fincas, setFincas] = useState([]);
  const [subproyectos, setSubproyectos] = useState([]);
  const [contratosExistentes, setContratosExistentes] = useState([]);

  const [form, setForm] = useState({
    codigo: '', subproyecto: '', finca: '',
    fecha_inicio: '', fecha_fin: '',
    observaciones: '', estado: 'PENDIENTE',
    porcentaje_distribuido: 0,
  });

  const [displayFechas, setDisplayFechas] = useState({
    fecha_inicio: '',
    fecha_fin: '',
  });
  const fechaInicioPickerRef = useRef(null);
  const fechaFinPickerRef = useRef(null);

  const [actividadesDisponibles, setActividadesDisponibles] = useState([]);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [actividadesSel, setActividadesSel] = useState([]);

  const [lotes, setLotes] = useState([]);
  const [nuevoLote, setNuevoLote] = useState('');

  const [cuadrillas, setCuadrillas] = useState([nuevaCuadrillaVacia(0)]);
  const [cuadrillasExistentes, setCuadrillasExistentes] = useState([]);

  const [todasPersonas, setTodasPersonas] = useState([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);

  const [busquedas, setBusquedas] = useState({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('datos');

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [fRes, sRes] = await Promise.all([getFincas(), getSubproyectos()]);
        setFincas(normalizeList(fRes));
        setSubproyectos(normalizeList(sRes));
      } catch (e) { console.error(e); }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || modo !== "crear") return;

    const cargarContratos = async () => {
      try {
        const res = await httpClient.get("/contratos");
        const lista = normalizeList(res?.data);
        setContratosExistentes(lista);
        const codigoGenerado = generarCodigoContrato(lista);
        setForm((prev) => ({ ...prev, codigo: codigoGenerado }));
      } catch (error) {
        console.error("Error cargando contratos:", error);
      }
    };

    cargarContratos();
  }, [isOpen, modo]);

  const cargarPersonas = useCallback(async () => {
    if (todasPersonas.length > 0) return;
    try {
      setLoadingPersonas(true);
      const res = await getPersonal();
      const lista = normalizeList(res);
      setTodasPersonas(lista);
    } catch (e) { console.error(e); }
    finally { setLoadingPersonas(false); }
  }, [todasPersonas.length]);

  useEffect(() => {
    if (tab === 'cuadrilla') cargarPersonas();
  }, [tab, cargarPersonas]);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayFechas({
      fecha_inicio: formatIsoToDisplay(form.fecha_inicio),
      fecha_fin: formatIsoToDisplay(form.fecha_fin),
    });
  }, [isOpen, contrato, modo]);

  const renderDatePickerField = (label, field, pickerRef) => (
    <div className="form-field">
      <label>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="DD/MM/AAAA"
          value={displayFechas[field]}
          onChange={(e) => {
            const value = e.target.value;
            setDisplayFechas((prev) => ({ ...prev, [field]: value }));
            const iso = parseDisplayToIso(value);
            if (iso) {
              setForm((prev) => ({ ...prev, [field]: iso }));
            }
          }}
          style={{
            width: '100%',
            padding: '8px 44px 8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 10,
            fontSize: 14,
            background: '#fff',
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (pickerRef.current?.showPicker) {
              pickerRef.current.showPicker();
            } else {
              pickerRef.current?.focus();
            }
          }}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#6366f1',
          }}
        >
          <Calendar size={16} />
        </button>
        <input
          ref={pickerRef}
          type="date"
          value={form[field] || ''}
          onChange={(e) => {
            const iso = e.target.value;
            setForm((prev) => ({ ...prev, [field]: iso }));
            setDisplayFechas((prev) => ({ ...prev, [field]: formatIsoToDisplay(iso) }));
          }}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            pointerEvents: 'none',
            width: 0,
            height: 0,
          }}
          tabIndex={-1}
        />
      </div>
    </div>
  );

  useEffect(() => {
    if (!isOpen) return;

    if (contrato && (modo === 'editar' || modo === 'ver')) {
      const fincaId =
        contrato.finca?.id ??
        contrato.finca?._id ??
        contrato.finca ??
        '';
      const subId = contrato.subproyecto?._id ?? contrato.subproyecto ?? '';

      setForm({
        codigo: contrato.codigo ?? '',
        subproyecto: subId,
        finca: fincaId,
        fecha_inicio: toDateInput(contrato.fecha_inicio),
        fecha_fin: toDateInput(contrato.fecha_fin),
        observaciones: contrato.observaciones ?? '',
        porcentaje_distribuido: contrato.porcentaje_distribuido ?? 0,
        estado: contrato.estado ?? 'PENDIENTE',
      });

      setLotes(
        Array.isArray(contrato.lotes)
          ? contrato.lotes.map((l) => ({ nombre: l.nombre, _id: l._id }))
          : []
      );

      setActividadesSel((contrato.actividades ?? []).map((a) => ({
        asignacion_id: a.asignacion_subproyecto?._id ?? a.asignacion_subproyecto ?? null,
        actividad_id: a.actividad?._id ?? a.actividad ?? '',
        nombre: a.actividad?.nombre ?? '—',
        unidad: a.actividad?.unidad_medida ?? '',
        cantidad_disponible: null,
        cantidad: String(a.cantidad ?? ''),
        precio_unitario: String(a.precio_unitario ?? ''),
      })));

      setCuadrillasExistentes(contrato.cuadrillas ?? []);

      if (subId) {
        cargarActividadesDisponibles(subId, contrato._id ?? contrato.id);
      }
    } else {
      const codigoGenerado = generarCodigoContrato(contratosExistentes);

      setForm({
        codigo: codigoGenerado,
        subproyecto: '',
        finca: '',
        fecha_inicio: '',
        fecha_fin: '',
        observaciones: '',
        estado: 'PENDIENTE',
      });

      setLotes([]);
      setNuevoLote('');
      setActividadesDisponibles([]);
      setActividadesSel([]);
      setCuadrillas([nuevaCuadrillaVacia(0)]);
      setCuadrillasExistentes([]);
      setBusquedas({});
      setTodasPersonas([]);
      setError(null);
      setTab('datos');
    }
  }, [isOpen, contrato, modo, contratosExistentes]);

  const resetForm = (codigoInicial = '') => {
    setForm({
      codigo: codigoInicial,
      subproyecto: '',
      finca: '',
      fecha_inicio: '',
      fecha_fin: '',
      observaciones: '',
      estado: 'PENDIENTE',
      porcentaje_distribuido: 0,
    });
    setLotes([]);
    setNuevoLote('');
    setActividadesDisponibles([]);
    setActividadesSel([]);
    setCuadrillas([nuevaCuadrillaVacia(0)]);
    setCuadrillasExistentes([]);
    setBusquedas({});
    setTodasPersonas([]);
    setError(null);
    setTab('datos');
  };

  const cargarActividadesDisponibles = async (subId, excludeId = null) => {
    if (!subId) { setActividadesDisponibles([]); return; }
    try {
      setLoadingActividades(true);
      const res = await getActividadesDisponiblesSubproyecto(subId, excludeId);
      setActividadesDisponibles(normalizeList(res));
    } catch { setActividadesDisponibles([]); }
    finally { setLoadingActividades(false); }
  };

  const handleSubproyectoChange = (subId) => {
    setForm(p => ({ ...p, subproyecto: subId }));
    setActividadesSel([]);
    cargarActividadesDisponibles(subId, contrato?._id ?? contrato?.id ?? null);
  };

  const handleAgregarLote = () => {
    const nombre = nuevoLote.trim();
    if (!nombre) return;
    setLotes((prev) => [...prev, { nombre }]);
    setNuevoLote('');
  };

  const handleEliminarLote = (idx) => {
    setLotes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLoteKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAgregarLote();
    }
  };

  const agregarActividad = (disp) => {
    if (!disp || typeof disp !== 'object') return;
    const actId = disp.actividad?._id ?? '';
    if (!actId || actividadesSel.some(a => a.actividad_id === actId)) return;
    const nueva = {
      asignacion_id: disp.asignacion_id || '',
      actividad_id: actId,
      nombre: disp.actividad?.nombre || '—',
      unidad: disp.unidad || '',
      cantidad_disponible: Number(disp.cantidad_disponible) || 0,
      cantidad: '',
      precio_unitario: String(disp.precio_unitario_referencia || ''),
    };
    setActividadesSel(prev => [...prev, nueva]);
  };
  const quitarActividad = (idx) => setActividadesSel(p => p.filter((_, i) => i !== idx));
  const actualizarCampoActividad = (idx, campo, valor) =>
    setActividadesSel(p => p.map((a, i) => i === idx ? { ...a, [campo]: valor } : a));
  const errorCantidad = (item) => {
    const cant = Number(item.cantidad);
    if (!item.cantidad || cant <= 0) return 'Requerida';
    if (item.cantidad_disponible !== null && cant > item.cantidad_disponible) return `Máx: ${fmt(item.cantidad_disponible)}`;
    return null;
  };

  const actualizarCuadrilla = (idx, campo, valor) =>
    setCuadrillas(prev => prev.map((c, i) => i === idx ? { ...c, [campo]: valor } : c));

  const agregarNuevaCuadrilla = () =>
    setCuadrillas(prev => [...prev, nuevaCuadrillaVacia(prev.length)]);

  const eliminarCuadrilla = (idx) => {
    if (cuadrillas.length === 1) return;
    setCuadrillas(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleExpandida = (idx) =>
    actualizarCuadrilla(idx, 'expandida', !cuadrillas[idx].expandida);

  // ✅ CORREGIDO: usar getPersonaId
  const seleccionarSupervisor = (cuadrillaIdx, persona) => {
    const pid = getPersonaId(persona);
    setCuadrillas((prev) =>
      prev.map((c, i) => {
        if (i !== cuadrillaIdx) return c;
        return {
          ...c,
          supervisor: persona,
          miembros: c.miembros.filter((m) => String(getPersonaId(m)) !== String(pid)),
        };
      })
    );
  };

  const quitarSupervisor = (cuadrillaIdx) =>
    actualizarCuadrilla(cuadrillaIdx, 'supervisor', null);

  // ✅ CORREGIDO: usar getPersonaId
  const agregarMiembro = (cuadrillaIdx, persona) => {
    setCuadrillas((prev) =>
      prev.map((c, i) => {
        if (i !== cuadrillaIdx) return c;
        const pid = getPersonaId(persona);
        if (c.miembros.some((m) => String(getPersonaId(m)) === String(pid))) {
          return c;
        }
        return {
          ...c,
          miembros: [...c.miembros, persona],
        };
      })
    );
  };

  // ✅ CORREGIDO: usar getPersonaId
  const quitarMiembro = (cuadrillaIdx, pid) =>
    setCuadrillas((prev) =>
      prev.map((c, i) =>
        i !== cuadrillaIdx
          ? c
          : {
            ...c,
            miembros: c.miembros.filter((m) => String(getPersonaId(m)) !== String(pid)),
          }
      )
    );

  // ✅ CORREGIDO: usar getPersonaId
  const getPersonasDisponibles = (cuadrillaIdx) => {
    const busqueda = (busquedas[cuadrillaIdx] ?? '').trim().toLowerCase();
    const todosOcupados = new Set();
    cuadrillas.forEach(c => {
      if (c.supervisor) todosOcupados.add(String(getPersonaId(c.supervisor)));
      c.miembros.forEach(m => todosOcupados.add(String(getPersonaId(m))));
    });
    return todasPersonas.filter(p => {
      const pid = String(getPersonaId(p));
      if (todosOcupados.has(pid)) return false;
      if (!busqueda) return true;
      const nombre = `${p.name ?? p.nombre ?? p.nombres ?? ''}`.toLowerCase();
      const doc = String(p.cc ?? p.num_doc ?? p.documento ?? '').toLowerCase();
      return nombre.includes(busqueda) || doc.includes(busqueda);
    });
  };

  // ══════════════════════════════════════════════════════════════════
  // ✅ FUNCIÓN handleSave COMPLETAMENTE CORREGIDA
  // ══════════════════════════════════════════════════════════════════
  const handleSave = async () => {
    setError(null);

    if (!form.codigo.trim()) return setError('El código del contrato es obligatorio');
    if (!form.subproyecto) return setError('Selecciona un subproyecto');
    if (!form.finca) return setError('Selecciona una finca');
    if (lotes.length === 0) return setError('Agrega al menos un lote');
    if (actividadesSel.length === 0) return setError('Agrega al menos una actividad');

    for (const a of actividadesSel) {
      const err = errorCantidad(a);
      if (err && err !== 'Requerida') return setError(`${a.nombre}: ${err}`);
      if (!a.cantidad || Number(a.cantidad) <= 0) return setError(`Ingresa una cantidad válida para "${a.nombre}"`);
      if (a.precio_unitario === '' || Number(a.precio_unitario) < 0) return setError(`Ingresa un precio válido para "${a.nombre}"`);
    }

    let cuadrillaIds = (contrato?.cuadrillas ?? []).map(c => c._id ?? c);

    // ✅ VALIDACIÓN Y CREACIÓN DE CUADRILLAS CORREGIDA
    if (modo === 'crear') {
      // Validar cuadrillas antes de enviar
      for (let i = 0; i < cuadrillas.length; i++) {
        const c = cuadrillas[i];

        if (!String(c.nombre ?? '').trim()) {
          return setError(`Cuadrilla ${i + 1}: el nombre es obligatorio`);
        }

        const supervisorNormalizado = normalizarPersonaParaCuadrilla(c.supervisor);

        if (!supervisorNormalizado) {
          return setError(`Cuadrilla ${i + 1}: el líder debe tener cédula y nombre`);
        }

        if (!Array.isArray(c.miembros) || c.miembros.length === 0) {
          return setError(`Cuadrilla ${i + 1}: agrega al menos un trabajador`);
        }

        const miembrosNormalizados = c.miembros
          .map(normalizarPersonaParaCuadrilla)
          .filter(Boolean);

        if (miembrosNormalizados.length !== c.miembros.length) {
          return setError(`Cuadrilla ${i + 1}: todos los miembros deben tener cédula y nombre`);
        }

        // Validar duplicados
        const ccs = new Set();
        for (const miembro of miembrosNormalizados) {
          if (ccs.has(miembro.cc)) {
            return setError(`Cuadrilla ${i + 1}: hay trabajadores duplicados`);
          }
          ccs.add(miembro.cc);

          if (miembro.cc === supervisorNormalizado.cc) {
            return setError(`Cuadrilla ${i + 1}: el líder no puede estar también como miembro`);
          }
        }
      }

      try {
        setSaving(true);

        // ✅ CREACIÓN DE CUADRILLAS CORREGIDA
        const resultados = await Promise.all(
          cuadrillas.map((c, idx) => {
            const supervisorNormalizado = normalizarPersonaParaCuadrilla(c.supervisor);
            const miembrosNormalizados = c.miembros
              .map(normalizarPersonaParaCuadrilla)
              .filter(Boolean);

            return httpClient.post('/cuadrillas', {
              codigo: `CUA-${Date.now()}-${idx}`,
              nombre: String(c.nombre ?? '').trim(),
              supervisor: supervisorNormalizado,
              miembros: miembrosNormalizados,
            });
          })
        );

        cuadrillaIds = resultados.map(r => r?.data?.data?._id ?? r?.data?._id);
        if (cuadrillaIds.some(id => !id)) throw new Error('No se pudo obtener el ID de una cuadrilla creada');
      } catch (e) {
        setError(e?.response?.data?.message ?? e?.message ?? 'Error al crear las cuadrillas');
        setSaving(false);
        return;
      }
    }

    // ✅ NORMALIZAR FINCA ANTES DE CREAR PAYLOAD
    const fincaSeleccionada = fincas.find((f) => {
      const id = getFincaId(f);
      return String(id) === String(form.finca);
    });

    const fincaNormalizada = normalizarFincaParaContrato(fincaSeleccionada);

    if (!fincaNormalizada) {
      return setError('Selecciona una finca válida con nombre');
    }

    // ✅ NORMALIZAR LOTES
    const lotesNormalizados = lotes
      .map((l) => ({
        nombre: String(l.nombre ?? '').trim(),
      }))
      .filter((l) => l.nombre);

    try {
      // ✅ PAYLOAD FINAL CORREGIDO
      const payload = {
        codigo: form.codigo.trim().toUpperCase(),
        subproyecto: form.subproyecto,
        finca: fincaNormalizada,
        lotes: lotesNormalizados,
        actividades: actividadesSel.map((a) => ({
          actividad: a.actividad_id,
          cantidad: Number(a.cantidad),
          precio_unitario: Number(a.precio_unitario),
        })),
        cuadrillas: cuadrillaIds,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        porcentaje_distribuido: Number(form.porcentaje_distribuido) || 0,
        observaciones: String(form.observaciones ?? '').trim(),
      };

      // En edición, agregar el estado
      if (modo === 'editar') {
        payload.estado = form.estado;
      }

      if (modo === 'editar' && contrato) {
        await updateContrato(contrato._id ?? contrato.id, payload);
      } else {
        // ✅ MANEJO DE RESPUESTA CORREGIDO
        const res = await createContrato(payload);
        const contratoCreado = res?.data?.data ?? res?.data ?? res;
        const newContratoId = contratoCreado?._id ?? contratoCreado?.id;

        onSuccess?.(newContratoId);
        onClose();
        return;
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

  const esVer = modo === 'ver';
  const valorTotal = actividadesSel.reduce((s, a) => s + (Number(a.cantidad) || 0) * (Number(a.precio_unitario) || 0), 0);

  // ══ MODO VER ══════════════════════════════════════════════════
  if (esVer) {
    const c = contrato;
    const lotesContrato = Array.isArray(c.lotes) ? c.lotes : [];
    return (
      <div className="modal-overlay">
        <div className="modal-contrato" onClick={e => e.stopPropagation()}>
          <div className="modal-contrato-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.12)' }}>
                <FileText size={17} color="#3b82f6" />
              </span>
              Detalle del Contrato
            </h3>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <InfoRow icon={FileText} label="Código">{c.codigo}</InfoRow>
            <InfoRow icon={GitBranch} label="Subproyecto">
              {c.subproyecto?.nombre ?? '—'} <span style={{ color: '#94a3b8', fontSize: 12 }}>({c.subproyecto?.codigo})</span>
            </InfoRow>
            <InfoRow icon={MapPin} label="Finca">
              {c.finca?.nombre ?? '—'} <span style={{ color: '#94a3b8', fontSize: 12 }}>({c.finca?.codigo})</span>
            </InfoRow>

            <InfoRow icon={Layers} label={`Lotes (${lotesContrato.length})`}>
              {lotesContrato.length === 0 ? (
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Sin lotes registrados</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {lotesContrato.map((l) => (
                    <span
                      key={l._id ?? l.codigo}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 8,
                        background: '#f0faf4', border: '1px solid rgba(31,143,87,0.25)',
                        fontSize: 12, fontWeight: 600, color: '#1f8f57',
                      }}
                    >
                      <span style={{ color: '#94a3b8', fontWeight: 500 }}>#{l.codigo}</span>
                      {l.nombre}
                    </span>
                  ))}
                </div>
              )}
            </InfoRow>

            <InfoRow icon={Wrench} label="Actividades">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(c.actividades ?? []).map((a, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{a.actividad?.nombre ?? '—'}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                      Cant: <strong>{fmt(a.cantidad)}</strong> · Precio: <strong>${fmt(a.precio_unitario)}</strong> · Total: <strong>${fmt((a.cantidad ?? 0) * (a.precio_unitario ?? 0))}</strong>
                    </p>
                  </div>
                ))}
                <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#1f8f57', textAlign: 'right' }}>
                  Valor total: ${fmt((c.actividades ?? []).reduce((s, a) => s + (a.cantidad ?? 0) * (a.precio_unitario ?? 0), 0))}
                </p>
              </div>
            </InfoRow>
            <InfoRow icon={Users} label={`Cuadrillas (${(c.cuadrillas ?? []).length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(c.cuadrillas ?? []).map((cua, i) => {
                  const miembros = (cua.miembros ?? []).filter(m => m.activo).map(m => m.persona ?? m);
                  return (
                    <div key={cua._id ?? i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{cua.nombre} <span style={{ color: '#94a3b8', fontSize: 11 }}>({cua.codigo})</span></p>
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {miembros.map((p, idx) => <span key={`miembro-${p._id || idx}`} className="chip">{p.nombres} {p.apellidos}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </InfoRow>
            <InfoRow icon={Calendar} label="Vigencia del contrato">
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
  const totalMiembros = cuadrillas.reduce((s, c) => s + c.miembros.length, 0);
  const TABS = [
    { key: 'datos', label: 'datos', icon: ClipboardList, texto: 'Datos' },
    { key: 'actividades', label: 'actividades', icon: Settings2, texto: `Actividades${actividadesSel.length > 0 ? ` (${actividadesSel.length})` : ''}` },
    { key: 'cuadrilla', label: 'cuadrilla', icon: UsersRound, texto: `Cuadrillas${modo === 'crear' && totalMiembros > 0 ? ` (${cuadrillas.length})` : ''}` },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-contrato" onClick={e => e.stopPropagation()} style={{ maxWidth: 860, width: '100%' }}>

        <div className="modal-contrato-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: modo === 'editar' ? 'rgba(234,179,8,0.12)' : 'rgba(31,143,87,0.12)' }}>
              {modo === 'editar' ? <Pencil size={14} color="#ca8a04" /> : <PlusCircle size={14} color="#1f8f57" />}
            </span>
            {modo === 'editar' ? 'Editar Contrato' : 'Nuevo Contrato'}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #e6e8ef', padding: '0 24px' }}>
          {TABS.map(t => {
            const TabIcon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '11px 18px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? '#1f8f57' : '#64748b',
                borderBottom: tab === t.key ? '2.5px solid #1f8f57' : '2.5px solid transparent',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <TabIcon size={14} />
                {t.texto}
              </button>
            );
          })}
        </div>

        <div className="modal-body">

          {tab === 'datos' && (
            <>
              <div className="form-section">
                <p className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <FolderOpen size={14} color="#6366f1" /> Subproyecto *
                </p>
                <div className="form-field">
                  <SearchableSelect
                    options={subproyectos}
                    value={form.subproyecto}
                    onChange={(id) => handleSubproyectoChange(id)}
                    placeholder="— Selecciona un subproyecto —"
                    searchPlaceholder="Buscar por código o nombre…"
                    filterFn={(s, q) => {
                      const term = q.toLowerCase();
                      return (
                        (s.codigo ?? '').toLowerCase().includes(term) ||
                        (s.nombre ?? '').toLowerCase().includes(term)
                      );
                    }}
                    renderOption={(s) => (
                      <>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                          fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {(s.codigo ?? '').slice(-3)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 13 }}>
                            {s.nombre}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.codigo}</div>
                        </div>
                      </>
                    )}
                    renderSelected={(s) => `${s.codigo} · ${s.nombre}`}
                  />
                </div>
              </div>

              <div className="form-section">
                <p className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><LayoutList size={14} color="#3b82f6" /> Datos básicos</p>
                <div className="form-row">
                  <div className="form-field">
                    <label>Código *</label>
                    <input
                      value={form.codigo}
                      disabled
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        fontWeight: 600,
                        letterSpacing: 1
                      }}
                    />
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      El código se genera automáticamente
                    </p>
                  </div>
                  <div className="form-field">
                    <label>Estado</label>
                    <select
                      value={form.estado}
                      disabled
                    >
                      <option value="PENDIENTE">Pendiente</option>
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: 12 }}>
                  {renderDatePickerField('Fecha de inicio *', 'fecha_inicio', fechaInicioPickerRef)}
                  {renderDatePickerField('Fecha de fin', 'fecha_fin', fechaFinPickerRef)}
                </div>
              </div>

              <div className="form-section">
                <p className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><MapPin size={14} color="#e67e22" /> Ubicación</p>
                <div className="form-field">
                  <label>Finca *</label>
                  <SearchableSelect
                    options={fincas}
                    value={form.finca}
                    onChange={(id) => setForm(p => ({ ...p, finca: id }))}
                    placeholder="— Selecciona una finca —"
                    searchPlaceholder="Buscar por nombre o código…"
                    filterFn={(f, q) => {
                      const term = q.toLowerCase();
                      return (
                        (f.nombreFinca ?? f.nombre ?? '').toLowerCase().includes(term) ||
                        (f.codeFinca ?? '').toLowerCase().includes(term)
                      );
                    }}
                    renderOption={(f) => (
                      <>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'rgba(230,126,34,0.1)', color: '#e67e22',
                          fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          🌿
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 13 }}>
                            {f.nombreFinca ?? f.nombre ?? 'Finca'}
                          </div>
                          {f.codeFinca && (
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.codeFinca}</div>
                          )}
                        </div>
                      </>
                    )}
                    renderSelected={(f) =>
                      `${f.nombreFinca ?? f.nombre ?? 'Finca'}${f.codeFinca ? ` (${f.codeFinca})` : ''}`
                    }
                  />
                </div>

                <div className="form-field" style={{ marginTop: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={13} /> Lotes * — {lotes.length} definido(s)
                  </label>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={nuevoLote}
                      onChange={(e) => setNuevoLote(e.target.value)}
                      onKeyDown={handleLoteKeyDown}
                      placeholder="Nombre del lote, ej: Lote Norte"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAgregarLote}
                      disabled={!nuevoLote.trim()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '0 16px', borderRadius: 8, border: 'none',
                        background: nuevoLote.trim() ? '#1f8f57' : '#e2e8f0',
                        color: nuevoLote.trim() ? '#fff' : '#94a3b8',
                        fontWeight: 700, fontSize: 13,
                        cursor: nuevoLote.trim() ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap', height: 38,
                      }}
                    >
                      <Plus size={15} /> Agregar
                    </button>
                  </div>

                  <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#94a3b8' }}>
                    Presiona Enter o el botón para agregar. El código se genera automáticamente.
                  </p>

                  {lotes.length > 0 && (
                    <div
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 6,
                        padding: '10px 12px',
                        background: '#f8fafc', borderRadius: 10,
                        border: '1px solid #e6e8ef',
                      }}
                    >
                      {lotes.map((lote, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 10px', borderRadius: 8,
                            background: '#fff', border: '1px solid #e6e8ef',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                width: 24, height: 24, borderRadius: 6,
                                background: '#e8f5ee', color: '#1f8f57',
                                fontSize: 11, fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {idx + 1}
                            </span>
                            <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>
                              {lote.nombre}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEliminarLote(idx)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#ef4444', padding: '4px',
                              display: 'flex', alignItems: 'center', borderRadius: 6,
                            }}
                            title="Eliminar lote"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <div className="form-field">
                  <label>Observaciones</label>
                  <textarea placeholder="Notas adicionales..." value={form.observaciones}
                    onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))} />
                </div>
              </div>

              <div className="form-section">
                <div className="form-field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={13} /> Porcentaje distribuido del subproyecto
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="number"
                      name="porcentaje_distribuido"
                      value={form.porcentaje_distribuido}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                        setForm((p) => ({ ...p, porcentaje_distribuido: val }));
                      }}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.1"
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', minWidth: 40 }}>
                      {Number(form.porcentaje_distribuido).toFixed(1)}%
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Asigna qué porcentaje del subproyecto corresponde a este contrato. La suma total de todos los contratos del subproyecto debe igualar el porcentaje del subproyecto.
                  </p>
                </div>
              </div>
            </>
          )}

          {tab === 'actividades' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {!form.subproyecto ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: 12, color: '#94a3b8' }}>
                  <p style={{ margin: 0, fontSize: 22 }}>📂</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13 }}>Selecciona primero un subproyecto en la pestaña "Datos"</p>
                </div>
              ) : loadingActividades ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Cargando actividades...</div>
              ) : (
                <>
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Actividades disponibles
                    </p>
                    {actividadesDisponibles.length === 0 ? (
                      <div style={{ padding: 16, background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={15} /> Sin actividades disponibles en este subproyecto.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {actividadesDisponibles.map(disp => {
                          const actId = disp.actividad?._id ?? '';
                          const yaAgregada = actividadesSel.some(a => a.actividad_id === actId);
                          const sinDisp = disp.cantidad_disponible <= 0;
                          return (
                            <div key={disp.asignacion_id} style={{
                              background: sinDisp ? '#f8fafc' : '#fff',
                              border: `1.5px solid ${sinDisp ? '#e2e8f0' : yaAgregada ? '#1f8f57' : '#e2e8f0'}`,
                              borderRadius: 10, padding: '12px 14px', opacity: sinDisp ? 0.65 : 1,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{disp.actividad?.nombre ?? '—'}</p>
                                  <p style={{ margin: '2px 0 4px', fontSize: 12, color: '#64748b' }}>
                                    {disp.actividad?.codigo} · {disp.unidad} · Precio ref: <strong>${fmt(disp.precio_unitario_referencia)}</strong>
                                  </p>
                                  <BarraCantidad disponible={disp.cantidad_disponible} total={typeof disp.cantidad_asignada_subproyecto === 'number' ? disp.cantidad_asignada_subproyecto : (disp.cantidad_asignada_subproyecto?.cantidad || 0)} />
                                </div>
                                <div style={{ flexShrink: 0 }}>
                                  {yaAgregada
                                    ? <span style={{ fontSize: 11, background: '#f0faf4', color: '#1f8f57', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>✅ Agregada</span>
                                    : sinDisp
                                      ? <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>Sin disponible</span>
                                      : (
                                        <button onClick={() => agregarActividad(disp)} style={{ background: '#f0faf4', border: '1.5px solid #1f8f57', color: '#1f8f57', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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

                  {actividadesSel.length > 0 && (
                    <div>
                      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        📝 Cantidades y precios
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 150px 90px 32px', gap: 8, padding: '8px 14px', background: '#f8fafc', borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        <span>Actividad</span><span>Cantidad</span><span>Precio unitario</span><span>Total</span><span></span>
                      </div>
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                        {actividadesSel.map((a, i) => {
                          const errCant = errorCantidad(a);
                          const total = (Number(a.cantidad) || 0) * (Number(a.precio_unitario) || 0);
                          return (
                            <div key={i} style={{
                              display: 'grid', gridTemplateColumns: '1fr 150px 150px 90px 32px',
                              gap: 8, padding: '10px 14px', alignItems: 'center',
                              borderBottom: i < actividadesSel.length - 1 ? '1px solid #f0f2f5' : 'none',
                              background: errCant && errCant !== 'Requerida' ? '#fff5f5' : '#fff',
                            }}>
                              <div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{a.nombre}</p>
                                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                                  {a.cantidad_disponible !== null ? `Disponible: ${fmt(a.cantidad_disponible)} ${a.unidad}` : a.unidad}
                                </p>
                              </div>
                              <div>
                                <input type="number" min="0.01" step="0.01"
                                  placeholder={a.cantidad_disponible !== null ? `Máx ${fmt(a.cantidad_disponible)}` : '0'}
                                  value={a.cantidad}
                                  onChange={e => actualizarCampoActividad(i, 'cantidad', e.target.value)}
                                  style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: `1.5px solid ${errCant && errCant !== 'Requerida' ? '#dc2626' : '#e6e8ef'}`, borderRadius: 8 }}
                                />
                                {errCant && errCant !== 'Requerida' && (
                                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#dc2626' }}>{errCant}</p>
                                )}
                              </div>
                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8' }}>$</span>
                                <input type="number" min="0" step="0.01" placeholder="0.00"
                                  value={a.precio_unitario}
                                  onChange={e => actualizarCampoActividad(i, 'precio_unitario', e.target.value)}
                                  style={{ width: '100%', padding: '7px 10px 7px 20px', fontSize: 13, border: '1.5px solid #e6e8ef', borderRadius: 8 }}
                                />
                              </div>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1f8f57', textAlign: 'right' }}>${fmt(total)}</p>
                              <button onClick={() => quitarActividad(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={15} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                        <div style={{ background: '#f0faf4', border: '1.5px solid #1f8f57', borderRadius: 10, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <DollarSign size={15} color="#1f8f57" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1f8f57' }}>Valor total: ${fmt(valorTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'cuadrilla' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {modo === 'editar' && cuadrillasExistentes.length > 0 && (
                <div style={{ background: '#f0faf4', border: '1.5px solid #1f8f57', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1f8f57' }}>✅ Cuadrillas asignadas actualmente</p>
                  {cuadrillasExistentes.map((cua, i) => (
                    <div key={cua._id ?? i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{cua.nombre ?? `Cuadrilla ${i + 1}`}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        {(cua.miembros ?? []).filter(m => m.activo).length} miembro(s)
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {modo === 'crear' && (
                <>
                  {cuadrillas.map((cua, cuaIdx) => {
                    const personasDisp = getPersonasDisponibles(cuaIdx);
                    const busqueda = busquedas[cuaIdx] ?? '';
                    return (
                      <div key={cua._key} style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderBottom: cua.expandida ? '1px solid #e2e8f0' : 'none', cursor: 'pointer' }}
                          onClick={() => toggleExpandida(cuaIdx)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,0.1)' }}>
                              <UsersRound size={15} color="#6366f1" />
                            </span>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                {cua.nombre.trim() || `Cuadrilla ${cuaIdx + 1}`}
                              </p>
                              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                                {cua.supervisor ? `Líder: ${cua.supervisor.nombres ?? cua.supervisor.name} ${cua.supervisor.apellidos ?? ''}` : 'Sin líder'} · {cua.miembros.length} miembro(s)
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {cuadrillas.length > 1 && (
                              <button
                                onClick={e => { e.stopPropagation(); eliminarCuadrilla(cuaIdx); }}
                                style={{ background: '#fee2e2', border: 'none', color: '#dc2626', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            {cua.expandida ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                          </div>
                        </div>

                        {cua.expandida && (
                          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                              <div className="form-field" style={{ margin: 0 }}>
                                <label>Nombre *</label>
                                <input placeholder="Ej: Cuadrilla Norte"
                                  value={cua.nombre}
                                  style={{ background: '#fff', color: '#0f172a' }}
                                  onChange={e => actualizarCuadrilla(cuaIdx, 'nombre', e.target.value)} />
                              </div>
                            </div>

                            {cua.supervisor && (
                              <div style={{ background: '#eff6ff', border: '1.5px solid #3b82f6', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>⭐ Líder</p>
                                  <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700 }}>{cua.supervisor.nombres ?? cua.supervisor.name} {cua.supervisor.apellidos ?? ''}</p>
                                  <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{cua.supervisor.tipo_doc} {cua.supervisor.num_doc ?? cua.supervisor.cc}</p>
                                </div>
                                <button onClick={() => quitarSupervisor(cuaIdx)} style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                  <X size={13} />
                                </button>
                              </div>
                            )}

                            {cua.miembros.length > 0 && (
                              <div>
                                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                  Trabajadores ({cua.miembros.length})
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  {cua.miembros.map(p => {
                                    const pid = getPersonaId(p);
                                    return (
                                      <div key={pid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px' }}>
                                        <div>
                                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{p.nombres ?? p.name} {p.apellidos ?? ''}</p>
                                          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{p.tipo_doc} {p.num_doc ?? p.cc}{p.cargo ? ` · ${p.cargo}` : ''}</p>
                                        </div>
                                        <button onClick={() => quitarMiembro(cuaIdx, pid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                          <UserX size={15} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div>
                              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>

                              </p>
                              <div style={{ position: 'relative', marginBottom: 10 }}>
                                <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                  placeholder="Buscar por nombre o cédula..."
                                  value={busqueda}
                                  onChange={e => setBusquedas(prev => ({ ...prev, [cuaIdx]: e.target.value }))}
                                  style={{ width: '100%', padding: '8px 12px 8px 34px', border: '1.5px solid #e6e8ef', borderRadius: 9, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}
                                />
                              </div>
                              {loadingPersonas ? (
                                <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>Cargando personas...</div>
                              ) : personasDisp.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 16, color: '#94a3b8', fontSize: 13 }}>
                                  {busqueda ? 'Sin resultados' : 'Todas las personas ya fueron asignadas'}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 240, overflowY: 'auto' }}>
                                  {personasDisp.map(p => {
                                    const pid = getPersonaId(p);
                                    return (
                                      <div key={pid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 12px' }}>
                                        <div>
                                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{p.nombres ?? p.name}</p>
                                          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{p.tipo_doc} {p.num_doc ?? p.cc}{p.cargo ? ` · ${p.cargo}` : ''}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                          <button onClick={() => seleccionarSupervisor(cuaIdx, p)}
                                            style={{ background: '#eff6ff', border: '1.5px solid #3b82f6', color: '#1d4ed8', padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <UserCheck size={12} /> Líder
                                          </button>
                                          <button onClick={() => agregarMiembro(cuaIdx, p)}
                                            style={{ background: '#f0faf4', border: '1.5px solid #1f8f57', color: '#1f8f57', padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Plus size={12} /> Agregar
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button onClick={agregarNuevaCuadrilla} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', border: '2px dashed #1f8f57', borderRadius: 12,
                    background: 'transparent', color: '#1f8f57', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', width: '100%',
                  }}>
                    <Plus size={16} /> Agregar otra cuadrilla
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px', marginBottom: 12,
              display: 'flex', alignItems: 'flex-start', gap: 8,
              fontSize: 13, color: '#dc2626',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
            <button className="btn-guardar" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : modo === 'editar' ? 'Guardar cambios' : 'Crear contrato'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}