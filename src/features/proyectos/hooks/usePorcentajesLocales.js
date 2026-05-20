/**
 * Hook personalizado para gestionar porcentajes localmente con localStorage
 * Ubicación: src/features/proyectos/hooks/usePorcentajesLocales.js
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'app_porcentajes_distribuidos';

/**
 * Hook para guardar y recuperar porcentajes de forma local
 */
export function usePorcentajesLocales() {
    const [porcentajes, setPorcentajes] = useState({
        subproyectos: {}, // { subproyectoId: 25.5 }
        contratos: {},    // { contratoId: 15.2 }
    });

    // Cargar porcentajes del localStorage al montar
    useEffect(() => {
        try {
            const guardados = localStorage.getItem(STORAGE_KEY);
            if (guardados) {
                setPorcentajes(JSON.parse(guardados));
                console.log('✅ Porcentajes cargados del localStorage:', JSON.parse(guardados));
            }
        } catch (e) {
            console.error('❌ Error cargando porcentajes:', e);
        }
    }, []);

    // Guardar porcentajes en localStorage
    const guardarPorcentaje = (tipo, id, valor) => {
        try {
            setPorcentajes(prev => {
                const nuevo = {
                    ...prev,
                    [tipo]: {
                        ...prev[tipo],
                        [id]: Number(valor) || 0,
                    }
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo));
                console.log(`💾 Porcentaje guardado: ${tipo}[${id}] = ${valor}%`);
                return nuevo;
            });
        } catch (e) {
            console.error('❌ Error guardando porcentaje:', e);
        }
    };

    // Obtener porcentaje de un item
    const obtenerPorcentaje = (tipo, id) => {
        return porcentajes[tipo]?.[id] ?? 0;
    };

    // Obtener todos los porcentajes de un tipo
    const obtenerPorcentajesTipo = (tipo) => {
        return porcentajes[tipo] ?? {};
    };

    // Limpiar todos los porcentajes
    const limpiar = () => {
        setPorcentajes({
            subproyectos: {},
            contratos: {},
        });
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Porcentajes limpiados');
    };

    return {
        porcentajes,
        guardarPorcentaje,
        obtenerPorcentaje,
        obtenerPorcentajesTipo,
        limpiar,
    };
}

/**
 * Hook para sincronizar porcentajes de un array de items
 */
export function usePorcentajesArray(items = [], tipo = 'subproyectos') {
    const { porcentajes, guardarPorcentaje, obtenerPorcentajesTipo } = usePorcentajesLocales();

    // Enriquecer items con porcentajes desde localStorage
    const itemsConPorcentajes = items.map(item => ({
        ...item,
        porcentaje_distribuido: item.porcentaje_distribuido || obtenerPorcentaje(tipo, item._id) || 0,
    }));

    const actualizarPorcentaje = (id, valor) => {
        guardarPorcentaje(tipo, id, valor);
    };

    return {
        itemsConPorcentajes,
        actualizarPorcentaje,
        obtenerTodos: () => obtenerPorcentajesTipo(tipo),
    };
}
