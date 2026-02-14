'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateTemplate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const unit = formData.get('unit') as string
    let width = parseFloat(formData.get('width') as string)
    let height = parseFloat(formData.get('height') as string)

    // Convert to mm if needed
    if (unit === 'in') {
        width = width * 25.4
        height = height * 25.4
    } else if (unit === 'px') {
        // Assuming 96 DPI
        width = width * 25.4 / 96
        height = height * 25.4 / 96
    }

    const orientation = formData.get('orientation') as string

    try {
        const { error } = await supabase
            .from('id_templates')
            .update({
                name,
                width_mm: width,
                height_mm: height,
                orientation,
                measurement_unit: unit || 'mm', // Valid fallback
            })
            .eq('id', id)
            .eq('organization_id', (await supabase.from('profiles').select('organization_id').eq('id', user.id).single()).data?.organization_id)

        if (error) {
            console.error('Supabase update error:', error)
            return { error: error.message }
        }
    } catch (err) {
        console.error('Unexpected error in updateTemplate:', err)
        return { error: 'An unexpected error occurred. Please check your connection and try again.' }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/templates/${id}/builder`)
    redirect(`/dashboard/templates/${id}/builder`)
}

export async function createTemplate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Get org id
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return { error: 'Profile not found' }
    }

    const name = formData.get('name') as string
    const unit = formData.get('unit') as string
    let width = parseFloat(formData.get('width') as string)
    let height = parseFloat(formData.get('height') as string)

    // Convert to mm if needed
    if (unit === 'in') {
        width = width * 25.4
        height = height * 25.4
    } else if (unit === 'px') {
        // Assuming 96 DPI
        width = width * 25.4 / 96
        height = height * 25.4 / 96
    }

    const orientation = formData.get('orientation') as string

    try {
        const { data, error } = await supabase
            .from('id_templates')
            .insert({
                organization_id: profile.organization_id,
                name,
                width_mm: width,
                height_mm: height,
                orientation,
                measurement_unit: unit || 'mm', // Valid fallback
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase create error:', error)
            return { error: error.message }
        }

        revalidatePath('/dashboard')
        redirect(`/dashboard/templates/${data.id}/builder`) // Redirect to builder
    } catch (err) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
            throw err // Re-throw redirect error
        }
        console.error('Unexpected error in createTemplate:', err)
        return { error: 'An unexpected error occurred. Please check your connection.' }
    }
}

export async function duplicateTemplate(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // 1. Get original template
    const { data: original, error: fetchError } = await supabase
        .from('id_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !original) {
        return { error: 'Template not found' }
    }

    // 2. Create new template copy
    const { data: newTemplate, error: createError } = await supabase
        .from('id_templates')
        .insert({
            organization_id: original.organization_id,
            name: `Copy of ${original.name}`,
            width_mm: original.width_mm,
            height_mm: original.height_mm,
            orientation: original.orientation,
            // Assuming we don't copy specific config like background_url effectively unless we handle storage, 
            // but for now basic fields are enough.
            // If background_url is just a string URL, it should copy fine.
        })
        .select()
        .single()

    if (createError) {
        return { error: 'Failed to create copy' }
    }

    // 3. Get original fields
    const { data: fields } = await supabase
        .from('template_fields')
        .select('*')
        .eq('template_id', id)

    // 4. Duplicate fields
    if (fields && fields.length > 0) {
        const fieldsToInsert = fields.map(field => {
            const { id, created_at, template_id, ...rest } = field
            return {
                ...rest,
                template_id: newTemplate.id
            }
        })

        const { error: fieldsError } = await supabase
            .from('template_fields')
            .insert(fieldsToInsert)

        if (fieldsError) {
            console.error('Failed to copy fields', fieldsError)
            // We continue even if fields fail, though ideally we'd rollback.
        }
    }

    revalidatePath('/dashboard/templates')
    return { success: true }
}
