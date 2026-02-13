import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile to get organization_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile) {
        // Handle edge case (e.g. profile not created yet)
        return <div>Error loading profile</div>
    }

    // Fetch organization
    const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

    if (!organization) {
        return <div>Organization not found</div>
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-6">
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    ← Back to Dashboard
                </Link>
            </div>
            <h1 className="text-3xl font-bold mb-8">Organization Settings</h1>
            <SettingsForm organization={organization} />
        </div>
    )
}
