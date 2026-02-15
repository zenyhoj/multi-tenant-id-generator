
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://anegwixaojmntsffqzcd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuZWd3aXhhb2ptbnRzZmZxemNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjA5NzgsImV4cCI6MjA4NjQ5Njk3OH0.5h-sMI0IFH3IowfcLrwd_A_IbvQbCZMhkGAoc28i9a4'
const supabase = createClient(supabaseUrl, supabaseKey)

async function inspect() {
    const { data, error } = await supabase.from('organizations').select('*').limit(1)
    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Keys:', data && data[0] ? Object.keys(data[0]) : 'No data')
    }
}

inspect()
