/**
 * Utilidades para validar y calcular distribución de porcentajes
 * en proyecto -> subproyecto -> contrato
 */

/**
 * Calcula el total de porcentaje de un array de items
 * @param {Array} items - Array de items con campo porcentaje
 * @param {string} field - Campo que contiene el porcentaje (default: 'porcentaje_distribuido')
 * @returns {number} - Total del porcentaje
 */
export const calcularTotalPorcentaje = (items = [], field = 'porcentaje_distribuido') => {
    return items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
};

/**
 * Valida que los porcentajes de un array sumen 100%
 * @param {Array} items - Array de items con porcentaje
 * @param {string} field - Campo que contiene el porcentaje
 * @param {number} tolerancia - Tolerancia de error permitida (default: 0.01)
 * @returns {object} - { valido: boolean, total: number, diferencia: number }
 */
export const validarDistribucionPorcentaje = (items = [], field = 'porcentaje_distribuido', tolerancia = 0.01) => {
    const total = calcularTotalPorcentaje(items, field);
    const diferencia = Math.abs(total - 100);

    return {
        valido: diferencia <= tolerancia,
        total: Math.round(total * 100) / 100, // Redondear a 2 decimales
        diferencia: Math.round(diferencia * 100) / 100,
        exceso: total > 100,
    };
};

/**
 * Obtiene mensajes de validación de porcentajes
 * @param {Array} items - Array de items
 * @param {string} field - Campo del porcentaje
 * @param {string} nombreEntidad - Nombre de la entidad (ej: "subproyectos", "contratos")
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const getMensajePorcentaje = (items = [], field = 'porcentaje_distribuido', nombreEntidad = 'elementos') => {
    const validacion = validarDistribucionPorcentaje(items, field);

    if (validacion.total === 0) {
        return `Sin porcentaje asignado en los ${nombreEntidad}`;
    }

    if (validacion.exceso) {
        return `El total de porcentajes (${validacion.total}%) excede el 100%. Reduce ${validacion.diferencia}%`;
    }

    if (!validacion.valido) {
        return `El total de porcentajes (${validacion.total}%) no suma 100%. Agrega ${validacion.diferencia}%`;
    }

    return null;
};

/**
 * Obtiene información visual para mostrar el estado de distribución
 * @param {Array} items - Array de items
 * @param {string} field - Campo del porcentaje
 * @returns {object} - { color, icon, mensaje, valido }
 */
export const getEstadoDistribucion = (items = [], field = 'porcentaje_distribuido') => {
    const validacion = validarDistribucionPorcentaje(items, field);

    if (validacion.total === 0) {
        return {
            color: '#94a3b8',
            icon: '⚠️',
            mensaje: 'Sin asignar',
            valido: false,
        };
    }

    if (validacion.exceso) {
        return {
            color: '#dc2626',
            icon: '❌',
            mensaje: `Exceso: +${validacion.diferencia}%`,
            valido: false,
        };
    }

    if (!validacion.valido) {
        return {
            color: '#f59e0b',
            icon: '⚠️',
            mensaje: `Falta: ${validacion.diferencia}%`,
            valido: false,
        };
    }

    return {
        color: '#10b981',
        icon: '✅',
        mensaje: '100% distribuido',
        valido: true,
    };
};
