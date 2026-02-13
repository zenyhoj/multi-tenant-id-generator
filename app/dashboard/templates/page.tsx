import { createClient } from '@/lib/supabase/server'

import NextLink from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

export default async function TemplatesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get org id to fetch templates
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile) return <div>Profile not found</div>

    const { data: templates } = await supabase
        .from('id_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">ID Templates</h1>
                <NextLink href="/dashboard/templates/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create New Template
                    </Button>
                </NextLink>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates?.map((template) => (
                    <NextLink href={`/dashboard/templates/${template.id}/builder`} key={template.id}>
                        <Card className="hover:bg-accent transition-colors cursor-pointer group">
                            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-md bg-white group-hover:border-primary/50 transition-colors"
                                    style={{
                                        width: '100px',
                                        height: template.orientation === 'portrait' ? '150px' : '66px', // Mini preview aspect ratio
                                        // simplified for list view
                                    }}
                                />
                                <CardTitle className="text-center">{template.name}</CardTitle>
                                <p className="text-xs text-muted-foreground">{template.width_mm}mm x {template.height_mm}mm ({template.orientation})</p>
                            </CardContent>
                        </Card>
                    </NextLink>
                ))}
                {(!templates || templates.length === 0) && (
                    <div className="col-span-3 text-center text-gray-500 py-12">
                        No templates found. Create your first one!
                    </div>
                )}
            </div>
        </div>
    )
}
