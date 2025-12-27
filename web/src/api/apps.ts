import { requestHelpers } from '@mochi/common'
import endpoints from '@/api/endpoints'
import type {
  AppsListResponse,
  AppDetailsResponse,
  CreateAppResponse,
  UploadVersionResponse,
  App,
  Track,
  Version,
} from '@/api/types/apps'

const listApps = async (): Promise<App[]> => {
  const response = await requestHelpers.get<AppsListResponse>(
    endpoints.apps.list
  )
  return response.apps
}

const getApp = async (
  id: string
): Promise<{
  app: App
  tracks: Track[]
  versions: Version[]
  administrator: boolean
  share: boolean
}> => {
  const response = await requestHelpers.get<AppDetailsResponse>(
    endpoints.apps.get(id)
  )
  return response
}

const createApp = async (
  name: string,
  privacy: string
): Promise<{ id: string; name: string }> => {
  const response = await requestHelpers.post<CreateAppResponse>(
    endpoints.apps.create,
    { name, privacy }
  )
  return response
}

const uploadVersion = async (
  appId: string,
  file: File,
  install: boolean,
  force: boolean
): Promise<{ version: string; app: App }> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('install', install ? 'yes' : 'no')
  if (force) {
    formData.append('force', 'yes')
  }

  const response = await requestHelpers.post<UploadVersionResponse>(
    endpoints.apps.uploadVersion(appId),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response
}

const appsApi = {
  list: listApps,
  get: getApp,
  create: createApp,
  uploadVersion,
}

export default appsApi
