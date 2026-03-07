import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'
import { csrf, login, forgotPassword } from '@/api/auth'
import { ApiError } from '@/api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Forgot-password inline form state
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetEmailWarning, setResetEmailWarning] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  // Already authenticated → go to admin
  useEffect(() => {
    if (user) navigate('/cx-admin', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await csrf()
      await login({ email, password })
      navigate('/cx-admin', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Email o contraseña incorrectos.' : err.message)
      } else {
        setError('Error inesperado. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setResetError(null)
    setResetLoading(true)

    try {
      const res = await forgotPassword(resetEmail)
      setResetEmailWarning(res.email_sent === false)
      setResetSent(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setResetError('Demasiadas solicitudes. Espera unos minutos.')
      } else {
        setResetError('Error al enviar el correo. Inténtalo de nuevo.')
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Corexpress</CardTitle>
          <CardDescription>
            {showForgot ? 'Recupera tu acceso' : 'Inicia sesión en tu panel'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showForgot ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando…' : 'Entrar'}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setError(null) }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </>
          ) : (
            <>
              {!resetSent ? (
                <form onSubmit={handleForgot} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña (válido por 10 minutos).
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  {resetError && (
                    <p className="text-sm text-destructive">{resetError}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={resetLoading}>
                    {resetLoading ? 'Enviando…' : 'Enviar enlace'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-3 py-2">
                  {resetEmailWarning ? (
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-center dark:border-yellow-700 dark:bg-yellow-950/30">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Problemas al enviar el correo
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        El enlace fue generado pero no pudimos enviarlo. Verifica la configuración de correo del servidor.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium">Revisa tu correo</p>
                      <p className="text-xs text-muted-foreground">
                        Si ese email está registrado, recibirás un enlace en breve.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(''); setResetError(null); setResetEmailWarning(false) }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
