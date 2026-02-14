'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Rnd } from 'react-rnd'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toPng } from 'html-to-image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { toast } from 'sonner'
import { Type, Image as ImageIcon, QrCode, PenTool, Save, ArrowLeft, ZoomIn, ZoomOut, Trash2, Settings, Palette, Smile, AlignCenter, AlignVerticalSpaceAround, AlignHorizontalSpaceAround, Move, Square, Ban, Minus } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    preview_image_url?: string | null
}

interface TemplateField {
    id: string
    template_id: string
    field_key: string
    field_type: 'text' | 'image' | 'qrcode' | 'signature' | 'icon' | 'box' | 'line'
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
    uppercase?: boolean
    color?: string
    rotation?: number
    // Box properties
    background_color?: string
    border_color?: string
    border_width?: number
    border_radius?: number
}

interface BuilderClientProps {
    template: Template
    initialFields: TemplateField[]
    organization?: any
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
    { label: 'Department Name', value: 'organization.department_name' },
    { label: 'Organization Address', value: 'organization.address' },
    { label: 'Organization Contact', value: 'organization.contact' },
    { label: 'Division Name', value: 'organization.division_name' },
    { label: 'Division Address', value: 'organization.division_address' },
    { label: 'Division Website', value: 'organization.division_website' },
    { label: 'Division Code', value: 'organization.division_code' },
    { label: 'Station Code', value: 'organization.station_code' },
    { label: 'Superintendent', value: 'organization.superintendent_name' },
    { label: 'Superintendent Title', value: 'organization.superintendent_title' },
    { label: 'Profile Image (URL)', value: 'profile_image' },
    { label: 'Signature (URL)', value: 'signature' },
    { label: 'Full Name (First Middle Last)', value: 'full_name_western' }, // Zeniepe Dela Cruz Balingit
    { label: 'Full Name (Last, First Middle)', value: 'full_name_eastern' }, // Balingit, Zeniepe Dela Cruz
    { label: 'Full Name (First M. Last)', value: 'full_name_initial' }, // Zeniepe D. Balingit
    { label: 'Full Name (Last, First M.)', value: 'full_name_filipino' }, // Balingit, Zeniepe D.
    { label: 'QR Code Value', value: 'qrcode' },
    { label: 'Emergency Contact Name', value: 'emergency_contact_name' },
    { label: 'Emergency Contact Phone', value: 'emergency_contact_phone' },
    { label: 'Emergency Contact Address', value: 'emergency_contact_address' },
    { label: 'TIN', value: 'tin_number' },
    { label: 'SSS/GSIS Number', value: 'sss_gsis_number' },
    { label: 'Pag-ibig Number', value: 'pagibig_number' },
    { label: 'PhilHealth Number', value: 'philhealth_number' },
]

export default function BuilderClient({ template, initialFields, organization }: BuilderClientProps) {
    const [fields, setFields] = useState<TemplateField[]>(initialFields)
    const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([])

    // Ref to handle click vs drag selection race conditions
    const selectionRef = useRef<{ id: string | null, justSelected: boolean }>({ id: null, justSelected: false })

    // Drag to Select State
    const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number, isVisible: boolean } | null>(null)
    const canvasRef = useRef<HTMLDivElement>(null)

    // History Management
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

    // if (!mounted) return null // Moved to end to prevent hook order issues

    // Calculate canvas dimensions
    const canvasWidth = template.width_mm * MM_TO_PX
    const canvasHeight = template.height_mm * MM_TO_PX

    const [history, setHistory] = useState<TemplateField[][]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)

    // Initialize history with the initial fields
    useEffect(() => {
        if (history.length === 0) {
            setHistory([fields])
            setHistoryIndex(0)
        }
    }, [fields, history.length]); // Depend on fields to capture initial state, history.length to run once

    // Helper to push a new state of fields into history
    const pushState = (newFields: TemplateField[]) => {
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newFields)
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
        setFields(newFields)
    }

    // Snapping Logic
    interface GuideLine {
        type: 'horizontal' | 'vertical'
        pos: number
    }
    const [guides, setGuides] = useState<GuideLine[]>([])

    const SNAP_THRESHOLD = 5

    const handleDrag = (d: { x: number, y: number }, field: TemplateField) => {
        // Calculate current field edges
        const current = {
            left: d.x,
            right: d.x + field.width,
            top: d.y,
            bottom: d.y + field.height,
            centerX: d.x + field.width / 2,
            centerY: d.y + field.height / 2
        }

        const newGuides: GuideLine[] = []
        let newX = d.x
        let newY = d.y

        // Check against other fields
        fields.forEach(f => {
            if (f.id === field.id) return
            if (selectedFieldIds.includes(f.id)) return // Don't snap to other moving elements if multi-selected (simplified)

            const target = {
                left: f.x,
                right: f.x + f.width,
                top: f.y,
                bottom: f.y + f.height,
                centerX: f.x + f.width / 2,
                centerY: f.y + f.height / 2
            }

            // Vertical Alignment (X axis)
            // Left to Left
            if (Math.abs(current.left - target.left) < SNAP_THRESHOLD) { newX = target.left; newGuides.push({ type: 'vertical', pos: target.left }) }
            // Left to Right
            if (Math.abs(current.left - target.right) < SNAP_THRESHOLD) { newX = target.right; newGuides.push({ type: 'vertical', pos: target.right }) }
            // Right to Left
            if (Math.abs(current.right - target.left) < SNAP_THRESHOLD) { newX = target.left - field.width; newGuides.push({ type: 'vertical', pos: target.left }) }
            // Right to Right
            if (Math.abs(current.right - target.right) < SNAP_THRESHOLD) { newX = target.right - field.width; newGuides.push({ type: 'vertical', pos: target.right }) }
            // Center to Center
            if (Math.abs(current.centerX - target.centerX) < SNAP_THRESHOLD) { newX = target.centerX - field.width / 2; newGuides.push({ type: 'vertical', pos: target.centerX }) }

            // Horizontal Alignment (Y axis)
            // Top to Top
            if (Math.abs(current.top - target.top) < SNAP_THRESHOLD) { newY = target.top; newGuides.push({ type: 'horizontal', pos: target.top }) }
            // Top to Bottom
            if (Math.abs(current.top - target.bottom) < SNAP_THRESHOLD) { newY = target.bottom; newGuides.push({ type: 'horizontal', pos: target.bottom }) }
            // Bottom to Top
            if (Math.abs(current.bottom - target.top) < SNAP_THRESHOLD) { newY = target.top - field.height; newGuides.push({ type: 'horizontal', pos: target.top }) }
            // Bottom to Bottom
            if (Math.abs(current.bottom - target.bottom) < SNAP_THRESHOLD) { newY = target.bottom - field.height; newGuides.push({ type: 'horizontal', pos: target.bottom }) }
            // Center to Center
            if (Math.abs(current.centerY - target.centerY) < SNAP_THRESHOLD) { newY = target.centerY - field.height / 2; newGuides.push({ type: 'horizontal', pos: target.centerY }) }
        })

        // Also snap to canvas edges (center, edges)
        const canvasCenterX = canvasWidth / 2
        if (Math.abs(current.centerX - canvasCenterX) < SNAP_THRESHOLD) { newX = canvasCenterX - field.width / 2; newGuides.push({ type: 'vertical', pos: canvasCenterX }) }

        const canvasCenterY = canvasHeight / 2
        if (Math.abs(current.centerY - canvasCenterY) < SNAP_THRESHOLD) { newY = canvasCenterY - field.height / 2; newGuides.push({ type: 'horizontal', pos: canvasCenterY }) }

        setGuides(newGuides)
        return { x: newX, y: newY }
    }

    const undo = () => {
        if (historyIndex > 0) {
            const previousIndex = historyIndex - 1
            setFields(history[previousIndex])
            setHistoryIndex(previousIndex)
        }
    }

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1
            setHistoryIndex(newIndex)
            setFields(history[newIndex])
        }
    }

    const addField = (type: TemplateField['field_type'], iconNameArg?: string) => {
        const iconName = type === 'icon' ? (iconNameArg || 'Star') : undefined
        const newField: TemplateField = {
            id: crypto.randomUUID(),
            template_id: template.id,
            field_key: type === 'text' ? 'New Text' : (type === 'image' || type === 'icon' ? '' : type),
            field_type: type,
            x: 10,
            y: 10,
            width: type === 'qrcode' ? 100 : (type === 'icon' ? 50 : (type === 'text' ? 0 : (type === 'line' ? 100 : 200))),
            height: type === 'qrcode' ? 100 : (type === 'icon' ? 50 : (type === 'text' ? 0 : (type === 'line' ? 2 : 50))),
            side: side,
            font_size: 14,
            font_weight: 'normal',
            text_align: 'left',
            opacity: 1,
            icon_name: iconName,
            uppercase: false,
            color: '#000000',
            rotation: 0,
            background_color: type === 'box' ? '#cccccc' : (type === 'line' ? '#000000' : undefined),
            border_color: '#000000',
            border_width: type === 'box' ? 1 : 0,
            border_radius: 0,
        }
        pushState([...fields, newField])
        setSelectedFieldIds([newField.id])
    }

    const updateField = (id: string, updates: Partial<TemplateField>, saveHistory = true) => {
        const newFields = fields.map(f => f.id === id ? { ...f, ...updates } : f)

        if (saveHistory) {
            pushState(newFields)
        } else {
            setFields(newFields)
        }
    }

    const removeField = (id: string) => {
        pushState(fields.filter(f => f.id !== id))
        setSelectedFieldIds(prev => prev.filter(pId => pId !== id))
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedFieldIds.length === 0) return

            // Avoid deleting if user is typing in an input
            const activeElement = document.activeElement as HTMLElement
            const isInput = activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA' ||
                activeElement?.isContentEditable

            if (isInput) return

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault()
                const newFields = fields.filter(f => !selectedFieldIds.includes(f.id))
                pushState(newFields)
                setSelectedFieldIds([])
                return
            }

            // Undo: Ctrl + Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                undo()
                return
            }

            // Redo: Ctrl + Y or Ctrl + Shift + Z
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                redo()
                return
            }

            // Duplicate on Ctrl + D
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault()
                const fieldsToDuplicate = fields.filter(f => selectedFieldIds.includes(f.id))
                if (fieldsToDuplicate.length > 0) {
                    const newFields = fieldsToDuplicate.map(f => ({
                        ...f,
                        id: crypto.randomUUID(),
                        x: f.x + 20,
                        y: f.y + 20,
                    }))
                    pushState([...fields, ...newFields])
                    setSelectedFieldIds(newFields.map(f => f.id))
                }
                return
            }

            // Movement keys
            const step = e.shiftKey ? 10 : 1
            const selectedFields = fields.filter(f => selectedFieldIds.includes(f.id))
            if (selectedFields.length === 0) return

            let dx = 0
            let dy = 0
            let moved = false

            switch (e.key) {
                case 'ArrowUp':
                    dy = -step
                    moved = true
                    break
                case 'ArrowDown':
                    dy = 0 + step // Explicit
                    moved = true
                    break
                case 'ArrowLeft':
                    dx = -step
                    moved = true
                    break
                case 'ArrowRight':
                    dx = step
                    moved = true
                    break
            }

            if (moved) {
                e.preventDefault()
                const newFields = fields.map(f => {
                    if (selectedFieldIds.includes(f.id)) {
                        return { ...f, x: f.x + dx, y: f.y + dy }
                    }
                    return f
                })
                pushState(newFields) // Could define a batchUpdateField but pushState is fine
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedFieldIds, fields]) // Re-bind when fields change to ensure removeField has latest state


    const handleSave = async () => {
        setSaving(true)

        // Capture Snapshot
        let previewImageUrl = null
        if (containerRef.current) {
            try {
                // Deselect everything first so we don't capture the UI handles
                const prevSelection = selectedFieldIds
                setSelectedFieldIds([])
                // Wait for render cycle
                await new Promise(resolve => setTimeout(resolve, 100))

                // Determine scale to capture at reasonable quality but not huge
                // We'll capture at 100% (scale 1)
                const dataUrl = await toPng(containerRef.current, {
                    cacheBust: true,
                    style: {
                        transform: 'scale(1)', // Force scale 1 for capture
                        transformOrigin: 'top left',
                        width: `${canvasWidth}px`,
                        height: `${canvasHeight}px`,
                    },
                    width: canvasWidth,
                    height: canvasHeight,
                    pixelRatio: 1, // Ensure consistent pixel density
                })

                // Restore selection
                setSelectedFieldIds(prevSelection)

                // Upload Snapshot
                const blob = await (await fetch(dataUrl)).blob()
                const fileName = `${template.id}/preview.png`
                const { error: uploadError } = await supabase.storage
                    .from('template-snapshots')
                    .upload(fileName, blob, { upsert: true, contentType: 'image/png' })

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('template-snapshots')
                        .getPublicUrl(fileName)
                    previewImageUrl = publicUrl
                } else {
                    console.error('Snapshot upload failed:', uploadError)
                }

            } catch (err) {
                console.error('Snapshot capture failed:', err)
            }
        }

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
            icon_name: f.icon_name,
            uppercase: f.uppercase,
            color: f.color,
            rotation: f.rotation,
            background_color: f.background_color,
            border_color: f.border_color,
            border_width: f.border_width,
            border_radius: f.border_radius
        })))

        // Save background colors and preview URL
        const updatePayload: any = {
            background_color_front: backgroundColorFront,
            background_color_back: backgroundColorBack
        }
        if (previewImageUrl) {
            updatePayload.preview_image_url = previewImageUrl
        }

        const { error: tmplError } = await supabase
            .from('id_templates')
            .update(updatePayload)
            .eq('id', template.id)

        if (error || tmplError) {
            toast.error('Failed to save: ' + (error?.message || tmplError?.message))
        } else {
            toast.success('Template saved successfully')
            router.refresh()
        }
        setSaving(false)
    }

    const selectedField = fields.find(f => f.id === selectedFieldIds[selectedFieldIds.length - 1])
    const isMultiSelect = selectedFieldIds.length > 1

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedField || !e.target.files || e.target.files.length === 0) return
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${template.id}/assets/${crypto.randomUUID()}.${fileExt}`

        // Upload to template-backgrounds (reusing bucket for now to ensure permissions)
        const { error: uploadError } = await supabase.storage
            .from('template-backgrounds')
            .upload(fileName, file)

        if (uploadError) {
            toast.error('Upload failed: ' + uploadError.message)
            return
        }

        const { data: { publicUrl } } = supabase.storage
            .from('template-backgrounds')
            .getPublicUrl(fileName)

        updateField(selectedField.id, { field_key: publicUrl })
        toast.success('Image uploaded')
    }

    const renderFieldContent = (field: TemplateField) => {
        switch (field.field_type) {
            case 'text':
                return <span style={{ textTransform: field.uppercase ? 'uppercase' : 'none', whiteSpace: 'nowrap' }}>{field.field_key}</span>
            case 'image':
                if (field.field_key.startsWith('http')) {
                    // eslint-disable-next-line @next/next/no-img-element
                    return <img src={field.field_key} alt="Static" className="w-full h-full object-contain pointer-events-none" />
                }
                return <ImageIcon className="text-gray-400" />
            case 'qrcode': return <QrCode className="text-gray-400" />
            case 'signature': return <div className="italic text-gray-500">Signature</div>
            case 'icon': {
                const IconComponent = (LucideIcons as any)[field.icon_name || 'Star']
                return IconComponent ? <IconComponent className="w-full h-full" /> : <Smile />
            }
            default: return null
        }
    }

    if (!mounted) return null // Prevent hydration mismatch

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Only start if clicking directly on the canvas background (not on a field)
        // Fields stop propagation, so if we are here, we are on canvas.
        if (e.button !== 0) return // Only left click

        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        // Calculate relative coordinates accounting for zoom
        const x = (e.clientX - rect.left) / zoom
        const y = (e.clientY - rect.top) / zoom

        setSelectionBox({
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
            isVisible: true
        })

        if (!e.shiftKey) {
            setSelectedFieldIds([])
        }
    }

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!selectionBox || !selectionBox.isVisible) return

        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = (e.clientX - rect.left) / zoom
        const y = (e.clientY - rect.top) / zoom

        setSelectionBox(prev => prev ? { ...prev, currentX: x, currentY: y } : null)
    }

    const handleCanvasMouseUp = (e: React.MouseEvent) => {
        if (!selectionBox || !selectionBox.isVisible) return

        // Calculate final box
        const left = Math.min(selectionBox.startX, selectionBox.currentX)
        const top = Math.min(selectionBox.startY, selectionBox.currentY)
        const width = Math.abs(selectionBox.currentX - selectionBox.startX)
        const height = Math.abs(selectionBox.currentY - selectionBox.startY)

        // Find intersecting fields
        // Simple AABB collision
        const intersectingIds = fields.filter(f => {
            if (f.side !== side) return false
            // Check if field rectangle intersects selection rectangle
            return (
                f.x < left + width &&
                f.x + f.width > left &&
                f.y < top + height &&
                f.y + f.height > top
            )
        }).map(f => f.id)

        if (e.shiftKey) {
            // Add unique IDs
            setSelectedFieldIds(prev => Array.from(new Set([...prev, ...intersectingIds])))
        } else {
            setSelectedFieldIds(intersectingIds)
        }

        setSelectionBox(null)
    }


    return (
        <div className="flex h-screen w-full bg-gray-50 text-gray-900 overflow-hidden select-none flex-col"
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
        >
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
                    <Button variant="outline" size="sm" onClick={() => addField('box')}>
                        <Square className="h-4 w-4 mr-2" /> Box
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addField('line')}>
                        <Minus className="h-4 w-4 mr-2" /> Line
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
                        onMouseDown={handleCanvasMouseDown}
                        ref={containerRef}
                    >
                        {/* RND Fields */}
                        {fields.filter(f => f.side === side).map(field => {
                            const isSelected = selectedFieldIds.includes(field.id)
                            return (
                                <Rnd
                                    key={field.id}
                                    scale={zoom}
                                    size={{ width: field.width || 'auto', height: field.height || 'auto' }}
                                    position={{ x: field.x, y: field.y }}
                                    onDragStart={(e: any) => {
                                        e.stopPropagation()
                                        // If dragging an unselected item, select it (and deselect others unless shift)
                                        const isShift = e.shiftKey
                                        let justSelected = false

                                        if (!isSelected) {
                                            justSelected = true
                                            if (isShift) {
                                                setSelectedFieldIds(prev => [...prev, field.id])
                                            } else {
                                                setSelectedFieldIds([field.id])
                                            }
                                        }

                                        selectionRef.current = { id: field.id, justSelected }
                                    }}
                                    onDrag={(e, d) => {
                                        if (isSelected) {
                                            // Handle snapping and movement for both single and multi-select
                                            // Calculate new snapped position for the dragged element
                                            const { x, y } = handleDrag({ x: d.x, y: d.y }, field)

                                            // Calculate delta from current state
                                            const dx = x - field.x
                                            const dy = y - field.y

                                            if (dx !== 0 || dy !== 0) {
                                                if (isMultiSelect) {
                                                    // Update all selected fields
                                                    const newFields = fields.map(f => {
                                                        if (selectedFieldIds.includes(f.id)) {
                                                            return { ...f, x: f.x + dx, y: f.y + dy }
                                                        }
                                                        return f
                                                    })
                                                    // Bypass history for smooth dragging
                                                    setFields(newFields)
                                                } else {
                                                    // Single select update
                                                    updateField(field.id, { x, y }, false)
                                                }
                                            }
                                        }
                                    }}
                                    onDragStop={(e, d) => {
                                        setGuides([]) // Clear guides

                                        // Commit the final state to history
                                        pushState(fields)
                                    }}
                                    onResizeStop={(e, direction, ref, delta, position) => {
                                        updateField(field.id, {
                                            width: parseInt(ref.style.width),
                                            height: parseInt(ref.style.height),
                                            ...position,
                                        })
                                    }}
                                    // bounds="parent"
                                    className="flex items-center justify-center"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation()

                                        // If we just selected this item in onDragStart, don't process click (which might deselect it)
                                        if (selectionRef.current.id === field.id && selectionRef.current.justSelected) {
                                            // Reset for next time
                                            selectionRef.current = { id: null, justSelected: false }
                                            return
                                        }

                                        if (e.shiftKey) {
                                            if (isSelected) {
                                                setSelectedFieldIds(prev => prev.filter(id => id !== field.id))
                                            } else {
                                                setSelectedFieldIds(prev => [...prev, field.id])
                                            }
                                        } else {
                                            setSelectedFieldIds([field.id])
                                        }
                                    }}
                                >
                                    <div
                                        id={`field-${field.id}`}
                                        className={`w-full h-full flex items-center ${field.text_align === 'left' ? 'justify-start' :
                                            field.text_align === 'right' ? 'justify-end' :
                                                'justify-center'
                                            } overflow-hidden transition-colors ${isSelected
                                                ? 'border-blue-500 border-[1px] z-50' // Clean selection
                                                : 'border border-dashed border-gray-300 hover:border-blue-400'
                                            } `}
                                        style={{
                                            fontSize: `${field.font_size}px`,
                                            fontWeight: field.font_weight,
                                            textAlign: field.text_align as any,
                                            opacity: field.opacity ?? 1,
                                            textTransform: field.uppercase ? 'uppercase' : 'none',
                                            color: field.color || '#000000',
                                            transform: `rotate(${field.rotation || 0}deg)`,
                                            backgroundColor: field.field_type === 'box' ? (field.background_color || 'transparent') : 'transparent',
                                            border: field.field_type === 'box' && (field.border_width || 0) > 0 ? `${field.border_width}px solid ${field.border_color || '#000000'}` : (isSelected ? '' : 'none'), // Clean up border logic
                                            borderRadius: field.field_type === 'box' ? `${field.border_radius || 0}px` : '0px',
                                        }}
                                    >
                                        {/* Line specific rendering with hit area */}
                                        {field.field_type === 'line' && (
                                            <>
                                                <div style={{ width: '100%', height: '100%', backgroundColor: field.background_color || '#000000' }} />
                                                <div className="absolute -top-4 -bottom-4 -left-0 -right-0 cursor-move" style={{ zIndex: 10 }} />
                                            </>
                                        )}

                                        {field.field_type === 'text' && (
                                            <div className="w-full h-full flex items-center" style={{
                                                justifyContent: field.text_align === 'center' ? 'center' : field.text_align === 'right' ? 'flex-end' : 'flex-start',
                                            }}>
                                                {renderFieldContent(field)}
                                            </div>
                                        )}

                                        {field.field_type === 'image' && (
                                            <div className="w-full h-full overflow-hidden">
                                                {/* Image content */}
                                                {renderFieldContent(field)}
                                            </div>
                                        )}

                                        {/* Other types rendering */}
                                        {(field.field_type === 'qrcode' || field.field_type === 'icon' || field.field_type === 'signature') && (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {renderFieldContent(field)}
                                            </div>
                                        )}

                                        {/* Selection overlay */}
                                        {isSelected && (
                                            <div className="absolute inset-0 border-[1px] border-blue-500 pointer-events-none z-50 rounded-sm" />
                                        )}
                                    </div>
                                </Rnd>
                            )
                        })}

                        {/* Selection Box Overlay */}
                        {selectionBox && selectionBox.isVisible && (
                            <div
                                className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-50"
                                style={{
                                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                                    height: Math.abs(selectionBox.currentY - selectionBox.startY),
                                }}
                            />
                        )}

                        {/* Alignment Guides */}
                        {guides.map((guide, i) => (
                            <div
                                key={i}
                                className="absolute bg-blue-500 z-50 pointer-events-none"
                                style={{
                                    left: guide.type === 'vertical' ? guide.pos : 0,
                                    top: guide.type === 'horizontal' ? guide.pos : 0,
                                    width: guide.type === 'vertical' ? '1px' : '100%',
                                    height: guide.type === 'horizontal' ? '1px' : '100%',
                                }}
                            />
                        ))}

                    </div>
                </div>

                {/* Properties Panel */}
                <div className="w-80 bg-white border-l overflow-y-auto p-4">
                    <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-500">Properties</h3>

                    {/* Layers List */}
                    <div className="mb-6 border-b pb-4">
                        <h4 className="text-xs font-semibold mb-2 text-gray-500 flex items-center justify-between">
                            Layers
                            <span className="text-[10px] font-normal text-gray-400">Top to Bottom</span>
                        </h4>
                        <div className="max-h-48 overflow-y-auto flex flex-col gap-1 pr-1">
                            {[...fields]
                                .filter(f => f.side === side)
                                .reverse()
                                .map(field => {
                                    const isSelected = selectedFieldIds.includes(field.id)
                                    let Icon = Type
                                    if (field.field_type === 'image') Icon = ImageIcon
                                    if (field.field_type === 'qrcode') Icon = QrCode
                                    if (field.field_type === 'signature') Icon = PenTool
                                    if (field.field_type === 'box') Icon = Square
                                    if (field.field_type === 'line') Icon = Minus
                                    if (field.field_type === 'icon') {
                                        const CustIcon = (LucideIcons as any)[field.icon_name || 'Star']
                                        if (CustIcon) Icon = CustIcon
                                        else Icon = Smile
                                    }

                                    return (
                                        <div
                                            key={field.id}
                                            className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer border ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50 border-transparent'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (e.shiftKey) {
                                                    if (isSelected) {
                                                        setSelectedFieldIds(prev => prev.filter(id => id !== field.id))
                                                    } else {
                                                        setSelectedFieldIds(prev => [...prev, field.id])
                                                    }
                                                } else {
                                                    setSelectedFieldIds([field.id])
                                                }
                                            }}
                                        >
                                            <Icon className="h-3 w-3 opacity-70" />
                                            <span className="truncate flex-1">{field.field_key || field.field_type}</span>
                                            {field.field_type === 'text' && <span className="text-[10px] text-gray-400 max-w-[50px] truncate">{field.field_key}</span>}
                                        </div>
                                    )
                                })
                            }
                            {fields.filter(f => f.side === side).length === 0 && (
                                <p className="text-xs text-muted-foreground italic text-center py-2">No elements on this side</p>
                            )}
                        </div>
                    </div>

                    {/* Multi-Selection Actions */}
                    {selectedFieldIds.length > 1 && (
                        <div className="mb-6 border-b pb-4">
                            <h4 className="text-xs font-semibold mb-2 text-gray-500">Alignment</h4>
                            <div className="grid grid-cols-6 gap-1 mb-2">
                                <Button variant="outline" size="icon" title="Align Left" onClick={() => {
                                    const selectedFields = fields.filter(f => selectedFieldIds.includes(f.id))
                                    const minX = Math.min(...selectedFields.map(f => f.x))
                                    const newFields = fields.map(f => selectedFieldIds.includes(f.id) ? { ...f, x: minX } : f)
                                    pushState(newFields)
                                    setFields(newFields)
                                }}><AlignHorizontalSpaceAround className="h-4 w-4 rotate-90" /></Button>

                                <Button variant="outline" size="icon" title="Align Center (Horiz)" onClick={() => {
                                    const selectedFields = fields.filter(f => selectedFieldIds.includes(f.id))

                                    // Calculate center of the bounding box of the selection
                                    // Use effective dimensions for center calculation if width is auto
                                    const getEffectiveRect = (f: TemplateField) => {
                                        if (f.width > 0) return { x: f.x, y: f.y, width: f.width, height: f.height }
                                        const el = document.getElementById(`field-${f.id}`)
                                        if (el) {
                                            const rect = el.getBoundingClientRect()
                                            return { x: f.x, y: f.y, width: rect.width / zoom, height: rect.height / zoom }
                                        }
                                        return { x: f.x, y: f.y, width: 0, height: 0 }
                                    }

                                    const rects = selectedFields.map(getEffectiveRect)
                                    const minX = Math.min(...rects.map(r => r.x))
                                    const maxX = Math.max(...rects.map(r => r.x + r.width))
                                    const centerX = (minX + maxX) / 2

                                    const newFields = fields.map(f => {
                                        if (selectedFieldIds.includes(f.id)) {
                                            const rect = getEffectiveRect(f)
                                            return { ...f, x: centerX - rect.width / 2 }
                                        }
                                        return f
                                    })
                                    pushState(newFields)
                                    setFields(newFields)
                                }}><AlignCenter className="h-4 w-4 rotate-90" /></Button>

                                <Button variant="outline" size="icon" title="Align Right" onClick={() => {
                                    const selectedFields = fields.filter(f => selectedFieldIds.includes(f.id))

                                    const getEffectiveRect = (f: TemplateField) => {
                                        if (f.width > 0 && f.x !== undefined) return { x: f.x, width: f.width }
                                        const el = document.getElementById(`field-${f.id}`)
                                        return el ? { x: f.x, width: el.getBoundingClientRect().width / zoom } : { x: f.x, width: 0 }
                                    }

                                    const rects = selectedFields.map(getEffectiveRect)
                                    const maxRight = Math.max(...rects.map(r => r.x + r.width))

                                    const newFields = fields.map(f => {
                                        if (selectedFieldIds.includes(f.id)) {
                                            const rect = getEffectiveRect(f)
                                            return { ...f, x: maxRight - rect.width }
                                        }
                                        return f
                                    })
                                    pushState(newFields)
                                    setFields(newFields)
                                }}><AlignHorizontalSpaceAround className="h-4 w-4 -rotate-90" /></Button>

                                <Button variant="outline" size="icon" title="Align Top" onClick={() => {
                                    const selectedFields = fields.filter(f => selectedFieldIds.includes(f.id))
                                    const minY = Math.min(...selectedFields.map(f => f.y))
                                    const newFields = fields.map(f => selectedFieldIds.includes(f.id) ? { ...f, y: minY } : f)
                                    pushState(newFields)
                                    setFields(newFields)
                                }}><AlignVerticalSpaceAround className="h-4 w-4 rotate-90" /></Button>

                                <Button variant="outline" size="icon" title="Align Middle (Vert)" onClick={() => {
                                    const selectedFields = fields.filter(f => selectedFieldIds.includes(f.id))

                                    const getEffectiveRect = (f: TemplateField) => {
                                        if (f.height > 0) return { y: f.y, height: f.height }
                                        const el = document.getElementById(`field-${f.id}`)
                                        return el ? { y: f.y, height: el.getBoundingClientRect().height / zoom } : { y: f.y, height: 0 }
                                    }

                                    const rects = selectedFields.map(getEffectiveRect)
                                    const minY = Math.min(...rects.map(r => r.y))
                                    const maxY = Math.max(...rects.map(r => r.y + r.height))
                                    const centerY = (minY + maxY) / 2

                                    const newFields = fields.map(f => {
                                        if (selectedFieldIds.includes(f.id)) {
                                            const rect = getEffectiveRect(f)
                                            return { ...f, y: centerY - rect.height / 2 }
                                        }
                                        return f
                                    })
                                    pushState(newFields)
                                    setFields(newFields)
                                }}><AlignCenter className="h-4 w-4" /></Button>

                                <Button variant="outline" size="icon" title="Align Bottom" onClick={() => {
                                    const selectedFields = fields.filter(f => selectedFieldIds.includes(f.id))

                                    const getEffectiveRect = (f: TemplateField) => {
                                        if (f.height > 0) return { y: f.y, height: f.height }
                                        const el = document.getElementById(`field-${f.id}`)
                                        return el ? { y: f.y, height: el.getBoundingClientRect().height / zoom } : { y: f.y, height: 0 }
                                    }

                                    const rects = selectedFields.map(getEffectiveRect)
                                    const maxBottom = Math.max(...rects.map(r => r.y + r.height))

                                    const newFields = fields.map(f => {
                                        if (selectedFieldIds.includes(f.id)) {
                                            const rect = getEffectiveRect(f)
                                            return { ...f, y: maxBottom - rect.height }
                                        }
                                        return f
                                    })
                                    pushState(newFields)
                                    setFields(newFields)
                                }}><AlignVerticalSpaceAround className="h-4 w-4 -rotate-90" /></Button>
                            </div>

                            <h4 className="text-xs font-semibold mb-2 text-gray-500 mt-4">Distribution</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    // Distribute Horizontally
                                    const selectedFields = fields.filter(f => selectedFieldIds.includes(f.id)).sort((a, b) => a.x - b.x)
                                    if (selectedFields.length < 3) return

                                    // Need effective widths for distribution calculation
                                    const getEffectiveRect = (f: TemplateField) => {
                                        if (f.width > 0) return { id: f.id, x: f.x, width: f.width }
                                        const el = document.getElementById(`field-${f.id}`)
                                        return el ? { id: f.id, x: f.x, width: el.getBoundingClientRect().width / zoom } : { id: f.id, x: f.x, width: 0 }
                                    }

                                    const rects = selectedFields.map(getEffectiveRect)
                                    const first = rects[0]
                                    const last = rects[rects.length - 1]

                                    // Span from first Left to last Right
                                    const span = (last.x + last.width) - first.x
                                    const sumWidths = rects.reduce((sum, r) => sum + r.width, 0)
                                    const totalGap = span - sumWidths
                                    const gap = totalGap / (rects.length - 1)

                                    let currentX = first.x + first.width + gap
                                    const updates = new Map<string, number>()

                                    for (let i = 1; i < rects.length - 1; i++) {
                                        updates.set(rects[i].id, currentX)
                                        currentX += rects[i].width + gap
                                    }

                                    const newFields = fields.map(f => {
                                        if (updates.has(f.id)) {
                                            return { ...f, x: updates.get(f.id)! }
                                        }
                                        return f
                                    })
                                    pushState(newFields)
                                    setFields(newFields)

                                }}><AlignHorizontalSpaceAround className="h-4 w-4 mr-2" /> Horiz</Button>

                                <Button variant="outline" size="sm" onClick={() => {
                                    // Distribute Vertically
                                    const selectedFields = fields.filter(f => selectedFieldIds.includes(f.id)).sort((a, b) => a.y - b.y)
                                    if (selectedFields.length < 3) return

                                    const getEffectiveRect = (f: TemplateField) => {
                                        if (f.height > 0) return { id: f.id, y: f.y, height: f.height }
                                        const el = document.getElementById(`field-${f.id}`)
                                        return el ? { id: f.id, y: f.y, height: el.getBoundingClientRect().height / zoom } : { id: f.id, y: f.y, height: 0 }
                                    }

                                    const rects = selectedFields.map(getEffectiveRect)
                                    const first = rects[0]
                                    const last = rects[rects.length - 1]

                                    // Calculate total gap
                                    const span = (last.y + last.height) - first.y
                                    const sumHeights = rects.reduce((sum, r) => sum + r.height, 0)
                                    const totalGap = span - sumHeights
                                    const gap = totalGap / (rects.length - 1)

                                    let currentY = first.y + first.height + gap
                                    const updates = new Map<string, number>()

                                    for (let i = 1; i < rects.length - 1; i++) {
                                        updates.set(rects[i].id, currentY)
                                        currentY += rects[i].height + gap
                                    }

                                    const newFields = fields.map(f => {
                                        if (updates.has(f.id)) {
                                            return { ...f, y: updates.get(f.id)! }
                                        }
                                        return f
                                    })
                                    pushState(newFields)
                                    setFields(newFields)
                                }}><AlignVerticalSpaceAround className="h-4 w-4 mr-2" /> Vert</Button>
                            </div>
                        </div>
                    )}

                    {/* Template Settings (Background) */}
                    {!selectedField && selectedFieldIds.length === 0 && (
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
                            {isMultiSelect && (
                                <div className="bg-blue-50 p-2 border border-blue-200 rounded text-xs text-blue-700 mb-2">
                                    {selectedFieldIds.length} items selected. Editing primary item.
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label>Field Type</Label>
                                <Input value={selectedField.field_type} disabled />
                            </div>

                            {selectedField.field_type === 'image' && (
                                <div className="grid gap-2 border p-2 rounded mb-2">
                                    <Label>Image Source</Label>
                                    <div className="flex gap-2 mb-2">
                                        <Button
                                            variant={!selectedField.field_key.startsWith('http') ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => updateField(selectedField.id, { field_key: 'profile_image' })}
                                        >
                                            Dynamic
                                        </Button>
                                        <Button
                                            variant={selectedField.field_key.startsWith('http') ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => updateField(selectedField.id, { field_key: 'https://' })}
                                        >
                                            Static
                                        </Button>
                                    </div>

                                    {selectedField.field_key.startsWith('http') ? (
                                        <div className="grid gap-2">
                                            <Label>Upload Image</Label>
                                            <Input type="file" accept="image/*" onChange={handleImageUpload} />
                                            <Label className="text-xs">Or URL:</Label>
                                            <Input
                                                value={selectedField.field_key}
                                                onChange={(e) => updateField(selectedField.id, { field_key: e.target.value })}
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            <Label>Data Key</Label>
                                            <Select
                                                value={selectedField.field_key}
                                                onValueChange={(val) => updateField(selectedField.id, { field_key: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Data" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="profile_image">Profile Image</SelectItem>
                                                    <SelectItem value="signature">Signature</SelectItem>
                                                    <SelectItem value="organization.logo">Org Logo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedField.field_type !== 'icon' && selectedField.field_type !== 'image' && selectedField.field_type !== 'box' && (
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

                            <div className="flex flex-col gap-2">
                                <Label>Position</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between"
                                        >
                                            <span className="flex items-center">
                                                <Move className="mr-2 h-4 w-4" />
                                                Align Element
                                            </span>
                                            <LucideIcons.ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px]">
                                        <DropdownMenuLabel>Positioning Options</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => updateField(selectedField.id, { x: (Math.round(canvasWidth) - selectedField.width) / 2 })}>
                                            <AlignHorizontalSpaceAround className="mr-2 h-4 w-4" />
                                            <span>Center Horizontally</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateField(selectedField.id, { y: (Math.round(canvasHeight) - selectedField.height) / 2 })}>
                                            <AlignVerticalSpaceAround className="mr-2 h-4 w-4" />
                                            <span>Center Vertically</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => updateField(selectedField.id, {
                                            x: (Math.round(canvasWidth) - selectedField.width) / 2,
                                            y: (Math.round(canvasHeight) - selectedField.height) / 2
                                        })}>
                                            <Move className="mr-2 h-4 w-4" />
                                            <span>Center Both</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-1">
                                    <Label>Width</Label>
                                    <Input
                                        type="number"
                                        value={Math.round(selectedField.width || 0)}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value)
                                            updateField(selectedField.id, { width: isNaN(val) ? 0 : val })
                                        }}
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Height</Label>
                                    <Input
                                        type="number"
                                        value={Math.round(selectedField.height || 0)}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value)
                                            updateField(selectedField.id, { height: isNaN(val) ? 0 : val })
                                        }}
                                    />
                                </div>
                            </div>

                            {selectedField.field_type === 'text' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label>Font Size (px)</Label>
                                        <Input
                                            type="number"
                                            value={selectedField.font_size || 0}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value)
                                                updateField(selectedField.id, { font_size: isNaN(val) ? 0 : val })
                                            }}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Font Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={selectedField.color || '#000000'}
                                                onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                                                className="w-12 h-12 p-1 rounded-md cursor-pointer"
                                            />
                                            <Input
                                                value={selectedField.color || '#000000'}
                                                onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                                                className="flex-1"
                                            />
                                        </div>
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
                                    <div className="flex items-center space-x-2 border p-2 rounded-md">
                                        <Input
                                            type="checkbox"
                                            id="uppercase"
                                            className="w-4 h-4"
                                            checked={selectedField.uppercase || false}
                                            onChange={(e) => updateField(selectedField.id, { uppercase: e.target.checked })}
                                        />
                                        <Label htmlFor="uppercase" className="cursor-pointer">Uppercase</Label>
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

                            <div className="grid gap-2">
                                <Label>Rotation: {selectedField.rotation || 0}°</Label>
                                <div className="flex gap-2 items-center">
                                    <Slider
                                        value={[selectedField.rotation || 0]}
                                        max={360}
                                        step={1}
                                        onValueChange={(val) => updateField(selectedField.id, { rotation: val[0] })}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        value={selectedField.rotation || 0}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value)
                                            updateField(selectedField.id, { rotation: isNaN(val) ? 0 : val })
                                        }}
                                        className="w-16"
                                    />
                                </div>
                            </div>

                            {selectedField.field_type === 'box' && (
                                <div className="grid gap-2 border-t pt-4 mt-4">
                                    <h4 className="font-semibold text-xs">Box Properties</h4>
                                    <div className="grid gap-2">
                                        <Label>Fill Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={selectedField.background_color || '#ffffff'}
                                                onChange={(e) => updateField(selectedField.id, { background_color: e.target.value })}
                                                className="w-8 h-8 p-1"
                                            />
                                            <Input
                                                value={selectedField.background_color || ''}
                                                onChange={(e) => updateField(selectedField.id, { background_color: e.target.value })}
                                                placeholder="transparent"
                                                className="text-xs"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => updateField(selectedField.id, { background_color: 'transparent' })}
                                                title="No Fill (Transparent)"
                                            >
                                                <Ban className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Border Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={selectedField.border_color || '#000000'}
                                                onChange={(e) => updateField(selectedField.id, { border_color: e.target.value })}
                                                className="w-8 h-8 p-1"
                                            />
                                            <Input
                                                value={selectedField.border_color || ''}
                                                onChange={(e) => updateField(selectedField.id, { border_color: e.target.value })}
                                                className="text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="grid gap-1">
                                            <Label>Border Width</Label>
                                            <Input
                                                type="number"
                                                value={selectedField.border_width || 0}
                                                onChange={(e) => updateField(selectedField.id, { border_width: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Radius</Label>
                                            <Input
                                                type="number"
                                                value={selectedField.border_radius || 0}
                                                onChange={(e) => updateField(selectedField.id, { border_radius: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

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
