import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, AlertCircle, Clock, RefreshCw } from "lucide-react";

export default function Avisos() {
  const { feedbackRole } = useAuthWithProfile();

  const canCreate = feedbackRole === "MASTER" || feedbackRole === "DIRETOR";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Avisos</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe os avisos e comunicados importantes
            </p>
          </div>
          {canCreate && (
            <Button>
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
              <Button variant="outline" size="sm">
                Todos
              </Button>
              <Button variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                Cotidiano
              </Button>
              <Button variant="outline" size="sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                Urgente
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recorrente
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Avisos */}
        <Card>
          <CardHeader>
            <CardTitle>Avisos Ativos</CardTitle>
            <CardDescription>Nenhum aviso no momento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum aviso ativo</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Quando houver avisos importantes, eles aparecerão aqui. 
                {canCreate && " Você pode criar um novo aviso usando o botão acima."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Avisos Lidos (apenas para não-administradores) */}
        {!canCreate && (
          <Card>
            <CardHeader>
              <CardTitle>Avisos Lidos</CardTitle>
              <CardDescription>Avisos que você já visualizou</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Nenhum aviso lido ainda
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
