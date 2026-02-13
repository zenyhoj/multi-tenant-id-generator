'use client'

import { useState, useRef, useEffect } from 'react'
import { IDRenderer } from '@/components/id-renderer'
import { Button } from '@/components/ui/button'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { Loader2, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface BulkGenerateClientProps {
    records: any[]
    templates: any[]
    organization: any
}

export default function BulkGenerateClient({ records, templates, organization }: BulkGenerateClientProps) {
    const [generating, setGenerating] = useState(false)
    const [progress, setProgress] = useState(0)
    // We need refs for each record... strictly speaking we can render them one by one or all at once.
    // Rendering all at once might be heavy if there are 100s.
    // But basic approach: Render all hidden, then capture.

    // We can use a map of refs
    const refs = useRef<{ [key: string]: { front: HTMLDivElement | null, back: HTMLDivElement | null } }>({})

    const getTemplate = (id: string) => templates.find(t => t.id === id)

    const handleDownloadAllPDF = async () => {
        setGenerating(true)
        setProgress(0)
        const toastId = toast.loading('Generating PDF...')

        try {
            const pdf = new jsPDF({
                orientation: 'p', // We will set individual page orientation
                unit: 'mm',
            })
            // Remove default first page
            pdf.deletePage(1)

            let count = 0
            for (const record of records) {
                const template = getTemplate(record.template_id)
                if (!template) continue

                const recordRefs = refs.current[record.id]
                if (!recordRefs?.front || !recordRefs?.back) continue

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

    return (
        <div className="flex flex-col gap-8">
            <div className="bg-white p-6 rounded shadow flex flex-col items-center justify-center gap-4 sticky top-4 z-10 border">
                <h2 className="text-xl font-bold">Bulk Generation</h2>
                <div className="flex gap-4 items-center">
                    <span className="text-sm font-medium">{records.length} records selected</span>
                    <Button onClick={handleDownloadAllPDF} disabled={generating}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {records.map(record => {
                    const template = getTemplate(record.template_id)
                    if (!template) return (
                        <div key={record.id} className="p-4 border border-red-200 bg-red-50 text-red-500 rounded">
                            <AlertCircle className="inline mr-2" />
                            Missing Template for {record.last_name}
                        </div>
                    )

                    return (
                        <div key={record.id} className="flex flex-col gap-4 border p-4 rounded bg-gray-50/50">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-bold">{record.last_name}, {record.first_name}</span>
                                <span className="text-xs text-muted-foreground">{record.employee_no}</span>
                            </div>

                            {/* Render Off-screen / Hidden but accessible for capture? 
                                Actually toPng requires the element to be in DOM and visible (mostly).
                                We can scale them down for preview, or just render them normally.
                                Let's render them in a scaled wrapper for preview, but capture might need full scale?
                                toPng handles scaling with 'pixelRatio'.
                                Let's just render them.
                            */}

                            <div className="flex flex-col items-center gap-2 transform scale-75 origin-top">
                                <span className="text-xs font-semibold text-gray-500">Front</span>
                                <div className="border shadow-sm">
                                    <IDRenderer
                                        ref={(el) => {
                                            if (!refs.current[record.id]) refs.current[record.id] = { front: null, back: null }
                                            refs.current[record.id].front = el
                                        }}
                                        template={template}
                                        fields={template.template_fields}
                                        record={record}
                                        organization={organization}
                                        side="front"
                                        scale={1}
                                    />
                                </div>
                                <span className="text-xs font-semibold text-gray-500 mt-2">Back</span>
                                <div className="border shadow-sm">
                                    <IDRenderer
                                        ref={(el) => {
                                            if (!refs.current[record.id]) refs.current[record.id] = { front: null, back: null }
                                            refs.current[record.id].back = el
                                        }}
                                        template={template}
                                        fields={template.template_fields}
                                        record={record}
                                        organization={organization}
                                        side="back"
                                        scale={1}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
