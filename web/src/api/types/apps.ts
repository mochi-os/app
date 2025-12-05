export interface App {
  id: string
  name: string
  privacy: string
  fingerprint?: string
}

export interface Track {
  app: string
  track: string
  version: string
}

export interface Version {
  app: string
  version: string
  file: string
}

export interface AppsListResponse {
  data: {
    apps: App[]
  }
}

export interface AppDetailsResponse {
  data: {
    app: App
    tracks: Track[]
    versions: Version[]
    administrator: boolean
  }
}

export interface CreateAppResponse {
  data: {
    id: string
    name: string
  }
}

export interface UploadVersionResponse {
  data: {
    version: string
    app: App
  }
}
