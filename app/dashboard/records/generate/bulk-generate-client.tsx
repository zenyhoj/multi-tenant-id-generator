'use client'

import { useState, useRef, useEffect } from 'react'
import { IDRenderer } from '@/components/id-renderer'
import { Button } from '@/components/ui/button'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { Loader2, Download, Eye, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface BulkGenerateClientProps {
    records: any[]
    templates: any[]
    organization: any
}

export default function BulkGenerateClient({ records: initialRecords, templates, organization }: BulkGenerateClientProps) {
    const [records, setRecords] = useState(initialRecords)
    const [generating, setGenerating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [selectedRecord, setSelectedRecord] = useState<any>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    // Refs for generation (hidden)
    const refs = useRef<{ [key: string]: { front: HTMLDivElement | null, back: HTMLDivElement | null } }>({})

    const getTemplate = (id: string) => templates.find(t => t.id === id)

    // Debug logging
    useEffect(() => {
        if (!records.length || !templates.length) return

        // Log warnings for missing templates
        records.forEach(r => {
            const t = getTemplate(r.template_id)
            if (!t) {
                console.warn(`Template not found for record ${r.last_name}`)
            }
        })
    }, [records, templates])


    const handleDownloadAllPDF = async () => {
        if (records.length === 0) return
        setGenerating(true)
        setProgress(0)
        const toastId = toast.loading('Generating PDF...')

        try {
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
            })
            pdf.deletePage(1)

            let count = 0
            for (const record of records) {
                const template = getTemplate(record.template_id)
                if (!template) continue

                const recordRefs = refs.current[record.id]
                if (!recordRefs?.front || !recordRefs?.back) {
                    console.warn(`Missing refs for record ${record.id}`)
                    continue
                }

                // Capture Front
                const frontDataUrl = await toPng(recordRefs.front, { cacheBust: true, pixelRatio: 2 })
                // Capture Back
                const backDataUrl = await toPng(recordRefs.back, { cacheBust: true, pixelRatio: 2 })

                // Add Front Page
                pdf.addPage([template.width_mm, template.height_mm], template.orientation === 'portrait' ? 'p' : 'l')
                pdf.addImage(frontDataUrl, 'PNG', 0, 0, template.width_mm, template.height_mm)

                // Add Back Page
                pdf.addPage([template.width_mm, template.height_mm], template.orientation === 'portrait' ? 'p' : 'l')
                pdf.addImage(backDataUrl, 'PNG', 0, 0, template.width_mm, template.height_mm)

                count++
                setProgress(Math.round((count / records.length) * 100))
            }

            pdf.save(`Bulk_IDs_${organization.name}.pdf`)
            toast.success('Generated PDF successfully', { id: toastId })

        } catch (err) {
            console.error(err)
            toast.error('Failed to generate PDF', { id: toastId })
        }
        setGenerating(false)
    }

    const openPreview = (record: any) => {
        setSelectedRecord(record)
        setIsPreviewOpen(true)
    }

    const removeRecord = (id: string) => {
        setRecords(prev => prev.filter(r => r.id !== id))
    }

    if (records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-muted-foreground">No records selected for generation.</p>
                <Button onClick={() => window.history.back()} variant="outline">Go Back</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="bg-white p-6 rounded shadow flex flex-col items-center justify-center gap-4 sticky top-4 z-10 border">
                <h2 className="text-xl font-bold">Bulk Generation</h2>
                <div className="flex gap-4 items-center">
                    <span className="text-sm font-medium">{records.length} records selected</span>
                    <Button onClick={handleDownloadAllPDF} disabled={generating || records.length === 0}>
                        {generating ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2" />}
                        Download All (PDF)
                    </Button>
                </div>
                {generating && (
                    <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        <p className="text-xs text-center mt-1 text-muted-foreground">{progress}%</p>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Template</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.map(record => {
                            const template = getTemplate(record.template_id)
                            return (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <div className="font-medium">{record.last_name}, {record.first_name}</div>
                                        <div className="text-xs text-muted-foreground">{record.employee_no}</div>
                                    </TableCell>
                                    <TableCell>
                                        {template ? (
                                            <span className="text-sm">{template.name}</span>
                                        ) : (
                                            <span className="text-red-500 flex items-center gap-1">
                                                <AlertCircle size={14} /> Missing
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openPreview(record)} disabled={!template} title="Preview">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => removeRecord(record.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Remove from list">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ID Preview: {selectedRecord?.last_name}, {selectedRecord?.first_name}</DialogTitle>
                    </DialogHeader>
                    {selectedRecord && getTemplate(selectedRecord.template_id) && (
                        (() => {
                            const template = getTemplate(selectedRecord.template_id)
                            const effectiveOrganization = template.organization_details ? {
                                ...organization,
                                ...template.organization_details,
                                address: template.organization_details.division_address || organization.division_address,
                            } : organization

                            return (
                                <div className="flex flex-col md:flex-row gap-8 items-start justify-center p-4 bg-gray-50 rounded">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-500">Front</span>
                                        <div className="border shadow-lg">
                                            <IDRenderer
                                                template={template}
                                                fields={template.template_fields}
                                                record={selectedRecord}
                                                organization={effectiveOrganization}
                                                side="front"
                                                scale={1}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-500">Back</span>
                                        <div className="border shadow-lg">
                                            <IDRenderer
                                                template={template}
                                                fields={template.template_fields}
                                                record={selectedRecord}
                                                organization={effectiveOrganization}
                                                side="back"
                                                scale={1}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })()
                    )}
                </DialogContent>
            </Dialog>

            {/* Hidden Rendering Area for PDF Generation */}
            <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
                {records.map(record => {
                    const template = getTemplate(record.template_id)
                    if (!template) return null

                    const effectiveOrganization = template.organization_details ? {
                        ...organization,
                        ...template.organization_details,
                        address: template.organization_details.division_address || organization.division_address,
                    } : organization

                    return (
                        <div key={record.id}>
                            <IDRenderer
                                ref={(el) => {
                                    if (!refs.current[record.id]) refs.current[record.id] = { front: null, back: null }
                                    refs.current[record.id].front = el
                                }}
                                template={template}
                                fields={template.template_fields}
                                record={record}
                                organization={effectiveOrganization}
                                side="front"
                                scale={1} // Must be 1 for correct PDF size
                            />
                            <IDRenderer
                                ref={(el) => {
                                    if (!refs.current[record.id]) refs.current[record.id] = { front: null, back: null }
                                    refs.current[record.id].back = el
                                }}
                                template={template}
                                fields={template.template_fields}
                                record={record}
                                organization={effectiveOrganization}
                                side="back"
                                scale={1}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
