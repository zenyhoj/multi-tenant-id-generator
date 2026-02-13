'use server'

import { createClient } from '@/lib/supabase/server'

export async function fetchTemplateFields(templateId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('template_fields')
        .select('*')
        .eq('template_id', templateId)

    if (error) {
        console.error('Error fetching template fields:', error)
        return []
    }

    return data || []
}
