import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { getUserOrganizations } from './actions'
import { OrgSwitcher } from './org-switcher'

export default async function OrganizationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const [{ data: profile }, organizations] = await Promise.all([
        supabase.from('profiles').select('organization_id').eq('id', user.id).single(),
        getUserOrganizations()
    ])

    const currentOrgId = profile?.organization_id

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Organizations</h1>
                    <p className="text-muted-foreground">Manage your schools or divisions.</p>
                </div>
                <Link href="/dashboard/organizations/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Organization
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map((org) => (
                    <Card key={org.id} className={`transition-shadow ${currentOrgId === org.id ? 'border-primary shadow-sm' : 'hover:shadow-md'}`}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded flex items-center justify-center ${currentOrgId === org.id ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{org.name}</CardTitle>
                                    <CardDescription>{org.division_name || 'No division set'}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground space-y-1 mt-2">
                                <div className="flex justify-between">
                                    <span>Status:</span>
                                    <OrgSwitcher orgId={org.id} isActive={currentOrgId === org.id} />
                                </div>
                                <div className="h-px bg-border my-2" />
                                <p className="truncate" title={org.division_address || ''}>{org.division_address || 'No address'}</p>
                                <p className="truncate" title={org.division_website || ''}>{org.division_website || 'No website'}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {organizations.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-gray-50">
                        <Building2 className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No organizations yet</h3>
                        <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">
                            Create your first organization to start managing templates and ID records specific to a school or division.
                        </p>
                        <Link href="/dashboard/organizations/new">
                            <Button variant="outline">Create Organization</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
