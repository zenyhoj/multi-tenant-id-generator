import { createClient } from '@/lib/supabase/server'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RecordForm } from '../../record-form'
import { notFound } from 'next/navigation'

export default async function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get org id and details
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            organization_id,
            organizations (
                name,
                division_name
            )
        `)
        .eq('id', user.id)
        .single()

    if (!profile) return <div>Profile not found</div>

    // Fetch the record
    const { data: record } = await supabase
        .from('id_records')
        .select('*')
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .single()

    if (!record) return notFound()

    // Fetch templates
    const { data: templates } = await supabase
        .from('id_templates')
        .select('*, template_fields(*)')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Record</CardTitle>
                    <CardDescription>Update employee or student details.</CardDescription>
                </CardHeader>
                <RecordForm
                    initialData={record}
                    templates={templates || []}
                    organization={profile?.organizations}
                />
            </Card>
        </div>
    )
}
