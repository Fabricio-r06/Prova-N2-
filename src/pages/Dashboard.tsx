import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StudentList from "@/components/StudentList";

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    trancados: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: alunos } = await supabase
      .from("alunos")
      .select("status")
      .is("deleted_at", null);

    if (alunos) {
      setStats({
        total: alunos.length,
        ativos: alunos.filter((a) => a.status === "ativo").length,
        inativos: alunos.filter((a) => a.status === "inativo").length,
        trancados: alunos.filter((a) => a.status === "trancado").length,
      });
    }
  };

  const statCards = [
    {
      title: "Total de Alunos",
      value: stats.total,
      icon: Users,
      gradient: "bg-gradient-primary",
    },
    {
      title: "Alunos Ativos",
      value: stats.ativos,
      icon: UserCheck,
      gradient: "bg-gradient-success",
    },
    {
      title: "Alunos Inativos",
      value: stats.inativos,
      icon: UserX,
      gradient: "bg-destructive",
    },
    {
      title: "Matrículas Trancadas",
      value: stats.trancados,
      icon: GraduationCap,
      gradient: "bg-warning",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do sistema de gestão acadêmica
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="shadow-card hover:shadow-hover transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.gradient}`}>
                  <stat.icon className="h-4 w-4 text-primary-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <StudentList onUpdate={fetchStats} />
      </div>
    </Layout>
  );
};

export default Dashboard;
