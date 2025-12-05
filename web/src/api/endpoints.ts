const endpoints = {
  apps: {
    list: '/publisher/list',
    get: (id: string) => `/publisher/view/${id}`,
    create: '/publisher/create',
    uploadVersion: (id: string) => `/publisher/${id}/version/create`,
  },
} as const

export type Endpoints = typeof endpoints

export default endpoints
