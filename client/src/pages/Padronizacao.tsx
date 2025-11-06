import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Pencil, Trash2, BookOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Padronizacao() {
  const { feedbackRole } = useAuthWithProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<any>(null);
  const [newTerm, setNewTerm] = useState({ term: "", definition: "" });

  const utils = trpc.useUtils();
  const { data: terms = [], isLoading } = trpc.padronizacao.list.useQuery();
  
  const createMutation = trpc.padronizacao.create.useMutation({
    onSuccess: () => {
      toast.success("Termo adicionado com sucesso!");
      utils.padronizacao.list.invalidate();
      setIsCreateOpen(false);
      setNewTerm({ term: "", definition: "" });
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.padronizacao.update.useMutation({
    onSuccess: () => {
      toast.success("Termo atualizado com sucesso!");
      utils.padronizacao.list.invalidate();
      setEditingTerm(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.padronizacao.delete.useMutation({
    onSuccess: () => {
      toast.success("Termo excluído com sucesso!");
      utils.padronizacao.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const canEdit = feedbackRole === "MASTER" || feedbackRole === "DIRETOR" || feedbackRole === "REVISOR";

  // Filtrar termos
  const filteredTerms = terms.filter((term: any) => {
    if (!searchTerm) return true;
    return term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (term.definition && term.definition.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Agrupar termos por letra inicial
  const groupedTerms = filteredTerms.reduce((acc: Record<string, typeof terms>, term: any) => {
    const firstLetter = term.term[0]?.toUpperCase() || "#";
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(term);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedTerms).sort();

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
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <h1 className="text-3xl font-bold tracking-tight">Padronização</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Glossário de termos e expressões padronizadas
            </p>
          </div>
          {canEdit && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Termo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Termo</DialogTitle>
                  <DialogDescription>
                    Adicione um novo termo ao glossário de padronização
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="term">Termo</Label>
                    <Input
                      id="term"
                      value={newTerm.term}
                      onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                      placeholder="Digite o termo..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="definition">Definição (opcional)</Label>
                    <Textarea
                      id="definition"
                      value={newTerm.definition || ""}
                      onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })}
                      placeholder="Digite a definição..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => createMutation.mutate(newTerm)} disabled={!newTerm.term}>
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar termos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Glossário */}
        {filteredTerms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum termo encontrado</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedLetters.map((letter) => (
              <div key={letter} className="space-y-4">
                {/* Letra Separadora */}
                <div className="border-b-2 border-primary pb-2">
                  <h2 className="text-4xl font-bold text-primary">{letter}</h2>
                </div>

                {/* Termos em colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                  {groupedTerms[letter].map((term: any) => (
                    <div key={term.id} className="flex items-start justify-between group">
                      <div className="flex-1">
                        <div className="font-medium text-lg">{term.term}</div>
                        {term.definition && (
                          <div className="text-sm text-muted-foreground mt-1">{term.definition}</div>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingTerm(term)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              if (confirm("Deseja realmente excluir este termo?")) {
                                deleteMutation.mutate({ id: term.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog de Edição */}
        {editingTerm && (
          <Dialog open={!!editingTerm} onOpenChange={() => setEditingTerm(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Termo</DialogTitle>
                <DialogDescription>
                  Edite o termo do glossário de padronização
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-term">Termo</Label>
                  <Input
                    id="edit-term"
                    value={editingTerm.term}
                    onChange={(e) => setEditingTerm({ ...editingTerm, term: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-definition">Definição (opcional)</Label>
                  <Textarea
                    id="edit-definition"
                    value={editingTerm.definition || ""}
                    onChange={(e) => setEditingTerm({ ...editingTerm, definition: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingTerm(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => updateMutation.mutate({ id: editingTerm.id, term: editingTerm.term, definition: editingTerm.definition })}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
