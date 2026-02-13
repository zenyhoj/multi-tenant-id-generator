'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Rnd } from 'react-rnd'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { toast } from 'sonner'
import { Type, Image as ImageIcon, QrCode, PenTool, Save, ArrowLeft, ZoomIn, ZoomOut, Trash2, Settings, Palette, Smile } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Template {
    id: string
    name: string
    width_mm: number
    height_mm: number
    orientation: string
    background_front_url: string | null
    background_back_url: string | null
    background_color_front: string | null
    background_color_back: string | null
}

interface TemplateField {
    id: string
    template_id: string
    field_key: string
    field_type: 'text' | 'image' | 'qrcode' | 'signature' | 'icon'
    x: number
    y: number
    width: number
    height: number
    font_size?: number
    font_weight?: string
    text_align?: string
    side: 'front' | 'back'
    opacity?: number
    icon_name?: string
}

interface BuilderClientProps {
    template: Template
    initialFields: TemplateField[]
}

const MM_TO_PX = 3.78

const DATA_KEYS = [
    { label: 'First Name', value: 'first_name' },
    { label: 'Last Name', value: 'last_name' },
    { label: 'Middle Name', value: 'middle_name' },
    { label: 'Name Suffix', value: 'name_suffix' },
    { label: 'Role/Position', value: 'position' },
    { label: 'Employee ID', value: 'employee_no' },
    { label: 'Birthdate', value: 'birthdate' },
    { label: 'Organization Name', value: 'organization.name' },
    { label: 'Organization Address', value: 'organization.address' },
    { label: 'Organization Contact', value: 'organization.contact' },
    { label: 'Profile Image (URL)', value: 'profile_image' },
    { label: 'Signature (URL)', value: 'signature' },
    { label: 'QR Code Value', value: 'qrcode' },
]

export default function BuilderClient({ template, initialFields }: BuilderClientProps) {
    const [fields, setFields] = useState<TemplateField[]>(initialFields)
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
    const [side, setSide] = useState<'front' | 'back'>('front')
    const [zoom, setZoom] = useState(1)
    const [saving, setSaving] = useState(false)
    const [backgroundColorFront, setBackgroundColorFront] = useState(template.background_color_front || '#ffffff')
    const [backgroundColorBack, setBackgroundColorBack] = useState(template.background_color_back || '#ffffff')
    const [mounted, setMounted] = useState(false) // New state
    const supabase = createClient()
    const router = useRouter()
    const containerRef = useRef<HTMLDivElement>(null)

    const [localFrontData, setLocalFrontData] = useState<string | null>(null)
    const [localBackData, setLocalBackData] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null // Prevent hydration mismatch

    // Calculate canvas dimensions
    const canvasWidth = template.width_mm * MM_TO_PX
    const canvasHeight = template.height_mm * MM_TO_PX

    const addField = (type: TemplateField['field_type'], iconName?: string) => {
        const newField: TemplateField = {
            id: crypto.randomUUID(),
            template_id: template.id,
            field_key: type === 'text' ? 'New Text' : (type === 'icon' ? (iconName || 'Star') : type),
            field_type: type,
            x: 10,
            y: 10,
            width: type === 'text' ? 100 : (type === 'icon' ? 50 : 50),
            height: type === 'text' ? 30 : (type === 'icon' ? 50 : 50),
            side: side,
            font_size: 14,
            font_weight: 'normal',
            text_align: 'left',
            opacity: 1,
            icon_name: iconName,
        }
        setFields([...fields, newField])
        setSelectedFieldId(newField.id)
    }

    const updateField = (id: string, updates: Partial<TemplateField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
    }

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id))
        setSelectedFieldId(null)
    }

    const handleSave = async () => {
        setSaving(true)

        const currentIds = fields.map(f => f.id)
        const originalIds = initialFields.map(f => f.id)
        const toDelete = originalIds.filter(id => !currentIds.includes(id))

        // Delete removed
        if (toDelete.length > 0) {
            await supabase.from('template_fields').delete().in('id', toDelete)
        }

        // Upsert all current
        const { error } = await supabase.from('template_fields').upsert(fields.map(f => ({
            id: f.id,
            template_id: f.template_id,
            field_key: f.field_key,
            field_type: f.field_type,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
            font_size: f.font_size,
            font_weight: f.font_weight,
            text_align: f.text_align,
            side: f.side,
            opacity: f.opacity,
            icon_name: f.icon_name
        })))

        // Save background colors
        const { error: tmplError } = await supabase
            .from('id_templates')
            .update({
                background_color_front: backgroundColorFront,
                background_color_back: backgroundColorBack
            })
            .eq('id', template.id)

        if (error || tmplError) {
            toast.error('Failed to save: ' + (error?.message || tmplError?.message))
        } else {
            toast.success('Template saved successfully')
            router.refresh()
        }
        setSaving(false)
    }

    const selectedField = fields.find(f => f.id === selectedFieldId)

    // Background upload handler
    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        const file = e.target.files[0]

        // Optimistic update
        const objectUrl = URL.createObjectURL(file)
        if (side === 'front') setLocalFrontData(objectUrl)
        else setLocalBackData(objectUrl)

        const fileExt = file.name.split('.').pop()
        const filePath = `${template.id}/${side}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('template-backgrounds')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            toast.error(uploadError.message)
            return
        }

        // Update template record
        const updateData = side === 'front'
            ? { background_front_url: filePath }
            : { background_back_url: filePath }

        const { error: dbError } = await supabase
            .from('id_templates')
            .update(updateData)
            .eq('id', template.id)

        if (dbError) {
            toast.error(dbError.message)
        } else {
            toast.success('Background uploaded')
            router.refresh()
        }
    }

    const handleRemoveBackground = async () => {
        // Optimistic update
        if (side === 'front') setLocalFrontData(null)
        else setLocalBackData(null)

        const updateData = side === 'front'
            ? { background_front_url: null }
            : { background_back_url: null }

        const { error: dbError } = await supabase
            .from('id_templates')
            .update(updateData)
            .eq('id', template.id)

        if (dbError) {
            toast.error('Failed to remove background')
            // Revert optimistic update if needed, but for now we'll rely on refresh or user retry
        } else {
            toast.success('Background removed')
            router.refresh()
        }
    }

    const getBackgroundImageUrl = () => {
        if (side === 'front') {
            if (localFrontData) return `url('${localFrontData}')`
            return template.background_front_url
                ? `url('${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/template-backgrounds/${template.background_front_url}')`
                : 'none'
        } else {
            if (localBackData) return `url('${localBackData}')`
            return template.background_back_url
                ? `url('${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/template-backgrounds/${template.background_back_url}')`
                : 'none'
        }
    }

    const renderFieldContent = (field: TemplateField) => {
        switch (field.field_type) {
            case 'text': return <span>{field.field_key}</span>
            case 'image': return <ImageIcon className="text-gray-400" />
            case 'qrcode': return <QrCode className="text-gray-400" />
            case 'signature': return <div className="italic text-gray-500">Signature</div>
            case 'icon': {
                const IconComponent = (LucideIcons as any)[field.icon_name || 'Star']
                return IconComponent ? <IconComponent className="w-full h-full" /> : <Smile />
            }
            default: return null
        }
    }

    return (
        <div className="flex h-screen flex-col">
            {/* Toolbar */}
            <div className="border-b bg-white p-2 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/templates">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h2 className="font-semibold">{template.name}</h2>
                    <Link href={`/dashboard/templates/${template.id}/edit`}>
                        <Button variant="ghost" size="icon" title="Edit Settings">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center border rounded-md ml-4">
                        <Button
                            variant={side === 'front' ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSide('front')}
                            className="rounded-none border-r"
                        >
                            Front
                        </Button>
                        <Button
                            variant={side === 'back' ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSide('back')}
                            className="rounded-none"
                        >
                            Back
                        </Button>
                    </div>
                    <div className="flex items-center border rounded-md ml-4">
                        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
                        <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => addField('text')}>
                        <Type className="h-4 w-4 mr-2" /> Text
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addField('image')}>
                        <ImageIcon className="h-4 w-4 mr-2" /> Image
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addField('qrcode')}>
                        <QrCode className="h-4 w-4 mr-2" /> QR
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addField('signature')}>
                        <PenTool className="h-4 w-4 mr-2" /> Sign
                    </Button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Smile className="h-4 w-4 mr-2" /> Icons
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 h-96 overflow-y-auto grid grid-cols-6 gap-2">
                            {['Star', 'Heart', 'User', 'Mail', 'Phone', 'MapPin', 'Globe', 'Award', 'CheckCircle', 'AlertCircle', 'Info', 'Shield', 'Lock', 'Unlock', 'Key', 'CreditCard', 'DollarSign', 'Briefcase', 'File', 'FileText', 'Image', 'Camera', 'Video', 'Music', 'Mic', 'Volume2', 'Settings', 'Tool', 'Truck', 'Package', 'ShoppingCart', 'Calendar', 'Clock', 'Bell', 'Search', 'Home', 'Menu', 'Layout', 'Grid', 'List', 'MoreHorizontal'].map(iconName => {
                                const Icon = (LucideIcons as any)[iconName]
                                if (!Icon) return null
                                return (
                                    <Button key={iconName} variant="ghost" size="icon" onClick={() => addField('icon', iconName)}>
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                )
                            })}
                        </PopoverContent>
                    </Popover>

                    <div className="w-4" /> {/* Spacer */}

                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Canvas Area */}
                <div className="flex-1 bg-gray-100 p-8 overflow-auto flex items-center justify-center relative">
                    <div
                        className="bg-white shadow-lg relative transition-all"
                        style={{
                            width: `${Math.round(canvasWidth)}px`,
                            height: `${Math.round(canvasHeight)}px`,
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center center',
                            backgroundColor: (side === 'front' ? backgroundColorFront : backgroundColorBack) || '#ffffff',
                            backgroundImage: getBackgroundImageUrl(),
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                        onClick={() => setSelectedFieldId(null)}
                        ref={containerRef}
                    >
                        {/* RND Fields */}
                        {fields.filter(f => f.side === side).map(field => (
                            <Rnd
                                key={field.id}
                                size={{ width: field.width, height: field.height }}
                                position={{ x: field.x, y: field.y }}
                                onDragStop={(e, d) => updateField(field.id, { x: d.x, y: d.y })}
                                onResizeStop={(e, direction, ref, delta, position) => {
                                    updateField(field.id, {
                                        width: parseInt(ref.style.width),
                                        height: parseInt(ref.style.height),
                                        ...position,
                                    })
                                }}
                                bounds="parent"
                                className={`border ${selectedFieldId === field.id ? 'border-primary border-2' : 'border-dashed border-gray-300 hover:border-blue-400'} flex items-center justify-center bg-white/50 backdrop-blur-sm`}
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation()
                                    setSelectedFieldId(field.id)
                                }}
                            >
                                <div
                                    className="w-full h-full flex items-center justify-center overflow-hidden"
                                    style={{
                                        fontSize: `${field.font_size}px`,
                                        fontWeight: field.font_weight,
                                        textAlign: field.text_align as any,
                                        opacity: field.opacity ?? 1,
                                    }}
                                >
                                    {renderFieldContent(field)}
                                </div>
                            </Rnd>
                        ))}
                    </div>
                </div>

                {/* Properties Panel */}
                <div className="w-80 bg-white border-l overflow-y-auto p-4">
                    <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-500">Properties</h3>

                    {/* Template Settings (Background) */}
                    {!selectedField && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Background Color ({side})</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={side === 'front' ? backgroundColorFront : backgroundColorBack}
                                        onChange={(e) => side === 'front' ? setBackgroundColorFront(e.target.value) : setBackgroundColorBack(e.target.value)}
                                        className="w-12 h-12 p-1 rounded-md cursor-pointer"
                                    />
                                    <Input
                                        value={side === 'front' ? backgroundColorFront : backgroundColorBack}
                                        onChange={(e) => side === 'front' ? setBackgroundColorFront(e.target.value) : setBackgroundColorBack(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Background Image ({side})</Label>
                                <Input type="file" accept="image/*" onChange={handleBackgroundUpload} />
                                <p className="text-xs text-muted-foreground">Upload an image to use as the background for the {side} side.</p>

                                {(side === 'front' ? (localFrontData || template.background_front_url) : (localBackData || template.background_back_url)) && (
                                    <Button variant="outline" size="sm" onClick={handleRemoveBackground} className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" /> Remove Background
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Field Settings */}
                    {selectedField && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Field Type</Label>
                                <Input value={selectedField.field_type} disabled />
                            </div>

                            {selectedField.field_type !== 'icon' && (
                                <div className="grid gap-2">
                                    <div className="flex justify-between items-center">
                                        <Label>Data Key / Content</Label>
                                        <Select onValueChange={(val) => updateField(selectedField.id, { field_key: val })}>
                                            <SelectTrigger className="h-6 w-[110px] text-[10px] px-2">
                                                <SelectValue placeholder="Insert Variable..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DATA_KEYS.map(k => (
                                                    <SelectItem key={k.value} value={k.value} className="text-xs">
                                                        {k.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input
                                        value={selectedField.field_key}
                                        onChange={(e) => updateField(selectedField.id, { field_key: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">e.g. `first_name`, `organization.name`, or static text</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-1">
                                    <Label>X</Label>
                                    <Input
                                        type="number"
                                        value={Math.round(selectedField.x)}
                                        onChange={(e) => updateField(selectedField.id, { x: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Y</Label>
                                    <Input
                                        type="number"
                                        value={Math.round(selectedField.y)}
                                        onChange={(e) => updateField(selectedField.id, { y: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-1">
                                    <Label>Width</Label>
                                    <Input
                                        type="number"
                                        value={Math.round(selectedField.width)}
                                        onChange={(e) => updateField(selectedField.id, { width: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Height</Label>
                                    <Input
                                        type="number"
                                        value={Math.round(selectedField.height)}
                                        onChange={(e) => updateField(selectedField.id, { height: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {selectedField.field_type === 'text' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label>Font Size (px)</Label>
                                        <Input
                                            type="number"
                                            value={selectedField.font_size}
                                            onChange={(e) => updateField(selectedField.id, { font_size: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Font Weight</Label>
                                        <Select
                                            value={selectedField.font_weight}
                                            onValueChange={(val) => updateField(selectedField.id, { font_weight: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="bold">Bold</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Alignment</Label>
                                        <Select
                                            value={selectedField.text_align}
                                            onValueChange={(val) => updateField(selectedField.id, { text_align: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="left">Left</SelectItem>
                                                <SelectItem value="center">Center</SelectItem>
                                                <SelectItem value="right">Right</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            <div className="grid gap-2">
                                <Label>Opacity: {Math.round((selectedField.opacity ?? 1) * 100)}%</Label>
                                <Slider
                                    value={[(selectedField.opacity ?? 1) * 100]}
                                    max={100}
                                    step={1}
                                    onValueChange={(val) => updateField(selectedField.id, { opacity: val[0] / 100 })}
                                />
                            </div>

                            <div className="pt-4 border-t">
                                <Button variant="destructive" size="sm" className="w-full" onClick={() => removeField(selectedField.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Field
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
