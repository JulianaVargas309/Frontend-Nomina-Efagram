# ⚡ QUICK START — Validar en 5 minutos

---

## 🚀 PASO 1: Verificar cambios locales

```bash
git status

# Debe mostrar:
# modified: src/features/programacion/components/ModalCrearProgramacion.jsx
# modified: src/features/proyectos/pages/ProyectosPage.jsx
```

---

## 🔌 PASO 2: Iniciar Backend y Frontend

**Terminal 1:**
```bash
npm run dev  # Backend
# Esperado: ✅ Server listening on port 5000
```

**Terminal 2:**
```bash
npm run dev  # Frontend
# Esperado: ✅ Local: http://localhost:5173
```

---

## 📋 PASO 3: Test de Programación (2 min)

### 3.1 Ir a Programación
```
http://localhost:5173/programacion
```

### 3.2 Crear Nueva Programación
- Click: **"Nueva Programación"**
- Contrato: Selecciona cualquiera (ej: CON-011)
- Lote: Selecciona uno (ej: Lote9)
- Fecha: Selecciona una fecha
- Cantidad: Ingresa `2`
- Click: **"Crear Programación"**

### 3.3 Validar Console (F12)
Abre **DevTools** → **Console Tab**

**Busca este log:**
```
📤 PAYLOAD PROGRAMACION: {
  "contrato_id": "...",
  "lote": {
    "codigo": "Lote9",
    "nombre": "Lote9"
  },
  ...
}
```

✅ **Si ves esto → Frontend está correcto**
❌ Si no lo ves → Hay error, revisar Console

### 3.4 Validar Network (F12)
**DevTools** → **Network Tab** → **XHR**

**Busca:** `POST /api/v1/programaciones`

**Status esperado:**
- ✅ `201 Created` → TODO BIEN
- ❌ `400 Bad Request` → Error en payload
- ❌ `500 Internal Server Error` → Error en backend

**Si es 201:**
```
✅ Modal debe cerrarse
✅ Tabla debe actualizarse
✅ Nueva fila debe aparecer
```

---

## 📊 PASO 4: Test de Barra de Progreso (2 min)

### 4.1 Ir a Proyectos
```
http://localhost:5173/proyectos
```

### 4.2 Buscar un proyecto
- Que tenga contratos
- Que tenga la programación que creaste

### 4.3 Verificar barra
**Debe aparecer una barra de avance con:**
- ✅ Porcentaje (0-100%)
- ✅ Color según avance (verde/azul/ámbar/rojo)
- ✅ Indicación "(por programaciones)"

**Si no aparece:**
- Haz F5 (refresh)
- Espera 2 segundos
- Debe aparecer

### 4.4 Crear Registro Diario
- Ir a `/programacion`
- Click en la programación que creaste
- Click: **"Registrar ejecución"**
- Ingresar cantidad: `1`
- Guardar

### 4.5 Volver a Proyectos
- Vuelve a `/proyectos`
- Haz F5 (refresh)
- **La barra debe actualizar su porcentaje** ✅

---

## ✅ CHECKLIST DE VALIDACIÓN

| Paso | Acción | Resultado | Status |
|------|--------|-----------|--------|
| 1 | Ver git status | Archivos modificados | ✅ |
| 2 | Backend corriendo | Server listening | ✅ |
| 3 | Frontend corriendo | Local: 5173 | ✅ |
| 4 | Crear programación | Modal cierra | ✅ |
| 5 | Network 201 | Created exitoso | ✅ |
| 6 | Console log | 📤 PAYLOAD aparece | ✅ |
| 7 | Barra en proyectos | Se muestra | ✅ |
| 8 | Barra con color | Dinámico | ✅ |
| 9 | Crear registro | Ejecución guardada | ✅ |
| 10 | Barra actualiza | Porcentaje cambia | ✅ |

**Si todos = ✅ → LISTO PARA PUSH** 🚀

---

## 🚀 PASO 5: Push a Producción

```bash
git add .
git commit -m "fix: normalizar lote en programación + barra dinámica

- Frontend: Normaliza lote como objeto {codigo, nombre}
- Backend: Recibe lote en formato correcto
- Proyectos: Barra se actualiza dinámicamente con programaciones
- Status: 201 Created en lugar de 400 Bad Request"
git push origin main
```

**Esperar:**
- ⏱️ 2-3 minutos en Render/Vercel
- 🔍 Revisar logs de deploy
- ✅ Confirmar build exitoso

**Validar en Producción:**
```
https://tu-dominio.com/programacion
```

Repetir pasos 3.1-3.4

---

## 🆘 TROUBLESHOOTING RÁPIDO

### ❌ "Lote es obligatorio" sigue apareciendo

**Checklist:**
1. ¿El modal muestra lotes?
   - No → Error en BD, contratos sin lotes
   - Sí → Continúa

2. ¿Estás seleccionando un lote?
   - No → Selecciona uno
   - Sí → Continúa

3. ¿Aparece 📤 PAYLOAD en console?
   - No → Error en JavaScript (F12 → console)
   - Sí → Continúa

4. ¿El lote es un objeto?
   ```javascript
   // Esperado:
   "lote": {"codigo": "Lote9", "nombre": "Lote9"}
   
   // No esperado:
   "lote_id": "mongodb_id"
   ```
   - Si no es objeto → Revisar handleGuardar
   - Si es objeto → Backend no está actualizado

---

### ❌ Barra no aparece en proyectos

**Solución rápida:**
```bash
# 1. Frontend
npm run dev

# 2. Hacer F5 en /proyectos
# Esperar 2 segundos

# 3. Si no aparece, revisar console (F12)
# Buscar error relacionado a programacionService

# 4. Si hay error, backend no devuelve programaciones
# Revisar endpoint: GET /api/v1/programaciones
```

---

### ❌ Error 500 en Network

**Solución:**
```bash
# Backend tiene bug
git pull origin main
npm install
npm run dev

# Frontend intenta nuevamente
```

---

## 📱 RESUMEN FINAL

**Tiempo total:** ~5 minutos

**Cambios realizados:**
- ✅ ModalCrearProgramacion: Normaliza lote
- ✅ ProyectosPage: Barra dinámica

**Resultado esperado:**
- ✅ Programaciones se crean sin errores
- ✅ Status 201 en Network
- ✅ Barra en proyectos se actualiza automáticamente

**Siguiente:** `git push` 🚀

---

**Documento:** QUICK_START.md  
**Versión:** 1.0  
**Estado:** LISTO PARA VALIDAR
