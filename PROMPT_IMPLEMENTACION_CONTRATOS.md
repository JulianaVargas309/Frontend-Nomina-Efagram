# 🚀 PROMPT: Implementación del Sistema de Aprobación de Contratos

## Para el Desarrollador

```
CONTEXTO:
Estoy implementando un sistema de aprobación de contratos en EFAGRAM Nómina.
Los contratos deben crearse en estado PENDIENTE, esperando que el Jefe de Operaciones 
los apruebe (cambie a ACTIVO) o rechace (cambie a CANCELADO).

El problema actual es que el frontend modifica el estado en memoria después de recibir 
la respuesta, pero eso no se guarda en la BD.

OBJETIVO:
✅ Los contratos se crean siempre con estado PENDIENTE (en la BD)
✅ Hay una página dedicada "Por Aprobar" para gestionar aprobaciones
✅ El Jefe ve badges de notificación en el menú
✅ Se pueden APROBAR o RECHAZAR con un click
✅ No se modifica el estado en memoria

ALCANCE:
- Solo modificar archivos del frontend
- Los cambios en backend ya están listos
- Mantener compatibilidad con funciones existentes
```

---

## 📋 CAMBIOS A IMPLEMENTAR

### **CAMBIO 1: Limpiar el Service (contratosService.js)**

**Archivo:** `src/features/contratos/services/contratosService.js`

**Ubicación:** Función `createContrato` (líneas ~11-20)

**Antes:**
```javascript
export const createContrato = async (data) => {
  const response = await httpClient.post('/contratos', data);
  // ❌ MALO: Modifica la respuesta en memoria
  if (response?.data) {
    response.data.estado = 'PENDIENTE';
  }
  return response.data;
};
```

**Después:**
```javascript
export const createContrato = async (data) => {
  const response = await httpClient.post('/contratos', data);
  // ✅ CORRECTO: Retorna tal como viene del servidor
  return response.data;
};
```

**Por qué:**
- El backend ya garantiza que se crea con PENDIENTE
- No debemos modificar respuestas en memoria
- Esto es más limpio y mantenible

**Acción:** REMOVER las 3 líneas de modificación

---

### **CAMBIO 2: Actualizar el Payload del Modal (ContratoModal.jsx)**

**Archivo:** `src/features/contratos/components/ContratoModal.jsx`

**Ubicación:** Función `handleSave`, sección de payload (líneas ~732-745)

**Antes:**
```javascript
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
  observaciones: String(form.observaciones ?? '').trim(),
  estado: modo === 'crear' ? 'ACTIVO' : form.estado,  // ❌ Envía ACTIVO
};
```

**Después:**
```javascript
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
  observaciones: String(form.observaciones ?? '').trim(),
  // ✅ NO incluir estado en creación
};

// ✅ Solo agregar estado si estamos editando
if (modo === 'editar') {
  payload.estado = form.estado;
}
```

**Por qué:**
- En creación, queremos que el backend aplique el default (PENDIENTE)
- En edición, el usuario puede cambiar el estado
- Separa claramente los dos casos

**Acciones:**
1. REMOVER la línea `estado: modo === 'crear' ? 'ACTIVO' : form.estado,`
2. AGREGAR al final la condicional `if (modo === 'editar')`

---

### **CAMBIO 3: Crear Nueva Página (ContratosPorAprobarPage.jsx)**

**Archivo:** `src/features/contratos/pages/ContratosPorAprobarPage.jsx` (NUEVO)

**Descripción:** Página donde el Jefe aprueba/rechaza contratos

**Funcionalidades:**
- ✅ Mostrar solo contratos PENDIENTE
- ✅ Tabla con: Código, Finca, Lotes, Actividades, Cuadrillas, Fecha inicio
- ✅ Búsqueda por código/finca/cuadrilla
- ✅ Botones: Ver detalle, APROBAR, RECHAZAR
- ✅ Confirmación antes de aprobar/rechazar
- ✅ Recargar listado después de cada acción

**Estructura básica:**
```javascript
import { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import ContratoModal from '../components/ContratoModal';
import { getContratos, updateContrato } from '../services/contratosService';

export default function ContratosPorAprobarPage() {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, contrato: null });

  // Cargar contratos PENDIENTE
  const cargar = async () => {
    const res = await getContratos();
    const pendientes = normalizeList(res).filter(c => c.estado === 'PENDIENTE');
    setContratos(pendientes);
  };

  // APROBAR: cambiar a ACTIVO
  const handleAprobar = async (c) => {
    if (!window.confirm(`¿Aprobar "${c.codigo}"?`)) return;
    await updateContrato(c._id, { estado: 'ACTIVO' });
    await cargar();
  };

  // RECHAZAR: cambiar a CANCELADO
  const handleRechazar = async (c) => {
    if (!window.confirm(`¿Rechazar "${c.codigo}"?`)) return;
    await updateContrato(c._id, { estado: 'CANCELADO' });
    await cargar();
  };

  // Renderizar tabla con botones de acción
  // ...
}
```

**Acciones:**
- CREAR archivo nuevo con el código completo (ver archivo de documentación)

---

### **CAMBIO 4: Agregar Ruta (AppRouter.jsx)**

**Archivo:** `src/app/routes/AppRouter.jsx`

**Ubicación:** Después de la ruta de Contratos (línea ~56)

**Antes:**
```javascript
import ContratosPage from '../../features/contratos/pages/ContratosPage';

// ... más imports y rutas ...

<Route path="/proyectos/contratos" element={<PrivateRoute><ContratosPage /></PrivateRoute>} />
```

**Después:**
```javascript
import ContratosPage from '../../features/contratos/pages/ContratosPage';
import ContratosPorAprobarPage from '../../features/contratos/pages/ContratosPorAprobarPage';

// ... más imports y rutas ...

<Route path="/proyectos/contratos" element={<PrivateRoute><ContratosPage /></PrivateRoute>} />
<Route path="/proyectos/contratos/por-aprobar" element={<PrivateRoute><ContratosPorAprobarPage /></PrivateRoute>} />
```

**Acciones:**
1. AGREGAR import de `ContratosPorAprobarPage`
2. AGREGAR Route para la nueva página

---

### **CAMBIO 5: Actualizar Menú Sidebar (Sidebar.jsx)**

**Archivo:** `src/shared/components/Sidebar.jsx`

**5a) Agregar import:**

**Ubicación:** Líneas 1-11 (imports)

```javascript
// AGREGAR esta línea
import { getContratos } from "../../features/contratos/services/contratosService";
```

**5b) Agregar estado para contador:**

**Ubicación:** Función `Sidebar`, línea ~22

```javascript
// AGREGAR esta línea
const [contratosPendientes, setContratosPendientes] = useState(0);
```

**5c) Agregar useEffect para cargar contador:**

**Ubicación:** Después de `handleLogout` (línea ~30-50)

```javascript
// AGREGAR este useEffect completo
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
  // Recargar cada 30 segundos
  const interval = setInterval(cargarPendientes, 30000);
  return () => clearInterval(interval);
}, []);
```

**5d) Mostrar badge en menú "Proyectos":**

**Ubicación:** Menú item "Proyectos" (línea ~240-250)

**ANTES:**
```javascript
<div
    className={`menu-item ${isProyectos ? "active" : ""}`}
    onClick={toggleProyectos}
>
    <Folder size={18} /><span>Proyectos</span>
    <ChevronDown size={16} className={`arrow ${openProyectos ? "rotate" : ""}`} />
</div>
```

**DESPUÉS:**
```javascript
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
            >
                {contratosPendientes > 99 ? '99+' : contratosPendientes}
            </span>
        )}
        <ChevronDown size={16} className={`arrow ${openProyectos ? "rotate" : ""}`} />
    </div>
</div>
```

**5e) Mostrar badge en submenu "Contratos":**

**Ubicación:** Dentro del submenu de Proyectos (línea ~265-275)

**ANTES:**
```javascript
<div
    className={`submenu-item ${isActiveSub("/proyectos/contratos")}`}
    onClick={() => navigatePreservingSidebar("/proyectos/contratos")}
>
    <FileText size={16} />Contratos
</div>
```

**DESPUÉS:**
```javascript
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
        >
            {contratosPendientes > 99 ? '99+' : contratosPendientes}
        </span>
    )}
</div>
```

**5f) AGREGAR nuevo item "Por Aprobar":**

**Ubicación:** Después del item "Contratos" en el submenu

```javascript
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
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] **CAMBIO 1:** Limpiar service (remover 3 líneas)
- [ ] **CAMBIO 2:** Actualizar payload en Modal (remover línea + agregar condicional)
- [ ] **CAMBIO 3:** Crear nueva página `ContratosPorAprobarPage.jsx`
- [ ] **CAMBIO 4:** Agregar ruta en `AppRouter.jsx` (import + Route)
- [ ] **CAMBIO 5a:** Agregar import en `Sidebar.jsx`
- [ ] **CAMBIO 5b:** Agregar estado `contratosPendientes`
- [ ] **CAMBIO 5c:** Agregar `useEffect` para cargar contador
- [ ] **CAMBIO 5d:** Badge en menú "Proyectos"
- [ ] **CAMBIO 5e:** Badge en submenu "Contratos"
- [ ] **CAMBIO 5f:** Agregar item "Por Aprobar" en submenu

---

## 🧪 VALIDACIÓN

Después de implementar, verificar:

1. **Backend corriendo:** `npm start` en `/backend-efagram-nomina`
2. **Frontend corriendo:** `npm run dev` en `/Frontend-Nomina-Efagram`
3. **Crear contrato:** Debe guardarse con `estado: "PENDIENTE"` en MongoDB
4. **Badge aparece:** En Proyectos, Contratos y Por Aprobar con número
5. **Página existe:** Click en "Por Aprobar" abre la nueva página
6. **Tabla muestra PENDIENTES:** Solo contratos con estado PENDIENTE
7. **Botones funcionan:** APROBAR cambia a ACTIVO, RECHAZAR a CANCELADO
8. **Notificaciones se actualizan:** Cada 30 segundos sin recargar

---

## 📞 Si Algo No Funciona

1. **Verificar en DevTools (F12):**
   - Console: ¿Hay errores?
   - Network: ¿Las llamadas a API salen correctamente?
   - Application > SessionStorage: ¿Se guardó el estado del sidebar?

2. **Verificar en Backend:**
   - ¿Los logs muestran que se creó PENDIENTE?
   - ¿MongoDB tiene el contrato con estado PENDIENTE?

3. **Limpiar cache:**
   ```bash
   # Borrar node_modules y reinstalar
   rm -r node_modules
   npm install
   npm run dev
   ```

4. **Reiniciar todo:**
   - Ctrl+C en ambas terminales
   - Cerrar navegador completamente
   - Abrir en navegador privado
   - `npm start` (backend)
   - `npm run dev` (frontend)

---

## 📚 Referencias

- **Documentación completa:** `IMPLEMENTACION_CONTRATOS_POR_APROBAR.md`
- **Archivos modificados:** 5 en frontend + 2 en backend
- **Funcionalidades nuevas:** Página de aprobación + Badges de notificación
- **Compatibilidad:** 100% compatible con funciones existentes

**Versión:** 1.0  
**Status:** Listo para implementar  
**Tiempo estimado:** 30-45 minutos
```

---

## 💡 Notas Importantes

### **Para Implementadores:**

✅ **Comienza por:** CAMBIO 1 y 2 (son los más simples)  
✅ **Luego:** CAMBIO 3 (crear la nueva página)  
✅ **Después:** CAMBIO 4 (agregar ruta)  
✅ **Finalmente:** CAMBIO 5 (actualizar sidebar)

✅ **Valida después de cada cambio:** Refresca el navegador con F5

✅ **Si algo no funciona:** Revisa la sección Troubleshooting en la documentación

---

