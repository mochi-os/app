import { useState, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Header,
  Input,
  Main,
  usePageTitle,
} from '@mochi/common'
import { ArrowLeft, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useAppQuery, useUploadVersionMutation } from '@/hooks/useApps'

export const Route = createFileRoute('/_authenticated/$appId')({
  component: AppDetailsPage,
})

function AppDetailsPage() {
  const { appId } = Route.useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useAppQuery(appId)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const handleBack = () => {
    navigate({ to: '/' })
  }

  usePageTitle(data?.app?.name ?? 'App')

  if (isLoading || !data) {
    return (
      <>
        <Header fixed>
          <Button variant='ghost' size='sm' onClick={handleBack} className='mr-2'>
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
        <Button variant='ghost' size='sm' onClick={handleBack} className='mr-2'>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-lg font-semibold'>{app.name}</h1>
      </Header>

      <Main>
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>App details</CardTitle>
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
                Upload version
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
  const [force, setForce] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadVersionMutation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a file')
      return
    }

    uploadMutation.mutate(
      { appId, file, install, force },
      {
        onSuccess: (data) => {
          toast.success('Version uploaded', {
            description: `Version ${data.version} has been created.`,
          })
          setFile(null)
          setInstall(true)
          setForce(false)
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
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='force'
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className='h-4 w-4'
              />
              <label htmlFor='force' className='text-sm'>
                Force upload (skip path validation)
              </label>
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
            <Button type='submit' disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
