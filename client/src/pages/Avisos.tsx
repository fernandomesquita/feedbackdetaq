import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, AlertCircle, Clock, RefreshCw, Eye, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useLocation } from "wouter";

const avisoTypeConfig = {
  COTIDIANO: {
    label: "Cotidiano",
    icon: Clock,
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  URGENTE: {
    label: "Urgente",
    icon: AlertCircle,
    color: "bg-red-100 text-red-800 border-red-200",
  },
  RECORRENTE: {
    label: "Recorrente",
    icon: RefreshCw,
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

export default function Avisos() {
  const { feedbackRole } = useAuthWithProfile();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const canCreate = feedbackRole === "MASTER" || feedbackRole === "DIRETOR";

  const { data: avisos, isLoading } = trpc.avisos.list.useQuery();
  const { data: unreadCount } = trpc.avisos.getUnreadCount.useQuery();

  const markAsReadMutation = trpc.avisos.markAsRead.useMutation({
    onSuccess: () => {
      utils.avisos.list.invalidate();
      utils.avisos.getUnreadCount.invalidate();
    },
  });

  const handleMarkAsRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsReadMutation.mutate({ id });
    toast.success("Aviso marcado como lido");
  };

  const filteredAvisos = avisos?.filter((aviso: any) => {
    if (!filter) return true;
    return aviso.type === filter;
  });

  const unreadAvisos = filteredAvisos?.filter((a: any) => !a.isRead) || [];
  const readAvisos = filteredAvisos?.filter((a: any) => a.isRead) || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Avisos</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe os avisos e comunicados importantes
              {unreadCount && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} não {unreadCount === 1 ? "lido" : "lidos"}
                </Badge>
              )}
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setLocation("/avisos/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Aviso
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(null)}
              >
                Todos
              </Button>
              {Object.entries(avisoTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant={filter === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(type)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Avisos Não Lidos */}
        {unreadAvisos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Avisos Não Lidos
                <Badge>{unreadAvisos.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unreadAvisos.map((aviso: any) => {
                  const config = avisoTypeConfig[aviso.type as keyof typeof avisoTypeConfig];
                  const Icon = config.icon;

                  return (
                    <Card key={aviso.id} className="border-2 border-primary/20 bg-primary/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={config.color}>
                                <Icon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(aviso.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <CardTitle className="text-lg">{aviso.title}</CardTitle>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleMarkAsRead(aviso.id, e)}
                            disabled={markAsReadMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Marcar como lido
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {aviso.content}
                        </p>
                        {aviso.creatorName && (
                          <p className="text-xs text-muted-foreground mt-3">
                            Publicado por: {aviso.creatorName}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Avisos Lidos */}
        {readAvisos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Avisos Lidos
                <Badge variant="secondary">{readAvisos.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {readAvisos.map((aviso: any) => {
                  const config = avisoTypeConfig[aviso.type as keyof typeof avisoTypeConfig];
                  const Icon = config.icon;

                  return (
                    <Card key={aviso.id} className="opacity-75">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={config.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(aviso.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <CardTitle className="text-base">{aviso.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {aviso.content}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado Vazio */}
        {filteredAvisos && filteredAvisos.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum aviso encontrado</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {filter
                  ? `Não há avisos do tipo "${avisoTypeConfig[filter as keyof typeof avisoTypeConfig].label}" no momento.`
                  : "Quando houver avisos importantes, eles aparecerão aqui."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
