import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BulkGenerateClient from './bulk-generate-client'

export default async function BulkGeneratePage({ searchParams }: { searchParams: Promise<{ ids: string }> }) {
    const { ids } = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    if (!ids) {
        return <div>No records selected.</div>
    }

    const idList = ids.split(',')

    // Get org details
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            organization_id,
            organizations (*)
        `)
        .eq('id', user.id)
        .single()

    if (!profile) return <div>Profile not found</div>

    // Fetch records
    const { data: records } = await supabase
        .from('id_records')
        .select('*')
        .in('id', idList)
        .eq('organization_id', profile.organization_id)

    if (!records || records.length === 0) {
        return <div>No records found.</div>
    }

    // Fetch templates used by these records
    const templateIds = [...new Set(records.map((r: any) => r.template_id).filter(Boolean))]

    if (templateIds.length === 0) {
        return <div>None of the selected records have a template assigned.</div>
    }

    const { data: templates } = await supabase
        .from('id_templates')
        .select('*, template_fields(*)')
        .in('id', templateIds)

    // Sign URLs for photos and signatures
    const photoPaths: string[] = []
    const signaturePaths: string[] = []

    records.forEach((r: any) => {
        if (r.photo_url) photoPaths.push(r.photo_url)
        if (r.signature_url) signaturePaths.push(r.signature_url)
    })

    let signedPhotos: any[] = []
    if (photoPaths.length > 0) {
        const { data } = await supabase.storage.from('id-photos').createSignedUrls(photoPaths, 60 * 60)
        signedPhotos = data || []
    }

    let signedSignatures: any[] = []
    if (signaturePaths.length > 0) {
        const { data } = await supabase.storage.from('id-signatures').createSignedUrls(signaturePaths, 60 * 60)
        signedSignatures = data || []
    }

    // Map signed URLs back to records
    const processedRecords = records.map((r: any) => {
        const newR = { ...r }
        if (r.photo_url) {
            const signed = signedPhotos.find(s => s.path === r.photo_url)
            if (signed) newR.photo_url = signed.signedUrl
        }
        if (r.signature_url) {
            const signed = signedSignatures.find(s => s.path === r.signature_url)
            if (signed) newR.signature_url = signed.signedUrl
        }
        return newR
    })

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Generate IDs</h1>
                    <p className="text-muted-foreground">Preview and download IDs for selected records.</p>
                </div>

                <BulkGenerateClient
                    records={processedRecords}
                    templates={templates || []}
                    organization={profile.organizations}
                />
            </div>
        </div>
    )
}
