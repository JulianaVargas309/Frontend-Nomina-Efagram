import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProyectos, deleteProyecto } from "../services/proyectosService";
import { getActividadesProyecto } from "../services/subproyectosService";
import programacionService from "../../programacion/services/programacionService";
import BarraProgreso from "../../programacion/components/BarraProgreso";
import "../../../assets/styles/proyectos.css";
import ProyectoModal from "../components/ProyectoModal";
import DashboardLayout from "../../../app/layouts/DashboardLayout";
import { Eye, Pencil, Trash2, Folder, GitBranch, MapPin, TrendingUp, Search, PlusCircle, Users } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────
const fmtFecha = (iso) =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "—";

const fmtMonto = (n) =>
  n != null ? "$ " + Number(n).toLocaleString("es-CO") : null;

const ESTADO_LABEL = {
  ACTIVO: "Activo", PLANEADO: "Planeado", FINALIZADO: "Finalizado",
  SUSPENDIDO: "Suspendido", CERRADO: "Cerrado",
  EN_NEGOCIACION: "En negociación", CANCELADO: "Cancelado",
};

const INTERVENCION_LABEL = {
  establecimiento: "Establecimiento", mantenimiento: "Mantenimiento", no_programadas: "No programadas",
};

// ── Helpers de texto seguro para evitar renderizar objetos ──
const getText = (value, fallback = 'Sin dato') => {
  if (value === null || value === undefined || value === '') return fallback;

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object') {
    return String(
      value.nombre ??
      value.name ??
      value.razon_social ??
      value.nombre_comercial ??
      value.codigo ??
      value.code ??
      value.documento ??
      value.cc ??
      fallback
    );
  }

  return fallback;
};

const getCodeNameText = (value, fallback = 'Sin dato') => {
  if (value === null || value === undefined || value === '') return fallback;

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object') {
    const codigo = value.codigo ?? value.code ?? '';
    const nombre =
      value.nombre ??
      value.name ??
      value.razon_social ??
      value.nombre_comercial ??
      '';

    if (codigo && nombre) return `${codigo} - ${nombre}`;
    if (nombre) return String(nombre);
    if (codigo) return String(codigo);

    return fallback;
  }

  return fallback;
};

// ── Helpers de normalización para IDs y datos ──
const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id ?? value.id ?? value.value ?? "");
};

const normalizeList = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.programaciones)) return response.programaciones;
  if (Array.isArray(response?.contratos)) return response.contratos;
  if (Array.isArray(response)) return response;
  return [];
};

const getProyectoIdFromContrato = (contrato) => {
  return getId(
    contrato?.proyecto_id ??
    contrato?.proyecto ??
    contrato?.subproyecto?.proyecto_id ??
    contrato?.subproyecto?.proyecto
  );
};

const getContratoIdFromProgramacion = (programacion) => {
  return getId(
    programacion?.contrato_id ??
    programacion?.contrato?._id ??
    programacion?.contrato?.id ??
    programacion?.contrato
  );
};

const calcularAvanceNumerico = (programacionesDelProyecto) => {
  if (!Array.isArray(programacionesDelProyecto) || programacionesDelProyecto.length === 0) {
    return { totalProyectado: 0, totalEjecutado: 0, avance: 0 };
  }

  let totalProyectado = 0;
  let totalEjecutado = 0;

  programacionesDelProyecto.forEach((prog) => {
    totalProyectado += Number(prog.cantidad_proyectada) || 0;

    if (Array.isArray(prog.registros_diarios)) {
      prog.registros_diarios.forEach((reg) => {
        totalEjecutado += Number(reg.cantidad_ejecutada) || 0;
      });
    }
    if (Array.isArray(prog.registrosDiarios)) {
      prog.registrosDiarios.forEach((reg) => {
        totalEjecutado += Number(reg.cantidad_ejecutada) || 0;
      });
    }
    if (Array.isArray(prog.registros)) {
      prog.registros.forEach((reg) => {
        totalEjecutado += Number(reg.cantidad_ejecutada) || 0;
      });
    }
    totalEjecutado += Number(prog.cantidad_ejecutada) || 0;
  });

  const avance = totalProyectado <= 0
    ? 0
    : Math.min(Math.round((totalEjecutado / totalProyectado) * 100), 100);

  return { totalProyectado, totalEjecutado, avance };
};

// ── Componente principal ──────────────────────────────────
const ProyectosPage = () => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [programacionesPorProyecto, setProgramacionesPorProyecto] = useState({});

  // modalState = { open: bool, modo: "crear"|"editar"|"ver", proyecto: obj|null }
  const [modalState, setModalState] = useState({ open: false, modo: "crear", proyecto: null });
  const [actividadesMap, setActividadesMap] = useState({});

  const abrirCrear = () => setModalState({ open: true, modo: "crear", proyecto: null });
  const abrirVer = (p) => setModalState({ open: true, modo: "ver", proyecto: p });
  const abrirEditar = (p) => setModalState({ open: true, modo: "editar", proyecto: p });
  const cerrarModal = () => setModalState(prev => ({ ...prev, open: false }));

  // ── Helper: Calcular avance de proyecto basado en programaciones ──
  const calcularAvanceProyecto = (programacionesDelProyecto) => {
    return calcularAvanceNumerico(programacionesDelProyecto).avance;
  };

  // ── Cargar proyectos ──
  const cargarProyectos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProyectos();
      const data = normalizeList(response);
      setProyectos(data);

      // Cargar actividades de todos los proyectos para los badges
      const map = {};
      await Promise.all(data.map(async (p) => {
        try {
          const res = await getActividadesProyecto({ proyecto: p._id });
          map[p._id] = res?.data?.data ?? [];
        } catch { map[p._id] = []; }
      }));
      setActividadesMap(map);

      // ── Cargar programaciones y contratos para calcular avance dinámico ──
      try {
        const { getContratos } = await import("../../contratos/services/contratosService");
        const [programacionesRes, contratosRes] = await Promise.all([
          programacionService.getAll(),
          getContratos(),
        ]);

        const progData = normalizeList(programacionesRes);
        const contratosData = normalizeList(contratosRes);

        // Crear mapa de contratos por proyecto
        const contratosPorProyecto = {};

        contratosData.forEach((contrato) => {
          const proyectoId = getProyectoIdFromContrato(contrato);
          const contratoId = getId(contrato);

          if (!proyectoId || !contratoId) return;

          if (!contratosPorProyecto[proyectoId]) {
            contratosPorProyecto[proyectoId] = new Set();
          }

          contratosPorProyecto[proyectoId].add(String(contratoId));
        });

        // Crear mapa de programaciones por proyecto
        const progMap = {};

        data.forEach((proyecto) => {
          const proyectoId = getId(proyecto);
          const contratoIds = contratosPorProyecto[proyectoId] ?? new Set();

          progMap[proyectoId] = progData.filter((prog) => {
            const contratoId = getContratoIdFromProgramacion(prog);
            return contratoId && contratoIds.has(String(contratoId));
          });
        });

        console.log("✅ AVANCE PROYECTOS:", {
          proyectos: data.length,
          contratos: contratosData.length,
          programaciones: progData.length,
          contratosPorProyecto: Object.keys(contratosPorProyecto).length,
          progMap: Object.entries(progMap).map(([id, progs]) => ({
            proyectoId: id,
            cantidadProgramaciones: progs.length
          }))
        });

        setProgramacionesPorProyecto(progMap);
      } catch (err) {
        console.warn("⚠️ Error cargando programaciones para avance:", err);
        setProgramacionesPorProyecto({});
      }
    } catch (err) {
      console.error("Error cargando proyectos:", err);
      setError("No se pudieron cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  };

  // ── Eliminar proyecto ──
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proyecto?")) return;
    try {
      setDeletingId(id);
      await deleteProyecto(id);
      await cargarProyectos();
    } catch (err) {
      alert(err?.response?.data?.message || err?.response?.data?.error || "No se pudo eliminar el proyecto");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => { cargarProyectos(); }, []);

  // ── Stats derivadas ──
  const activos = proyectos.filter(p => p.estado?.toUpperCase() === "ACTIVO").length;
  const totalLotes = proyectos.reduce((acc, p) => acc + (p.lotes?.length ?? p.cantidad_lotes ?? 0), 0);
  const avancePromedio = proyectos.length > 0
    ? Math.round(
      proyectos.reduce((acc, p) => {
        const avanceProg = calcularAvanceProyecto(programacionesPorProyecto[p._id] || []);
        return acc + (avanceProg || p.avance || 0);
      }, 0) / proyectos.length
    )
    : 0;

  // ── Filtro búsqueda ──
  const proyectosFiltrados = proyectos.filter(p => {
    const q = busqueda.toLowerCase();
    const clienteTexto = getText(p.cliente, '').toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(q) ||
      clienteTexto.includes(q) ||
      p.codigo?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="proyectos-container">

        {/* ── STATS ── */}
        <div className="proy-stats-row">
          <div className="proy-stat-card">
            <div className="proy-stat-icon proy-stat-icon--green"><Folder size={22} /></div>
            <div>
              <p className="proy-stat-label">Proyectos Activos</p>
              <p className="proy-stat-value">{activos}</p>
            </div>
          </div>
          <div className="proy-stat-card">
            <div className="proy-stat-icon proy-stat-icon--blue"><MapPin size={22} /></div>
            <div>
              <p className="proy-stat-label">Total Lotes</p>
              <p className="proy-stat-value">{totalLotes}</p>
            </div>
          </div>
          <div className="proy-stat-card">
            <div className="proy-stat-icon proy-stat-icon--orange"><TrendingUp size={22} /></div>
            <div>
              <p className="proy-stat-label">Avance Promedio</p>
              <p className="proy-stat-value">{avancePromedio}%</p>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="proy-toolbar">
          <div className="proy-search-wrapper">
            <Search size={15} className="proy-search-icon" style={{ color: '#94a3b8' }} />
            <input
              className="proy-search-input"
              type="text"
              placeholder="Buscar proyecto o cliente..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <button className="btn-crear" onClick={abrirCrear} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <PlusCircle size={16} /> Nuevo Proyecto
          </button>
        </div>

        {/* ── ESTADOS ── */}
        {loading && <p className="proy-msg">Cargando proyectos...</p>}
        {error && <p className="proy-msg proy-msg--error">{error}</p>}
        {!loading && proyectosFiltrados.length === 0 && (
          <p className="proy-msg">No hay proyectos registrados.</p>
        )}

        {/* ── GRID DE CARDS ── */}
        <div className="proy-cards-grid">
          {proyectosFiltrados.map(proyecto => {
            const estado = proyecto.estado?.toUpperCase();
            const avance = proyecto.avance ?? 0;

            // Agrupar actividades por intervención desde actividadesMap
            const actsProyecto = actividadesMap[proyecto._id] ?? [];
            const intervByObj = actsProyecto.reduce((acc, a) => {
              const id = a.intervencion?._id ?? a.intervencion ?? "sin_tipo";
              const nombre = getText(a.intervencion, id);
              if (!acc[id]) acc[id] = { nombre, acts: [], monto: 0, cantidad: 0 };
              acc[id].acts.push(a);
              acc[id].monto += (a.precio_unitario || 0) * (Number(a.cantidad_total ?? a.cantidad) || 0);
              acc[id].cantidad += Number(a.cantidad_total ?? a.cantidad) || 0;
              return acc;
            }, {});
            const intervOld = actsProyecto.length === 0
              ? Object.entries(proyecto.actividades_por_intervencion ?? {}).filter(([, arr]) => Array.isArray(arr) && arr.length > 0)
              : [];
            const presupuesto = proyecto.presupuesto_por_intervencion ?? {};
            const intervenciones = Object.values(intervByObj);

            const totalActividades = proyecto.total_actividades ??
              (actsProyecto.length || intervOld.reduce((acc, [, arr]) => acc + arr.length, 0));

            const totalProyecto =
              Number(proyecto.total_proyecto) > 0 ? proyecto.total_proyecto :
                Number(proyecto.valor_total) > 0 ? proyecto.valor_total :
                  (intervenciones.reduce((acc, iv) => acc + (iv.monto || 0), 0) ||
                    Object.values(presupuesto).reduce((acc, p) => acc + (p?.monto_presupuestado || 0), 0)) ||
                  0;

            return (
              <div key={proyecto._id} className="proy-card">

                {/* Cabecera */}
                <div className="proy-card-header">
                  <div className="proy-card-icon-wrap">
                    <Folder size={20} color="#1f8f57" />
                  </div>
                  <div className="proy-card-title-block">
                    <h3 className="proy-card-nombre">{proyecto.nombre}</h3>
                    <p className="proy-card-cliente">
                      {getText(proyecto.cliente, "Sin cliente")}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, fontSize: 13, color: '#475569' }}>
                      <span>Total actividades: <strong>{totalActividades ?? 0}</strong></span>
                      <span>Total proyecto: <strong>{fmtMonto(totalProyecto) ?? '—'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6, fontSize: 12, color: '#64748b' }}>
                      {proyecto.zona ? (
                        <span>Zona: {getCodeNameText(proyecto.zona, 'Sin zona')}</span>
                      ) : null}
                      {proyecto.responsable ? (
                        <span>Responsable: {getText(proyecto.responsable)}</span>
                      ) : null}
                    </div>
                  </div>
                  <span className={`proy-estado-chip proy-estado-chip--${estado?.toLowerCase()}`}>
                    {ESTADO_LABEL[estado] ?? proyecto.estado}
                  </span>
                </div>

                {/* Barra de avance dinámica basada en programaciones */}
                {
                  (() => {
                    const proyectoId = getId(proyecto);
                    const programacionesProyecto = programacionesPorProyecto[proyectoId] || [];
                    const totales = calcularAvanceNumerico(programacionesProyecto);

                    const avanceTotal = programacionesProyecto.length > 0
                      ? totales.avance
                      : Number(proyecto.avance) || 0;

                    const totalEjecutado = programacionesProyecto.length > 0
                      ? totales.totalEjecutado
                      : Number(proyecto.cantidad_ejecutada_total ?? proyecto.total_ejecutado) || 0;

                    const totalProyectado = programacionesProyecto.length > 0
                      ? totales.totalProyectado
                      : Number(proyecto.cantidad_proyectada_total ?? proyecto.total_proyectado) || 0;

                    const hasProgramaciones = programacionesProyecto.length > 0;

                    return (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                            Avance {hasProgramaciones ? `(${programacionesProyecto.length} programaciones)` : '(manual)'}
                          </span>
                          <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: avanceTotal >= 75 ? '#10b981' : avanceTotal >= 50 ? '#3b82f6' : '#ef4444',
                          }}>
                            {avanceTotal}%
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                          <span>Proyectado: <strong>{Number(totalProyectado).toLocaleString('es-CO')}</strong></span>
                          <span>Ejecutado: <strong>{Number(totalEjecutado).toLocaleString('es-CO')}</strong></span>
                        </div>
                        <BarraProgreso
                          porcentaje={avanceTotal}
                          cantidad={totalEjecutado}
                          cantidadProyectada={totalProyectado}
                          showLabel={false}
                          className="proyecto-barra-progreso"
                        />
                      </div>
                    );
                  })()
                }

                {/* Chips de intervenciones */}
                {intervenciones.length > 0 && (
                  <div className="proy-intervenciones">
                    {intervenciones.map((iv) => (
                      <span key={iv.nombre} className="proy-interv-chip">
                        🌿 {iv.nombre}&nbsp;
                        <strong>{iv.cantidad || 0}</strong>
                      </span>
                    ))}
                    {intervOld.map(([tipo, acts]) => {
                      const monto = presupuesto[tipo]?.monto_presupuestado;
                      return (
                        <span key={tipo} className="proy-interv-chip">
                          🌿 {INTERVENCION_LABEL[tipo] ?? tipo}&nbsp;
                          <strong>{acts.length}</strong>
                          {fmtMonto(monto) && <>&nbsp;{fmtMonto(monto)}</>}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Valor total */}
                {proyecto.valor_total != null && (
                  <p className="proy-valor-total">
                    Valor total: <strong>{fmtMonto(proyecto.valor_total)}</strong>
                  </p>
                )}

                {/* Cuadrillas y lotes */}
                <div className="proy-meta-row">
                  {proyecto.cuadrillas != null && (
                    <span className="proy-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} /> {proyecto.cuadrillas} cuadrilla{proyecto.cuadrillas !== 1 ? "s" : ""}
                    </span>
                  )}
                  {(proyecto.lotes?.length ?? proyecto.cantidad_lotes) ? (
                    <span className="proy-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {proyecto.lotes?.length ?? proyecto.cantidad_lotes} lote
                      {(proyecto.lotes?.length ?? proyecto.cantidad_lotes) !== 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>

                {/* Footer */}
                <div className="proy-card-footer">
                  <span className="proy-fechas">
                    {fmtFecha(proyecto.fecha_inicio)} — {fmtFecha(proyecto.fecha_fin_estimada)}
                  </span>
                  <div className="proy-acciones">

                    {/* IR A SUBPROYECTOS */}
                    <button
                      className="proy-btn-accion"
                      title="Subproyectos"
                      onClick={() => navigate(`/proyectos/subproyectos?proyecto=${proyecto._id}`)}
                      style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}
                    >
                      <GitBranch size={15} />
                    </button>

                    {/* VER DETALLE */}
                    <button
                      className="proy-btn-accion proy-btn-accion--view"
                      title="Ver detalle"
                      onClick={() => abrirVer(proyecto)}
                    >
                      <Eye size={16} />
                    </button>

                    {/* EDITAR */}
                    <button
                      className="proy-btn-accion proy-btn-accion--edit"
                      title="Editar"
                      onClick={() => abrirEditar(proyecto)}
                    >
                      <Pencil size={16} />
                    </button>

                    {/* ELIMINAR */}
                    <button
                      className="proy-btn-accion proy-btn-accion--delete"
                      title="Eliminar"
                      onClick={() => handleDelete(proyecto._id)}
                      disabled={deletingId === proyecto._id}
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MODAL ÚNICO (maneja crear / editar / ver) ── */}
        <ProyectoModal
          isOpen={modalState.open}
          onClose={() => {
            setModalState({ open: false, proyecto: null, modo: "crear" });
          }}
          onSuccess={() => {
            cargarProyectos();
            setModalState({ open: false, proyecto: null, modo: "crear" });
          }}
          proyecto={modalState.proyecto}
          modo={modalState.modo}
          proyectosActuales={proyectos}
        />

      </div>
    </DashboardLayout>
  );
};

export default ProyectosPage;