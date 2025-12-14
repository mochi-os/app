const endpoints = {
  auth: {
    code: '/_/code',
    verify: '/_/verify',
    identity: '/_/identity',
    logout: '/_/logout',
  },
  apps: {
    list: 'list',
    get: (id: string) => `view/${id}`,
    create: 'create',
    uploadVersion: (id: string) => `${id}/version/create`,
  },
} as const

export type Endpoints = typeof endpoints

export default endpoints
