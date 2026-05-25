// ===============================================================
// EJEMPLO DE INTEGRACIÓN - BARRA DE PROGRESO CASCADA
// ===============================================================
// Ubicación: src/features/proyectos/pages/ProyectosPage.jsx
// ===============================================================

import React, { useState } from 'react';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import ProjectProgressList from '../components/ProjectProgressList';
import ProjectDetailProgress from '../components/ProjectDetailProgress';

/**
 * Ejemplo de integración de componentes de progreso
 * Muestra cómo usar ProjectProgressList y ProjectDetailProgress
 */
const ProyectosPageWithProgress = () => {
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  return (
    <DashboardLayout>
      <div style={{ padding: '24px' }}>
        {selectedProjectId ? (
          // Vista detallada de un proyecto
          <ProjectDetailProgress
            projectId={selectedProjectId}
            onBack={() => setSelectedProjectId(null)}
          />
        ) : (
          // Vista lista de todos los proyectos
          <ProjectProgressList
            onSelectProject={(projectId) => setSelectedProjectId(projectId)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProyectosPageWithProgress;

// ===============================================================
// ALTERNATE: Mostrar lado a lado (en pantallas grandes)
// ===============================================================

/**
 * Versión de dos columnas
 */
const ProyectosPageSideBySide = () => {
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  return (
    <DashboardLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '24px' }}>
        {/* Columna izquierda: Lista */}
        <div>
          <ProjectProgressList
            onSelectProject={(projectId) => setSelectedProjectId(projectId)}
          />
        </div>

        {/* Columna derecha: Detalles */}
        {selectedProjectId && (
          <div>
            <ProjectDetailProgress
              projectId={selectedProjectId}
              onBack={() => setSelectedProjectId(null)}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// ===============================================================
// USO EN COMPONENTES EXISTENTES
// ===============================================================

/**
 * Para agregar a una página existente, importa y usa:
 * 
 * import ProgressBar from '../components/ProgressBar';
 * 
 * <ProgressBar
 *   porcentaje={75}
 *   estado="EN_PROGRESO"
 *   label="Mi Proyecto"
 *   showDetails
 *   completados={3}
 *   total={4}
 * />
 */
