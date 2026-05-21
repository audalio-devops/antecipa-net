import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WalletCards, LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const { login, loginPending, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login({ username, password });
      navigate("/");
    } catch (err: any) {
      const msg = err?.message || "Erro ao fazer login";
      try {
        const body = JSON.parse(err?.message || "{}");
        setError(body.message || msg);
      } catch {
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
            <WalletCards className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Antecipa<span className="text-emerald-400">Net</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Gestão de Recebíveis</p>
        </div>

        <Card className="border-slate-700 bg-slate-800 text-white shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-slate-400">
              Informe suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-500/30 bg-red-500/10 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-testid="login-error">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Usuário</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                data-testid="button-login"
                disabled={loginPending}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium mt-2"
              >
                {loginPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Entrar
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} AntecipaNET — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
