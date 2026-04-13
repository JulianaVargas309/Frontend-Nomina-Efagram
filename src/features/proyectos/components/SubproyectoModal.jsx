import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createSubproyecto,
  updateSubproyecto,
  getActividadesDisponibles,
  createAsignacion,
  getAsignaciones,
  cancelarAsignacion,
} from '../services/subproyectosService';
import { getPersonal } from '../services/personalService';
import httpClient from '../../../core/api/httpClient';
import {
  FolderGit2,
  User,
  MapPin,
  Plus,
  PlusCircle,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const toDateInput = (iso) => (iso ? iso.slice(0, 10) : '');

const INTERVENCION_LABEL = {
  mantenimiento: 'Mantenimiento',
  no_programadas: 'No programadas',
  establecimiento: 'Establecimiento',
  sin_intervencion: 'Sin intervención',
};

const INTERVENCION_COLOR = {
  mantenimiento: { bg: '#f0faf4', border: '#1f8f57', color: '#1f8f57' },
  no_programadas: { bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8' },
  establecimiento: { bg: '#fff5f5', border: '#ef4444', color: '#dc2626' },
  sin_intervencion: { bg: '#f8fafc', border: '#cbd5e1', color: '#475569' },
};

const TIPO_EMOJI = {
  mantenimiento: '🔧',
  no_programadas: '⚡',
  establecimiento: '🌱',
  sin_intervencion: '📌',
};

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_CORTOS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const normalizeIntervencion = (value) => {
  if (!value) {
    return {
      key: 'sin_intervencion',
      label: INTERVENCION_LABEL.sin_intervencion,
    };
  }

  if (typeof value === 'string') {
    const key = value.trim() || 'sin_intervencion';
    return {
      key,
      label:
        INTERVENCION_LABEL[key] ??
        key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    };
  }

  if (typeof value === 'object') {
    const key =
      value.codigo ||
      value.slug ||
      value.tipo ||
      value.key ||
      value._id ||
      value.nombre ||
      'sin_intervencion';

    const label =
      value.nombre ||
      value.label ||
      INTERVENCION_LABEL[key] ||
      String(key).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    return { key: String(key), label };
  }

  return {
    key: 'sin_intervencion',
    label: INTERVENCION_LABEL.sin_intervencion,
  };
};

const ErrorBanner = ({ errors }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        {errors.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              fontSize: 13,
              color: '#dc2626',
              marginBottom: i < errors.length - 1 ? 4 : 0,
            }}
          >
            <span style={{ flexShrink: 0 }}>•</span>
            <span>{msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle, icon, tone = 'green' }) => {
  const tones = {
    green: {
      bg: '#ecfdf5',
      color: '#1f8f57',
      border: '#bbf7d0',
    },
    blue: {
      bg: '#eff6ff',
      color: '#2563eb',
      border: '#bfdbfe',
    },
  };

  const t = tones[tone] || tones.green;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        background: t.bg,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: t.color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
};

function CalendarioPicker({ value, onChange, disabled = false }) {
  const hoy = new Date();
  const selDate = value ? new Date(value + 'T12:00:00') : null;

  const [vistaAnio, setVistaAnio] = useState(
    selDate ? selDate.getFullYear() : hoy.getFullYear()
  );
  const [vistaMes, setVistaMes] = useState(
    selDate ? selDate.getMonth() : hoy.getMonth()
  );
  const [abierto, setAbierto] = useState(false);

  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!selDate) return;
    setVistaAnio(selDate.getFullYear());
    setVistaMes(selDate.getMonth());
  }, [value]);

  const irMesAnterior = () => {
    if (vistaMes === 0) {
      setVistaMes(11);
      setVistaAnio((y) => y - 1);
    } else {
      setVistaMes((m) => m - 1);
    }
  };

  const irMesSiguiente = () => {
    if (vistaMes === 11) {
      setVistaMes(0);
      setVistaAnio((y) => y + 1);
    } else {
      setVistaMes((m) => m + 1);
    }
  };

  const primerDia = new Date(vistaAnio, vistaMes, 1).getDay();
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  const diasEnMes = new Date(vistaAnio, vistaMes + 1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const esSeleccionado = (d) => {
    if (!d || !selDate) return false;
    return (
      selDate.getFullYear() === vistaAnio &&
      selDate.getMonth() === vistaMes &&
      selDate.getDate() === d
    );
  };

  const esHoy = (d) => {
    if (!d) return false;
    return (
      hoy.getFullYear() === vistaAnio &&
      hoy.getMonth() === vistaMes &&
      hoy.getDate() === d
    );
  };

  const seleccionarDia = (d) => {
    if (!d || disabled) return;
    const mm = String(vistaMes + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${vistaAnio}-${mm}-${dd}`);
    setAbierto(false);
  };

  const labelBoton = selDate
    ? `${String(selDate.getDate()).padStart(2, '0')}/${String(
        selDate.getMonth() + 1
      ).padStart(2, '0')}/${selDate.getFullYear()}`
    : 'dd/mm/aaaa';

  const s = {
    wrap: {
      position: 'relative',
      width: '100%',
      overflow: 'visible',
    },
    trigger: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '11px 12px',
      border: '1px solid #d1d5db',
      borderRadius: 10,
      background: disabled ? '#f8fafc' : '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 14,
      color: selDate ? '#111827' : '#9ca3af',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s',
      letterSpacing: selDate ? 0 : 1,
    },
    popup: {
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: '#fff',
      borderRadius: 14,
      padding: '16px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb',
      width: 280,
      userSelect: 'none',
    },
    navRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    navBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      border: '1px solid #e5e7eb',
      background: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#374151',
    },
    mesLabel: { fontWeight: 700, fontSize: 15, color: '#111827' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
    diaHeader: {
      textAlign: 'center',
      fontSize: 11,
      fontWeight: 700,
      color: '#9ca3af',
      padding: '4px 0',
    },
    celda: (d, sel, hoyFlag) => ({
      width: '100%',
      aspectRatio: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      fontSize: 13,
      cursor: d ? 'pointer' : 'default',
      fontWeight: sel ? 700 : hoyFlag ? 600 : 400,
      background: sel ? '#16a34a' : hoyFlag ? '#f0fdf4' : 'transparent',
      color: sel ? '#fff' : hoyFlag ? '#16a34a' : d ? '#111827' : 'transparent',
      border:
        hoyFlag && !sel ? '1.5px solid #86efac' : '1.5px solid transparent',
    }),
    footerRow: {
      marginTop: 12,
      paddingTop: 10,
      borderTop: '1px solid #f1f5f9',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    btnHoy: {
      fontSize: 12,
      fontWeight: 600,
      color: '#16a34a',
      background: '#f0fdf4',
      border: '1px solid #86efac',
      borderRadius: 6,
      padding: '4px 10px',
      cursor: 'pointer',
    },
    btnLimpiar: {
      fontSize: 12,
      fontWeight: 500,
      color: '#6b7280',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px 6px',
    },
  };

  return (
    <div ref={ref} style={s.wrap}>
      <button
        type="button"
        style={s.trigger}
        disabled={disabled}
        onClick={() => !disabled && setAbierto((a) => !a)}
        onFocus={(e) => {
          if (!disabled) e.currentTarget.style.borderColor = '#16a34a';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        <span>{labelBoton}</span>
        <Calendar size={15} color="#6b7280" />
      </button>

      {abierto && (
        <div style={s.popup}>
          <div style={s.navRow}>
            <button type="button" style={s.navBtn} onClick={irMesAnterior}>
              <ChevronLeft size={14} />
            </button>
            <span style={s.mesLabel}>
              {MESES[vistaMes]} {vistaAnio}
            </span>
            <button type="button" style={s.navBtn} onClick={irMesSiguiente}>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={s.grid}>
            {DIAS_CORTOS.map((d) => (
              <div key={d} style={s.diaHeader}>
                {d}
              </div>
            ))}

            {celdas.map((d, i) => {
              const sel = esSeleccionado(d);
              const hoyF = esHoy(d);

              return (
                <div
                  key={i}
                  style={s.celda(d, sel, hoyF)}
                  onClick={() => seleccionarDia(d)}
                  onMouseEnter={(e) => {
                    if (d && !sel) e.currentTarget.style.background = '#f0fdf4';
                  }}
                  onMouseLeave={(e) => {
                    if (d && !sel) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {d ?? ''}
                </div>
              );
            })}
          </div>

          <div style={s.footerRow}>
            <button
              type="button"
              style={s.btnHoy}
              onClick={() => {
                const h = new Date();
                const iso = `${h.getFullYear()}-${String(
                  h.getMonth() + 1
                ).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
                onChange(iso);
                setAbierto(false);
              }}
            >
              Hoy
            </button>

            <button
              type="button"
              style={s.btnLimpiar}
              onClick={() => {
                onChange('');
                setAbierto(false);
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SubproyectoModal = ({
  isOpen,
  onClose,
  onSuccess,
  subproyecto = null,
  proyecto,
  nextCode = '',
}) => {
  const modoEditar = !!subproyecto;

  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    supervisor: '',
    fecha_inicio: '',
    fecha_fin_estimada: '',
    observaciones: '',
  });

  const [nucleos, setNucleos] = useState([]);
  const [nucleosSel, setNucleosSel] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [actDisponibles, setActDisponibles] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [nuevasAsigs, setNuevasAsigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadData, setLoadData] = useState(false);
  const [formErrors, setFormErrors] = useState([]);

  const initialForm = useMemo(
    () => ({
      codigo: '',
      nombre: '',
      supervisor: '',
      fecha_inicio: '',
      fecha_fin_estimada: '',
      observaciones: '',
    }),
    []
  );

  useEffect(() => {
    if (!isOpen || !proyecto) return;
    setFormErrors([]);

    const cargar = async () => {
      try {
        setLoadData(true);

        const [pRes, aRes] = await Promise.all([
          getPersonal(),
          getActividadesDisponibles(proyecto._id),
        ]);

        setPersonas(pRes?.data?.data ?? []);
        setActDisponibles(aRes?.data?.data ?? []);

        const zonaId = proyecto.zona?._id ?? proyecto.zona ?? null;
        const nucleosParams = zonaId ? { zona: zonaId } : {};
        const nRes = await httpClient.get('/nucleos', { params: nucleosParams });
        setNucleos(nRes?.data?.data ?? []);

        if (modoEditar && subproyecto) {
          setForm({
            codigo: subproyecto.codigo ?? '',
            nombre: subproyecto.nombre ?? '',
            supervisor: subproyecto.supervisor?._id ?? subproyecto.supervisor ?? '',
            fecha_inicio: toDateInput(subproyecto.fecha_inicio),
            fecha_fin_estimada: toDateInput(subproyecto.fecha_fin_estimada),
            observaciones: subproyecto.observaciones ?? '',
          });

          setNucleosSel(subproyecto.nucleos?.map((n) => n._id ?? n) ?? []);

          const asRes = await getAsignaciones({ subproyecto: subproyecto._id });
          setAsignaciones(asRes?.data?.data ?? []);
          setNuevasAsigs([]);
        } else {
          setForm({
            ...initialForm,
            codigo: nextCode || '',
          });
          setNucleosSel([]);
          setAsignaciones([]);
          setNuevasAsigs([]);
        }
      } catch (e) {
        console.error('Error cargando datos del subproyecto', e);
      } finally {
        setLoadData(false);
      }
    };

    cargar();
  }, [isOpen, proyecto, subproyecto, modoEditar, initialForm, nextCode]);

  useEffect(() => {
    if (!isOpen || modoEditar) return;

    setForm((prev) => ({
      ...prev,
      codigo: nextCode || '',
    }));
  }, [isOpen, modoEditar, nextCode]);

  const toggleNucleo = (id) => {
    setFormErrors([]);
    setNucleosSel((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const agregarActividad = (actProyecto) => {
    const yaEnBorrador = nuevasAsigs.some(
      (a) => a.actividad_proyecto_id === actProyecto._id
    );
    const yaAsignada = asignaciones.some(
      (a) => (a.actividad_proyecto?._id ?? a.actividad_proyecto) === actProyecto._id
    );

    if (yaEnBorrador || yaAsignada) return;

    const intervencionInfo = normalizeIntervencion(actProyecto.intervencion);

    setNuevasAsigs((prev) => [
      ...prev,
      {
        actividad_proyecto_id: actProyecto._id,
        nombre: actProyecto.actividad?.nombre ?? 'Actividad',
        intervencion_key: intervencionInfo.key,
        intervencion_label: intervencionInfo.label,
        cantidad_total: actProyecto.cantidad_total,
        cantidad_asignada_global: actProyecto.cantidad_asignada,
        unidad: actProyecto.actividad?.unidad_medida ?? actProyecto.unidad ?? '',
        cantidad: '',
      },
    ]);
  };

  const actualizarCantidad = (idx, valor) => {
    setNuevasAsigs((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, cantidad: valor } : a))
    );
  };

  const quitarBorrador = (idx) => {
    setNuevasAsigs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCancelarAsignacion = async (asignacionId) => {
    if (!window.confirm('¿Cancelar esta asignación? La cantidad será devuelta al pool disponible.')) {
      return;
    }

    try {
      await cancelarAsignacion(asignacionId);
      setAsignaciones((prev) => prev.filter((a) => a._id !== asignacionId));
      const aRes = await getActividadesDisponibles(proyecto._id);
      setActDisponibles(aRes?.data?.data ?? []);
    } catch (e) {
      setFormErrors([e?.response?.data?.message ?? 'Error cancelando asignación']);
    }
  };

  const handleSubmit = async () => {
    setFormErrors([]);

    const errores = [];
    if (!form.codigo.trim()) errores.push('El código del subproyecto es obligatorio (ej: SUB-001).');
    if (!form.nombre.trim()) errores.push('El nombre del subproyecto es obligatorio.');
    if (nucleosSel.length === 0) errores.push('Debes seleccionar al menos un núcleo.');
    if (errores.length > 0) {
      setFormErrors(errores);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...form,
        codigo: form.codigo.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        proyecto: proyecto._id,
        nucleos: nucleosSel,
      };

      let subId;

      if (modoEditar) {
        await updateSubproyecto(subproyecto._id, payload);
        subId = subproyecto._id;
      } else {
        const res = await createSubproyecto(payload);
        subId = res?.data?.data?._id;
      }

      if (subId && nuevasAsigs.length > 0) {
        for (const a of nuevasAsigs) {
          const cant = parseFloat(a.cantidad);
          if (!cant || cant <= 0) continue;

          try {
            await createAsignacion({
              subproyecto: subId,
              actividad_proyecto: a.actividad_proyecto_id,
              cantidad_asignada: cant,
            });
          } catch (e) {
            console.warn('No se pudo asignar:', a.nombre, e?.response?.data?.message);
          }
        }
      }

      onSuccess?.();
      onClose?.();
    } catch (e) {
      const backendErrors = e?.response?.data?.errors;

      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        const MENSAJES = {
          codigo: 'El código del subproyecto es obligatorio.',
          nombre: 'El nombre del subproyecto es obligatorio.',
          nucleos: 'Debes seleccionar al menos un núcleo.',
          supervisor: 'El supervisor seleccionado no es válido.',
          cliente: 'El cliente seleccionado no es válido.',
          fecha_inicio: 'La fecha de inicio no es válida.',
          fecha_fin_estimada: 'La fecha fin estimada no es válida.',
        };

        setFormErrors(
          backendErrors.map((err) => {
            const campo = err.path ?? err.param ?? err.field ?? '';
            return MENSAJES[campo] ?? err.msg ?? err.message ?? `Campo inválido: ${campo}`;
          })
        );
      } else {
        setFormErrors([e?.response?.data?.message ?? 'Error guardando el subproyecto.']);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const disponiblesPorIntervencion = actDisponibles.reduce((acc, a) => {
    const info = normalizeIntervencion(a.intervencion);

    if (!acc[info.key]) {
      acc[info.key] = {
        label: info.label,
        actividades: [],
      };
    }

    acc[info.key].actividades.push(a);
    return acc;
  }, {});

  return (
    <div className="modal-overlay">
      <div
        className="modal"
        style={{
          width: 'min(760px, calc(100% - 24px))',
          background: '#fff',
          borderRadius: 18,
          border: '1px solid #e6e8ef',
          boxShadow: '0 24px 64px rgba(15,23,42,0.22)',
          maxHeight: '92vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #f0f2f5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(99,102,241,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FolderGit2 size={22} color="#6366f1" />
          </div>

          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: modoEditar
                    ? 'rgba(234,179,8,0.12)'
                    : 'rgba(31,143,87,0.12)',
                }}
              >
                {modoEditar ? (
                  <Pencil size={14} color="#ca8a04" />
                ) : (
                  <PlusCircle size={14} color="#1f8f57" />
                )}
              </span>
              {modoEditar ? 'Editar Subproyecto' : 'Nuevo Subproyecto'}
            </h3>

            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
              Proyecto: <strong>{proyecto?.nombre}</strong> ({proyecto?.codigo})
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: '#94a3b8',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {loadData ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              Cargando datos...
            </div>
          ) : (
            <>
              <SectionHeader
                title="Información general"
                subtitle="Completa los datos base del subproyecto"
                icon={<FolderGit2 size={18} />}
                tone="blue"
              />

              <div className="form-group">
                <label>
                  Código *{' '}
                  {!modoEditar && (
                    <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                      (automático)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={form.codigo}
                  onChange={(e) => {
                    setFormErrors([]);
                    setForm((p) => ({ ...p, codigo: e.target.value }));
                  }}
                  placeholder="Ej: SUB-001"
                  style={{ textTransform: 'uppercase' }}
                  disabled={!modoEditar}
                  readOnly={!modoEditar}
                />
                {!modoEditar && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                    El código se genera automáticamente con base en los subproyectos existentes.
                  </p>
                )}
                {modoEditar && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                    El código no puede modificarse después de la creación.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Nombre del subproyecto *</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={(e) => {
                    setFormErrors([]);
                    setForm((p) => ({ ...p, nombre: e.target.value }));
                  }}
                  placeholder="Nombre del subproyecto"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={13} /> Supervisor
                </label>
                <select
                  name="supervisor"
                  value={form.supervisor}
                  onChange={(e) => setForm((p) => ({ ...p, supervisor: e.target.value }))}
                >
                  <option value="">— Seleccione supervisor (opcional) —</option>
                  {personas.map((p) => (
                    <option key={p._id} value={p._id}>
                      {`${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim() || p.nombre || 'Persona'}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="modal-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  overflow: 'visible',
                }}
              >
                <div className="form-group" style={{ overflow: 'visible' }}>
                  <label>Fecha Inicio</label>
                  <CalendarioPicker
                    value={form.fecha_inicio}
                    onChange={(fecha) =>
                      setForm((prev) => ({
                        ...prev,
                        fecha_inicio: fecha,
                      }))
                    }
                  />
                </div>

                <div className="form-group" style={{ overflow: 'visible' }}>
                  <label>Fecha Fin Estimada</label>
                  <CalendarioPicker
                    value={form.fecha_fin_estimada}
                    onChange={(fecha) =>
                      setForm((prev) => ({
                        ...prev,
                        fecha_fin_estimada: fecha,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} /> Núcleos *
                </label>

                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>
                  Selecciona uno o varios núcleos donde se ejecutará este subproyecto.
                </p>

                {nucleos.length === 0 ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#fef9c3',
                      border: '1px solid #fde68a',
                      borderRadius: 10,
                      color: '#92400e',
                      fontSize: 13,
                    }}
                  >
                    <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />
                    No hay núcleos disponibles. Asegúrate de que el proyecto tenga una zona asignada.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {nucleos.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => toggleNucleo(n._id)}
                        style={{
                          padding: '10px 14px',
                          border: `1.5px solid ${
                            nucleosSel.includes(n._id) ? '#1f8f57' : '#e6e8ef'
                          }`,
                          background: nucleosSel.includes(n._id) ? '#f0faf4' : '#fff',
                          borderRadius: 10,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: `2px solid ${
                              nucleosSel.includes(n._id) ? '#1f8f57' : '#cbd5e1'
                            }`,
                            background: nucleosSel.includes(n._id) ? '#1f8f57' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {nucleosSel.includes(n._id) && (
                            <CheckCircle2 size={10} color="#fff" strokeWidth={3} />
                          )}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                          {n.nombre}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, observaciones: e.target.value }))
                  }
                  placeholder="Observaciones opcionales..."
                  rows={3}
                />
              </div>

              <SectionHeader
                title="Asignación de actividades"
                subtitle="Puedes seleccionar actividades desde ahora. Se guardarán automáticamente después de crear o actualizar el subproyecto."
                icon={<PlusCircle size={18} />}
                tone="green"
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {modoEditar && asignaciones.length > 0 && (
                  <div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#0f172a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      ✅ Actividades asignadas
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {asignaciones.map((a) => {
                        const ap = actDisponibles.find(
                          (x) => x._id === (a.actividad_proyecto?._id ?? a.actividad_proyecto)
                        );

                        const intervInfo = normalizeIntervencion(ap?.intervencion);
                        const col = INTERVENCION_COLOR[intervInfo.key] ?? INTERVENCION_COLOR.sin_intervencion;

                        return (
                          <div
                            key={a._id}
                            style={{
                              background: '#fff',
                              border: `1.5px solid ${col.border || '#e6e8ef'}`,
                              borderRadius: 12,
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: '#0f172a',
                                }}
                              >
                                {TIPO_EMOJI[intervInfo.key] ?? '📌'} {ap?.actividad?.nombre ?? 'Actividad'}
                              </p>
                              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                                {intervInfo.label} · Asignado:{' '}
                                <strong>
                                  {a.cantidad_asignada} {ap?.actividad?.unidad_medida ?? ''}
                                </strong>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCancelarAsignacion(a._id)}
                              style={{
                                background: 'rgba(220,38,38,0.1)',
                                border: '1px solid rgba(220,38,38,0.3)',
                                color: '#dc2626',
                                width: 30,
                                height: 30,
                                borderRadius: 7,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!modoEditar && (
                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 12,
                      color: '#1d4ed8',
                      fontSize: 13,
                    }}
                  >
                    Puedes seleccionar actividades desde ahora. Se guardarán automáticamente
                    después de crear el subproyecto.
                  </div>
                )}

                {Object.entries(disponiblesPorIntervencion).map(([tipo, grupo]) => {
                  const col = INTERVENCION_COLOR[tipo] ?? INTERVENCION_COLOR.sin_intervencion;

                  return (
                    <div key={tipo}>
                      <p
                        style={{
                          margin: '0 0 10px',
                          fontSize: 13,
                          fontWeight: 700,
                          color: col.color,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {TIPO_EMOJI[tipo] ?? '📌'} {grupo.label}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {grupo.actividades.map((a) => {
                          const enBorrador = nuevasAsigs.some(
                            (n) => n.actividad_proyecto_id === a._id
                          );
                          const yaAsignada = asignaciones.some(
                            (as) =>
                              (as.actividad_proyecto?._id ?? as.actividad_proyecto) === a._id &&
                              as.estado !== 'CANCELADA'
                          );
                          const cerrada = a.estado === 'CERRADA';

                          return (
                            <div
                              key={a._id}
                              style={{
                                background: cerrada ? '#f8fafc' : '#fff',
                                border: `1.5px solid ${cerrada ? '#e2e8f0' : col.border}`,
                                borderRadius: 12,
                                padding: '12px 14px',
                                opacity: cerrada ? 0.65 : 1,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                }}
                              >
                                <div>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: '#0f172a',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                  >
                                    {cerrada && <Lock size={13} color="#64748b" />}
                                    {a.actividad?.nombre}
                                  </p>
                                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                                    {grupo.label} · {a.actividad?.codigo} · {a.actividad?.unidad_medida}
                                  </p>
                                </div>

                                {!cerrada && !yaAsignada && !enBorrador && (
                                  <button
                                    type="button"
                                    onClick={() => agregarActividad(a)}
                                    style={{
                                      background: col.bg,
                                      border: `1.5px solid ${col.border}`,
                                      color: col.color,
                                      borderRadius: 8,
                                      padding: '5px 12px',
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Plus size={12} /> Asignar
                                  </button>
                                )}

                                {(yaAsignada || enBorrador) && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      background: '#f0faf4',
                                      color: '#1f8f57',
                                      padding: '3px 10px',
                                      borderRadius: 999,
                                      fontWeight: 700,
                                      flexShrink: 0,
                                    }}
                                  >
                                    ✅ Agregada
                                  </span>
                                )}

                                {cerrada && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      background: '#fee2e2',
                                      color: '#dc2626',
                                      padding: '3px 10px',
                                      borderRadius: 999,
                                      fontWeight: 700,
                                      flexShrink: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <Lock size={10} /> Cerrada
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {nuevasAsigs.length > 0 && (
                  <div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#0f172a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      📝 Por asignar (ingresa cantidades)
                    </p>

                    <div
                      style={{
                        border: '1.5px solid #e2e8f0',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 160px 32px',
                          gap: 8,
                          padding: '8px 14px',
                          background: '#f8fafc',
                          borderBottom: '1px solid #e6e8ef',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                        }}
                      >
                        <span>Actividad</span>
                        <span>Cantidad a asignar</span>
                        <span></span>
                      </div>

                      {nuevasAsigs.map((a, i) => {
                        const disponible = a.cantidad_total - a.cantidad_asignada_global;
                        const intervLabel =
                          a.intervencion_label ??
                          INTERVENCION_LABEL[a.intervencion_key] ??
                          'Intervención';

                        return (
                          <div
                            key={i}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 160px 32px',
                              gap: 8,
                              padding: '10px 14px',
                              borderBottom:
                                i < nuevasAsigs.length - 1 ? '1px solid #f0f2f5' : 'none',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: '#0f172a',
                                }}
                              >
                                {TIPO_EMOJI[a.intervencion_key] ?? '📌'} {a.nombre}
                              </p>
                              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                                {intervLabel} · Disponible: {disponible.toFixed(2)} {a.unidad}
                              </p>
                            </div>

                            <input
                              type="number"
                              min="0.01"
                              max={disponible}
                              step="0.01"
                              placeholder={`Máx: ${disponible.toFixed(2)}`}
                              value={a.cantidad}
                              onChange={(e) => actualizarCantidad(i, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                border: '1.5px solid #e6e8ef',
                                borderRadius: 8,
                                fontSize: 13,
                              }}
                            />

                            <button
                              type="button"
                              onClick={() => quitarBorrador(i)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {actDisponibles.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '28px 20px',
                      background: '#f8fafc',
                      border: '2px dashed #e2e8f0',
                      borderRadius: 12,
                      color: '#94a3b8',
                    }}
                  >
                    <p style={{ margin: '0 0 4px', fontSize: 20 }}>📦</p>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      No hay actividades disponibles en este proyecto.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f2f5' }}>
          <ErrorBanner errors={formErrors} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                padding: '11px 20px',
                borderRadius: 10,
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: loading ? '#94a3b8' : '#1f8f57',
                color: '#fff',
                border: 'none',
                padding: '11px 24px',
                borderRadius: 10,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                boxShadow: loading ? 'none' : '0 4px 12px rgba(31,143,87,0.25)',
              }}
            >
              {loading ? 'Guardando...' : modoEditar ? 'Guardar Cambios' : 'Crear Subproyecto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubproyectoModal;