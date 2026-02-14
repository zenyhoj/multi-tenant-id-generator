'use client'

import { MoreVertical, Copy, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TemplateActionsProps {
    templateId: string
    onDuplicate: (id: string) => Promise<{ error?: string; success?: boolean }>
}

export function TemplateActions({ templateId, onDuplicate }: TemplateActionsProps) {
    const router = useRouter()

    const handleDuplicate = async () => {
        toast.loading('Duplicating template...')
        const result = await onDuplicate(templateId)
        toast.dismiss()

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Template duplicated')
            router.refresh()
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <Link href={`/dashboard/templates/${templateId}/builder`}>
                    <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    handleDuplicate()
                }}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => {
                    e.stopPropagation()
                    // handleDelete() // TODO: Implement delete
                }}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
