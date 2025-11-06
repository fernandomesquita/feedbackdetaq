import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AvisoNew() {
  const { feedbackRole } = useAuthWithProfile();
  const [, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"COTIDIANO" | "URGENTE" | "RECORRENTE">("COTIDIANO");
  const [targets, setTargets] = useState<string[]>(["TODOS"]);

  const createMutation = trpc.avisos.create.useMutation({
    onSuccess: () => {
      toast.success("Aviso criado com sucesso");
      setLocation("/avisos");
    },
    onError: (error) => {
      toast.error("Erro ao criar aviso: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Digite um título");
      return;
    }

    if (!content.trim()) {
      toast.error("Digite o conteúdo do aviso");
      return;
    }

    createMutation.mutate({
      title,
      content,
      type,
      targets,
    });
  };

  // Verificar permissão
  if (feedbackRole !== "MASTER" && feedbackRole !== "DIRETOR") {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Acesso Negado</p>
            <p className="text-sm text-muted-foreground">
              Apenas Master e Diretores podem criar avisos.
            </p>
            <Button className="mt-4" onClick={() => setLocation("/avisos")}>
              Voltar para Avisos
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/avisos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Aviso</h1>
            <p className="text-muted-foreground mt-1">
              Crie um novo aviso para comunicar informações importantes
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Aviso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Aviso *</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COTIDIANO">Cotidiano</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                    <SelectItem value="RECORRENTE">Recorrente</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <strong>Cotidiano:</strong> Avisos do dia a dia<br />
                  <strong>Urgente:</strong> Avisos que requerem atenção imediata<br />
                  <strong>Recorrente:</strong> Avisos que se repetem periodicamente
                </p>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título do aviso"
                  required
                />
              </div>

              {/* Conteúdo */}
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Digite o conteúdo do aviso..."
                  rows={8}
                  required
                />
              </div>

              {/* Público-alvo */}
              <div className="space-y-3">
                <Label>Público-alvo *</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="target-todos"
                      checked={targets.includes("TODOS")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTargets(["TODOS"]);
                        } else {
                          setTargets([]);
                        }
                      }}
                    />
                    <label htmlFor="target-todos" className="text-sm font-medium cursor-pointer">
                      Todos os usuários
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="target-revisor"
                      checked={targets.includes("REVISOR")}
                      disabled={targets.includes("TODOS")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTargets([...targets.filter(t => t !== "TODOS"), "REVISOR"]);
                        } else {
                          setTargets(targets.filter(t => t !== "REVISOR"));
                        }
                      }}
                    />
                    <label htmlFor="target-revisor" className="text-sm font-medium cursor-pointer">
                      Apenas Revisores
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="target-taquigrafo"
                      checked={targets.includes("TAQUIGRAFO")}
                      disabled={targets.includes("TODOS")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTargets([...targets.filter(t => t !== "TODOS"), "TAQUIGRAFO"]);
                        } else {
                          setTargets(targets.filter(t => t !== "TAQUIGRAFO"));
                        }
                      }}
                    />
                    <label htmlFor="target-taquigrafo" className="text-sm font-medium cursor-pointer">
                      Apenas Taquígrafos
                    </label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecione quem deve visualizar este aviso
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/avisos")}
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "Criando..." : "Criar Aviso"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
