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

    const { error } = await supabase
        .from('id_templates')
        .update({
            name,
            width_mm: width,
            height_mm: height,
            orientation,
        })
        .eq('id', id)
        .eq('organization_id', (await supabase.from('profiles').select('organization_id').eq('id', user.id).single()).data?.organization_id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/templates/${id}/builder`)
    redirect(`/templates/${id}/builder`)
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

    const { data, error } = await supabase
        .from('id_templates')
        .insert({
            organization_id: profile.organization_id,
            name,
            width_mm: width,
            height_mm: height,
            orientation,
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    redirect(`/templates/${data.id}/builder`) // Redirect to builder
}
