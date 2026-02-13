'use client'

import { useState, useRef } from 'react'
import { IDRenderer } from '@/components/id-renderer'
import { Button } from '@/components/ui/button'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { Loader2, Download, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface GenerateClientProps {
    template: any
    fields: any[]
    record: any
    organization: any
}

export default function GenerateClient({ template, fields, record, organization }: GenerateClientProps) {
    const frontRef = useRef<HTMLDivElement>(null)
    const backRef = useRef<HTMLDivElement>(null)
    const [generating, setGenerating] = useState(false)
    const supabase = createClient()

    // Pre-process record data if needed (e.g. resolve photo_url)
    // For now assuming raw record

    const handleDownloadPNG = async () => {
        if (!frontRef.current || !backRef.current) return
        setGenerating(true)

        try {
            const frontDataUrl = await toPng(frontRef.current, { cacheBust: true, pixelRatio: 3 })
            const backDataUrl = await toPng(backRef.current, { cacheBust: true, pixelRatio: 3 })

            // Download Front
            const link = document.createElement('a')
            link.download = `${record.last_name}_front.png`
            link.href = frontDataUrl
            link.click()

            // Download Back
            const link2 = document.createElement('a')
            link2.download = `${record.last_name}_back.png`
            link2.href = backDataUrl
            link2.click()

            toast.success('Downloaded PNGs')
        } catch (err) {
            console.error(err)
            toast.error('Failed to generate PNG')
        }
        setGenerating(false)
    }

    const handleDownloadPDF = async () => {
        if (!frontRef.current || !backRef.current) return
        setGenerating(true)

        try {
            const frontDataUrl = await toPng(frontRef.current, { cacheBust: true, pixelRatio: 3 })
            const backDataUrl = await toPng(backRef.current, { cacheBust: true, pixelRatio: 3 })

            const pdf = new jsPDF({
                orientation: template.orientation === 'portrait' ? 'p' : 'l',
                unit: 'mm',
                format: [template.width_mm, template.height_mm]
            })

            pdf.addImage(frontDataUrl, 'PNG', 0, 0, template.width_mm, template.height_mm)
            pdf.addPage()
            pdf.addImage(backDataUrl, 'PNG', 0, 0, template.width_mm, template.height_mm)

            pdf.save(`${record.last_name}_ID.pdf`)

            // Save to Generated IDs table
            // Upload PDF to storage
            const pdfBlob = pdf.output('blob')
            const fileName = `${record.id}/${Date.now()}.pdf`
            await supabase.storage.from('generated-ids').upload(fileName, pdfBlob)

            // Insert DB record
            await supabase.from('generated_ids').insert({
                record_id: record.id,
                file_url: fileName,
                format: 'pdf'
            })

            toast.success('Downloaded PDF')
        } catch (err) {
            console.error(err)
            toast.error('Failed to generate PDF')
        }
        setGenerating(false)
    }

    return (
        <div className="flex flex-col items-center gap-8 py-8">
            <div className="flex gap-4">
                <Button onClick={handleDownloadPNG} disabled={generating}>
                    {generating ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2" />}
                    Download PNG
                </Button>
                <Button onClick={handleDownloadPDF} disabled={generating} variant="secondary">
                    {generating ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2" />}
                    Download PDF
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500">Front</span>
                    <div className="border shadow-lg">
                        <IDRenderer
                            ref={frontRef}
                            template={template}
                            fields={fields}
                            record={record}
                            organization={organization}
                            side="front"
                            scale={1}
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500">Back</span>
                    <div className="border shadow-lg">
                        <IDRenderer
                            ref={backRef}
                            template={template}
                            fields={fields}
                            record={record}
                            organization={organization}
                            side="back"
                            scale={1}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
