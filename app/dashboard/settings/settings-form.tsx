'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { updateOrganization } from '../organizations/actions'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface OrgSettingsProps {
    organization: any
}

export function SettingsForm({ organization }: OrgSettingsProps) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [uploadingSignature, setUploadingSignature] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await updateOrganization(organization.id, formData)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Settings updated successfully')
            router.refresh()
        }
        setLoading(false)
    }

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return
        setUploadingLogo(true)
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const filePath = `${organization.id}/logo.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('organization-logos')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            toast.error(uploadError.message)
            setUploadingLogo(false)
            return
        }

        const formData = new FormData()
        formData.append('logo_url', filePath)

        const result = await updateOrganization(organization.id, formData)

        if (result.error) {
            toast.error('Logo uploaded but failed to link: ' + result.error)
        } else {
            toast.success('Logo uploaded and linked')
            router.refresh()
        }
        setUploadingLogo(false)
    }

    async function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return
        setUploadingSignature(true)
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const filePath = `${organization.id}/signature.${fileExt}`

        // Reusing organization-logos bucket for simplicity as it likely has public read access
        const { error: uploadError } = await supabase.storage
            .from('organization-logos')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            toast.error(uploadError.message)
            setUploadingSignature(false)
            return
        }

        const formData = new FormData()
        formData.append('signature_url', filePath)

        const result = await updateOrganization(organization.id, formData)

        if (result.error) {
            toast.error('Signature uploaded but failed to link: ' + result.error)
        } else {
            toast.success('Signature uploaded and linked')
            router.refresh()
        }
        setUploadingSignature(false)
    }

    const orgType = organization.org_type || 'education'

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Organization Profile</CardTitle>
                            <CardDescription>
                                Manage your organization&apos;s default details.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="capitalize">{orgType}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Organization Name</Label>
                        <Input id="name" name="name" defaultValue={organization.name} required />
                    </div>

                    {orgType === 'education' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="department_name">Department Name</Label>
                                    <Input id="department_name" name="department_name" defaultValue={organization.department_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="division_name">Division Name</Label>
                                    <Input id="division_name" name="division_name" defaultValue={organization.division_name} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="division_address">Address</Label>
                                <Input id="division_address" name="division_address" defaultValue={organization.division_address} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="division_website">Website</Label>
                                    <Input id="division_website" name="division_website" defaultValue={organization.division_website} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="division_code">Division Code</Label>
                                    <Input id="division_code" name="division_code" defaultValue={organization.division_code} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="station_code">Station Code</Label>
                                    <Input id="station_code" name="station_code" defaultValue={organization.station_code} />
                                </div>
                                {/* Logo handled below */}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="superintendent_name">Superintendent Name</Label>
                                    <Input id="superintendent_name" name="superintendent_name" defaultValue={organization.superintendent_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="superintendent_title">Title</Label>
                                    <Input id="superintendent_title" name="superintendent_title" defaultValue={organization.superintendent_title} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Generic Mode */}
                            <div className="space-y-2">
                                <Label htmlFor="division_address">Address</Label>
                                <Input id="division_address" name="division_address" defaultValue={organization.division_address} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="division_website">Website</Label>
                                <Input id="division_website" name="division_website" defaultValue={organization.division_website} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="superintendent_name">Signatory Name</Label>
                                    <Input id="superintendent_name" name="superintendent_name" defaultValue={organization.superintendent_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="superintendent_title">Signatory Title</Label>
                                    <Input id="superintendent_title" name="superintendent_title" defaultValue={organization.superintendent_title} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Common Assets */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="signature">Signature</Label>
                            <Input id="signature" type="file" onChange={handleSignatureUpload} disabled={uploadingSignature} accept="image/*" />
                            {uploadingSignature && <span className="text-xs text-muted-foreground">Uploading...</span>}
                            {organization.signature_url && !uploadingSignature && (
                                <div className="mt-2">
                                    <p className="text-xs text-muted-foreground mb-1">Current Signature:</p>
                                    <img src={supabase.storage.from('organization-logos').getPublicUrl(organization.signature_url).data.publicUrl} alt="Signature" className="h-12 w-auto object-contain border rounded p-1" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Theme Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="primary_color">Primary Color</Label>
                            <div className="flex gap-2 items-center">
                                <Input id="primary_color" name="primary_color" type="color" className="w-12 h-10 p-1 cursor-pointer" defaultValue={organization.primary_color || '#000000'} />
                                <Input type="text" value={organization.primary_color || '#000000'} className="flex-1" readOnly />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secondary_color">Secondary Color</Label>
                            <div className="flex gap-2 items-center">
                                <Input id="secondary_color" name="secondary_color" type="color" className="w-12 h-10 p-1 cursor-pointer" defaultValue={organization.secondary_color || '#ffffff'} />
                                <Input type="text" value={organization.secondary_color || '#ffffff'} className="flex-1" readOnly />
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </Card >
        </form >
    )
}
