import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { RecordsTable } from './records-table'

export default async function RecordsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get org id
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile) return <div>Profile not found</div>

    const { data: records } = await supabase
        .from('id_records')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('last_name', { ascending: true })

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">ID Records</h1>
                <Link href="/dashboard/records/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Record
                    </Button>
                </Link>
            </div>

            <RecordsTable records={records || []} />
        </div>
    )
}
