import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { TemplateSettingsForm } from './settings-form'

export default async function TemplateSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch template
    const { data: template, error } = await supabase
        .from('id_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !template) {
        return <div>Template not found</div>
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/dashboard/templates/${id}/builder`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Template Settings</h1>
            </div>

            <TemplateSettingsForm template={template} />
        </div>
    )
}
