'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { switchOrganization } from './actions'
import { Check, ArrowRightLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface OrgSwitcherProps {
    orgId: string
    isActive: boolean
}

export function OrgSwitcher({ orgId, isActive }: OrgSwitcherProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSwitch = async () => {
        setLoading(true)
        const result = await switchOrganization(orgId)

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            toast.success('Organization switched')
            router.refresh()
            // Loading state will persist until refresh completes/navigation happens which is fine
        }
    }

    if (isActive) {
        return (
            <Badge variant="secondary" className="gap-1 pl-1 pr-2.5 py-1">
                <div className="bg-green-500 rounded-full p-0.5">
                    <Check className="h-3 w-3 text-white" />
                </div>
                Active
            </Badge>
        )
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitch}
            disabled={loading}
            className="text-muted-foreground hover:text-primary"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
            Switch
        </Button>
    )
}
