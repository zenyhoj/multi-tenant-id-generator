'use client'
// Re-compile trigger

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
            const bgField = side === 'front' ? template?.background_front_url : template?.background_back_url
            console.log(`[IDRenderer] ${side} mounted`, {
                templateId: template?.id,
                fieldsCount: fields?.length,
                recordId: record?.id,
                sideProp: side,
                bgFieldFromTemplate: bgField,
                fullBgUrlComputed: bgField ? (bgField.startsWith('http') ? bgField : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/template-backgrounds/${bgField}`) : 'None'
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

        // Handle specific aliases
        if (key === 'profile_image' && record?.photo_url) return record.photo_url
        if (key === 'signature' && record?.signature_url) return record.signature_url

        // Map School Name and Division to Organization Settings
        if (key === 'school_name') return organization?.name || ''
        if (key === 'division') return organization?.division_name || ''

        if (key.startsWith('full_name_')) {
            const last = record?.last_name || ''
            const first = record?.first_name || ''
            const middle = record?.middle_name || ''
            const midInitial = middle ? ` ${middle[0]}.` : ''
            const midFull = middle ? ` ${middle}` : ''

            switch (key) {
                case 'full_name_western': return `${first}${midFull} ${last}`.trim() // Zeniepe Dela Cruz Balingit
                case 'full_name_eastern': return `${last}, ${first}${midFull}`.trim() // Balingit, Zeniepe Dela Cruz
                case 'full_name_initial': return `${first}${midInitial} ${last}`.trim() // Zeniepe D. Balingit
                case 'full_name_filipino': return `${last}, ${first}${midInitial}`.trim() // Balingit, Zeniepe D.
            }
        }

        // Check organization nested keys
        if (key.startsWith('organization.')) {
            const orgKey = key.split('.')[1]
            return organization?.[orgKey] || ''
        }

        // Check direct record keys
        if (record && record[key] !== undefined) {
            return record[key] ?? ''
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

    const getFullImageUrl = (path: string | null | undefined, bucket: string = 'id-images') => { // Default bucket, adjust if needed
        if (!path) return null
        if (path.startsWith('http') || path.startsWith('blob:')) return path
        if (path.startsWith('/')) return path // Local asset?
        // Assume relative path in storage
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
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
                backgroundImage: fullBgUrl ? `url('${fullBgUrl}')` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >


            {/* Content Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {sideFields.map((field: any) => {
                    console.log(`[IDRenderer] Field ${field.field_key}:`, {
                        rotation: field.rotation,
                        content: resolveValue(field.field_key),
                        uppercase: field.uppercase
                    })
                    let content = resolveValue(field.field_key) || ''

                    if (field.field_type === 'text' && field.uppercase) {
                        content = String(content).toUpperCase()
                    }

                    return (
                        <div
                            key={field.id}
                            className="absolute flex items-center overflow-hidden"
                            style={{
                                left: Number(field.x),
                                top: Number(field.y),
                                width: Number(field.width) > 0 ? Number(field.width) : 'auto',
                                height: Number(field.height) > 0 ? Number(field.height) : 'auto',
                                fontSize: `${Number(field.font_size)}px`,
                                fontWeight: field.font_weight,
                                textAlign: field.text_align as any,
                                justifyContent: field.text_align === 'center' ? 'center' : field.text_align === 'right' ? 'flex-end' : 'flex-start',
                                color: field.color || '#000000',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.2',
                                opacity: field.opacity ?? 1,
                                textTransform: field.uppercase ? 'uppercase' : 'none',
                                transform: `rotate(${Number(field.rotation || 0)}deg)`,
                                // Box specific styles
                                backgroundColor: (field.field_type === 'box' || field.field_type === 'line') ? (field.background_color || 'transparent') : 'transparent',
                                border: field.field_type === 'box' && Number(field.border_width) > 0 ? `${field.border_width}px solid ${field.border_color || '#000000'}` : 'none',
                                borderRadius: field.field_type === 'box' ? `${field.border_radius || 0}px` : '0px',
                            }}
                        >
                            {field.field_type === 'text' && <span>{content}</span>}

                            {field.field_type === 'image' && (
                                content ? (
                                    <img
                                        src={getFullImageUrl(content, 'id-images') || ''}
                                        alt="img"
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-contain"
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
                                content ? (
                                    <img
                                        src={getFullImageUrl(content, 'signatures') || ''}
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

                            {/* Box doesn't need content, styling is applied to container */}
                        </div>
                    )
                })}
            </div>
        </div>
    )
})

IDRenderer.displayName = "IDRenderer"
