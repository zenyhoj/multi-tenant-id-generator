import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard/settings" className="block">
                    <div className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer h-full">
                        <h3 className="font-semibold mb-2">My Organization</h3>
                        <p className="text-sm text-gray-500">Manage settings</p>
                    </div>
                </Link>
                <Link href="/dashboard/templates" className="block">
                    <div className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer h-full">
                        <h3 className="font-semibold mb-2">Templates</h3>
                        <p className="text-sm text-gray-500">Create & edit designs</p>
                    </div>
                </Link>
                <Link href="/dashboard/records" className="block">
                    <div className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer h-full">
                        <h3 className="font-semibold mb-2">ID Records</h3>
                        <p className="text-sm text-gray-500">View employees</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}
