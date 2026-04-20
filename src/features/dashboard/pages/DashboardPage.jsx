import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import '../dashboard.css';
import StatCard from '../components/StatCard';
import QuickActions from '../components/QuickActions';
import ActivityList from '../components/ActivityList';
import { Users, Folder, CalendarDays, MapPin } from "lucide-react";
import reportesService from '../../reportes/services/reportes.service';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getNested(obj, paths, fallback = undefined) {
  for (const path of paths) {
    const value = path.split('.').reduce((acc, key) => acc?.[key], obj);
    if (value !== undefined && value !== null) return value;
  }
  return fallback;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoadingDashboard(true);
        const response = await reportesService.getDashboard();

        if (!mounted) return;

        setDashboardData(response);
      } catch (error) {
        console.error('Error cargando dashboard:', error);
        if (mounted) {
          setDashboardData(null);
        }
      } finally {
        if (mounted) {
          setLoadingDashboard(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const personalActivo = getNested(dashboardData, [
      'data.personalActivo',
      'data.personal_activo',
      'personalActivo',
      'personal_activo',
      'resumen.personalActivo',
      'resumen.personal_activo',
      'estadisticas.personalActivo',
      'estadisticas.personal_activo',
      'totales.personalActivo',
      'totales.personal_activo',
    ], 148);

    const proyectosCurso = getNested(dashboardData, [
      'data.proyectosEnCurso',
      'data.proyectos_en_curso',
      'proyectosEnCurso',
      'proyectos_en_curso',
      'resumen.proyectosEnCurso',
      'resumen.proyectos_en_curso',
      'estadisticas.proyectosEnCurso',
      'estadisticas.proyectos_en_curso',
      'totales.proyectosEnCurso',
      'totales.proyectos_en_curso',
    ], 23);

    const semanasRegistradas = getNested(dashboardData, [
      'data.semanasRegistradas',
      'data.semanas_registradas',
      'semanasRegistradas',
      'semanas_registradas',
      'resumen.semanasRegistradas',
      'resumen.semanas_registradas',
      'estadisticas.semanasRegistradas',
      'estadisticas.semanas_registradas',
      'totales.semanasRegistradas',
      'totales.semanas_registradas',
    ], 47);

    const zonasTerritoriales = getNested(dashboardData, [
      'data.zonasTerritoriales',
      'data.zonas_territoriales',
      'zonasTerritoriales',
      'zonas_territoriales',
      'resumen.zonasTerritoriales',
      'resumen.zonas_territoriales',
      'estadisticas.zonasTerritoriales',
      'estadisticas.zonas_territoriales',
      'totales.zonasTerritoriales',
      'totales.zonas_territoriales',
    ], 12);

    return {
      personalActivo: toNumber(personalActivo, 148),
      proyectosCurso: toNumber(proyectosCurso, 23),
      semanasRegistradas: toNumber(semanasRegistradas, 47),
      zonasTerritoriales: toNumber(zonasTerritoriales, 12),
    };
  }, [dashboardData]);

  const recentActivities = useMemo(() => {
    const actividades = getNested(dashboardData, [
      'data.actividadReciente',
      'data.actividad_reciente',
      'data.actividadesRecientes',
      'data.actividades_recientes',
      'actividadReciente',
      'actividad_reciente',
      'actividadesRecientes',
      'actividades_recientes',
      'resumen.actividadReciente',
      'resumen.actividad_reciente',
      'resumen.actividadesRecientes',
      'resumen.actividades_recientes',
    ], []);

    return Array.isArray(actividades) ? actividades : [];
  }, [dashboardData]);

  return (
    <DashboardLayout>
      <div className="dashboard-grid">
        <div className="stats-row">
          <StatCard
            title="Personal Activo"
            value={stats.personalActivo}
            change="+12"
            icon={Users}
          />

          <StatCard
            title="Proyectos en Curso"
            value={stats.proyectosCurso}
            change="+3"
            icon={Folder}
          />

          <StatCard
            title="Semanas Registradas"
            value={stats.semanasRegistradas}
            change="+1"
            icon={CalendarDays}
          />

          <StatCard
            title="Zonas Territoriales"
            value={stats.zonasTerritoriales}
            icon={MapPin}
          />
        </div>

        <div className="dashboard-columns">
          <QuickActions />
          <ActivityList
            activities={recentActivities}
            loading={loadingDashboard}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}