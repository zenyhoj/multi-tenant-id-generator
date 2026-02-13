import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NewTemplateForm } from './new-template-form'

export default function NewTemplatePage() {
    return (
        <div className="max-w-xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Template</CardTitle>
                    <CardDescription>Define the base dimensions for your ID card.</CardDescription>
                </CardHeader>
                <NewTemplateForm />
            </Card>
        </div>
    )
}
