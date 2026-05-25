import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard, BarChart3, Play, Folder,
    Users, CheckSquare, ChevronDown, Layers, Building,
    AlertTriangle, Calendar, Clock,
    Settings, MapPin, Wrench, GitBranch, FileText, Activity, Briefcase, LogOut
} from "lucide-react";
import { useAuth } from "../../app/providers/useAuth";
import { getContratos } from "../../features/contratos/services/contratosService";
import "./sidebar.css";

const SIDEBAR_SCROLL_KEY = "efagram_sidebar_scroll_top";
const SIDEBAR_STATE_KEY = "efagram_sidebar_state";

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);
    const { user, logout } = useAuth();
    const [contratosPendientes, setContratosPendientes] = useState(0);

    const handleLogout = async () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            await logout();
            navigate('/login', { replace: true });
        }
    };

    // ✅ Cargar contador de contratos pendientes
    useEffect(() => {
        const cargarPendientes = async () => {
            try {
                const res = await getContratos();
                const lista = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
                const pendientes = lista.filter(c => c.estado === 'PENDIENTE').length;
                setContratosPendientes(pendientes);
            } catch (error) {
                console.error('Error al cargar contratos pendientes:', error);
                setContratosPendientes(0);
            }
        };

        cargarPendientes();
        // Recargar cada 30 segundos para mantener actualizado
        const interval = setInterval(cargarPendientes, 30000);
        return () => clearInterval(interval);
    }, []);

    const isEjecucion = location.pathname.startsWith("/ejecucion");
    const isProyectos = location.pathname.startsWith("/proyectos");
    const isProgramacion = location.pathname.startsWith("/programacion");
    const isPersonal = location.pathname.startsWith("/personal");
    const isConfiguracion = location.pathname.startsWith("/configuracion");
    const isReportes = location.pathname.startsWith("/reportes");

    const getInitialSidebarState = () => {
        try {
            const saved = sessionStorage.getItem(SIDEBAR_STATE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    manualEjecucion: parsed.manualEjecucion ?? null,
                    manualProyectos: parsed.manualProyectos ?? null,
                    manualPersonal: parsed.manualPersonal ?? null,
                    manualConfiguracion: parsed.manualConfiguracion ?? null,
                    openReportes: parsed.openReportes ?? false,
                    openUbicacion:
                        parsed.openUbicacion ??
                        location.pathname.startsWith("/configuracion/ubicacion"),
                };
            }
        } catch (error) {
            console.error("No se pudo leer el estado del sidebar:", error);
        }

        return {
            manualEjecucion: null,
            manualProyectos: null,
            manualPersonal: null,
            manualConfiguracion: null,
            openReportes: false,
            openUbicacion: location.pathname.startsWith("/configuracion/ubicacion"),
        };
    };

    const initialState = getInitialSidebarState();

    const [manualEjecucion, setManualEjecucion] = useState(initialState.manualEjecucion);
    const [manualProyectos, setManualProyectos] = useState(initialState.manualProyectos);
    const [manualPersonal, setManualPersonal] = useState(initialState.manualPersonal);
    const [manualConfiguracion, setManualConfiguracion] = useState(initialState.manualConfiguracion);
    const [openReportes, setOpenReportes] = useState(initialState.openReportes);
    const [openUbicacion, setOpenUbicacion] = useState(initialState.openUbicacion);

    const openEjecucion = manualEjecucion !== null ? manualEjecucion : isEjecucion;
    const openProyectos = manualProyectos !== null ? manualProyectos : isProyectos;
    const openPersonal = manualPersonal !== null ? manualPersonal : isPersonal;
    const openConfiguracion = manualConfiguracion !== null ? manualConfiguracion : isConfiguracion;

    const toggleEjecucion = () => setManualEjecucion((prev) => !(prev !== null ? prev : isEjecucion));
    const toggleProyectos = () => setManualProyectos((prev) => !(prev !== null ? prev : isProyectos));
    const togglePersonal = () => setManualPersonal((prev) => !(prev !== null ? prev : isPersonal));
    const toggleConfiguracion = () => setManualConfiguracion((prev) => !(prev !== null ? prev : isConfiguracion));

    const isActive = (path) => location.pathname === path;
    const isActiveSub = (path) => location.pathname === path ? "submenu-active" : "";

    const saveSidebarScroll = () => {
        const el = sidebarRef.current;
        if (!el) return;
        sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(el.scrollTop));
    };

    const navigatePreservingSidebar = (path) => {
        saveSidebarScroll();
        navigate(path);
    };

    useEffect(() => {
        try {
            sessionStorage.setItem(
                SIDEBAR_STATE_KEY,
                JSON.stringify({
                    manualEjecucion,
                    manualProyectos,
                    manualPersonal,
                    manualConfiguracion,
                    openReportes,
                    openUbicacion,
                })
            );
        } catch (error) {
            console.error("No se pudo guardar el estado del sidebar:", error);
        }
    }, [manualEjecucion, manualProyectos, manualPersonal, manualConfiguracion, openReportes, openUbicacion]);

    useLayoutEffect(() => {
        const el = sidebarRef.current;
        if (!el) return;

        const savedScroll = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
        if (savedScroll !== null) {
            el.scrollTop = Number(savedScroll) || 0;
        }
    }, [location.pathname]);

    useEffect(() => {
        const el = sidebarRef.current;
        if (!el) return;

        const handleScroll = () => {
            sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(el.scrollTop));
        };

        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (location.pathname.startsWith("/configuracion/ubicacion")) {
            setManualConfiguracion(true);
            setOpenUbicacion(true);
        }
    }, [location.pathname]);

    return (
        <aside className="sidebar" ref={sidebarRef}>

            <div className="sidebar-header">
                <div className="logo-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 3C21 3 13 3 8 8c-3.5 3.5-4 9-4 9s5.5-.5 9-4c1.2-1.2 2.1-2.6 2.7-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 21c2-2 4-6 5-9" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
                <div><h2>EFAGRAM S.A.S</h2><p>Sistema de Gestión</p></div>
            </div>

            <hr />

            <div className="sidebar-menu">

                <div className="menu-title">General</div>

                <div
                    className={`menu-item ${isActive("/") ? "active" : ""}`}
                    onClick={() => navigatePreservingSidebar("/")}
                >
                    <LayoutDashboard size={18} /><span>Dashboard</span>
                </div>

                <div className="menu-title">Módulos</div>

                <div
                    className={`menu-item ${isReportes ? "active" : ""}`}
                    onClick={() => setOpenReportes((prev) => !prev)}
                >
                    <BarChart3 size={18} /><span>Reportes</span>
                    <ChevronDown size={16} className={`arrow ${openReportes ? "rotate" : ""}`} />
                </div>
                {openReportes && (
                    <div className="submenu">
                        <div
                            className={`submenu-item ${isActiveSub("/reportes")}`}
                            onClick={() => navigatePreservingSidebar("/reportes")}
                        >
                            <BarChart3 size={16} />Reporte General
                        </div>
                    </div>
                )}

                <div
                    className={`menu-item ${isEjecucion ? "active" : ""}`}
                    onClick={toggleEjecucion}
                >
                    <Play size={18} /><span>Ejecución</span>
                    <ChevronDown size={16} className={`arrow ${openEjecucion ? "rotate" : ""}`} />
                </div>
                {openEjecucion && (
                    <div className="submenu">
                        <div
                            className={`submenu-item ${isActiveSub("/ejecucion/novedades")}`}
                            onClick={() => navigatePreservingSidebar("/ejecucion/novedades")}
                        >
                            <AlertTriangle size={16} />Novedades
                        </div>


                    </div>
                )}

                <div
                    className={`menu-item ${isProgramacion ? "active" : ""}`}
                    onClick={() => navigatePreservingSidebar("/programacion")}
                >
                    <Activity size={18} /><span>Programación</span>
                </div>

                <div
                    className={`menu-item ${isProyectos ? "active" : ""}`}
                    onClick={toggleProyectos}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Folder size={18} /><span>Proyectos</span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {contratosPendientes > 0 && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                }}
                                title={`${contratosPendientes} contratos por aprobar`}
                            >
                                {contratosPendientes > 99 ? '99+' : contratosPendientes}
                            </span>
                        )}
                        <ChevronDown size={16} className={`arrow ${openProyectos ? "rotate" : ""}`} />
                    </div>
                </div>
                {openProyectos && (
                    <div className="submenu">
                        <div
                            className={`submenu-item ${isActiveSub("/proyectos")}`}
                            onClick={() => navigatePreservingSidebar("/proyectos")}
                        >
                            <Folder size={16} />Proyectos
                        </div>
                        <div
                            className={`submenu-item ${isActiveSub("/proyectos/subproyectos")}`}
                            onClick={() => navigatePreservingSidebar("/proyectos/subproyectos")}
                        >
                            <GitBranch size={16} />Subproyectos
                        </div>
                        <div
                            className={`submenu-item ${isActiveSub("/proyectos/contratos")}`}
                            onClick={() => navigatePreservingSidebar("/proyectos/contratos")}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={16} />Contratos
                            </span>
                            {contratosPendientes > 0 && (
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        background: '#fbbf24',
                                        color: '#78350f',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                    }}
                                    title={`${contratosPendientes} contratos por aprobar`}
                                >
                                    {contratosPendientes > 99 ? '99+' : contratosPendientes}
                                </span>
                            )}
                        </div>
                        <div
                            className={`submenu-item ${isActiveSub("/proyectos/contratos/por-aprobar")}`}
                            onClick={() => navigatePreservingSidebar("/proyectos/contratos/por-aprobar")}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Clock size={16} />Por Aprobar
                            </span>
                            {contratosPendientes > 0 && (
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        background: '#ef4444',
                                        color: '#fff',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                    }}
                                >
                                    {contratosPendientes > 99 ? '99+' : contratosPendientes}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div
                    className={`menu-item ${isPersonal ? "active" : ""}`}
                    onClick={togglePersonal}
                >
                    <Users size={18} /><span>Personal</span>
                    <ChevronDown size={16} className={`arrow ${openPersonal ? "rotate" : ""}`} />
                </div>
                {openPersonal && (
                    <div className="submenu">
                        <div
                            className={`submenu-item ${isActiveSub("/personal/catalogo")}`}
                            onClick={() => navigatePreservingSidebar("/personal/catalogo")}
                        >
                            <Users size={16} />Catálogo personal
                        </div>
                    </div>
                )}

                <div className="menu-title">Sistema</div>

                <div
                    className={`menu-item ${isConfiguracion ? "active" : ""}`}
                    onClick={toggleConfiguracion}
                >
                    <Settings size={18} /><span>Configuración</span>
                    <ChevronDown size={16} className={`arrow ${openConfiguracion ? "rotate" : ""}`} />
                </div>

                {openConfiguracion && (
                    <div className="submenu">

                        <div
                            className={`submenu-item ${isActiveSub("/configuracion/catalogo-clientes")}`}
                            onClick={() => navigatePreservingSidebar("/configuracion/catalogo-clientes")}
                        >
                            <Users size={16} />Catálogo Clientes
                        </div>

                        <div
                            className={`submenu-item ${isActiveSub("/configuracion/catalogo-usuarios")}`}
                            onClick={() => navigatePreservingSidebar("/configuracion/catalogo-usuarios")}
                        >
                            <Users size={16} />Catálogo Usuarios
                        </div>

                        <div
                            className={`submenu-item ${isActiveSub("/configuracion/catalogo-procesos")}`}
                            onClick={() => navigatePreservingSidebar("/configuracion/catalogo-procesos")}
                        >
                            <Layers size={16} />Catálogo Procesos
                        </div>

                        <div
                            className={`submenu-item ${isActiveSub("/configuracion/catalogo-cargos")}`}
                            onClick={() => navigatePreservingSidebar("/configuracion/catalogo-cargos")}
                        >
                            <Briefcase size={16} />Catálogo Cargos
                        </div>

                        <div
                            className={`submenu-item ${isActiveSub("/configuracion/catalogo-intervenciones")}`}
                            onClick={() => navigatePreservingSidebar("/configuracion/catalogo-intervenciones")}
                        >
                            <Wrench size={16} />Catálogo Intervenciones
                        </div>

                        <div
                            className={`submenu-item ${isActiveSub("/configuracion/catalogo-actividades")}`}
                            onClick={() => navigatePreservingSidebar("/configuracion/catalogo-actividades")}
                        >
                            <CheckSquare size={16} />Catálogo Actividades
                        </div>

                        <div
                            className="submenu-item submenu-group"
                            onClick={() => setOpenUbicacion((prev) => !prev)}
                        >
                            <MapPin size={16} />
                            <span>Ubicación</span>
                            <ChevronDown size={13} className={`arrow arrow-sub ${openUbicacion ? "rotate" : ""}`} />
                        </div>

                        {openUbicacion && (
                            <div className="submenu submenu-nested">
                                <div
                                    className={`submenu-item ${isActiveSub("/configuracion/ubicacion/zonas")}`}
                                    onClick={() => navigatePreservingSidebar("/configuracion/ubicacion/zonas")}
                                >
                                    <MapPin size={14} />Zonas
                                </div>
                                <div
                                    className={`submenu-item ${isActiveSub("/configuracion/ubicacion/nucleos")}`}
                                    onClick={() => navigatePreservingSidebar("/configuracion/ubicacion/nucleos")}
                                >
                                    <Layers size={14} />Núcleos
                                </div>
                                <div
                                    className={`submenu-item ${isActiveSub("/configuracion/ubicacion/fincas")}`}
                                    onClick={() => navigatePreservingSidebar("/configuracion/ubicacion/fincas")}
                                >
                                    <Building size={14} />Fincas
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div className="user-avatar">{user?.nombre?.[0]?.toUpperCase() || 'U'}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.nombre || 'Usuario'}
                        </strong>
                        <span style={{ display: 'block', fontSize: 11, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.rol || 'usuario'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = '#f87171';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                    }}
                >
                    <LogOut size={18} />
                </button>
            </div>

        </aside>
    );
}