import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Fila } from "@/types/crm";
import { 
  Users
} from "lucide-react";

const mockFilas: Fila[] = [
  {
    id: '1',
    nome: 'Fila Facebook Ads - Apartamentos',
    corretores: ['Maria Santos', 'Pedro Oliveira'],
    ordem: 'sequencial',
    origem: 'meta-ads',
    status: 'ativa',
    configuracoes: {
      tempoResposta: 90,
      maxLeadsPorCorretor: 10
    }
  },
  {
    id: '2',
    nome: 'Fila Google Ads - Casas',
    corretores: ['Pedro Oliveira', 'Ana Costa'],
    ordem: 'sequencial',
    origem: 'google-ads',
    status: 'ativa',
    configuracoes: {
      tempoResposta: 120,
      maxLeadsPorCorretor: 8
    }
  }
];

const Filas = () => {
  const [corretoresDisponiveis, setCorretoresDisponiveis] = useState([
    { nome: 'Maria Santos', ativo: true },
    { nome: 'Pedro Oliveira', ativo: true },
    { nome: 'Ana Costa', ativo: false }
  ]);

  const toggleCorretorStatus = (nomeCorretor: string) => {
    setCorretoresDisponiveis(prevCorretores => 
      prevCorretores.map(corretor => 
        corretor.nome === nomeCorretor 
          ? { ...corretor, ativo: !corretor.ativo }
          : corretor
      )
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Corretores</h1>
          <p className="text-gray-600 mt-1">
            Gerencie a equipe de corretores e suas ativações
          </p>
        </div>
      </div>

      {/* Lista de Corretores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {corretoresDisponiveis.map((corretor) => (
          <Card key={corretor.nome}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{corretor.nome}</h3>
                    <Badge className={corretor.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {corretor.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant={corretor.ativo ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => toggleCorretorStatus(corretor.nome)}
                >
                  {corretor.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Filas;
