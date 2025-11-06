import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Bell, BookOpen, TrendingUp, X, AlertCircle, Info, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { user, feedbackRole } = useAuthWithProfile();
  const { data: feedbackCount = 0 } = trpc.feedbacks.count.useQuery();
  const { data: avisos = [] } = trpc.avisos.list.useQuery();
  const { data: padronizacaoCount = 0 } = trpc.padronizacao.count.useQuery();
  const [dismissedAvisos, setDismissedAvisos] = useState<number[]>([]);
  const utils = trpc.useUtils();
  
  const recordViewMutation = trpc.avisos.recordView.useMutation();
  const markAsReadMutation = trpc.avisos.markAsRead.useMutation({
    onSuccess: () => {
      utils.avisos.list.invalidate();
    },
  });

  // Registrar visualização dos avisos não lidos ao carregar o dashboard
  useEffect(() => {
    const unreadAvisos = avisos.filter((a: any) => !a.isRead);
    unreadAvisos.forEach((aviso: any) => {
      recordViewMutation.mutate({ id: aviso.id });
    });
  }, [avisos.length]);

  const handleDismiss = (avisoId: number) => {
    setDismissedAvisos([...dismissedAvisos, avisoId]);
    markAsReadMutation.mutate({ id: avisoId });
  };

  // Filtrar avisos por público-alvo
  const filteredByTarget = avisos.filter((a: any) => {
    if (!a.targets || a.targets.length === 0) return true; // Sem targets = todos
    if (a.targets.includes("TODOS")) return true;
    if (feedbackRole && a.targets.includes(feedbackRole)) return true;
    return false;
  });

  const activeAvisos = filteredByTarget.filter((a: any) => !dismissedAvisos.includes(a.id) && !a.isRead);

  const getAvisoIcon = (type: string) => {
    switch (type) {
      case "URGENTE":
        return <AlertCircle className="h-5 w-5" />;
      case "RECORRENTE":
        return <Repeat className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAvisoVariant = (type: string) => {
    switch (type) {
      case "URGENTE":
        return "destructive";
      default:
        return "default";
    }
  };

  const getAvisoBackgroundClass = (type: string) => {
    switch (type) {
      case "URGENTE":
        return "bg-red-50 border-red-200";
      case "RECORRENTE":
        return "bg-purple-50 border-purple-200";
      case "COTIDIANO":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

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

        {/* Avisos no Topo */}
        {activeAvisos.length > 0 && (
          <div className="space-y-3">
            {activeAvisos.map((aviso: any) => (
              <div key={aviso.id} className={`relative rounded-lg border p-4 ${getAvisoBackgroundClass(aviso.type)}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getAvisoIcon(aviso.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-lg font-bold text-foreground">{aviso.title}</h3>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{aviso.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 -mt-1 -mr-1 hover:bg-foreground/10"
                    onClick={() => handleDismiss(aviso.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Card de Feedbacks - não mostrar para DIRETOR */}
          {feedbackRole !== "DIRETOR" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {feedbackRole === "REVISOR" ? "Feedbacks Enviados" : "Feedbacks Recebidos"}
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feedbackCount}</div>
              <p className="text-xs text-muted-foreground">
                {feedbackCount === 0 ? "Nenhum feedback ainda" : `${feedbackCount} feedback${feedbackCount > 1 ? 's' : ''}`}
              </p>
            </CardContent>
          </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avisos Ativos
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredByTarget.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredByTarget.length === 0 ? "Nenhum aviso no momento" : `${filteredByTarget.length} aviso${filteredByTarget.length > 1 ? 's' : ''} ativo${filteredByTarget.length > 1 ? 's' : ''}`}
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
              <div className="text-2xl font-bold">{padronizacaoCount}</div>
              <p className="text-xs text-muted-foreground">
                {padronizacaoCount === 0 ? "Glossário vazio" : `${padronizacaoCount} termo${padronizacaoCount > 1 ? 's' : ''} cadastrado${padronizacaoCount > 1 ? 's' : ''}`}
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
