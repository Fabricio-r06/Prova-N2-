import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Shield, BookOpen } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-primary rounded-2xl shadow-hover">
              <GraduationCap className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Sistema de Gestão Acadêmica
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Plataforma completa para gerenciamento de alunos com controle de acesso,
            auditoria e segurança de dados
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              variant="gradient"
              onClick={() => navigate("/auth")}
            >
              Acessar Sistema
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-lg p-6 shadow-card hover:shadow-hover transition-all">
            <div className="p-3 bg-gradient-success rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-success-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gestão Completa</h3>
            <p className="text-muted-foreground">
              CRUD completo de alunos com validações, filtros e busca avançada
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-card hover:shadow-hover transition-all">
            <div className="p-3 bg-gradient-primary rounded-lg w-fit mb-4">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Controle de Acesso</h3>
            <p className="text-muted-foreground">
              Três perfis de usuário com permissões granulares e auditoria
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-card hover:shadow-hover transition-all">
            <div className="p-3 bg-warning rounded-lg w-fit mb-4">
              <BookOpen className="h-6 w-6 text-warning-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Dados Seguros</h3>
            <p className="text-muted-foreground">
              Mascaramento de CPF, soft delete e proteção de dados sensíveis
            </p>
          </div>
        </div>

        <div className="mt-16 bg-card rounded-lg p-8 shadow-card max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Perfis de Usuário</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="px-3 py-1 bg-gradient-primary text-primary-foreground rounded-full text-sm font-medium">
                Admin
              </div>
              <p className="text-sm text-muted-foreground">
                Acesso total: CRUD completo, hard delete, visualização de auditoria
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="px-3 py-1 bg-gradient-success text-success-foreground rounded-full text-sm font-medium">
                Coordenador
              </div>
              <p className="text-sm text-muted-foreground">
                CRUD completo, visualização de logs, soft delete apenas
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                Secretário
              </div>
              <p className="text-sm text-muted-foreground">
                Criação e edição de dados básicos, visualização com CPF mascarado
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
