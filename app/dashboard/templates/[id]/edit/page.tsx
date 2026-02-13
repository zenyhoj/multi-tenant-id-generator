import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EditTemplateForm } from './edit-template-form'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditTemplatePage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: template } = await supabase
        .from('id_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (!template) {
        return <div>Template not found</div>
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Edit Template</CardTitle>
                    <CardDescription>Modify your template dimensions and settings.</CardDescription>
                </CardHeader>
                <EditTemplateForm template={template} />
            </Card>
        </div>
    )
}
