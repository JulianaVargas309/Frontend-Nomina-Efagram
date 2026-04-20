import httpClient from '../../../core/api/httpClient';
import { endpoints } from '../../../core/api/endpoints';

// ==========================================
// CRUD USUARIOS
// ==========================================

/**
 * Obtener lista de usuarios con paginación y filtros
 * @param {number} page - Número de página (default: 1)
 * @param {number} limit - Límite por página (default: 10)
 * @param {string} search - Buscar por nombre o email
 * @param {string} rol - Filtrar por rol (ADMIN_SISTEMA, SUPERVISOR, TRABAJADOR)
 * @param {boolean} activo - Filtrar por estado
 * @returns {Promise}
 */
export const getUsuarios = async (page = 1, limit = 10, search = '', rol = '', activo = '') => {
    const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(rol && { rol }),
        ...(activo !== '' && { activo }),
    });

    const response = await httpClient.get(`${endpoints.usuarios.getAll}?${params}`);
    // La API devuelve { success: true, data: { usuarios: [...], paginacion: {...} } }
    return response.data?.data || { usuarios: [], paginacion: {} };
};

/**
 * Obtener usuario por ID
 * @param {string} id - ID del usuario
 * @returns {Promise}
 */
export const getUsuarioById = async (id) => {
    const response = await httpClient.get(endpoints.usuarios.getOne(id));
    return response.data?.data || null;
};

/**
 * Crear nuevo usuario
 * @param {Object} payload - { nombre, email, password, roles }
 * @returns {Promise}
 */
export const createUsuario = async (payload) => {
    const response = await httpClient.post(endpoints.usuarios.create, payload);
    // La API devuelve { success: true, data: { usuario: {...}, tokens: {...} } }
    return response.data?.data || response.data;
};

/**
 * Actualizar datos del usuario (nombre, email, avatar)
 * @param {string} id - ID del usuario
 * @param {Object} payload - { nombre, email, avatar }
 * @returns {Promise}
 */
export const updateUsuario = async (id, payload) => {
    const response = await httpClient.put(endpoints.usuarios.update(id), payload);
    return response.data?.data || response.data;
};

/**
 * Cambiar contraseña del usuario
 * @param {string} id - ID del usuario
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise}
 */
export const updatePasswordUsuario = async (id, newPassword) => {
    const response = await httpClient.put(endpoints.usuarios.updatePassword(id), {
        newPassword,
    });
    return response.data?.data || response.data;
};

/**
 * Cambiar roles del usuario (solo admin)
 * @param {string} id - ID del usuario
 * @param {Array} roles - Array de roles (ADMIN_SISTEMA, SUPERVISOR)
 * @returns {Promise}
 */
export const updateRolesUsuario = async (id, roles) => {
    const response = await httpClient.put(endpoints.usuarios.updateRoles(id), {
        roles,
    });
    return response.data?.data || response.data;
};

/**
 * Activar usuario
 * @param {string} id - ID del usuario
 * @returns {Promise}
 */
export const activateUsuario = async (id) => {
    const response = await httpClient.put(endpoints.usuarios.activate(id));
    return response.data?.data || response.data;
};

/**
 * Desactivar usuario (soft delete)
 * @param {string} id - ID del usuario
 * @returns {Promise}
 */
export const deactivateUsuario = async (id) => {
    const response = await httpClient.put(endpoints.usuarios.deactivate(id));
    return response.data?.data || response.data;
};

/**
 * Eliminar usuario permanentemente (solo admin)
 * @param {string} id - ID del usuario
 * @returns {Promise}
 */
export const deleteUsuario = async (id) => {
    const response = await httpClient.delete(endpoints.usuarios.delete(id));
    return response.data;
};

// ==========================================
// ROLES Y PERMISOS
// ==========================================

/**
 * Obtener lista de roles disponibles
 * @returns {Promise}
 */
export const getRolesList = async () => {
    const response = await httpClient.get(endpoints.usuarios.rolesList);
    // La API devuelve { success: true, data: { roles: [...] } }
    return response.data?.data?.roles || [];
};

/**
 * Obtener permisos de un rol específico
 * @param {string} rol - Nombre del rol (ADMIN_SISTEMA, SUPERVISOR)
 * @returns {Promise}
 */
export const getRolePermissions = async (rol) => {
    const response = await httpClient.get(endpoints.usuarios.rolePermissions(rol));
    // La API devuelve { success: true, data: { rol, info, permisos, totalPermisos } }
    return response.data?.data || null;
};

// ==========================================
// ESTADÍSTICAS
// ==========================================

/**
 * Obtener estadísticas de usuarios
 * @returns {Promise}
 */
export const getUsuariosStats = async () => {
    const response = await httpClient.get(endpoints.usuarios.stats);
    // La API devuelve { success: true, data: { totalUsuarios, usuariosActivos, porRol, ... } }
    return response.data?.data || null;
};
