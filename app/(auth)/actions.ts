'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // validate fields
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const origin = (await headers()).get('origin')
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string
    const orgName = formData.get('organization_name') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                organization_name: orgName,
            },
            emailRedirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Check your email to verify your account.' }
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function ensureProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Check if profile exists
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
    if (profile) return { success: true }

    // Create organization
    // We try to find existing org or create new one. For simplicity, create new one if profile is missing implies setup failed.
    const orgName = user.user_metadata?.organization_name || `${user.email}'s Organization`

    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName })
        .select()
        .single()

    if (orgError) {
        console.error('Error creating org:', orgError)
        return { error: `Failed to create organization: ${orgError.message}` }
    }

    // Create profile
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: user.id,
            organization_id: org.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            // role: 'admin' // Assuming first user is admin, table might have default
        })

    if (profileError) {
        console.error('Error creating profile:', profileError)
        return { error: `Failed to create profile: ${profileError.message}` }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
