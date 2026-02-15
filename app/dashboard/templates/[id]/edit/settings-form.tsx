'use client'

import { useState } from 'react'
import { updateTemplate } from '@/app/dashboard/templates/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TemplateSettingsFormProps {
    template: any
}

export function TemplateSettingsForm({ template }: TemplateSettingsFormProps) {
    const isCustom = !!template.organization_details
    const [useCustomOrg, setUseCustomOrg] = useState(isCustom)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const details = template.organization_details || {}

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = await updateTemplate(formData)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Template updated')
            // router.refresh() // updateTemplate handles redirect/revalidate usually
        }
        setLoading(false)
    }

    return (
        <form action={handleSubmit}>
            <input type="hidden" name="id" value={template.id} />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Template Name</Label>
                            <Input id="name" name="name" defaultValue={template.name} required />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="width">Width</Label>
                                <Input id="width" name="width" type="number" step="0.1" defaultValue={template.width_mm} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="height">Height</Label>
                                <Input id="height" name="height" type="number" step="0.1" defaultValue={template.height_mm} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Select name="unit" defaultValue={template.measurement_unit || 'mm'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mm">mm</SelectItem>
                                        <SelectItem value="in">in</SelectItem>
                                        <SelectItem value="px">px</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="orientation">Orientation</Label>
                            <Select name="orientation" defaultValue={template.orientation || 'portrait'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Orientation" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="portrait">Portrait</SelectItem>
                                    <SelectItem value="landscape">Landscape</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Organization Details</CardTitle>
                                <CardDescription>
                                    Override your account's default organization details for this specific template.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="use_custom_org">Use Custom Details</Label>
                                <Switch
                                    id="use_custom_org"
                                    name="use_custom_org"
                                    checked={useCustomOrg}
                                    onCheckedChange={setUseCustomOrg}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    {useCustomOrg && (
                        <CardContent className="grid gap-4 border-t pt-6 bg-slate-50">
                            <div className="grid gap-2">
                                <Label>Organization Name</Label>
                                <Input name="org_name" defaultValue={details.name || ''} placeholder="e.g. Guinabsan National High School" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Department Name</Label>
                                    <Input name="org_department_name" defaultValue={details.department_name || ''} placeholder="e.g. Department of Education" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Division Name</Label>
                                    <Input name="org_division_name" defaultValue={details.division_name || ''} placeholder="e.g. Division of Buenavista" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Address</Label>
                                <Input name="org_division_address" defaultValue={details.division_address || ''} placeholder="Address line" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Website</Label>
                                    <Input name="org_division_website" defaultValue={details.division_website || ''} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Logo URL</Label>
                                    <Input name="org_logo_url" defaultValue={details.logo_url || ''} placeholder="https://..." />
                                    <p className="text-[10px] text-muted-foreground">Upload logo in builder or provide URL here</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Division Code</Label>
                                    <Input name="org_division_code" defaultValue={details.division_code || ''} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Station Code</Label>
                                    <Input name="org_station_code" defaultValue={details.station_code || ''} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Superintendent Name</Label>
                                    <Input name="org_superintendent_name" defaultValue={details.superintendent_name || ''} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Superintendent Title</Label>
                                    <Input name="org_superintendent_title" defaultValue={details.superintendent_title || ''} />
                                </div>
                            </div>
                        </CardContent>
                    )}
                    <CardFooter className="justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </form>
    )
}
