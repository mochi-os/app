import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import appsApi from '@/api/apps'

const appKeys = {
  all: () => ['apps'] as const,
  list: () => ['apps', 'list'] as const,
  detail: (id: string) => ['apps', 'detail', id] as const,
}

export const useAppsQuery = () =>
  useQuery({
    queryKey: appKeys.list(),
    queryFn: () => appsApi.list(),
  })

export const useAppQuery = (id: string) =>
  useQuery({
    queryKey: appKeys.detail(id),
    queryFn: () => appsApi.get(id),
    enabled: !!id,
  })

export const useCreateAppMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, privacy }: { name: string; privacy: string }) =>
      appsApi.create(name, privacy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appKeys.all() })
    },
  })
}

export const useUploadVersionMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      appId,
      file,
      install,
    }: {
      appId: string
      file: File
      install: boolean
    }) => appsApi.uploadVersion(appId, file, install),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appKeys.all() })
    },
  })
}
