import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Edit, Trash2, Shield, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const roleConfig = {
  MASTER: { label: "Master", color: "bg-purple-100 text-purple-800 border-purple-200" },
  DIRETOR: { label: "Diretor", color: "bg-blue-100 text-blue-800 border-blue-200" },
  REVISOR: { label: "Revisor", color: "bg-green-100 text-green-800 border-green-200" },
  TAQUIGRAFO: { label: "Taquígrafo", color: "bg-orange-100 text-orange-800 border-orange-200" },
};

export default function Usuarios() {
  const { feedbackRole, user: currentUser } = useAuthWithProfile();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<string>("");

  const utils = trpc.useUtils();

  const isMaster = feedbackRole === "MASTER";

  const { data: users, isLoading } = trpc.users.list.useQuery();

  const updateMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      toast.success("Perfil atualizado com sucesso");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar perfil: " + error.message);
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      toast.success("Usuário removido com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover usuário: " + error.message);
    },
  });

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.feedbackRole || "TAQUIGRAFO");
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedUser) return;
    updateMutation.mutate({
      userId: selectedUser.id,
      feedbackRole: newRole as any,
    });
  };

  const handleDelete = (user: any) => {
    if (confirm(`Deseja realmente remover o usuário "${user.name}"?`)) {
      deleteMutation.mutate({ id: user.id });
    }
  };

  if (!isMaster) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Acesso Negado</p>
            <p className="text-sm text-muted-foreground">
              Apenas Master pode acessar a gestão de usuários.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie usuários e seus perfis de acesso
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(roleConfig).map(([role, config]) => {
            const count = users?.filter((u: any) => u.feedbackRole === role).length || 0;
            return (
              <Card key={role}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {count === 1 ? "usuário" : "usuários"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              Total: {users?.length || 0} usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users && users.length > 0 ? (
                users.map((user: any) => (
                  <Card key={user.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{user.name || "Sem nome"}</h3>
                            {user.feedbackRole && (
                              <Badge
                                variant="outline"
                                className={roleConfig[user.feedbackRole as keyof typeof roleConfig]?.color}
                              >
                                {roleConfig[user.feedbackRole as keyof typeof roleConfig]?.label}
                              </Badge>
                            )}
                            {user.id === currentUser?.id && (
                              <Badge variant="secondary">Você</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {user.email && <p>Email: {user.email}</p>}
                            {user.lastSignedIn && (
                              <p>
                                Último acesso:{" "}
                                {format(new Date(user.lastSignedIn), "dd/MM/yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </p>
                            )}
                            {user.createdAt && (
                              <p>
                                Cadastrado em:{" "}
                                {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                            disabled={updateMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Nenhum usuário encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Os usuários aparecerão aqui quando fizerem login no sistema
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Perfil do Usuário</DialogTitle>
              <DialogDescription>
                Altere o perfil de acesso do usuário {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Perfil de Acesso *</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MASTER">Master</SelectItem>
                    <SelectItem value="DIRETOR">Diretor</SelectItem>
                    <SelectItem value="REVISOR">Revisor</SelectItem>
                    <SelectItem value="TAQUIGRAFO">Taquígrafo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <strong>Master:</strong> Acesso total ao sistema<br />
                  <strong>Diretor:</strong> Pode criar avisos e gerenciar feedbacks<br />
                  <strong>Revisor:</strong> Pode criar feedbacks para taquígrafos<br />
                  <strong>Taquígrafo:</strong> Recebe e visualiza feedbacks
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
