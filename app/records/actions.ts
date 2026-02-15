'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRecord(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get org id
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profile not found' }

    // Handle file uploads
    const photoFile = formData.get('photo') as File
    let photoPath = null
    if (photoFile && photoFile.size > 0) {
        if (photoFile.size > 5 * 1024 * 1024) return { error: 'Photo must be less than 5MB' }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(photoFile.type)) return { error: 'Photo must be JPEG, PNG, or WebP' }
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = `${profile.organization_id}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('id-photos')
            .upload(filePath, photoFile)

        if (uploadError) {
            return { error: `Photo upload failed: ${uploadError.message}` }
        }
        photoPath = filePath
    }

    const signatureFile = formData.get('signature') as File
    let signaturePath = null
    if (signatureFile && signatureFile.size > 0) {
        if (signatureFile.size > 5 * 1024 * 1024) return { error: 'Signature must be less than 5MB' }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(signatureFile.type)) return { error: 'Signature must be JPEG, PNG, or WebP' }
        const fileExt = signatureFile.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = `${profile.organization_id}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('id-signatures')
            .upload(filePath, signatureFile)

        if (uploadError) {
            return { error: `Signature upload failed: ${uploadError.message}` }
        }
        signaturePath = filePath
    }

    const recordData = {
        organization_id: profile.organization_id,
        template_id: formData.get('template_id') as string,
        first_name: formData.get('first_name') as string,
        middle_name: formData.get('middle_name') as string,
        last_name: formData.get('last_name') as string,
        employee_no: formData.get('employee_no') as string,
        position: formData.get('position') as string,
        // school_name and division are now sourced from organization settings dynamically

        tin_number: formData.get('tin_number') as string,
        sss_gsis_number: formData.get('sss_gsis_number') as string,
        pagibig_number: formData.get('pagibig_number') as string,
        philhealth_number: formData.get('philhealth_number') as string,

        emergency_contact_name: formData.get('emergency_contact_name') as string,
        emergency_contact_phone: formData.get('emergency_contact_phone') as string,
        emergency_contact_address: formData.get('emergency_contact_address') as string,
        birthdate: formData.get('birthdate') as string,

        photo_url: photoPath,
        signature_url: signaturePath,
    }

    const { error } = await supabase
        .from('id_records')
        .insert(recordData)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/records')
    redirect('/dashboard/records')
}

export async function updateRecord(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get org id to verify ownership
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profile not found' }

    // Handle file uploads (similar logic, maybe refactor if time permits)
    const photoFile = formData.get('photo') as File
    let photoPath = undefined
    if (photoFile && photoFile.size > 0) {
        if (photoFile.size > 5 * 1024 * 1024) return { error: 'Photo must be less than 5MB' }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(photoFile.type)) return { error: 'Photo must be JPEG, PNG, or WebP' }
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = `${profile.organization_id}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('id-photos')
            .upload(filePath, photoFile)

        if (uploadError) {
            return { error: `Photo upload failed: ${uploadError.message}` }
        }
        photoPath = filePath
    }

    const signatureFile = formData.get('signature') as File
    let signaturePath = undefined
    if (signatureFile && signatureFile.size > 0) {
        if (signatureFile.size > 5 * 1024 * 1024) return { error: 'Signature must be less than 5MB' }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(signatureFile.type)) return { error: 'Signature must be JPEG, PNG, or WebP' }
        const fileExt = signatureFile.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = `${profile.organization_id}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('id-signatures')
            .upload(filePath, signatureFile)

        if (uploadError) {
            return { error: `Signature upload failed: ${uploadError.message}` }
        }
        signaturePath = filePath
    }

    const recordData: any = {
        template_id: formData.get('template_id') as string,
        first_name: formData.get('first_name') as string,
        middle_name: formData.get('middle_name') as string,
        last_name: formData.get('last_name') as string,
        employee_no: formData.get('employee_no') as string,
        position: formData.get('position') as string,
        // school_name and division are now sourced from organization settings dynamically

        tin_number: formData.get('tin_number') as string,
        sss_gsis_number: formData.get('sss_gsis_number') as string,
        pagibig_number: formData.get('pagibig_number') as string,
        philhealth_number: formData.get('philhealth_number') as string,

        emergency_contact_name: formData.get('emergency_contact_name') as string,
        emergency_contact_phone: formData.get('emergency_contact_phone') as string,
        emergency_contact_address: formData.get('emergency_contact_address') as string,
        birthdate: formData.get('birthdate') as string,
    }

    if (photoPath) recordData.photo_url = photoPath
    if (signaturePath) recordData.signature_url = signaturePath

    const { error } = await supabase
        .from('id_records')
        .update(recordData)
        .eq('id', id)
        .eq('organization_id', profile.organization_id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/records')
    redirect('/dashboard/records')
}

export async function deleteRecord(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get org id
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profile not found' }

    const { error } = await supabase
        .from('id_records')
        .delete()
        .eq('id', id)
        .eq('organization_id', profile.organization_id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/records')
}
