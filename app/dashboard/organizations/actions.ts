'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createOrganization(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const name = formData.get('name') as string
    const orgType = formData.get('org_type') as string || 'education'

    // Common fields
    const metadata: any = {
        // Capture any flexible fields here if needed
    }

    // Optional Education-specific fields (mapped to columns)
    const departmentName = formData.get('department_name') as string
    const divisionName = formData.get('division_name') as string
    const divisionAddress = formData.get('division_address') as string
    const divisionWebsite = formData.get('division_website') as string
    const divisionCode = formData.get('division_code') as string
    const stationCode = formData.get('station_code') as string
    const superintendentName = formData.get('superintendent_name') as string
    const superintendentTitle = formData.get('superintendent_title') as string


    try {
        const { data, error } = await supabase
            .from('organizations')
            .insert({
                name,
                owner_id: user.id, // Explicitly set owner
                org_type: orgType,
                metadata,
                department_name: departmentName,
                division_name: divisionName,
                division_address: divisionAddress,
                division_website: divisionWebsite,
                division_code: divisionCode,
                station_code: stationCode,
                superintendent_name: superintendentName,
                superintendent_title: superintendentTitle,
                primary_color: formData.get('primary_color') as string,
                secondary_color: formData.get('secondary_color') as string,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating organization:', error)
            return { error: error.message }
        }

        // Handle Signature Upload if present
        const signatureFile = formData.get('signature') as File
        if (signatureFile && signatureFile.size > 0 && data) {
            const fileExt = signatureFile.name.split('.').pop()
            const filePath = `${data.id}/signature.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('organization-logos')
                .upload(filePath, signatureFile, { upsert: true })

            if (uploadError) {
                console.error('Error uploading signature:', uploadError)
                // Start a toast or just log it? ideally we'd tell the user but we're redirecting. 
                // We'll just continue as the org is created.
            } else {
                await supabase.from('organizations').update({ signature_url: filePath }).eq('id', data.id)
            }
        }

        revalidatePath('/dashboard/organizations')
    } catch (err) {
        console.error('Unexpected error:', err)
        return { error: 'Failed to create organization' }
    }

    redirect('/dashboard/organizations')
}

export async function getUserOrganizations() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch organizations where user is owner OR linked via profile
    // The policy "Users can view their own organizations" handles the logic, 
    // so we just select * from organizations.
    // However, to be explicit and sure, we can select.

    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching organizations:', error)
        return []
    }

    return data
}

export async function switchOrganization(organizationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        // Verify user has access to this org (owner or member) - heavily implied by getting here via list
        // But let's check existence just in case
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('id', organizationId)
            .single()

        if (orgError || !org) {
            return { error: 'Organization not found or access denied' }
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({ organization_id: organizationId })
            .eq('id', user.id)
            .select()

        if (error) {
            console.error('Error switching org:', error)
            return { error: error.message }
        }

        if (!data || data.length === 0) {
            return { error: 'Failed to update profile. Please try again.' }
        }

        revalidatePath('/', 'layout') // Revalidate everything as org context changes global nav
    } catch (err) {
        console.error('Unexpected error switching org:', err)
        return { error: 'Failed to switch organization' }
    }

    return { success: true }
}

export async function updateOrganization(organizationId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        // Check ownership or permission
        // Currently relying on RLS upstream or simple owner check here?
        // Let's rely on RLS update policy which checks owner_id.
        // But we are in a server action with service role? No, createClient() uses cookies/user context.
        // So RLS applies! Perfect.

        // Check if org has no owner and claim it if so (legacy fix)
        const { data: currentOrg } = await supabase.from('organizations').select('owner_id').eq('id', organizationId).single()
        if (currentOrg && !currentOrg.owner_id) {
            await supabase.from('organizations').update({ owner_id: user.id }).eq('id', organizationId)
        }

        const updates = {
            name: formData.get('name') as string,
            department_name: formData.get('department_name') as string,
            division_name: formData.get('division_name') as string,
            division_address: formData.get('division_address') as string,
            division_website: formData.get('division_website') as string,
            superintendent_name: formData.get('superintendent_name') as string,
            superintendent_title: formData.get('superintendent_title') as string,
            division_code: formData.get('division_code') as string,
            station_code: formData.get('station_code') as string,
            primary_color: formData.get('primary_color') as string,
            secondary_color: formData.get('secondary_color') as string,
            // logo_url handled via client upload or separate logic?
            // The form might send logo_url as hidden field if uploaded client side?
            // Or we handle file upload here.
            // For now, let's assume client handles file upload and sends URL, or we accept logo_url string.
        }

        // If logo_url is present in formData, update it
        const logoUrl = formData.get('logo_url') as string
        if (logoUrl) {
            Object.assign(updates, { logo_url: logoUrl })
        }

        // If signature_url is present in formData, update it
        const signatureUrl = formData.get('signature_url') as string
        if (signatureUrl) {
            Object.assign(updates, { signature_url: signatureUrl })
        }

        const { error } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', organizationId)

        if (error) {
            console.error('Error updating org:', error)
            return { error: error.message }
        }

        revalidatePath('/dashboard/settings')
        revalidatePath('/dashboard/organizations')
    } catch (err) {
        console.error('Unexpected error updating org:', err)
        return { error: 'Failed to update organization' }
    }

    return { success: true }
}
