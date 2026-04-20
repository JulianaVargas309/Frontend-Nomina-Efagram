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
  },
  clientes: {
    getAll: '/clientes',
    create: '/clientes',
  },
  usuarios: {
    getAll: 'https://backend-nomina-efagram.onrender.com/api/v1/Users',
    create: 'https://backend-nomina-efagram.onrender.com/api/v1/Users',
    update: (id) => `https://backend-nomina-efagram.onrender.com/api/v1/Users/${id}`,
    delete: (id) => `https://backend-nomina-efagram.onrender.com/api/v1/Users/${id}`,
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