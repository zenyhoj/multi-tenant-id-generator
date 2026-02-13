'use client'

import { useActionState, useEffect } from 'react'
import { signup } from '../(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

const initialState = {
    error: '',
    success: false,
    message: ''
}

export function SignupForm() {
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await signup(formData)
        if (result?.error) {
            return { error: result.error, success: false, message: '' }
        }
        if (result?.success) {
            return { error: '', success: true, message: result.message }
        }
        return { error: '', success: false, message: '' }
    }, initialState)

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error)
        }
        if (state?.success) {
            toast.success(state.message)
        }
    }, [state])

    if (state?.success) {
        return (
            <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-green-600 mb-2">Registration Successful!</h3>
                <p className="text-gray-600 mb-4">{state.message}</p>
                <Link href="/login">
                    <Button variant="outline">Go to Login</Button>
                </Link>
            </div>
        )
    }

    return (
        <form action={formAction} className="grid gap-4">
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input id="full_name" name="full_name" placeholder="John Doe" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="organization_name">Organization Name</Label>
                        <Input id="organization_name" name="organization_name" placeholder="Acme Corp" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" disabled={isPending}>{isPending ? 'Creating account...' : 'Sign Up'}</Button>
                <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="underline">
                        Log in
                    </Link>
                </div>
            </CardFooter>
        </form>
    )
}
