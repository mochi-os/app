const endpoints = {
  apps: {
    list: '/app/list',
    get: (id: string) => `/app/view/${id}`,
    create: '/app/create',
    uploadVersion: (id: string) => `/app/${id}/version/create`,
  },
} as const

export type Endpoints = typeof endpoints

export default endpoints
