'use client'

import { useActionState, useState, useEffect } from 'react'
import { createRecord, updateRecord } from '../../records/actions'
import { DEPED_POSITIONS } from './data/positions'
import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import Image from 'next/image'

const initialState = {
    error: '',
}

interface RecordFormProps {
    templates: any[]
    organization?: any
    initialData?: any
}

export function RecordForm({ templates, organization, initialData }: RecordFormProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialData?.template_id || '')
    const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set())

    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        let result;
        if (initialData) {
            result = await updateRecord(initialData.id, formData)
        } else {
            result = await createRecord(formData)
        }

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

    useEffect(() => {
        if (!selectedTemplateId) {
            setVisibleFields(new Set())
            return
        }
        const template = templates.find(t => t.id === selectedTemplateId)
        if (template && template.template_fields) {
            const keys = template.template_fields.map((f: any) => f.field_key.toLowerCase())
            setVisibleFields(new Set(keys))
        }
    }, [selectedTemplateId, templates])

    const shouldShow = (fieldName: string) => {
        if (!selectedTemplateId) return true
        if (visibleFields.size === 0) return true
        return visibleFields.has(fieldName.toLowerCase())
    }

    return (
        <form action={formAction}>
            <CardContent className="grid gap-6">

                <div className="grid gap-2">
                    <Label htmlFor="template_id">Assign Template</Label>
                    <Select name="template_id" required value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                            {templates?.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Core Fields - Always Visible */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input id="first_name" name="first_name" required defaultValue={initialData?.first_name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="middle_name">Middle Name</Label>
                        <Input id="middle_name" name="middle_name" defaultValue={initialData?.middle_name} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input id="last_name" name="last_name" required defaultValue={initialData?.last_name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="employee_no">ID / Employee No</Label>
                        <Input id="employee_no" name="employee_no" required defaultValue={initialData?.employee_no} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="birthdate">Date of Birth</Label>
                    <Input id="birthdate" name="birthdate" type="date" defaultValue={initialData?.birthdate} />
                </div>

                {/* Conditional Fields */}

                <div className="grid grid-cols-2 gap-4">
                    {shouldShow('position') && (
                        <div className="grid gap-2">
                            <Label htmlFor="position">Position / Title</Label>
                            <Select name="position" defaultValue={initialData?.position}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPED_POSITIONS.map((pos) => (
                                        <SelectItem key={pos} value={pos}>
                                            {pos}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="tin_number">TIN</Label>
                        <Input id="tin_number" name="tin_number" defaultValue={initialData?.tin_number} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="sss_gsis_number">SSS / GSIS</Label>
                        <Input id="sss_gsis_number" name="sss_gsis_number" defaultValue={initialData?.sss_gsis_number} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="pagibig_number">Pag-IBIG</Label>
                        <Input id="pagibig_number" name="pagibig_number" defaultValue={initialData?.pagibig_number} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="philhealth_number">PhilHealth</Label>
                        <Input id="philhealth_number" name="philhealth_number" defaultValue={initialData?.philhealth_number} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="photo">ID Photo</Label>
                        {initialData?.photo_url && (
                            <div className="relative w-20 h-20 mb-2 border rounded overflow-hidden">
                                {/* We need a proper image loader or public URL. Assuming signed/public URL handling is done, 
                                     but wait, actions save relative path. We need to construct URL or use StorageImage component.
                                     For now, let's just show input. 
                                     If we want to show preview, we need to fetch signed URL.
                                 */}
                                <div className="text-xs text-center p-2 text-muted-foreground">Current Photo Set</div>
                            </div>
                        )}
                        <Input id="photo" name="photo" type="file" accept="image/*" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="signature">e-Signature</Label>
                        {initialData?.signature_url && (
                            <div className="text-xs text-muted-foreground mb-1">Current Signature Set</div>
                        )}
                        <Input id="signature" name="signature" type="file" accept="image/*" />
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Emergency Contact</h3>
                    {(!selectedTemplateId || shouldShow('emergency_contact_name')) && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                                <Input id="emergency_contact_name" name="emergency_contact_name" defaultValue={initialData?.emergency_contact_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                                <Input id="emergency_contact_phone" name="emergency_contact_phone" defaultValue={initialData?.emergency_contact_phone} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="emergency_contact_address">Contact Address</Label>
                                <Input id="emergency_contact_address" name="emergency_contact_address" defaultValue={initialData?.emergency_contact_address} />
                            </div>
                        </div>
                    )}
                    {selectedTemplateId && !shouldShow('emergency_contact_name') && (
                        <p className="text-sm text-gray-500 italic">No emergency contact fields in this template.</p>
                    )}
                </div>

            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" disabled={isPending} onClick={() => history.back()}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : (initialData ? 'Update Record' : 'Save Record')}</Button>
            </CardFooter>
        </form>
    )
}
