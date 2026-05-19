# 🎴 TARJETA DE REFERENCIA RÁPIDA

**Imprime esto o guárdalo en tu teléfono** 📱

---

## ❌ PROBLEMA

```
Error: "Lote es obligatorio"
Status: 400 Bad Request
Endpoint: POST /api/v1/programaciones
```

---

## ✅ SOLUCIÓN

### Archivo 1: ModalCrearProgramacion.jsx

**Busca:** `const handleGuardar = async () => {`

**Reemplaza:** La función completa

**Con:** Versión que normaliza lote

**Líneas afectadas:** ~78-150

---

### Archivo 2: ProyectosPage.jsx

**Cambios:**
- Importa `programacionService`
- Importa `BarraProgreso`
- Carga programaciones dinámicamente
- Reemplaza barra estática por componente

**Líneas afectadas:** Múltiples secciones

---

## 🧪 TEST RÁPIDO

### 1. Crear Programación
```
URL: http://localhost:5173/programacion
Acción: Click "Nueva Programación"
Esperado: Modal se abre
```

### 2. Llenar Formulario
```
Contrato: Cualquiera (ej: CON-011)
Lote: Cualquiera (ej: Lote9)
Fecha: Cualquiera (ej: 19/05/2026)
Cantidad: 2
```

### 3. Crear
```
Acción: Click "Crear Programación"
Esperado: Modal cierra, tabla actualiza
Verificar (F12): 
  - Console: 📤 PAYLOAD PROGRAMACION
  - Network: POST /api/v1/programaciones → 201
```

### 4. Verificar Barra
```
URL: http://localhost:5173/proyectos
Esperado: Barra de avance con porcentaje
Color dinámico: Verde/Azul/Ámbar/Rojo
```

---

## 🔧 TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| "Lote es obligatorio" | Revisar que handleGuardar está actualizado |
| Network 400 | Verificar lote sea objeto, no string |
| Barra no aparece | Hacer F5, esperar 2 seg |
| Console error | Revisar importaciones en ProyectosPage |
| Backend 500 | Backend no actualizado, hacer `git pull` |

---

## 📝 COMANDOS

```bash
# Verificar cambios
git status

# Ver diferencias
git diff src/features/programacion/components/ModalCrearProgramacion.jsx

# Commit
git add .
git commit -m "fix: normalizar lote en programación + barra dinámica"

# Push
git push origin main

# Backend
npm run dev

# Frontend
npm run dev
```

---

## 📊 PAYLOAD CORRECTO

```json
{
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

✅ `lote` DEBE ser un OBJETO con `codigo` y `nombre`

---

## 🎯 CHECKLIST DEPLOY

- [ ] Cambios en ModalCrearProgramacion.jsx
- [ ] Cambios en ProyectosPage.jsx
- [ ] Local test pasado
- [ ] Network muestra 201
- [ ] Console muestra 📤 PAYLOAD
- [ ] Barra aparece en /proyectos
- [ ] Git push exitoso
- [ ] Build en Render/Vercel exitoso
- [ ] Prod test pasado

---

## 📞 SOPORTE

**Si falla después de deploy:**

1. **Revisar Network (F12)**
   - ¿Status 201? → TODO OK
   - ¿Status 400? → Payload incorrecto
   - ¿Status 500? → Backend error

2. **Revisar Console (F12)**
   - ¿Aparece 📤 PAYLOAD? → Frontend correcto
   - ¿Aparece error? → Leer error

3. **Revisar Backend**
   - ¿Último `git pull`? → Sí/No
   - ¿`npm run dev`? → Sí/No

---

## 📚 DOCUMENTOS

| Archivo | Tiempo | Propósito |
|---------|--------|----------|
| README_SOLUCION.md | 2 min | Overview ultra-rápido |
| QUICK_START.md | 5 min | Validación rápida |
| RESUMEN_EJECUTIVO.md | 10 min | Para managers/leads |
| COMPARACION_ANTES_DESPUES.md | 15 min | Para code review |
| PROGRAMACION_FIX_GUIA.md | 30 min | Documentación oficial |

**👉 Empezar con:** README_SOLUCION.md (2 min)

---

## ⏰ TIEMPO ESTIMADO

```
Validación local: 5 min
Deploy: 3 min
Validación prod: 2 min
───────────────────
TOTAL: 10 min ⚡
```

---

## ✅ DESPUÉS DE DEPLOY

- Notificar al equipo que funciona
- Cerrar tickets/issues relacionados
- Documentar en wiki interna (si tienen)
- Celebrar 🎉

---

**Tarjeta:** REFERENCIA_RAPIDA.md  
**Versión:** 1.0  
**Para imprimir:** Sí ✅  
**¡Listo para usar!** 🚀
