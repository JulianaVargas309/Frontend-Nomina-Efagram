# 📊 Sistema de Distribución de Porcentajes

## 🎯 Descripción General

Este sistema permite distribuir porcentajes de forma jerárquica:
- **Proyecto**: 100% total disponible
- **Subproyectos**: Distribuyen el 100% del proyecto (ej: 20%, 20%, 10%, 50%)
- **Contratos**: Distribuyen el % del subproyecto (ej: si subproyecto es 20%, los contratos pueden ser 10% + 10%)
- **Programación**: Refleja automáticamente estos datos

## 🏗️ Estructura de Datos

### Subproyecto
```javascript
{
  _id: "...",
  codigo: "PRO-001-SP-001",
  nombre: "Subproyecto 1",
  porcentaje_distribuido: 25,  // ← Campo nuevo
  // ... otros campos
}
```

### Contrato
```javascript
{
  _id: "...",
  codigo: "CON-001",
  subproyecto: "...",
  porcentaje_distribuido: 15,  // ← Campo nuevo (máx 25% si subproyecto es 25%)
  // ... otros campos
}
```

## 🎮 Uso en la UI

### 1️⃣ Crear Subproyecto
**Ubicación**: `src/features/proyectos/pages/SubproyectosPage.jsx`

1. Abre el modal "Nuevo Subproyecto"
2. Completa los datos básicos
3. En el campo **"Porcentaje distribuido del proyecto"**, ingresa el % (ej: 25%)
4. Guarda el subproyecto

**Validación**: SubproyectosPage mostrará una alerta si los porcentajes no suman 100%

### 2️⃣ Crear Contrato
**Ubicación**: `src/features/contratos/pages/ContratosPage.jsx`

1. Abre el modal "Nuevo Contrato"
2. Selecciona el subproyecto
3. Ve a la pestaña "Datos"
4. En el campo **"Porcentaje distribuido del subproyecto"**, ingresa el % (máximo el % del subproyecto)
5. Guarda el contrato

**Validación**: La interfaz no permite exceder el porcentaje del subproyecto

### 3️⃣ Visualizar en Subproyectos
En la tabla de subproyectos verás:
- **Columna "Porcentaje"**: Barra visual + número con 1 decimal
- **Alerta roja**: Si los porcentajes no suman 100%

### 4️⃣ Visualizar en Contratos
Cada contrato mostrará su porcentaje asignado en la tabla

## 🛠️ Componentes y Utilidades

### `porcentajeUtils.js`
Funciones helper para validar y calcular porcentajes:

```javascript
import { 
  calcularTotalPorcentaje,
  validarDistribucionPorcentaje,
  getMensajePorcentaje,
  getEstadoDistribucion
} from '../utils/porcentajeUtils';

// Calcular total
const total = calcularTotalPorcentaje(subproyectos, 'porcentaje_distribuido');
// → 100

// Validar distribución
const validacion = validarDistribucionPorcentaje(subproyectos, 'porcentaje_distribuido');
// → { valido: true, total: 100, diferencia: 0, exceso: false }

// Obtener mensaje de error
const mensaje = getMensajePorcentaje(subproyectos, 'porcentaje_distribuido', 'subproyectos');
// → null (si es válido) o string con el error

// Obtener estado visual
const estado = getEstadoDistribucion(subproyectos, 'porcentaje_distribuido');
// → { color: '#10b981', icon: '✅', mensaje: '100% distribuido', valido: true }
```

### `ValidadorPorcentajes.jsx`
Componente visual para mostrar validación:

```jsx
import ValidadorPorcentajes from '../components/ValidadorPorcentajes';

// Uso en una página
<ValidadorPorcentajes
  items={subproyectos}
  campo="porcentaje_distribuido"
  nombreEntidad="subproyectos"
  mostrarDetalle={true}
  compacto={false}
/>

// Uso compacto
<ValidadorPorcentajes
  items={contratos}
  campo="porcentaje_distribuido"
  nombreEntidad="contratos"
  compacto={true}
/>
```

## ✅ Checklist de Implementación

- [x] Agregar campo `porcentaje_distribuido` a SubproyectoModal
- [x] Agregar columna de porcentaje en SubproyectosPage
- [x] Mostrar alerta si subproyectos no suman 100%
- [x] Agregar campo `porcentaje_distribuido` a ContratoModal
- [x] Crear utilidades de validación
- [x] Crear componente ValidadorPorcentajes
- [ ] Integrar validación en página de contratos
- [ ] Mostrar información de porcentajes en programación
- [ ] Agregar reportes de distribución de porcentajes

## 📋 Ejemplos de Casos de Uso

### Caso 1: Proyecto de $100M con 3 subproyectos
- Subproyecto 1: 40%
- Subproyecto 2: 35%
- Subproyecto 3: 25%
- **Total**: 100% ✅

### Caso 2: Subproyecto de 40% con 2 contratos
- Contrato 1: 25% (del subproyecto)
- Contrato 2: 15% (del subproyecto)
- **Total**: 40% ✅

### Caso 3: Error de distribución
- Subproyecto 1: 30%
- Subproyecto 2: 50%
- Subproyecto 3: 15%
- **Total**: 95% ❌ (Falta 5%)

## 🔄 Flujo de Datos

```
Proyecto (100%)
  ├── Subproyecto A (40%)
  │   ├── Contrato 1 (20%)
  │   ├── Contrato 2 (15%)
  │   └── Contrato 3 (5%)
  │       └── Programación utiliza el 5%
  ├── Subproyecto B (35%)
  │   ├── Contrato 4 (20%)
  │   └── Contrato 5 (15%)
  │       └── Programación utiliza el 15%
  └── Subproyecto C (25%)
      └── Contrato 6 (25%)
          └── Programación utiliza el 25%
```

## 🚨 Notas Importantes

1. Los porcentajes permiten decimales (ej: 33.3%)
2. La validación usa una tolerancia de 0.01% (para errores de redondeo)
3. Los porcentajes no pueden ser negativos ni mayores a 100%
4. Si un contrato no tiene porcentaje asignado, se considera 0%
5. En programación, los datos se filtran y reflejan según estos porcentajes

## 📞 Soporte

Para más información sobre la implementación, revisar:
- `src/features/proyectos/utils/porcentajeUtils.js`
- `src/features/proyectos/components/ValidadorPorcentajes.jsx`
- `src/features/proyectos/components/SubproyectoModal.jsx`
- `src/features/contratos/components/ContratoModal.jsx`
