import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 text-center p-4">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
        Multi-Tenant ID Maker
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Create professional ID cards for your organization with our drag-and-drop builder.
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button size="lg">Login</Button>
        </Link>
        <Link href="/signup">
          <Button size="lg" variant="outline">Sign Up</Button>
        </Link>
      </div>
    </div>
  )
}
