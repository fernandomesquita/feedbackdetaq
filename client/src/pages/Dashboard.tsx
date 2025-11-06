import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Bell, BookOpen, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user, feedbackRole } = useAuthWithProfile();

  const getRoleLabel = (role: string | null) => {
    const labels: Record<string, string> = {
      MASTER: "Master",
      DIRETOR: "Diretor",
      REVISOR: "Revisor",
      TAQUIGRAFO: "Taquígrafo",
    };
    return role ? labels[role] : "Sem perfil";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo(a), {user?.name || "Usuário"}! Você está logado como{" "}
            <span className="font-medium">{getRoleLabel(feedbackRole)}</span>.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Feedbacks Recebidos
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Nenhum feedback ainda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avisos Ativos
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Nenhum aviso no momento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Termos Padronizados
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Glossário vazio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Média de Avaliação
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Sem dados ainda
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as funcionalidades principais do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <a
                href="/feedbacks"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Ver Feedbacks</p>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe seus feedbacks
                  </p>
                </div>
              </a>

              <a
                href="/avisos"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Ver Avisos</p>
                  <p className="text-sm text-muted-foreground">
                    Confira os avisos recentes
                  </p>
                </div>
              </a>

              <a
                href="/padronizacao"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Padronização</p>
                  <p className="text-sm text-muted-foreground">
                    Consulte o glossário
                  </p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre o Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              O Sistema de Gestão de Feedbacks para Taquígrafos foi desenvolvido para facilitar
              a comunicação entre revisores e taquígrafos da Câmara dos Deputados.
            </p>
            <p className="text-sm text-muted-foreground">
              Através desta plataforma, você pode receber feedbacks sobre seu trabalho,
              acompanhar avisos importantes e consultar o glossário de padronização.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
