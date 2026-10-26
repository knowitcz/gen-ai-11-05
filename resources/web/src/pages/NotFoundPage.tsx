import { Link } from 'react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Page not found.</h1>
        </CardTitle>
        <CardDescription>
          <Link to="/clients" className="underline underline-offset-4">
            Go to the client list
          </Link>
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
