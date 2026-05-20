# 🎨 GUÍA VISUAL: Sistema de Aprobación de Contratos

## 📊 Arquitectura Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                       NAVEGACIÓN EN MENÚ                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dashboard                                                      │
│  Reportes                                                       │
│  Ejecución                                                      │
│  Programación                                                   │
│  ├─ 🔴 Proyectos (badge rojo si hay pendientes)                │
│  │  ├─ Proyectos                                               │
│  │  ├─ Subproyectos                                            │
│  │  ├─ 🟡 Contratos (badge amarillo si hay pendientes)        │
│  │  │  └─ Tabla con todos los contratos                       │
│  │  └─ 🔴 Por Aprobar (badge rojo con número)                 │
│  │     └─ ⭐ NUEVA PÁGINA - Solo PENDIENTES                   │
│  │        ├─ Botón ✅ APROBAR → ACTIVO                        │
│  │        ├─ Botón ❌ RECHAZAR → CANCELADO                    │
│  │        └─ Botón 👁️ VER DETALLE                             │
│  │                                                              │
│  Personal                                                       │
│  Configuración                                                  │
│  └─ ...                                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1️⃣ ContratoModal (Crear/Editar)                                       │
│     ├─ Forma datos del contrato                                        │
│     ├─ NO envía estado en creación ✅ (Cambio #2)                     │
│     └─ Hace POST a /api/v1/contratos                                  │
│                                                                         │
│  2️⃣ contratosService (Interceptor)                                     │
│     ├─ Llama al backend ✅                                             │
│     ├─ NO modifica response.data ✅ (Cambio #1)                       │
│     └─ Retorna tal como viene del servidor                            │
│                                                                         │
│  3️⃣ Sidebar (Notificaciones)                                           │
│     ├─ Carga contratos cada 30 segundos ✅ (Cambio #5)               │
│     ├─ Filtra los PENDIENTE                                           │
│     ├─ Muestra badges: Proyectos, Contratos, Por Aprobar             │
│     └─ Se actualiza automáticamente                                   │
│                                                                         │
│  4️⃣ ContratosPorAprobarPage ⭐ (Nueva)                                │
│     ├─ Carga solo contratos PENDIENTE                                 │
│     ├─ Tabla con opción de buscar                                     │
│     ├─ Botón ✅ APROBAR → PUT { estado: 'ACTIVO' }                   │
│     └─ Botón ❌ RECHAZAR → PUT { estado: 'CANCELADO' }              │
│                                                                         │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                    API CALLS HTTP
                           │
┌──────────────────────────▼───────────────────────────────────────────────┐
│                         BACKEND (Express)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  POST /api/v1/contratos                                               │
│  └─ Crea contrato con estado PENDIENTE (default del schema)           │
│     └─ Retorna { ...datos, estado: 'PENDIENTE' }                      │
│                                                                         │
│  GET /api/v1/contratos                                                │
│  └─ Retorna todos los contratos (con todos los estados)               │
│                                                                         │
│  PUT /api/v1/contratos/:id { estado: 'ACTIVO' }                      │
│  └─ Aprueba contrato (Jefe ejecuta esta acción)                       │
│                                                                         │
│  PUT /api/v1/contratos/:id { estado: 'CANCELADO' }                   │
│  └─ Rechaza contrato (Jefe ejecuta esta acción)                       │
│                                                                         │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                      Base de Datos
                           │
┌──────────────────────────▼───────────────────────────────────────────────┐
│                      MONGODB (Persistencia)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  colección: contratos                                                  │
│  ├─ {                                                                  │
│  │   _id: ObjectId,                                                   │
│  │   codigo: "CON-001",                                               │
│  │   estado: "PENDIENTE",  ◄─ FUENTE DE VERDAD ✅                   │
│  │   finca: {...},                                                    │
│  │   lotes: [...],                                                    │
│  │   actividades: [...],                                              │
│  │   cuadrillas: [...],                                               │
│  │   ...más campos                                                    │
│  │ }                                                                   │
│  └─ ...                                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎬 Secuencia Paso a Paso

### **Escenario 1: Crear Nuevo Contrato**

```
PASO 1: Usuario llena formulario
        ├─ Código: CON-001
        ├─ Finca: Finca A
        ├─ Lotes: [Lote 1, Lote 2]
        ├─ Actividades: [Act 1, Act 2]
        └─ Cuadrillas: [CUA-001, CUA-002]

PASO 2: Click en "Guardar"
        └─ ContratoModal.handleSave() se ejecuta

PASO 3: Crear payload
        ├─ codigo: "CON-001"
        ├─ finca: {...}
        ├─ lotes: [...]
        ├─ actividades: [...]
        ├─ cuadrillas: [...]
        └─ ❌ NO incluye 'estado' (porque es creación) ✅

PASO 4: POST /api/v1/contratos
        └─ Backend recibe sin estado

PASO 5: Backend aplica default
        ├─ estado: 'PENDIENTE' (del schema)
        └─ Guarda en MongoDB

PASO 6: Backend retorna respuesta
        ├─ { _id, codigo, estado: 'PENDIENTE', ... }
        └─ Frontend recibe

PASO 7: Frontend NO modifica
        ├─ Antes: response.data.estado = 'PENDIENTE' ❌ (Removido)
        └─ Ahora: Retorna tal como viene ✅

PASO 8: Sidebar se actualiza
        ├─ Detecta nuevo PENDIENTE
        ├─ Incrementa badge
        └─ Muestra: Proyectos 🔴1, Contratos 🟡1, Por Aprobar 🔴1

RESULTADO: ✅ Contrato creado con estado PENDIENTE en la BD
```

---

### **Escenario 2: Jefe Aprueba Contrato**

```
PASO 1: Jefe navegó a "Por Aprobar"
        └─ Ve tabla con contratos PENDIENTE

PASO 2: Jefe ve CON-001 en la tabla
        ├─ Puede hacer click en "Ver detalle" para revisar
        ├─ O click en "✅ APROBAR" directamente
        └─ Confirma en diálogo: "¿Aprobar CON-001?"

PASO 3: Click APROBAR
        └─ handleAprobar(contrato) se ejecuta

PASO 4: PUT /api/v1/contratos/:id
        └─ { estado: 'ACTIVO' }

PASO 5: Backend actualiza
        ├─ Busca contrato por :id
        ├─ Cambia estado: 'PENDIENTE' → 'ACTIVO'
        └─ Retorna contrato actualizado

PASO 6: Frontend recarga tabla
        ├─ Llama a cargar()
        └─ getContratos() filtra solo PENDIENTE

PASO 7: CON-001 ya no aparece
        ├─ Porque su estado es ACTIVO (no PENDIENTE)
        └─ Se removió de "Por Aprobar"

PASO 8: Sidebar se actualiza automáticamente
        ├─ En 30 segundos máximo
        ├─ Decrementa todos los badges
        └─ Proyectos 🔴0, Contratos 🟡0, Por Aprobar 🔴0

PASO 9: Jefe navega a "Contratos"
        ├─ Ve CON-001 con estado ✅ ACTIVO
        └─ Puede editarlo si es necesario

RESULTADO: ✅ Contrato aprovado, estado ACTIVO en BD
```

---

### **Escenario 3: Jefe Rechaza Contrato**

```
PASO 1-3: Igual a Escenario 2, pero click ❌ RECHAZAR

PASO 4: PUT /api/v1/contratos/:id
        └─ { estado: 'CANCELADO' }

PASO 5-9: Igual al Escenario 2, pero:
        └─ estado: 'ACTIVO' cambia a 'CANCELADO'

RESULTADO: ✅ Contrato rechazado, estado CANCELADO en BD
           └─ Ya no se puede editar
           └─ No aparece en "Por Aprobar" nunca más
```

---

## 🎯 Los 5 Cambios Visualizados

### **Cambio 1️⃣: Service - Remover Modificación**

```
ANTES:
┌──────────────────────────────────────┐
│ Frontend crea: { estado: 'ACTIVO' }  │
└────────┬─────────────────────────────┘
         │ POST
         ▼
┌──────────────────────────────────────┐
│ Backend guarda: ACTIVO               │
└────────┬─────────────────────────────┘
         │ Response
         ▼
┌──────────────────────────────────────┐
│ { estado: 'ACTIVO' }                 │
└────────┬─────────────────────────────┘
         │ Service modifica 🚫
         ▼
┌──────────────────────────────────────┐
│ response.data.estado = 'PENDIENTE'   │
│ (SOLO EN MEMORIA, NO EN BD) 🔴      │
└──────────────────────────────────────┘

DESPUÉS:
┌──────────────────────────────────────┐
│ Frontend NO envía estado             │
└────────┬─────────────────────────────┘
         │ POST
         ▼
┌──────────────────────────────────────┐
│ Backend aplica default: PENDIENTE ✅ │
└────────┬─────────────────────────────┘
         │ Response
         ▼
┌──────────────────────────────────────┐
│ { estado: 'PENDIENTE' }              │
└────────┬─────────────────────────────┘
         │ Retorna sin modificar ✅
         ▼
┌──────────────────────────────────────┐
│ Estado real de la BD: PENDIENTE 🟢  │
└──────────────────────────────────────┘
```

---

### **Cambio 2️⃣: Modal - No Enviar Estado**

```
CREAR CONTRATO:
┌────────────────────────────────────────────┐
│ payload = {                                │
│   codigo: 'CON-001',                       │
│   finca: {...},                            │
│   lotes: [...],                            │
│   actividades: [...],                      │
│   cuadrillas: [...],                       │
│   ❌ NO: estado: 'ACTIVO'                 │
│   ✅ (Dejamos que backend lo defina)      │
│ }                                          │
└────────────────────────────────────────────┘

EDITAR CONTRATO:
┌────────────────────────────────────────────┐
│ payload = {                                │
│   codigo: 'CON-001',                       │
│   ...campos...                             │
│   ✅ if (modo === 'editar') {             │
│        payload.estado = form.estado;      │
│      }                                      │
│ }                                          │
└────────────────────────────────────────────┘
```

---

### **Cambio 3️⃣: Nueva Página "Por Aprobar"**

```
ContratosPage (Existente):
┌───────────────────────────────────────────┐
│ TODOS los contratos                       │
├───────────────────────────────────────────┤
│ CON-001  FINCA-A  Activo      ✏️ 🗑️ 👁️  │
│ CON-002  FINCA-B  Cancelado   ✏️ 🗑️ 👁️  │
│ CON-003  FINCA-C  Borrador    ✏️ 🗑️ 👁️  │
│ CON-004  FINCA-D  Pendiente   ✏️ 🗑️ 👁️  │
│ CON-005  FINCA-E  Cerrado     ✏️ 🗑️ 👁️  │
└───────────────────────────────────────────┘

⭐ ContratosPorAprobarPage (NUEVA):
┌───────────────────────────────────────────┐
│ SOLO PENDIENTES                           │
├───────────────────────────────────────────┤
│ CON-004  FINCA-D  👁️ ✅ APROBAR ❌ RECHAZAR│
│ (... otros PENDIENTES ...)                │
└───────────────────────────────────────────┘
```

---

### **Cambio 4️⃣: Ruta en AppRouter**

```
RUTAS DISPONIBLES (Después del cambio):

/proyectos/contratos
    ├─ ContratosPage
    │  └─ Todos los contratos
    │
    └─ /por-aprobar ⭐ (NUEVA)
       └─ ContratosPorAprobarPage
          └─ Solo PENDIENTES
```

---

### **Cambio 5️⃣: Notificaciones en Sidebar**

```
MENÚ ANTES:
├─ Proyectos
│  ├─ Proyectos
│  ├─ Subproyectos
│  ├─ Contratos
│  └─ (Sin notificaciones 😞)

MENÚ DESPUÉS:
├─ 🔴 Proyectos (badge rojo si hay pendientes)
│  ├─ Proyectos
│  ├─ Subproyectos
│  ├─ 🟡 Contratos (badge amarillo)
│  └─ ⭐ 🔴 Por Aprobar (badge rojo con número)
│
└─ Se actualiza cada 30 segundos automáticamente ⏰
```

---

## 📈 Estados del Sistema

```
┌─────────────────────────────────────────────────────┐
│          MÁQUINA DE ESTADOS (Contratos)             │
├─────────────────────────────────────────────────────┤
│                                                     │
│    CREACIÓN                                         │
│       │                                             │
│       ▼                                             │
│    ┌──────────┐                                     │
│    │PENDIENTE │ ◄──── DEFAULT (Un solo origen)      │
│    │(NUEVO)   │                                     │
│    └────┬─────┘                                     │
│         │ (Jefe Operaciones decide)                │
│    ┌────┴────┐                                      │
│    │          │                                      │
│    ▼          ▼                                      │
│  ┌──────┐ ┌──────────┐                              │
│  │ACTIVO│ │CANCELADO │ ◄───── FINAL (Sin retorno) │
│  └───┬──┘ └──────────┘                              │
│      │ (Trabajo ejecutado)                          │
│      ▼                                              │
│   ┌──────┐                                          │
│   │CERRADO│ ◄────── COMPLETADO (Final)             │
│   └───────┘                                         │
│                                                     │
│ Otros estados (BORRADOR) no se usan en este flujo  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Componentes UI

```
PÁGINA: ContratosPorAprobarPage

┌─────────────────────────────────────────────────────────┐
│ Contratos por Aprobar                                   │
│ Contratos en estado PENDIENTE esperando aprobación     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ⏳ Por Aprobar: 3                                       │
│                                                         │
│ 🔍 Buscar por código, finca o cuadrilla... [______]   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Tabla:                                                  │
│  Código │ Finca │ Lotes │ Actividades │ Cuadrillas   │
│ ─────────────────────────────────────────────────────  │
│ CON-001 │ A     │ 👁️   │ 👁️         │ 👁️           │
│         │       │ 2    │ 2           │ 2            │
│         │       │       │             │              │
│         │       │       │  ┌─────────────────┐       │
│         │       │       │  │ 👁️ ✅ ❌        │       │
│         │       │       │  │ Ver Aprobar Rech│       │
│         │       │       │  └─────────────────┘       │
│                                                         │
│ CON-002 │ B     │ ...   │ ...         │ ...          │
│ ...     │ ...   │ ...   │ ...         │ ...          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Ciclo de Actualización

```
PRIMERA VEZ (Al abrir la página):
1. Sidebar.useEffect() se ejecuta
2. getContratos() trae todos
3. Filtra PENDIENTE
4. Muestra en badges

CADA 30 SEGUNDOS (Automático):
1. useEffect interval dispara
2. getContratos() trae todos nuevamente
3. Filtra PENDIENTE (puede haber aumentado o disminuido)
4. Actualiza badges
5. Si usuario está en "Por Aprobar", puede recargar manualmente

CUANDO APRUEBA/RECHAZA:
1. Llama updateContrato()
2. Backend cambia estado
3. Llama cargar() para refresco inmediato
4. Tabla actualiza
5. Sidebar notifica (en máximo 30 segundos)
```

---

## ✨ Resultados Visibles

```
SIN IMPLEMENTACIÓN:
❌ Contratos ACTIVO desde el inicio
❌ No hay lugar para aprobar
❌ Confusión en el flujo
❌ Sin notificaciones

CON IMPLEMENTACIÓN:
✅ Contratos PENDIENTE desde el inicio
✅ Página "Por Aprobar" dedicada
✅ Flujo PENDIENTE → ACTIVO/CANCELADO claro
✅ Badges en menú notifican automáticamente
✅ Un solo origen de verdad (MongoDB)
```

---

**Última actualización:** 19 Mayo 2026  
**Versión:** 1.0
