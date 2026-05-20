/**
 * Componente: Validador de Distribución de Porcentajes
 * Ubicación: src/features/proyectos/components/ValidadorPorcentajes.jsx
 * 
 * Muestra una validación visual de la distribución de porcentajes
 * para proyectos, subproyectos y contratos.
 */

import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { calcularTotalPorcentaje, getEstadoDistribucion, getMensajePorcentaje } from '../utils/porcentajeUtils';

export default function ValidadorPorcentajes({
    items = [],
    campo = 'porcentaje_distribuido',
    nombreEntidad = 'elementos',
    mostrarDetalle = true,
    compacto = false,
}) {
    const estado = getEstadoDistribucion(items, campo);
    const total = calcularTotalPorcentaje(items, campo);
    const mensaje = getMensajePorcentaje(items, campo, nombreEntidad);

    if (compacto) {
        return (
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: `${estado.color}22`,
                    border: `1.5px solid ${estado.color}44`,
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 700, color: estado.color }}>
                    {estado.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: estado.color }}>
                    {total.toFixed(1)}%
                </span>
            </div>
        );
    }

    if (!mensaje) {
        return (
            <div
                style={{
                    background: '#f0faf4',
                    border: '1.5px solid #bbf7d0',
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                }}
            >
                <CheckCircle2 size={18} color="#1f8f57" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1f8f57', marginBottom: 2 }}>
                        ✅ Distribución correcta
                    </div>
                    {mostrarDetalle && (
                        <div style={{ fontSize: 13, color: '#15803d' }}>
                            {nombreEntidad.charAt(0).toUpperCase() + nombreEntidad.slice(1)} suman exactamente 100%
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Determinar si es advertencia o error
    const esError = estado.exceso || total === 0;
    const color = total === 0 ? '#94a3b8' : estado.exceso ? '#dc2626' : '#f59e0b';
    const bgColor = total === 0 ? '#f1f5f9' : estado.exceso ? '#fef2f2' : '#fffbeb';
    const borderColor = total === 0 ? '#cbd5e1' : estado.exceso ? '#fecaca' : '#fde68a';

    return (
        <div
            style={{
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
            }}
        >
            <AlertCircle size={18} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: color, marginBottom: 2 }}>
                    {total === 0 ? '⚠️ Sin asignar' : estado.exceso ? '❌ Exceso de porcentaje' : '⚠️ Falta asignar'}
                </div>
                {mostrarDetalle && (
                    <div style={{ fontSize: 13, color: color }}>
                        {mensaje}
                    </div>
                )}
            </div>
        </div>
    );
}
