import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Book, Plus, Search, Edit, Trash2, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Padronizacao() {
  const { feedbackRole } = useAuthWithProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<any>(null);

  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");

  const utils = trpc.useUtils();

  const canManage = feedbackRole === "MASTER" || feedbackRole === "DIRETOR" || feedbackRole === "REVISOR";

  const { data: terms, isLoading } = trpc.padronizacao.list.useQuery();

  const createMutation = trpc.padronizacao.create.useMutation({
    onSuccess: () => {
      utils.padronizacao.list.invalidate();
      toast.success("Termo adicionado ao glossário");
      setIsCreateDialogOpen(false);
      setNewTerm("");
      setNewDefinition("");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar termo: " + error.message);
    },
  });

  const updateMutation = trpc.padronizacao.update.useMutation({
    onSuccess: () => {
      utils.padronizacao.list.invalidate();
      toast.success("Termo atualizado");
      setIsEditDialogOpen(false);
      setSelectedTerm(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar termo");
    },
  });

  const deleteMutation = trpc.padronizacao.delete.useMutation({
    onSuccess: () => {
      utils.padronizacao.list.invalidate();
      toast.success("Termo removido");
    },
    onError: () => {
      toast.error("Erro ao remover termo");
    },
  });

  const handleCreate = () => {
    if (!newTerm.trim()) {
      toast.error("Digite o termo");
      return;
    }
    createMutation.mutate({ term: newTerm, definition: newDefinition || undefined });
  };

  const handleEdit = () => {
    if (!selectedTerm) return;
    updateMutation.mutate({
      id: selectedTerm.id,
      term: selectedTerm.term,
      definition: selectedTerm.definition || undefined,
    });
  };

  const handleDelete = (id: number, term: string) => {
    if (confirm(`Deseja realmente remover o termo "${term}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredTerms = terms?.filter((term: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      term.term.toLowerCase().includes(query) ||
      (term.definition && term.definition.toLowerCase().includes(query))
    );
  });

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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Padronização
            </h1>
            <p className="text-muted-foreground mt-2">
              Glossário de termos e expressões padronizadas
            </p>
          </div>
          {canManage && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Termo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Termo</DialogTitle>
                  <DialogDescription>
                    Adicione um novo termo ao glossário de padronização
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="term">Termo *</Label>
                    <Input
                      id="term"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      placeholder="Digite o termo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="definition">Definição</Label>
                    <Textarea
                      id="definition"
                      value={newDefinition}
                      onChange={(e) => setNewDefinition(e.target.value)}
                      placeholder="Digite a definição ou explicação do termo"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adicionando..." : "Adicionar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar termos..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Termos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Glossário
              {filteredTerms && <Badge variant="secondary">{filteredTerms.length} termos</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTerms && filteredTerms.length > 0 ? (
              <div className="space-y-4">
                {filteredTerms.map((term: any) => (
                  <Card key={term.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{term.term}</h3>
                          {term.definition && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                              {term.definition}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {term.creatorName && <span>Criado por: {term.creatorName}</span>}
                            {term.createdAt && (
                              <span>
                                {format(new Date(term.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedTerm(term);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(term.id, term.term)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum termo encontrado</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Tente buscar com outros termos"
                    : canManage
                      ? "Adicione o primeiro termo ao glossário"
                      : "O glossário está vazio no momento"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Termo</DialogTitle>
              <DialogDescription>
                Atualize as informações do termo no glossário
              </DialogDescription>
            </DialogHeader>
            {selectedTerm && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-term">Termo *</Label>
                  <Input
                    id="edit-term"
                    value={selectedTerm.term}
                    onChange={(e) => setSelectedTerm({ ...selectedTerm, term: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-definition">Definição</Label>
                  <Textarea
                    id="edit-definition"
                    value={selectedTerm.definition || ""}
                    onChange={(e) =>
                      setSelectedTerm({ ...selectedTerm, definition: e.target.value })
                    }
                    rows={4}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
