'use client'

import { useActionState, useState } from 'react'
import { createOrganization } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from 'next/link'
import { Loader2, Building2, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect } from 'react'

const initialState = {
    error: '',
}

export default function NewOrganizationPage() {
    const [orgType, setOrgType] = useState('education')
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createOrganization(formData)
        if (result?.error) {
            return { error: result.error }
        }
        return { error: '' }
    }, initialState)

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error)
        }
    }, [state?.error])

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="mb-6">
                <Link href="/dashboard/organizations" className="text-sm text-muted-foreground hover:text-foreground">
                    ← Back to Organizations
                </Link>
            </div>

            <form action={formAction}>
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Organization</CardTitle>
                        <CardDescription>
                            Add a new school, division, or company. You can link templates to this organization later.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="space-y-3">
                            <Label>Organization Type</Label>
                            <RadioGroup
                                defaultValue="education"
                                name="org_type"
                                className="grid grid-cols-2 gap-4"
                                onValueChange={setOrgType}
                            >
                                <div>
                                    <RadioGroupItem value="education" id="education" className="peer sr-only" />
                                    <Label
                                        htmlFor="education"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <GraduationCap className="mb-3 h-6 w-6" />
                                        Department of Education
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="generic" id="generic" className="peer sr-only" />
                                    <Label
                                        htmlFor="generic"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <Building2 className="mb-3 h-6 w-6" />
                                        Generic / Corporate
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name <span className="text-red-500">*</span></Label>
                            <Input id="name" name="name" required placeholder={orgType === 'education' ? "e.g. Guinabsan National High School" : "e.g. Acme Corp Inc."} />
                        </div>

                        {orgType === 'education' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="department_name">Department Name</Label>
                                        <Input id="department_name" name="department_name" placeholder="e.g. Department of Education" defaultValue="Department of Education" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="division_name">Division Name</Label>
                                        <Input id="division_name" name="division_name" placeholder="e.g. Division of Agusan del Norte" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="division_address">Address</Label>
                                    <Input id="division_address" name="division_address" placeholder="Full address" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="division_website">Website</Label>
                                        <Input id="division_website" name="division_website" placeholder="www.example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="division_code">Division Code</Label>
                                        <Input id="division_code" name="division_code" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="station_code">Station Code</Label>
                                        <Input id="station_code" name="station_code" />
                                    </div>
                                    <div className="space-y-2">
                                        {/* Spacer */}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="superintendent_name">Superintendent Name</Label>
                                        <Input id="superintendent_name" name="superintendent_name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="superintendent_title">Title</Label>
                                        <Input id="superintendent_title" name="superintendent_title" placeholder="e.g. Schools Division Superintendent" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signature">Signature (Image)</Label>
                                    <Input id="signature" name="signature" type="file" accept="image/*" />
                                    <p className="text-xs text-muted-foreground">Upload an image of the signature.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Reusing existing columns for generic mapping where appropriate */}
                                <div className="space-y-2">
                                    <Label htmlFor="division_address">Address</Label>
                                    <Input id="division_address" name="division_address" placeholder="Company Address" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="division_website">Website</Label>
                                    <Input id="division_website" name="division_website" placeholder="Company Website" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="superintendent_name">Signatory Name</Label>
                                        <Input id="superintendent_name" name="superintendent_name" placeholder="Name of authorized signatory" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="superintendent_title">Signatory Title</Label>
                                        <Input id="superintendent_title" name="superintendent_title" placeholder="e.g. HR Manager / CEO" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signature">Signature (Image)</Label>
                                    <Input id="signature" name="signature" type="file" accept="image/*" />
                                    <p className="text-xs text-muted-foreground">Upload an image of the signature.</p>
                                </div>
                            </>
                        )}

                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Link href="/dashboard/organizations">
                            <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Organization
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
