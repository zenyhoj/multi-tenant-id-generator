import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BuilderClient from './builder-client'

interface BuilderPageProps {
    params: {
        id: string
    }
}

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch template
    const { data: template } = await supabase
        .from('id_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (!template) {
        return <div>Template not found</div>
    }

    // Fetch fields
    const { data: fields } = await supabase
        .from('template_fields')
        .select('*')
        .eq('template_id', template.id)

    // Fetch organization info
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            organization_id,
            organizations (
                name,
                division_name,
                department_name,
                address,
                contact
            )
        `)
        .eq('id', user.id)
        .single()

    return (
        <BuilderClient
            template={template}
            initialFields={fields || []}
            organization={profile?.organizations}
        />
    )
}
