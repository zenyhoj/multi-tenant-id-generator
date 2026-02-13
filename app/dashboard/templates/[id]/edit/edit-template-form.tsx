'use client'

import { useActionState, useState } from 'react'
import { updateTemplate } from '../../actions'
import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const initialState = {
    error: '',
}

interface EditTemplateFormProps {
    template: {
        id: string
        name: string
        width_mm: number
        height_mm: number
        orientation: string
    }
}

export function EditTemplateForm({ template }: EditTemplateFormProps) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await updateTemplate(formData)
        if (result?.error) {
            return { error: result.error }
        }
        return { error: '' }
    }, initialState)

    useEffect(() => {
        if (state?.error) {
            console.error('Template update error:', state.error)
            toast.error(state.error)
        }
    }, [state?.error])

    const [unit, setUnit] = useState('mm')
    // Initialize width/height based on mm values from DB
    const [width, setWidth] = useState(template.width_mm.toString())
    const [height, setHeight] = useState(template.height_mm.toString())

    const handleUnitChange = (newUnit: string) => {
        const w = parseFloat(width)
        const h = parseFloat(height)

        if (isNaN(w) || isNaN(h)) {
            setUnit(newUnit)
            return
        }

        let w_mm = w
        let h_mm = h

        // Convert current to mm
        if (unit === 'in') {
            w_mm = w * 25.4
            h_mm = h * 25.4
        } else if (unit === 'px') {
            w_mm = w * 25.4 / 96
            h_mm = h * 25.4 / 96
        }

        // Convert mm to new unit
        let new_w = w_mm
        let new_h = h_mm

        if (newUnit === 'in') {
            new_w = w_mm / 25.4
            new_h = h_mm / 25.4
        } else if (newUnit === 'px') {
            new_w = w_mm * 96 / 25.4
            new_h = h_mm * 96 / 25.4
        }

        const precision = newUnit === 'px' ? 1 : 3
        setWidth(parseFloat(new_w.toFixed(precision)).toString())
        setHeight(parseFloat(new_h.toFixed(precision)).toString())
        setUnit(newUnit)
    }

    return (
        <form action={formAction}>
            <input type="hidden" name="id" value={template.id} />
            <CardContent className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input id="name" name="name" required defaultValue={template.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select name="unit" value={unit} onValueChange={handleUnitChange}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mm">Millimeters (mm)</SelectItem>
                            <SelectItem value="in">Inches (in)</SelectItem>
                            <SelectItem value="px">Pixels (px)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="width">Width ({unit})</Label>
                        <Input
                            id="width"
                            name="width"
                            type="number"
                            step="any"
                            required
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="height">Height ({unit})</Label>
                        <Input
                            id="height"
                            name="height"
                            type="number"
                            step="any"
                            required
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="orientation">Orientation</Label>
                    <Select name="orientation" defaultValue={template.orientation || 'landscape'}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select orientation" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="landscape">Landscape</SelectItem>
                            <SelectItem value="portrait">Portrait</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" disabled={isPending} onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
            </CardFooter>
        </form>
    )
}
