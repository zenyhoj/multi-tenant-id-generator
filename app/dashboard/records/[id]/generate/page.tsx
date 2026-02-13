import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GenerateClient from './generate-client'

interface PageProps {
    params: {
        id: string
    }
}

export default async function GeneratePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch record
    const { data: record } = await supabase
        .from('id_records')
        .select('*')
        .eq('id', id)
        .single()

    if (!record) return <div>Record not found</div>

    // Fetch organization
    const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', record.organization_id)
        .single()

    // Fetch template
    // If record has no template_id, we might need to ask user to select one. 
    // For now assume logic sets it or we pick default.
    // Actually schema `id_records` has `template_id`.

    if (!record.template_id) {
        return <div>This record is not assigned to a template. Please edit the record and assign a template.</div>
    }

    const { data: template } = await supabase
        .from('id_templates')
        .select('*')
        .eq('id', record.template_id)
        .single()

    if (!template) return <div>Template not found</div>

    // Fetch fields
    const { data: fields } = await supabase
        .from('template_fields')
        .select('*')
        .eq('template_id', template.id)

    // Sign URLs if present
    if (record.photo_url) {
        const { data } = await supabase.storage.from('id-photos').createSignedUrl(record.photo_url, 60 * 60)
        if (data) record.photo_url = data.signedUrl
    }
    if (record.signature_url) {
        const { data } = await supabase.storage.from('id-signatures').createSignedUrl(record.signature_url, 60 * 60)
        if (data) record.signature_url = data.signedUrl
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold text-center mb-8">Preview & Generate ID</h1>
            <GenerateClient
                template={template}
                fields={fields || []}
                record={record}
                organization={organization}
            />
        </div>
    )
}
