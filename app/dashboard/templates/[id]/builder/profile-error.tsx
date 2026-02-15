'use client'

import { ensureProfile } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ProfileError({ userId, error }: { userId: string, error?: string }) {
    const router = useRouter()

    const handleRepair = async () => {
        const toastId = toast.loading('Repairing profile...')
        try {
            const result = await ensureProfile()
            if (result.error) {
                toast.error(result.error, { id: toastId })
            } else {
                toast.success('Profile repaired!', { id: toastId })
                router.refresh()
            }
        } catch (err) {
            toast.error('Failed to repair profile', { id: toastId })
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
            <h1 className="text-xl font-bold">Profile Not Found</h1>
            <p className="text-muted-foreground text-center max-w-md">
                Your user account exists but is missing profile data. This can happen if the setup process was interrupted.
            </p>
            <div className="p-4 bg-red-50 text-red-600 rounded text-sm font-mono max-w-md break-all">
                User ID: {userId}<br />
                Details: {error || 'Unknown error'}
            </div>
            <Button onClick={handleRepair}>Repair Profile & Continue</Button>
        </div>
    )
}
