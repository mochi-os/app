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
import { requestHelpers } from '@/lib/request'

const listApps = async (): Promise<App[]> => {
  const response = await requestHelpers.get<AppsListResponse>(
    endpoints.apps.list
  )
  return response.data.apps
}

const getApp = async (
  id: string
): Promise<{
  app: App
  tracks: Track[]
  versions: Version[]
  administrator: boolean
}> => {
  const response = await requestHelpers.get<AppDetailsResponse>(
    endpoints.apps.get(id)
  )
  return response.data
}

const createApp = async (
  name: string,
  privacy: string
): Promise<{ id: string; name: string }> => {
  const response = await requestHelpers.post<CreateAppResponse>(
    endpoints.apps.create,
    { name, privacy }
  )
  return response.data
}

const uploadVersion = async (
  appId: string,
  file: File,
  install: boolean
): Promise<{ version: string; app: App }> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('install', install ? 'yes' : 'no')

  const response = await requestHelpers.post<UploadVersionResponse>(
    endpoints.apps.uploadVersion(appId),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data
}

export const appsApi = {
  list: listApps,
  get: getApp,
  create: createApp,
  uploadVersion,
}

export default appsApi
