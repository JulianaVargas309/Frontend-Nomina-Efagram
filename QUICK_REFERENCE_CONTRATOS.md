# 🏃 QUICK REFERENCE: Contratos por Aprobar

## 5 Cambios en 30 Minutos

### 1️⃣ `contratosService.js` (2 min)
```diff
export const createContrato = async (data) => {
  const response = await httpClient.post('/contratos', data);
-  if (response?.data) {
-    response.data.estado = 'PENDIENTE';
-  }
  return response.data;
};
```
**Líneas:** 11-20 | **Acción:** REMOVER 3 líneas

---

### 2️⃣ `ContratoModal.jsx` (3 min)
```diff
  const payload = {
    // ... campos ...
-   estado: modo === 'crear' ? 'ACTIVO' : form.estado,
  };

+ if (modo === 'editar') {
+   payload.estado = form.estado;
+ }
```
**Líneas:** 732-745 | **Acción:** Cambiar 1 línea + agregar condicional

---

### 3️⃣ `ContratosPorAprobarPage.jsx` (15 min)
```javascript
// CREAR ARCHIVO NUEVO
// Ubicación: src/features/contratos/pages/
// Copiar código de PROMPT_IMPLEMENTACION_CONTRATOS.md

// Funciones clave:
const handleAprobar = async (c) => { // → ACTIVO
  await updateContrato(c._id, { estado: 'ACTIVO' });
};

const handleRechazar = async (c) => { // → CANCELADO
  await updateContrato(c._id, { estado: 'CANCELADO' });
};
```
**Acción:** CREAR archivo nuevo

---

### 4️⃣ `AppRouter.jsx` (2 min)
```diff
+ import ContratosPorAprobarPage from '../../features/contratos/pages/ContratosPorAprobarPage';

  <Route path="/proyectos/contratos" element={<PrivateRoute><ContratosPage /></PrivateRoute>} />
+ <Route path="/proyectos/contratos/por-aprobar" element={<PrivateRoute><ContratosPorAprobarPage /></PrivateRoute>} />
```
**Líneas:** 28, 56 | **Acciones:** 1 import + 1 ruta

---

### 5️⃣ `Sidebar.jsx` (8 min) - 6 Cambios
```javascript
// 5a) AGREGAR IMPORT (línea ~1)
import { getContratos } from "../../features/contratos/services/contratosService";

// 5b) AGREGAR ESTADO (línea ~22)
const [contratosPendientes, setContratosPendientes] = useState(0);

// 5c) AGREGAR USEEFFECT (línea ~30)
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
  const interval = setInterval(cargarPendientes, 30000);
  return () => clearInterval(interval);
}, []);

// 5d-5f) AGREGAR BADGES en 3 lugares:
// - Menú "Proyectos" 
// - Submenu "Contratos"
// - Nuevo submenu "Por Aprobar"
// Ver detalles en PROMPT_IMPLEMENTACION_CONTRATOS.md
```

---

## ⚡ Checklist

- [ ] Remover 3 líneas en service
- [ ] Cambiar 1 línea en modal
- [ ] Crear nueva página
- [ ] Agregar import en router
- [ ] Agregar ruta en router
- [ ] Agregar import en sidebar
- [ ] Agregar estado en sidebar
- [ ] Agregar useEffect en sidebar
- [ ] Agregar badge en "Proyectos"
- [ ] Agregar badge en "Contratos"
- [ ] Agregar item "Por Aprobar" con badge

---

## 🧪 Test Rápidos

```bash
# Backend
cd backend && npm start

# Frontend (otra terminal)
cd Frontend-Nomina-Efagram && npm run dev

# Abrir navegador
http://localhost:5173

# Tests
1. Crear contrato → MongoDB debe mostrar estado: "PENDIENTE"
2. Ver badges → Deben aparecer en menú
3. Click "Por Aprobar" → Página debe cargar
4. Click "✅ APROBAR" → Contrato → ACTIVO
5. Click "❌ RECHAZAR" → Contrato → CANCELADO
```

---

## 🐛 Si Falla Algo

```bash
# Limpiar cache
rm -r node_modules
npm install
npm run dev

# Verificar backend está corriendo
curl http://localhost:5000/api/v1/contratos

# Verificar DevTools
F12 → Console → Ver errores
F12 → Network → Ver requests
```

---

## 📖 Documentación

| Archivo | Propósito | Tiempo |
|---------|-----------|--------|
| `RESUMEN_EJECUTIVO_CONTRATOS.md` | Resumen de alto nivel | 5 min |
| `PROMPT_IMPLEMENTACION_CONTRATOS.md` | Paso a paso detallado | 15 min |
| `IMPLEMENTACION_CONTRATOS_POR_APROBAR.md` | Documentación completa | 30 min |
| `QUICK_REFERENCE_CONTRATOS.md` | Este archivo (referencia rápida) | 2 min |

---

## 💡 Notas

✅ El backend ya está listo (no tocamos)  
✅ Solo 5 archivos del frontend  
✅ Orden: 1→2→3→4→5  
✅ ~30 minutos total  
✅ Completamente reversible si necesitas deshacer  

---

**Creado:** 19 Mayo 2026  
**Versión:** 1.0  
**Status:** ✅ LISTO PARA USAR
