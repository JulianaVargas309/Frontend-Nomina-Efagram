export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
  },
  proyectos: {
    getAll: '/proyectos',
    create: '/proyectos',
    update: (id) => `/proyectos/${id}`,
    delete: (id) => `/proyectos/${id}`,
    // Endpoints de progreso
    progreso: (id) => `/proyectos/${id}/progreso`,
    subproyectosProgreso: (id) => `/proyectos/${id}/subproyectos-progreso`,
    progresosAll: '/proyectos/progresos/todos',
  },
  subproyectos: {
    progreso: (id) => `/subproyectos/${id}/progreso`,
  },
  clientes: {
    getAll: '/clientes',
    create: '/clientes',
  },
  usuarios: {
    getAll: '/users', // GET con query params: page, limit, search, rol, activo
    getOne: (id) => `/users/${id}`,
    create: '/users',
    update: (id) => `/users/${id}`,
    updatePassword: (id) => `/users/${id}/password`,
    updateRoles: (id) => `/users/${id}/roles`,
    activate: (id) => `/users/${id}/activate`,
    deactivate: (id) => `/users/${id}/deactivate`,
    delete: (id) => `/users/${id}`,
    rolesList: '/users/roles/list',
    rolePermissions: (rol) => `/users/roles/${rol}/permissions`,
    stats: '/users/stats/dashboard',
  },
  actividades: {
    getAll: '/actividades',
  },
  contratos: {
    getAll: '/contratos',
    getOne: (id) => `/contratos/${id}`,
    create: '/contratos',
    update: (id) => `/contratos/${id}`,
    delete: (id) => `/contratos/${id}`,
    trabajadoresDisponibles: (id) => `/contratos/${id}/trabajadores-disponibles`,
  },
};