import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasLetter: false,
    hasNumber: false
  });

  useEffect(() => {
    const { password } = formData;
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password)
    });
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de senha
    if (formData.password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 8 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      toast({
        title: "Senha fraca",
        description: "A senha deve conter letras e números.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    const result = await updatePassword(formData.password);

    if (result.success) {
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi redefinida com sucesso. Faça login com a nova senha.",
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      toast({
        title: "Erro ao atualizar senha",
        description: result.error || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full transform -translate-x-32 -translate-y-32 opacity-20"></div>
      <div className="absolute top-20 right-0 w-48 h-48 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full transform translate-x-24 opacity-20"></div>
      <div className="absolute bottom-0 left-20 w-56 h-56 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full transform translate-y-28 opacity-20"></div>
      <div className="absolute bottom-20 right-0 w-40 h-40 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full transform translate-x-20 opacity-20"></div>

      {/* Container principal */}
      <div className="w-full max-w-md mx-4">
        <div className="relative bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Redefinir Senha</h1>
            <p className="text-white/70 text-sm">Digite sua nova senha abaixo</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
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

              {/* Indicadores de força da senha */}
              {formData.password && (
                <div className="space-y-1 mt-2">
                  <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasMinLength ? 'text-green-400' : 'text-white/50'}`}>
                    <CheckCircle2 className={`h-3 w-3 ${passwordStrength.hasMinLength ? 'text-green-400' : 'text-white/30'}`} />
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasLetter ? 'text-green-400' : 'text-white/50'}`}>
                    <CheckCircle2 className={`h-3 w-3 ${passwordStrength.hasLetter ? 'text-green-400' : 'text-white/30'}`} />
                    <span>Contém letras</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasNumber ? 'text-green-400' : 'text-white/50'}`}>
                    <CheckCircle2 className={`h-3 w-3 ${passwordStrength.hasNumber ? 'text-green-400' : 'text-white/30'}`} />
                    <span>Contém números</span>
                  </div>
                </div>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white/80 text-sm">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Digite a senha novamente"
                  className="pl-10 pr-10 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-white/40 focus:border-blue-400/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Botão Redefinir Senha */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 rounded-lg transition-all"
            >
              {isLoading ? 'Atualizando...' : 'Redefinir Senha'}
            </Button>

            {/* Link voltar ao login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-white/70 hover:text-white text-sm underline"
              >
                Voltar ao login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
