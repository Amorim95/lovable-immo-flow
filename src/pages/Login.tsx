
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

const Login = () => {
  const { login, user, loading } = useAuth();
  const { settings } = useCompany();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirecionar se já estiver logado
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast({
        title: "Login realizado",
        description: "Bem-vindo ao sistema!"
      });
    } else {
      toast({
        title: "Erro no login",
        description: "E-mail ou Senha estão Incorretos!\nPor favor, verifique os acessos corretos e tente novamente.",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = () => {
    toast({
      title: "Link enviado",
      description: "Se o email existir, você receberá um link para redefinir a senha.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Elementos decorativos de fundo com tons de azul */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full transform -translate-x-32 -translate-y-32 opacity-20"></div>
      <div className="absolute top-20 right-0 w-48 h-48 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full transform translate-x-24 opacity-20"></div>
      <div className="absolute bottom-0 left-20 w-56 h-56 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full transform translate-y-28 opacity-20"></div>
      <div className="absolute bottom-20 right-0 w-40 h-40 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full transform translate-x-20 opacity-20"></div>

      {/* Container principal */}
      <div className="w-full max-w-md mx-4">
        {/* Container do formulário */}
        <div className="relative bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Código utente"
                  className="pl-10 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-white/40 focus:border-blue-400/50"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  className="pl-10 pr-10 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-white/40 focus:border-blue-400/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 rounded-lg transition-all"
            >
              {isLoading ? 'Entrando...' : 'ENTRAR'}
            </Button>

            {/* Link esqueci minha senha */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-white/70 hover:text-white text-sm underline"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Texto auxiliar */}
            <div className="text-center">
              <p className="text-white/60 text-sm">
                Ainda não tem acesso? Solicite ao administrador.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
