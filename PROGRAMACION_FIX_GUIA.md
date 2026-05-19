# 🔧 GUÍA COMPLETA: FIX PROGRAMACIÓN + BARRA DE PROGRESO

---

## 📋 CONTENIDO

1. **Diagnóstico del Error**
2. **Soluciones Implementadas**
3. **Validación Local**
4. **Deployment**
5. **Troubleshooting**

---

## 🔍 PARTE 1: DIAGNÓSTICO DEL ERROR

### ❌ PROBLEMA

Al crear nueva programación:
- **Error:** `"Lote es obligatorio"`
- **HTTP Status:** `400 Bad Request`
- **Ubicación:** `/api/v1/programaciones`

El **lote se selecciona en el modal**, pero no llega al backend en el formato correcto.

### 🎯 CAUSA RAÍZ

**Frontend enviaba:**
```json
{
  "contrato_id": "...",
  "lote_id": "mongodb_id_del_lote",  // ❌ INCORRECTO
  "fecha_inicial": "..."
}
```

**Backend esperaba:**
```json
{
  "contrato_id": "...",
  "lote": {                           // ✅ CORRECTO
    "codigo": "Lote9",
    "nombre": "Lote9"
  },
  "fecha_inicial": "..."
}
```

### 🔗 FLUJO DEL ERROR

```
Modal (ModalCrearProgramacion)
  ↓
handleGuardar() [ANTES]
  → Busca loteSeleccionado (solo el ID)
  → Envía lote_id = "mongodb_id"  ❌
  ↓
programacionService.create(datos)
  → HTTP POST /programaciones
  ↓
Backend (programacion.controller.js)
  → Valida req.body.lote
  → No encuentra req.body.lote ❌
  → Responde 400 "Lote es obligatorio"
```

---

## ✅ PARTE 2: SOLUCIONES IMPLEMENTADAS

### SOLUCIÓN 1️⃣: Normalizar Lote en Frontend

**Archivo:** `src/features/programacion/components/ModalCrearProgramacion.jsx`

**Cambios en `handleGuardar` (líneas ~78-119):**

```javascript
// 1. Buscar el lote objeto COMPLETO
const loteCompleto = (infoContrato?.lotes || []).find(l => {
  const loteId = String(l?._id || l?.id || '');
  return loteId === String(loteSeleccionado);
});

// 2. Normalizar a {codigo, nombre}
const loteNormalizado = {
  codigo: String(loteCompleto?.codigo || loteCompleto?.nombre).trim(),
  nombre: String(loteCompleto?.nombre || loteCompleto?.codigo).trim(),
};

// 3. Enviar como objeto 'lote' (no 'lote_id')
const datos = {
  contrato_id: contratoSeleccionado,
  lote: loteNormalizado,        // ✅ CORRECTO
  fecha_inicial: fechaISO,
  cantidad_proyectada: cantNum,
  observaciones: observaciones.trim(),
};

console.log('📤 PAYLOAD PROGRAMACION:', JSON.stringify(datos, null, 2));
await onSave(datos);
```

**Beneficios:**
- ✅ Envía objeto lote completo
- ✅ Evita errores de normalización
- ✅ Log para debugging
- ✅ Fallback si faltan datos

### SOLUCIÓN 2️⃣: Barra de Progreso Dinámica en Proyectos

**Archivo:** `src/features/proyectos/pages/ProyectosPage.jsx`

**Cambios:**

#### 2.1 Importaciones
```javascript
import programacionService from "../../programacion/services/programacionService";
import BarraProgreso from "../../programacion/components/BarraProgreso";
```

#### 2.2 Estado
```javascript
const [programacionesPorProyecto, setProgramacionesPorProyecto] = useState({});
```

#### 2.3 Función Helper
```javascript
const calcularAvanceProyecto = (programacionesDelProyecto) => {
  if (!Array.isArray(programacionesDelProyecto) || programacionesDelProyecto.length === 0) {
    return 0;
  }

  let totalProyectado = 0;
  let totalEjecutado = 0;

  programacionesDelProyecto.forEach((prog) => {
    const cantProyectada = Number(prog.cantidad_proyectada) || 0;
    totalProyectado += cantProyectada;

    // Sumar TODOS los registros diarios ejecutados
    if (Array.isArray(prog.registros_diarios)) {
      prog.registros_diarios.forEach((reg) => {
        const cantEjecutada = Number(reg.cantidad_ejecutada) || 0;
        totalEjecutado += cantEjecutada;
      });
    }
  });

  if (totalProyectado === 0) return 0;
  return Math.min(Math.round((totalEjecutado / totalProyectado) * 100), 100);
};
```

#### 2.4 Cargar Programaciones
```javascript
// En cargarProyectos()
try {
  const programaciones = await programacionService.getAll();
  const progData = Array.isArray(programaciones?.data)
    ? programaciones.data
    : Array.isArray(programaciones)
      ? programaciones
      : [];

  // Agrupar por proyecto
  const progMap = {};
  data.forEach((p) => {
    const contratoIds = (p.contratos || []).map(c => c._id || c);
    const progDelProyecto = progData.filter((prog) => {
      const contratoId = prog.contrato?._id || prog.contrato_id;
      return contratoIds.includes(contratoId);
    });
    progMap[p._id] = progDelProyecto;
  });

  setProgramacionesPorProyecto(progMap);
} catch (err) {
  console.warn('Error cargando programaciones:', err);
}
```

#### 2.5 Reemplazar Barra Estática
```jsx
{
  (() => {
    const avanceDinamico = calcularAvanceProyecto(programacionesPorProyecto[proyecto._id] || []);
    const avanceTotal = avanceDinamico || proyecto.avance || 0;
    const hasProgramaciones = Array.isArray(programacionesPorProyecto[proyecto._id]) 
      && programacionesPorProyecto[proyecto._id].length > 0;

    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
            Avance {hasProgramaciones ? '(por programaciones)' : ''}
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: avanceTotal >= 75 ? '#10b981' : avanceTotal >= 50 ? '#3b82f6' : '#ef4444',
          }}>
            {avanceTotal}%
          </span>
        </div>
        <BarraProgreso
          porcentaje={avanceTotal}
          cantidad={0}
          cantidadProyectada={0}
          showLabel={false}
          className="proyecto-barra-progreso"
        />
      </div>
    );
  })()
}
```

---

## 🧪 PARTE 3: VALIDACIÓN LOCAL

### PASO 1: Iniciar Servidor

```bash
# Terminal 1: Backend
cd ~/mi-proyecto-backend
npm run dev
# Esperado: ✅ Listening on port 5000
```

```bash
# Terminal 2: Frontend
cd ~/Frontend-Nomina-Efagram
npm run dev
# Esperado: ✅ VITE v4.x.x ready in xxx ms
```

### PASO 2: Ir a Módulo de Programación

```
URL: http://localhost:5173/programacion
```

Debe mostrar:
- ✅ Lista de programaciones (puede estar vacía)
- ✅ Botón "Nueva Programación"
- ✅ Stats de arriba (Total, Activas, etc)

### PASO 3: Crear Programación

1. Click en **"Nueva Programación"**
   - Modal debe abrirse

2. **Seleccionar Contrato:**
   - Ejemplo: `CON-011 · Condor, El`
   - Click → SearchableSelect se abre
   - Seleccionar

3. **Verificar que aparezcan lotes:**
   - Debe mostrar: Lote9, Lote20
   - Si no aparecen → Error en base de datos

4. **Seleccionar Lote:**
   - Click en dropdown "Lote"
   - Seleccionar `Lote9`

5. **Seleccionar Fecha:**
   - Click en input de fecha
   - Seleccionar cualquier fecha futura
   - Ej: `19/05/2026`

6. **Ingresar Cantidad:**
   - Cantidad Proyectada: `2` (número)
   - Valor Proyectado: (opcional)

7. **Crear Programación:**
   - Click botón **"Crear Programación"**

### PASO 4: Validación en Console

**Abrir DevTools** (F12) → **Console Tab**

Debe aparecer:
```javascript
📤 PAYLOAD PROGRAMACION: {
  "contrato_id": "65f3d2a1b2c3d4e5f6g7h8i9",
  "lote": {
    "codigo": "Lote9",
    "nombre": "Lote9"
  },
  "fecha_inicial": "2026-05-19T12:00:00.000Z",
  "cantidad_proyectada": 2,
  "valor_proyectado": 0,
  "observaciones": ""
}
```

✅ **Importante:** El `lote` DEBE ser un OBJETO, no string o ID.

### PASO 5: Validación en Network

**DevTools** → **Network Tab** → **XHR/Fetch**

Buscar: `POST /api/v1/programaciones`

**Request (Payload):**
```json
{
  "contrato_id": "...",
  "lote": {
    "codigo": "Lote9",
    "nombre": "Lote9"
  },
  "fecha_inicial": "...",
  "cantidad_proyectada": 2,
  "valor_proyectado": 0,
  "observaciones": ""
}
```

**Response:**
```json
{
  "success": true,
  "message": "Programación creada exitosamente",
  "data": {
    "_id": "65f3d2a1b2c3d4e5f6g7h8i9",
    "contrato_id": "...",
    "lote": {...},
    ...
  }
}
```

**HTTP Status:**
- ✅ `201 Created` → TODO BIEN
- ❌ `400 Bad Request` → Error en payload
- ❌ `500 Internal Server Error` → Error en backend

### PASO 6: Verificar Modal

Después de crear:
- ✅ Modal debe cerrarse
- ✅ Tabla debe actualizarse
- ✅ Nueva fila debe aparecer
- ✅ Success message verde (arriba)

### PASO 7: Validar Barra de Progreso en Proyectos

```
URL: http://localhost:5173/proyectos
```

1. Ir a un proyecto que tenga contratos

2. **Buscar la barra de avance:**
   - Debe mostrar porcentaje en color
   - Si hay programaciones → Avance calculado
   - Si no hay → 0%

3. **Crear registros diarios:**
   - Ir a `/programacion`
   - Click en programación creada
   - Click "Registrar ejecución"
   - Ingresar cantidad ejecutada
   - Guardar

4. **Volver a `/proyectos`:**
   - Refresh la página (F5)
   - La barra debe actualizarse
   - Porcentaje debe aumentar
   - Color debe cambiar según avance

**Ejemplo:**
- Programación: Cantidad Proyectada = 10
- Registro 1: Ejecutado = 3
- Registro 2: Ejecutado = 2
- Avance = (3+2)/10 = 50% → Azul

---

## 🚀 PARTE 4: DEPLOYMENT

### 4.1 Preparar Cambios

```bash
# Verificar cambios
git status

# Debe mostrar:
# ✅ modified: src/features/programacion/components/ModalCrearProgramacion.jsx
# ✅ modified: src/features/proyectos/pages/ProyectosPage.jsx
```

### 4.2 Commit y Push

```bash
# Stage todos los cambios
git add .

# Commit con mensaje claro
git commit -m "fix: normalizar lote en programación + barra dinámica en proyectos

- Cambio principal: frontend envía 'lote' como objeto {codigo, nombre}
- Antes: enviaba 'lote_id' como string ❌
- Ahora: envía 'lote' normalizado ✅
- Integración: ProyectosPage carga programaciones dinámicamente
- Barra: Calcula avance = cantidad_ejecutada / cantidad_proyectada
- Colores: Verde (100%), Azul (75%), Ámbar (50%), Rojo (25%), Gris (0%)"

# Push a rama main
git push origin main
```

### 4.3 Esperar Deploy

**En Render o Vercel:**
- Esperar ~2-3 minutos
- Revisar logs:
  - Debe haber un build exitoso
  - Deployment exitoso

### 4.4 Validar en Producción

```
URL: https://tu-dominio.com/programacion
```

Repetir **PASO 3-7** de validación local.

---

## ⚠️ PARTE 5: TROUBLESHOOTING

### Problema: "Lote es obligatorio" sigue apareciendo

**Checklist:**

1. **¿El modal muestra lotes?**
   - Sí → Ir a 2
   - No → Error en base de datos o contratos sin lotes

2. **¿Estás seleccionando un lote?**
   - Sí → Ir a 3
   - No → Selecciona un lote

3. **¿Aparece el log 📤 PAYLOAD PROGRAMACION en console?**
   - Sí → Ir a 4
   - No → Hay error en JavaScript (F12 Console)

4. **¿El lote en console es un objeto {codigo, nombre}?**
   - Sí → Backend no actualizado
   - No → Frontend tiene bug en handleGuardar

**Solución:**
```javascript
// En ModalCrearProgramacion.jsx handleGuardar
// Verifica que loteNormalizado sea:
console.log('Lote normalizado:', loteNormalizado);
// Output debe ser: {codigo: "Lote9", nombre: "Lote9"}
```

---

### Problema: Barra no aparece en Proyectos

**Checklist:**

1. **¿Visitaste /proyectos después de crear programación?**
   - Sí → Ir a 2
   - No → Visita /proyectos

2. **¿Hace refresh (F5) después de crear programación?**
   - Sí → Ir a 3
   - No → Refresh la página

3. **¿Aparece error en console?**
   - Sí → Copiar error y revisar
   - No → Ir a 4

4. **¿El proyecto tiene contratos?**
   - Sí → Ir a 5
   - No → Crea un contrato primero

5. **¿Existen programaciones para ese contrato?**
   - Sí → Ir a 6
   - No → Crea una programación

6. **¿El avance aparece como 0%?**
   - Sí → Crea registros diarios para la programación
   - No → Barra está funcionando ✅

---

### Problema: Error en Network: 500 Internal Server Error

**Probablemente backend no está actualizado.**

**Solución:**
```bash
# En backend
git pull origin main
npm install
npm run dev

# Esperar a que se reinicie
# Volver a intentar en frontend
```

---

### Problema: Las programaciones no se cargan en ProyectosPage

**Probablemente error en obtener programaciones.**

**Debug:**

```javascript
// En ProyectosPage.jsx - cargarProyectos()
console.log('📥 Programaciones cargadas:', progData);
console.log('📊 Programaciones por proyecto:', progMap);
```

Si console muestra `undefined`:
- Backend está retornando estructura diferente
- Revisar endpoint `/api/v1/programaciones`

---

## 📝 RESUMEN FINAL

### ✅ Qué cambió

| Componente | Cambio | Impacto |
|-----------|--------|--------|
| ModalCrearProgramacion | handleGuardar normaliza lote | Envía objeto en lugar de ID |
| programacionService | (Sin cambios) | Limpio, envía todo |
| ProyectosPage | Carga programaciones + BarraProgreso | Avance dinámico en tiempo real |

### ✅ Qué NO cambió

- ✅ Endpoints del API
- ✅ Modelos de base de datos
- ✅ Estructura de otros módulos
- ✅ Autenticación

### ✅ Resultado esperado

1. **Crear programación** → Sin errores 400
2. **Ver en tabla** → Programación aparece
3. **Ir a proyectos** → Barra muestra avance
4. **Crear registros** → Avance sube automáticamente

---

## 🎯 PRÓXIMAS MEJORAS (OPCIONAL)

1. **Gráficos de avance por mes**
2. **Alertas si avance < esperado**
3. **Exportar reporte de programaciones**
4. **Timeline visual de programaciones**
5. **Comparar avance vs proyectado**

---

**Documento creado:** Mayo 19, 2026  
**Versión:** 1.0 - Producción  
**Estado:** ✅ LISTO PARA DEPLOY
