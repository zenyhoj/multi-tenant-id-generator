'use client'

import React, { forwardRef, useEffect } from 'react'
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
    // Debug logging
    useEffect(() => {
        // Only log in development or if explicitly requested
        if (true) {
            console.log(`[IDRenderer] ${side} mounted`, {
                templateId: template?.id,
                fieldsCount: fields?.length,
                recordId: record?.id,
                sideProp: side
            })
        }
    }, [template, fields, record, side])

    if (!template) {
        return <div className="text-red-500 p-4 border border-red-500 bg-red-50">No Template Data Provided</div>
    }

    const width = (Number(template.width_mm) || 85.6) * MM_TO_PX
    const height = (Number(template.height_mm) || 54) * MM_TO_PX

    // Resolve field values
    const resolveValue = (key: string) => {
        if (!key) return ''

        // Check organization nested keys
        if (key.startsWith('organization.')) {
            const orgKey = key.split('.')[1]
            return organization?.[orgKey] || ''
        }

        // Check direct record keys
        if (record && record[key] !== undefined) {
            return record[key]
        }

        // Return key itself if not found/static
        return key
    }

    const bgUrl = side === 'front' ? template.background_front_url : template.background_back_url
    const fullBgUrl = bgUrl ? (bgUrl.startsWith('http') ? bgUrl : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/template-backgrounds/${bgUrl}`) : ''

    const safeFields = Array.isArray(fields) ? fields : []
    // Filter fields for the current side (case-insensitive)
    const sideFields = safeFields.filter((f: any) =>
        (f.side || '').toLowerCase() === (side || '').toLowerCase()
    )

    // Log if no fields found for this side
    if (sideFields.length === 0 && fields?.length > 0) {
        console.warn(`[IDRenderer] No fields match side '${side}'. Available sides:`, fields.map(f => f.side))
    }

    return (
        <div
            ref={ref}
            className={cn("bg-white shadow-sm relative overflow-hidden print:shadow-none transition-transform", className)}
            style={{
                width: width,
                height: height,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                backgroundColor: (side === 'front' ? template.background_color_front : template.background_color_back) || 'white',
            }}
        >
            {/* Background Image */}
            {fullBgUrl && (
                <img
                    src={fullBgUrl}
                    alt="background"
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    onError={(e) => console.error(`[IDRenderer] Failed to load background: ${fullBgUrl}`, e)}
                />
            )}

            {/* Content Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {sideFields.map((field: any) => {
                    const content = resolveValue(field.field_key)

                    return (
                        <div
                            key={field.id}
                            className="absolute flex items-center overflow-hidden"
                            style={{
                                left: Number(field.x),
                                top: Number(field.y),
                                width: Number(field.width),
                                height: Number(field.height),
                                fontSize: `${Number(field.font_size)}px`,
                                fontWeight: field.font_weight,
                                textAlign: field.text_align as any,
                                justifyContent: field.text_align === 'center' ? 'center' : field.text_align === 'right' ? 'flex-end' : 'flex-start',
                                color: 'black',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.2',
                                opacity: field.opacity ?? 1,
                            }}
                        >
                            {field.field_type === 'text' && <span>{content}</span>}

                            {field.field_type === 'image' && (
                                content && (content.startsWith('http') || content.startsWith('/')) ? (
                                    <img
                                        src={content}
                                        alt="img"
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-cover"
                                        onError={(e) => console.error(`[IDRenderer] Failed to load image field: ${content}`)}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 border border-gray-300">
                                        <ImageIcon size={24} />
                                    </div>
                                )
                            )}

                            {field.field_type === 'qrcode' && (
                                <div className="bg-white p-1 w-full h-full flex items-center justify-center">
                                    <QrCode className="w-full h-full" />
                                </div>
                            )}

                            {field.field_type === 'signature' && (
                                content && (content.startsWith('http') || content.startsWith('/')) ? (
                                    <img
                                        src={content}
                                        alt="sign"
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-contain"
                                        onError={(e) => console.error(`[IDRenderer] Failed to load signature: ${content}`)}
                                    />
                                ) : (
                                    <div className="w-full h-full border border-dashed flex items-center justify-center text-[10px] text-gray-400">
                                        Sign
                                    </div>
                                )
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
})

IDRenderer.displayName = "IDRenderer"
