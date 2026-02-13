import { createClient } from '@/lib/supabase/server'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RecordForm } from '../record-form'

export default async function NewRecordPage() {
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

    // Fetch templates WITH fields to know what inputs to show
    const { data: templates } = await supabase
        .from('id_templates')
        .select('*, template_fields(*)')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Employee / Student</CardTitle>
                    <CardDescription>Enter the details for the ID card holder.</CardDescription>
                </CardHeader>
                <RecordForm
                    templates={templates || []}
                    organization={profile?.organizations}
                />
            </Card>
        </div>
    )
}
