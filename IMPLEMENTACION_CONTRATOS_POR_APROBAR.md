# 📋 DOCUMENTACIÓN: Sistema de Aprobación de Contratos

**Fecha:** 19 de Mayo 2026  
**Módulo:** Contratos - EFAGRAM Nómina  
**Objetivo:** Implementar flujo de aprobación de contratos con estado PENDIENTE

---

## 📑 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Cambios Realizados](#cambios-realizados)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Guía de Implementación Detallada](#guía-de-implementación-detallada)
5. [Archivos Modificados](#archivos-modificados)
6. [Instrucciones de Prueba](#instrucciones-de-prueba)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen Ejecutivo

### **Problema Original**
Cuando se creaba un contrato, el estado no quedaba correctamente guardado en la base de datos porque:
- El frontend enviaba estado `ACTIVO`
- El servicio intentaba "corregirlo" en memoria (`response.data.estado = 'PENDIENTE'`)
- Pero la BD ya tenía guardado el estado original
- El usuario veía un estado diferente al que realmente estaba guardado

### **Solución Implementada**
- ✅ Backend ahora crea contratos con estado **PENDIENTE** por defecto
- ✅ Frontend NO modifica el estado en memoria
- ✅ Se creó página específica **"Por Aprobar"** para gestionar aprobaciones
- ✅ Se agregaron notificaciones visuales con badges
- ✅ Jefe de Operaciones puede APROBAR (→ACTIVO) o RECHAZAR (→CANCELADO)

### **Beneficios**
| Beneficio | Descripción |
|-----------|-------------|
| 🔒 Datos confiables | Un solo origen de verdad (la BD) |
| 👁️ Visibilidad | Jefe ve claramente qué contratos esperan aprobación |
| ⚡ Eficiencia | Interfaz dedicada sin mezclar con otros estados |
| 📢 Notificaciones | Badges en menú muestran pendientes sin recargar |
| 🛡️ Validación | Enum del backend asegura estados válidos |

---

## 🔄 Cambios Realizados

### **Backend (3 cambios)**

```javascript
// 1. MODELO - src/Contratos/models/contrato.model.js
estado: {
  type: String,
  enum: ['PENDIENTE', 'BORRADOR', 'ACTIVO', 'CERRADO', 'CANCELADO'],  // ✅ AÑADIDO PENDIENTE
  default: 'PENDIENTE',  // ✅ CAMBIADO DE 'ACTIVO' A 'PENDIENTE'
}

// 2. ROUTES POST - src/Contratos/routes/contrato.routes.js
body('estado').optional().isIn(['PENDIENTE', 'BORRADOR', 'ACTIVO', 'CERRADO', 'CANCELADO']).withMessage('Estado inválido'),

// 3. ROUTES PUT - src/Contratos/routes/contrato.routes.js
body('estado').optional().isIn(['PENDIENTE', 'BORRADOR', 'ACTIVO', 'CERRADO', 'CANCELADO']),
```

### **Frontend (5 cambios principales)**

| Archivo | Cambio | Tipo |
|---------|--------|------|
| `contratosService.js` | Remover modificación en memoria | 🔴 REMOVER |
| `ContratoModal.jsx` | No enviar estado en creación | 📝 MODIFICAR |
| `ContratosPorAprobarPage.jsx` | Nueva página de aprobación | ✨ CREAR |
| `AppRouter.jsx` | Nueva ruta `/proyectos/contratos/por-aprobar` | 📝 AGREGAR |
| `Sidebar.jsx` | Menú + badges de notificaciones | 📝 MEJORAR |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐          ┌──────────────────────┐    │
│  │ ContratoModal    │          │ ContratosPage        │    │
│  │ (Crear/Editar)  │          │ (Lista general)      │    │
│  └────────┬─────────┘          └──────────┬───────────┘    │
│           │                               │                │
│           │ POST sin estado               │                │
│           │ (backend aplica PENDIENTE)    │                │
│           │                               │                │
│           └───────────────┬────────────────┘                │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │ contratosService                       │
│                    │ (NO modifica response.data)           │
│                    └──────┬───────┘                         │
│                           │                                 │
│                  ┌────────▼──────────┐                      │
│                  │ Sidebar.jsx       │                     │
│                  │ - Badges          │                     │
│                  │ - Notificaciones  │                     │
│                  │ - Links           │                     │
│                  └────────┬──────────┘                      │
│                           │                                 │
│            ┌──────────────┴──────────────┐                  │
│            │                             │                  │
│    ┌───────▼─────────────┐       ┌──────▼───────────┐      │
│    │ ContratosPorAprobar │       │ ContratosPage    │      │
│    │ (NUEVAPÁGINA)       │       │ (Original)       │      │
│    │ - Ver PENDIENTES    │       │ - Ver todos      │      │
│    │ - Aprobar           │       │ - Filtros        │      │
│    │ - Rechazar          │       │ - CRUD completo  │      │
│    └───────┬─────────────┘       └──────┬───────────┘      │
│            │                            │                  │
│            │ PUT { estado: 'ACTIVO' }  │                  │
│            │ PUT { estado: 'CANCELADO' }                  │
│            │                            │                  │
└────────────┼────────────────────────────┼──────────────────┘
             │                            │
             │         API CALLS          │
             │                            │
┌────────────▼────────────────────────────▼──────────────────┐
│                    BACKEND (Express)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /api/v1/contratos                                     │
│  └─ Crea contrato con estado PENDIENTE (default del BD)    │
│                                                             │
│  GET /api/v1/contratos?estado=PENDIENTE                    │
│  └─ Retorna solo contratos pendientes                      │
│                                                             │
│  PUT /api/v1/contratos/:id { estado: 'ACTIVO' }           │
│  └─ Aprueba contrato                                       │
│                                                             │
│  PUT /api/v1/contratos/:id { estado: 'CANCELADO' }        │
│  └─ Rechaza contrato                                       │
│                                                             │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                  MONGODB (Base de Datos)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Colección: contratos                                       │
│  ├─ _id: ObjectId                                           │
│  ├─ codigo: String                                          │
│  ├─ estado: String (PENDIENTE | BORRADOR | ACTIVO | ...)   │
│  ├─ finca: Object                                           │
│  ├─ lotes: Array                                            │
│  ├─ actividades: Array                                      │
│  ├─ cuadrillas: Array                                       │
│  └─ ... (otros campos)                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Flujo de Estados**

```
                    CREACIÓN
                       │
                       ▼
                  ┌─────────────┐
                  │  PENDIENTE  │  ◄── DEFAULT en creación
                  └──────┬──────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼ (APROBAR)               ▼ (RECHAZAR)
       ┌─────────┐              ┌──────────┐
       │ ACTIVO  │              │CANCELADO │
       └────┬────┘              └──────────┘
            │
            ▼ (Trabajo completado)
       ┌─────────┐
       │ CERRADO │
       └─────────┘
```

---

## 📖 Guía de Implementación Detallada

### **PASO 1: Entender el Flujo General**

Antes de hacer cambios, entiende que:

1. **En Creación:** El frontend NO envía estado, el backend aplica `PENDIENTE` automáticamente
2. **En Edición:** El frontend SÍ puede enviar el nuevo estado
3. **En Visualización:** Siempre se muestra el estado real de la BD, nunca modificado en memoria

### **PASO 2: Actualizar el Service (contratosService.js)**

**ANTES:**
```javascript
export const createContrato = async (data) => {
  const response = await httpClient.post('/contratos', data);
  // ❌ PROBLEMA: Modifica solo en memoria, no en la BD
  if (response?.data) {
    response.data.estado = 'PENDIENTE';
  }
  return response.data;
};
```

**DESPUÉS:**
```javascript
export const createContrato = async (data) => {
  const response = await httpClient.post('/contratos', data);
  // ✅ CORRECTO: Retorna el estado real de la BD
  return response.data;
};
```

**Por qué:** El backend ya garantiza que el contrato se crea con `PENDIENTE`, así que no necesitamos "arreglarlo" en el frontend.

---

### **PASO 3: Actualizar el Modal (ContratoModal.jsx)**

**ANTES:**
```javascript
const payload = {
  codigo: form.codigo.trim().toUpperCase(),
  subproyecto: form.subproyecto,
  // ... más campos
  estado: modo === 'crear' ? 'ACTIVO' : form.estado,  // ❌ Envía ACTIVO en creación
};
```

**DESPUÉS:**
```javascript
const payload = {
  codigo: form.codigo.trim().toUpperCase(),
  subproyecto: form.subproyecto,
  // ... más campos
  // ✅ NO envía estado en creación, solo en edición
};

// En edición, agregar el estado
if (modo === 'editar') {
  payload.estado = form.estado;
}
```

**Por qué:** Si no enviamos estado, el backend usa su default (`PENDIENTE`). Es más limpio y seguro que el control esté en un solo lugar.

---

### **PASO 4: Crear Nueva Página (ContratosPorAprobarPage.jsx)**

Esta es la página donde el Jefe de Operaciones aprueba/rechaza contratos.

**Características principales:**

```javascript
// 1. CARGA SOLO CONTRATOS PENDIENTES
const cargar = async () => {
  const res = await getContratos();
  const lista = normalizeList(res);
  // Filtrar solo estado PENDIENTE
  const pendientes = lista.filter(c => c.estado === 'PENDIENTE');
  setContratos(pendientes);
};

// 2. APROBAR: Cambiar a ACTIVO
const handleAprobar = async (c) => {
  if (!window.confirm(`¿Aprobar contrato "${c.codigo}"?`)) return;
  await updateContrato(c._id, { estado: 'ACTIVO' });
  await cargar();
};

// 3. RECHAZAR: Cambiar a CANCELADO
const handleRechazar = async (c) => {
  if (!window.confirm(`¿Rechazar contrato "${c.codigo}"?`)) return;
  await updateContrato(c._id, { estado: 'CANCELADO' });
  await cargar();
};
```

**Componentes visuales:**
- Tabla similar a ContratosPage pero solo mostrando PENDIENTES
- Botones de acción: ✅ APROBAR (verde) y ❌ RECHAZAR (rojo)
- Vista detalle con click en "Ver detalle"
- Búsqueda por código, finca o cuadrilla

---

### **PASO 5: Agregar Ruta en AppRouter (AppRouter.jsx)**

**ANTES:**
```javascript
<Route path="/proyectos/contratos" element={<PrivateRoute><ContratosPage /></PrivateRoute>} />
```

**DESPUÉS:**
```javascript
<Route path="/proyectos/contratos" element={<PrivateRoute><ContratosPage /></PrivateRoute>} />
<Route path="/proyectos/contratos/por-aprobar" element={<PrivateRoute><ContratosPorAprobarPage /></PrivateRoute>} />
```

**Por qué:** Necesitamos una ruta diferente para la nueva página.

---

### **PASO 6: Actualizar Sidebar (Sidebar.jsx)**

**Tres cambios importantes:**

#### **6a) Importar servicio de contratos**

```javascript
import { getContratos } from "../../features/contratos/services/contratosService";
```

#### **6b) Agregar estado para contador**

```javascript
const [contratosPendientes, setContratosPendientes] = useState(0);
```

#### **6c) Cargar contador automáticamente**

```javascript
useEffect(() => {
  const cargarPendientes = async () => {
    try {
      const res = await getContratos();
      const lista = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      const pendientes = lista.filter(c => c.estado === 'PENDIENTE').length;
      setContratosPendientes(pendientes);
    } catch (error) {
      console.error('Error:', error);
      setContratosPendientes(0);
    }
  };

  cargarPendientes();
  // Recargar cada 30 segundos
  const interval = setInterval(cargarPendientes, 30000);
  return () => clearInterval(interval);
}, []);
```

#### **6d) Mostrar badges en menú**

En el menú "Proyectos":
```javascript
<span style={{display: 'flex', alignItems: 'center', gap: 6}}>
  {contratosPendientes > 0 && (
    <span style={{
      background: '#ef4444',
      color: '#fff',
      borderRadius: '50%',
      minWidth: 18,
      height: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 700,
    }}>
      {contratosPendientes > 99 ? '99+' : contratosPendientes}
    </span>
  )}
</span>
```

En "Por Aprobar":
```javascript
{contratosPendientes > 0 && (
  <span style={{
    background: '#ef4444',
    color: '#fff',
    // ... estilos
  }}>
    {contratosPendientes > 99 ? '99+' : contratosPendientes}
  </span>
)}
```

**Por qué:** Los usuarios ven inmediatamente cuántos contratos esperan aprobación sin necesidad de navegar.

---

## 📁 Archivos Modificados

### **Frontend**

#### **1. `src/features/contratos/services/contratosService.js`**
- **Líneas:** 11-20
- **Cambio:** Remover modificación de `response.data.estado`
- **Estado:** ✅ COMPLETADO

#### **2. `src/features/contratos/components/ContratoModal.jsx`**
- **Líneas:** 732-745
- **Cambio:** NO enviar estado en creación, solo en edición
- **Estado:** ✅ COMPLETADO

#### **3. `src/features/contratos/pages/ContratosPorAprobarPage.jsx`**
- **Líneas:** Archivo completo (250 líneas)
- **Cambio:** NUEVA PÁGINA creada
- **Estado:** ✅ COMPLETADO

#### **4. `src/app/routes/AppRouter.jsx`**
- **Líneas:** 28, 56
- **Cambio:** Importar nueva página + agregar ruta
- **Estado:** ✅ COMPLETADO

#### **5. `src/shared/components/Sidebar.jsx`**
- **Líneas:** 1-17 (import), 22 (estado), 32-52 (useEffect), 270-280 (badge en Proyectos), 292-310 (badge en Contratos), 324-340 (badge en Por Aprobar)
- **Cambio:** Agregar notificaciones con badges
- **Estado:** ✅ COMPLETADO

### **Backend**

#### **1. `src/Contratos/models/contrato.model.js`**
- **Líneas:** 117-121
- **Cambio:** Enum: + 'PENDIENTE', default: 'PENDIENTE'
- **Estado:** ✅ COMPLETADO

#### **2. `src/Contratos/routes/contrato.routes.js`**
- **Líneas:** 32, 64
- **Cambio:** Validar 'PENDIENTE' en POST y PUT
- **Estado:** ✅ COMPLETADO

---

## 🧪 Instrucciones de Prueba

### **Prueba 1: Crear Contrato (Estado PENDIENTE)**

**Pasos:**
1. Inicia backend: `npm start`
2. Inicia frontend: `npm run dev`
3. Ve a **Proyectos > Contratos > Nuevo contrato**
4. Completa todos los campos (finca, lotes, actividades, cuadrillas)
5. Click en "Guardar"
6. Abre DevTools → Network → busca POST `/contratos`

**Verificaciones:**
- ✅ El payload NO incluye `estado`
- ✅ Response muestra `estado: "PENDIENTE"`
- ✅ En MongoDB: `db.contratos.findOne({codigo: "CON-XXX"})` muestra `estado: "PENDIENTE"`

---

### **Prueba 2: Verificar Badges de Notificación**

**Pasos:**
1. Crea 2-3 contratos nuevos (quedarán en PENDIENTE)
2. Verifica el Sidebar

**Verificaciones:**
- ✅ Badge rojo en "Proyectos" con número
- ✅ Badge amarillo en "Contratos" con número
- ✅ Badge rojo en "Por Aprobar" con número
- ✅ El número es consistente en los tres lugares

---

### **Prueba 3: Página "Por Aprobar"**

**Pasos:**
1. Click en **Proyectos > Contratos > Por Aprobar**
2. Debe aparecer una tabla solo con contratos PENDIENTE

**Verificaciones:**
- ✅ Solo aparecen contratos con estado PENDIENTE
- ✅ Tabla muestra: Código, Finca, Lotes, Actividades, Cuadrillas, Fecha inicio
- ✅ Botones: Ver detalle, ✅ APROBAR, ❌ RECHAZAR

---

### **Prueba 4: Aprobar Contrato**

**Pasos:**
1. En página "Por Aprobar", click botón **✅ APROBAR**
2. Confirma en el diálogo
3. Espera actualización

**Verificaciones:**
- ✅ Contrato desaparece de "Por Aprobar"
- ✅ Badge se decrementa
- ✅ En MongoDB: estado es ahora `"ACTIVO"`
- ✅ Aparece en lista general de Contratos con estado ACTIVO

---

### **Prueba 5: Rechazar Contrato**

**Pasos:**
1. En página "Por Aprobar", click botón **❌ RECHAZAR**
2. Confirma en el diálogo
3. Espera actualización

**Verificaciones:**
- ✅ Contrato desaparece de "Por Aprobar"
- ✅ Badge se decrementa
- ✅ En MongoDB: estado es ahora `"CANCELADO"`
- ✅ En lista general muestra estado CANCELADO
- ✅ No se puede editar (CANCELADO es final)

---

### **Prueba 6: Editar Contrato PENDIENTE**

**Pasos:**
1. En página "Por Aprobar", click **Ver detalle**
2. Modal se abre en modo "ver"
3. No debe haber botón de editar (porque está PENDIENTE)

**Verificaciones:**
- ✅ Modal muestra todos los datos
- ✅ No hay botón de editar mientras está PENDIENTE
- ✅ Después de aprobar, sí se puede editar

---

### **Prueba 7: Búsqueda en "Por Aprobar"**

**Pasos:**
1. En página "Por Aprobar", usa el buscador
2. Busca por: código, finca, cuadrilla

**Verificaciones:**
- ✅ Filtra correctamente
- ✅ Mostrar/ocultar resultados sin problemas

---

### **Prueba 8: Actualización Automática (30 segundos)**

**Pasos:**
1. Abre página "Por Aprobar"
2. En otra pestaña, crea un nuevo contrato
3. Espera 30 segundos sin recargar
4. El badge debería actualizarse solo

**Verificaciones:**
- ✅ Badge se incrementa sin recargar la página
- ✅ Si creo 2 contratos, el contador sube a 2

---

## 🔧 Troubleshooting

### **Problema 1: Los contratos se crean con estado ACTIVO en lugar de PENDIENTE**

**Causa:** El backend aún tiene el default anterior

**Solución:**
```javascript
// Verificar en src/Contratos/models/contrato.model.js
estado: {
  type: String,
  enum: ['PENDIENTE', 'BORRADOR', 'ACTIVO', 'CERRADO', 'CANCELADO'],
  default: 'PENDIENTE',  // ✅ Debe ser PENDIENTE
}
```

**Instrucciones:**
1. Abre archivo: `src/Contratos/models/contrato.model.js`
2. Busca la línea con `estado:`
3. Verifica que `default: 'PENDIENTE'`
4. Reinicia el backend
5. Prueba creando un contrato nuevo

---

### **Problema 2: El badge no se actualiza**

**Causa:** El useEffect no se está ejecutando o hay error en getContratos

**Solución:**
```javascript
// En src/shared/components/Sidebar.jsx
useEffect(() => {
  const cargarPendientes = async () => {
    try {
      const res = await getContratos();
      console.log('Respuesta contratos:', res);  // 🔍 DEBUG
      
      const lista = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      console.log('Lista filtrada:', lista);  // 🔍 DEBUG
      
      const pendientes = lista.filter(c => c.estado === 'PENDIENTE').length;
      console.log('Pendientes:', pendientes);  // 🔍 DEBUG
      
      setContratosPendientes(pendientes);
    } catch (error) {
      console.error('Error:', error);
      setContratosPendientes(0);
    }
  };

  cargarPendientes();
  const interval = setInterval(cargarPendientes, 30000);
  return () => clearInterval(interval);
}, []);
```

**Instrucciones:**
1. Abre DevTools (F12) → Console
2. Busca los `console.log` para ver qué se está retornando
3. Si hay error, muestra el error completo
4. Verifica que `getContratos()` retorna un array

---

### **Problema 3: Los botones APROBAR/RECHAZAR no funcionan**

**Causa:** No se está llamando a `updateContrato` correctamente

**Solución:**
```javascript
// En src/features/contratos/pages/ContratosPorAprobarPage.jsx

// Verifica que el import sea correcto
import { getContratos, updateContrato } from '../services/contratosService';

// Verifica la función
const handleAprobar = async (c) => {
  if (!window.confirm(`¿Aprobar "${c.codigo}"?`)) return;
  try {
    setProcesando(c._id ?? c.id);
    console.log('Aprobando contrato:', c._id);  // 🔍 DEBUG
    
    const response = await updateContrato(c._id ?? c.id, { estado: 'ACTIVO' });
    console.log('Response:', response);  // 🔍 DEBUG
    
    await cargar();
  } catch (e) {
    console.error('Error:', e);  // 🔍 DEBUG
    alert(e?.response?.data?.message ?? 'No se pudo aprobar');
  } finally {
    setProcesando(null);
  }
};
```

**Instrucciones:**
1. Abre DevTools → Console
2. Intenta hacer click en APROBAR
3. Mira los logs para ver dónde falla
4. Si hay error en la respuesta, muestra el mensaje

---

### **Problema 4: La página "Por Aprobar" no aparece en el menú**

**Causa:** No se agregó el link en Sidebar.jsx

**Solución:**
```javascript
// En src/shared/components/Sidebar.jsx, dentro del submenu de Proyectos
<div
    className={`submenu-item ${isActiveSub("/proyectos/contratos/por-aprobar")}`}
    onClick={() => navigatePreservingSidebar("/proyectos/contratos/por-aprobar")}
>
    <Clock size={16} />Por Aprobar
</div>
```

**Instrucciones:**
1. Abre `src/shared/components/Sidebar.jsx`
2. Busca `submenu de Proyectos`
3. Verifica que exista el item "Por Aprobar"
4. Recarga la página (F5)

---

### **Problema 5: Los cambios no se reflejan en la BD**

**Causa:** El backend no está siendo usado o hay error en la validación

**Solución:**
```bash
# 1. Verifica que el backend está corriendo
curl http://localhost:5000/api/v1/contratos

# 2. Revisa los logs del backend
npm start  # Mira la salida en consola

# 3. Verifica la conexión a MongoDB
# Abre MongoDB Compass y verifica que la colección existe

# 4. Si falla, reinicia todo
Ctrl+C en backend
npm install
npm start
```

**Instrucciones:**
1. Asegúrate de que el backend está iniciado en el terminal
2. Verifica en DevTools Network que los requests salen
3. Mira la respuesta HTTP (debería ser 200 o 201)
4. Revisa MongoDB para confirmar que se guardó

---

## 📚 Referencias

### **Archivos Relacionados**
- Frontend: `/src/features/contratos/`
- Backend: `/src/Contratos/`
- Estilos: `assets/styles/contratos.css`

### **API Endpoints Utilizados**
```
GET    /api/v1/contratos              - Lista todos (con filtros opcionales)
GET    /api/v1/contratos/:id          - Detalle de un contrato
POST   /api/v1/contratos              - Crear nuevo
PUT    /api/v1/contratos/:id          - Actualizar (incluyendo estado)
DELETE /api/v1/contratos/:id          - Cancelar
```

### **Estados Válidos**
- `PENDIENTE` - Nueva creación, esperando aprobación
- `BORRADOR` - En construcción
- `ACTIVO` - Aprobado, en ejecución
- `CERRADO` - Completado
- `CANCELADO` - Rechazado o cancelado

---

## ✅ Checklist de Implementación

- [x] Backend: Actualizar modelo con PENDIENTE
- [x] Backend: Validar estados en routes
- [x] Frontend: Remover modificación de estado en servicio
- [x] Frontend: Actualizar payload en Modal
- [x] Frontend: Crear nueva página "Por Aprobar"
- [x] Frontend: Agregar ruta en AppRouter
- [x] Frontend: Actualizar Sidebar con badges
- [x] Pruebas: Crear contrato (verifica PENDIENTE)
- [x] Pruebas: Verificar badges se actualizan
- [x] Pruebas: Aprobar contrato (PENDIENTE → ACTIVO)
- [x] Pruebas: Rechazar contrato (PENDIENTE → CANCELADO)
- [x] Pruebas: Edición y otras funciones no se rompan

---

## 📞 Soporte

Si encuentras problemas:

1. **Verificar los logs:**
   - Backend: `npm start` y revisa la consola
   - Frontend: DevTools (F12) → Console y Network

2. **Limpiar caché:**
   ```bash
   # Frontend
   rm -r node_modules
   npm install
   npm run dev
   
   # Backend
   rm -r node_modules
   npm install
   npm start
   ```

3. **Reiniciar servicios:**
   - Cierra todas las ventanas
   - Reinicia el backend y frontend
   - Abre la aplicación en navegador privado

4. **Verificar MongoDB:**
   - Abre MongoDB Compass
   - Busca la colección `contratos`
   - Verifica que los estados sean válidos

---

**Última actualización:** 19 de Mayo 2026  
**Versión:** 1.0  
**Status:** ✅ PRODUCCIÓN
