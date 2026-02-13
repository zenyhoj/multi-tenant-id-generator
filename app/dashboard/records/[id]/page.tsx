import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Edit, CreditCard } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function ViewRecordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get org id and details
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile) return <div>Profile not found</div>

    // Fetch the record
    const { data: record } = await supabase
        .from('id_records')
        .select(`
            *,
            id_templates ( name )
        `)
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .single()

    if (!record) return notFound()

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <Link href="/dashboard/records">
                    <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Records</Button>
                </Link>
                <div className="flex gap-2">
                    <Link href={`/dashboard/records/${record.id}/edit`}>
                        <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                    </Link>
                    <Link href={`/dashboard/records/${record.id}/generate`}>
                        <Button><CreditCard className="mr-2 h-4 w-4" /> Generate ID</Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{record.last_name}, {record.first_name} {record.middle_name}</CardTitle>
                    <CardDescription>{record.employee_no} • {record.position}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Division</span>
                            <p>{record.division || '-'}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">School/Org</span>
                            <p>{record.school_name || '-'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Date of Birth</span>
                            <p>{record.birthdate ? new Date(record.birthdate).toLocaleDateString() : '-'}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Assigned Template</span>
                            <p>{record.id_templates?.name || 'None'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                            <span className="text-sm font-medium text-muted-foreground block mb-2">Photo</span>
                            {record.photo_url ? (
                                <div className="text-sm text-green-600">Uploaded</div>
                                // We can't easily show signed URL here without fetch, keeping it simple.
                            ) : (
                                <span className="text-sm text-gray-400">Not available</span>
                            )}
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground block mb-2">Signature</span>
                            {record.signature_url ? (
                                <div className="text-sm text-green-600">Uploaded</div>
                            ) : (
                                <span className="text-sm text-gray-400">Not available</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">TIN</span>
                            <p>{record.tin_number || '-'}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">SSS</span>
                            <p>{record.sss_number || '-'}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Pag-IBIG</span>
                            <p>{record.pagibig_number || '-'}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">PhilHealth</span>
                            <p>{record.philhealth_number || '-'}</p>
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <span className="font-semibold mb-2 block">Emergency Contact</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <span className="text-xs text-muted-foreground">Name</span>
                                <p className="text-sm">{record.emergency_contact_name || '-'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Phone</span>
                                <p className="text-sm">{record.emergency_contact_phone || '-'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Address</span>
                                <p className="text-sm">{record.emergency_contact_address || '-'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
