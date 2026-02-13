'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { QrCode, Image as ImageIcon } from 'lucide-react'

interface IDRendererProps {
    template: any
    fields: any[]
    record: any
    organization: any
    side: 'front' | 'back'
    scale?: number
    className?: string
}

const MM_TO_PX = 3.78

export const IDRenderer = forwardRef<HTMLDivElement, IDRendererProps>(({
    template,
    fields,
    record,
    organization,
    side,
    scale = 1,
    className
}, ref) => {
    const width = template.width_mm * MM_TO_PX
    const height = template.height_mm * MM_TO_PX

    // Resolve field values
    const resolveValue = (key: string) => {
        if (!key) return ''

        // Check organization nested keys
        if (key.startsWith('organization.')) {
            const orgKey = key.split('.')[1]
            return organization[orgKey] || ''
        }

        // Check direct record keys
        if (record[key] !== undefined) {
            return record[key]
        }

        // If not found, return key itself (static text) if it doesn't look like a variable?
        // Or just return key.
        // Let's assume if it's not in record, it's static text.
        return key
    }

    const bgUrl = side === 'front' ? template.background_front_url : template.background_back_url
    const fullBgUrl = bgUrl ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/template-backgrounds/${bgUrl}` : ''

    return (
        <div
            ref={ref}
            className={cn("bg-white shadow-sm relative overflow-hidden print:shadow-none", className)}
            style={{
                width: width,
                height: height,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                backgroundImage: bgUrl ? `url('${fullBgUrl}')` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'white',
            }}
        >
            {fields.filter((f: any) => f.side === side).map((field: any) => {
                const content = resolveValue(field.field_key)

                return (
                    <div
                        key={field.id}
                        className="absolute flex items-center overflow-hidden"
                        style={{
                            left: field.x,
                            top: field.y,
                            width: field.width,
                            height: field.height,
                            fontSize: `${field.font_size}px`,
                            fontWeight: field.font_weight,
                            textAlign: field.text_align as any,
                            justifyContent: field.text_align === 'center' ? 'center' : field.text_align === 'right' ? 'flex-end' : 'flex-start',
                            color: 'black', // Default color, maybe add color field later
                        }}
                    >
                        {field.field_type === 'text' && <span>{content}</span>}

                        {field.field_type === 'image' && (
                            // If content is a URL (photo_url), show image. Else placeholder
                            content && (content.startsWith('http') || content.startsWith('/')) ? (
                                <img src={content} alt="img" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <ImageIcon size={24} />
                                </div>
                            )
                        )}

                        {field.field_type === 'qrcode' && (
                            <div className="bg-white p-1">
                                <QrCode className="w-full h-full" />
                                {/* In real app, generate real QR from content */}
                            </div>
                        )}

                        {field.field_type === 'signature' && (
                            content && (content.startsWith('http') || content.startsWith('/')) ? (
                                <img src={content} alt="sign" className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full border border-dashed flex items-center justify-center text-[10px] text-gray-400">
                                    Signature
                                </div>
                            )
                        )}
                    </div>
                )
            })}
        </div>
    )
})

IDRenderer.displayName = "IDRenderer"
