'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface OrgSettingsProps {
    organization: any
}

export function SettingsForm({ organization }: OrgSettingsProps) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const updates = {
            name: formData.get('name') as string,
            department_name: formData.get('department_name') as string,
            division_name: formData.get('division_name') as string,
            division_address: formData.get('division_address') as string,
            division_website: formData.get('division_website') as string,
            superintendent_name: formData.get('superintendent_name') as string,
            superintendent_title: formData.get('superintendent_title') as string,
            primary_color: formData.get('primary_color') as string,
            secondary_color: formData.get('secondary_color') as string,
            division_code: formData.get('division_code') as string,
            station_code: formData.get('station_code') as string,
        }

        const { error } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', organization.id)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Settings updated successfully')
            router.refresh()
        }
        setLoading(false)
    }

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return
        setLoading(true)
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const filePath = `${organization.id}/logo.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('organization-logos')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            toast.error(uploadError.message)
            setLoading(false)
            return
        }

        const { data: { publicUrl } } = supabase.storage
            .from('organization-logos')
            .getPublicUrl(filePath)

        // For private buckets we need a signed URL if we want to display it securely, 
        // but typically logos are fine to be public or signed.
        // The previous storage policy was: authenticated only.
        // So we need to create a signed URL for display or change the bucket to public?
        // Actually, logos should be public usually. But the requirements said "Create private buckets".
        // So we will use createSignedUrl for display if needed, but for the "logo_url" column, 
        // we might store the path and generate signed URL on demand or just use signed URL with long expiry?
        // Storing the signed URL is bed practice as it expires. Storing the path is better. 
        // BUT the prompt said "logo_url text" in the schema.
        // Let's store the path and handle URL generation on the server or client component.
        // Actually, for simplicity and expected usage in "style={{ backgroundImage... }}", a public URL is much easier.
        // But since the bucket is private, we must use signed URLs.
        // Let's store the path in "logo_url" for now (e.g. "org_id/logo.png") and resolve it later.
        // Wait, the schema has `logo_url text`.
        // Let's ask the user? No, I should solve it.
        // I will store the path. And in the UI I will generate a signed URL to show the preview.

        const { error: updateError } = await supabase
            .from('organizations')
            .update({ logo_url: filePath })
            .eq('id', organization.id)

        if (updateError) {
            toast.error(updateError.message)
        } else {
            toast.success('Logo uploaded')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Organization Profile</CardTitle>
                    <CardDescription>Manage your organization's branding and details.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                        <Label>Logo</Label>
                        <div className="flex items-center gap-4">
                            {/* We would need a way to show the image here. Since it's private, we need a signed URL passed in props or fetched. */}
                            {/* For now just the input */}
                            <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={loading} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input id="name" name="name" defaultValue={organization.name} required disabled={loading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="department_name">Department Name</Label>
                            <Input id="department_name" name="department_name" defaultValue={organization.department_name || ''} disabled={loading} placeholder="e.g. Department of Education" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="division_name">Division Name</Label>
                            <Input id="division_name" name="division_name" defaultValue={organization.division_name || ''} disabled={loading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="division_address">Division Address</Label>
                            <Input id="division_address" name="division_address" defaultValue={organization.division_address || ''} disabled={loading} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2 col-span-1">
                            <Label htmlFor="division_website">Division Website</Label>
                            <Input id="division_website" name="division_website" defaultValue={organization.division_website || ''} disabled={loading} />
                        </div>
                        <div className="grid gap-2 col-span-1">
                            <Label htmlFor="division_code">Division Code</Label>
                            <Input id="division_code" name="division_code" defaultValue={organization.division_code || ''} disabled={loading} placeholder="e.g. N01" />
                        </div>
                        <div className="grid gap-2 col-span-1">
                            <Label htmlFor="station_code">Station Code</Label>
                            <Input id="station_code" name="station_code" defaultValue={organization.station_code || ''} disabled={loading} placeholder="e.g. 001" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="superintendent_name">Superintendent Name</Label>
                            <Input id="superintendent_name" name="superintendent_name" defaultValue={organization.superintendent_name || ''} disabled={loading} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="superintendent_title">Superintendent Title</Label>
                            <Input id="superintendent_title" name="superintendent_title" defaultValue={organization.superintendent_title || ''} disabled={loading} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="primary_color">Primary Color</Label>
                            <div className="flex gap-2">
                                <Input id="primary_color" name="primary_color" type="color" className="w-12 p-1" defaultValue={organization.primary_color || '#000000'} disabled={loading} />
                                <Input name="primary_color_text" defaultValue={organization.primary_color || '#000000'} disabled={loading}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const colorInput = document.getElementById('primary_color') as HTMLInputElement;
                                        if (colorInput) colorInput.value = val;
                                    }}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="secondary_color">Secondary Color</Label>
                            <div className="flex gap-2">
                                <Input id="secondary_color" name="secondary_color" type="color" className="w-12 p-1" defaultValue={organization.secondary_color || '#ffffff'} disabled={loading} />
                                <Input name="secondary_color_text" defaultValue={organization.secondary_color || '#ffffff'} disabled={loading}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const colorInput = document.getElementById('secondary_color') as HTMLInputElement;
                                        if (colorInput) colorInput.value = val;
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
