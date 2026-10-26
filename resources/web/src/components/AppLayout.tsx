import { Link, Outlet } from 'react-router'

export function AppLayout() {
  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link to="/clients" className="font-heading text-lg font-semibold">
            Happy Bank
          </Link>
          <nav>
            <Link to="/clients" className="text-sm text-muted-foreground hover:text-foreground">
              Clients
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
