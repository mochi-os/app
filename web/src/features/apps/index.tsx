import { useState, useRef } from 'react'
import { usePageTitle } from '@mochi/common'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Header,
  Main,
} from '@mochi/common'
import { Package, Plus, Upload, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAppsQuery,
  useAppQuery,
  useCreateAppMutation,
  useUploadVersionMutation,
} from '@/hooks/useApps'

export function Apps() {
  usePageTitle('Publisher')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { data: apps, isLoading } = useAppsQuery()

  if (isLoading && !apps) {
    return (
      <>
        <Main>
          <div className='flex h-64 items-center justify-center'>
            <div className='text-muted-foreground'>Loading apps...</div>
          </div>
        </Main>
      </>
    )
  }

  if (selectedAppId) {
    return (
      <AppDetails appId={selectedAppId} onBack={() => setSelectedAppId(null)} />
    )
  }

  return (
    <>
      <Main>
        <div className='mb-6 flex justify-end'>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New app
          </Button>
        </div>

        {apps?.length === 0 ? (
          <Card>
            <CardContent className='py-12'>
              <div className='text-muted-foreground text-center'>
                <Package className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <p className='text-lg font-medium'>No apps yet</p>
                <p className='mt-1 text-sm'>
                  Create your first app to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {apps?.map((app) => (
              <Card
                key={app.id}
                className='flex cursor-pointer flex-col transition-shadow hover:shadow-md'
                onClick={() => setSelectedAppId(app.id)}
              >
                <CardHeader>
                  <CardTitle className='truncate text-lg'>{app.name}</CardTitle>
                  {app.version && (
                    <p className='text-muted-foreground text-sm'>{app.version}</p>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <CreateAppDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={(id) => {
            setShowCreateDialog(false)
            setSelectedAppId(id)
          }}
        />
      </Main>
    </>
  )
}

function AppDetails({ appId, onBack }: { appId: string; onBack: () => void }) {
  const { data, isLoading } = useAppQuery(appId)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  if (isLoading || !data) {
    return (
      <>
        <Header fixed>
          <Button variant='ghost' size='sm' onClick={onBack} className='mr-2'>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <h1 className='text-lg font-semibold'>Loading...</h1>
        </Header>
        <Main>
          <div className='flex h-64 items-center justify-center'>
            <div className='text-muted-foreground'>Loading app details...</div>
          </div>
        </Main>
      </>
    )
  }

  const { app, tracks, versions, administrator } = data

  return (
    <>
      <Header fixed>
        <Button variant='ghost' size='sm' onClick={onBack} className='mr-2'>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-lg font-semibold'>{app.name}</h1>
      </Header>

      <Main>
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>App Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <span className='font-medium'>ID:</span>{' '}
                <span className='font-mono text-sm'>{app.id}</span>
              </div>
              <div>
                <span className='font-medium'>Fingerprint:</span>{' '}
                <span className='font-mono text-sm'>{app.fingerprint}</span>
              </div>
              <div>
                <span className='font-medium'>Privacy:</span>{' '}
                <span className='capitalize'>{app.privacy}</span>
              </div>
            </CardContent>
          </Card>

          {tracks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tracks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {tracks.map((track) => (
                    <div key={track.track} className='flex justify-between'>
                      <span className='font-medium'>{track.track}</span>
                      <span className='font-mono text-sm'>{track.version}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {versions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Versions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {versions.map((version) => (
                    <div key={version.version} className='flex justify-between'>
                      <span className='font-mono text-sm'>
                        {version.version}
                      </span>
                      <span className='text-muted-foreground text-sm'>
                        {version.file}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upload new version</CardTitle>
              <CardDescription>
                Upload a new version of your app as a zip file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className='mr-2 h-4 w-4' />
                Upload Version
              </Button>
            </CardContent>
          </Card>
        </div>

        <UploadVersionDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          appId={appId}
          showInstallOption={administrator}
        />
      </Main>
    </>
  )
}

function CreateAppDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [privacy, setPrivacy] = useState('public')
  const createMutation = useCreateAppMutation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter an app name')
      return
    }

    createMutation.mutate(
      { name: name.trim(), privacy },
      {
        onSuccess: (data) => {
          toast.success('App created', {
            description: `${name} has been created successfully.`,
          })
          setName('')
          setPrivacy('public')
          onSuccess(data.id)
        },
        onError: () => {
          toast.error('Failed to create app')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New App</DialogTitle>
          <DialogDescription>
            Create a new app to publish to others
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <label htmlFor='name' className='text-sm font-medium'>
                Name
              </label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='My App'
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='privacy' className='text-sm font-medium'>
                Make app publicly available
              </label>
              <select
                id='privacy'
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className='border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm'
              >
                <option value='public'>Yes</option>
                <option value='private'>No</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create App'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UploadVersionDialog({
  open,
  onOpenChange,
  appId,
  showInstallOption,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  appId: string
  showInstallOption: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [install, setInstall] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadVersionMutation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a file')
      return
    }

    uploadMutation.mutate(
      { appId, file, install },
      {
        onSuccess: (data) => {
          toast.success('Version uploaded', {
            description: `Version ${data.version} has been created.`,
          })
          setFile(null)
          setInstall(true)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          onOpenChange(false)
        },
        onError: () => {
          toast.error('Failed to upload version')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload new version</DialogTitle>
          <DialogDescription>
            Upload a zip file containing your app
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <label htmlFor='file' className='text-sm font-medium'>
                File
              </label>
              <Input
                ref={fileInputRef}
                id='file'
                type='file'
                accept='.zip'
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            {showInstallOption && (
              <div className='space-y-2'>
                <label htmlFor='install' className='text-sm font-medium'>
                  Also install locally
                </label>
                <select
                  id='install'
                  value={install ? 'yes' : 'no'}
                  onChange={(e) => setInstall(e.target.value === 'yes')}
                  className='border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm'
                >
                  <option value='yes'>Yes</option>
                  <option value='no'>No</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
