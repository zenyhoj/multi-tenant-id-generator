import { SignupForm } from './signup-form'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Sign Up</CardTitle>
                    <CardDescription>
                        Create an account for your organization
                    </CardDescription>
                </CardHeader>
                <SignupForm />
            </Card>
        </div>
    )
}
