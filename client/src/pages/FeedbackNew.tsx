import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";

export default function FeedbackNew() {
  const [, setLocation] = useLocation();
  const { feedbackRole } = useAuthWithProfile();
  const [formData, setFormData] = useState({
    type: "CORRETIVO" as "CORRETIVO" | "POSITIVO",
    title: "",
    content: "",
    rating: 0,
    sessionType: "" as "" | "PLENARIO" | "COMISSAO",
    sessionNum: "",
    taquigId: 0,
    imageUrl: "",
  });

  // Query para buscar taquígrafos
  const { data: users } = trpc.users.listByRole.useQuery({ role: "TAQUIGRAFO" });

  const createMutation = trpc.feedbacks.create.useMutation({
    onSuccess: () => {
      toast.success("Feedback criado com sucesso");
      setLocation("/feedbacks");
    },
    onError: (error) => {
      toast.error("Erro ao criar feedback: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast.error("O conteúdo do feedback é obrigatório");
      return;
    }

    if (formData.taquigId === 0) {
      toast.error("Selecione um taquígrafo");
      return;
    }

    createMutation.mutate({
      type: formData.type,
      title: formData.title || undefined,
      content: formData.content,
      rating: formData.rating > 0 ? formData.rating : undefined,
      sessionType: formData.sessionType || undefined,
      sessionNum: formData.sessionNum || undefined,
      imageUrl: formData.imageUrl || undefined,
      taquigId: formData.taquigId,
    });
  };

  if (feedbackRole !== "REVISOR") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Apenas revisores podem criar feedbacks</p>
          <Button onClick={() => setLocation("/feedbacks")} className="mt-4">
            Voltar para feedbacks
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Feedback</h1>
            <p className="text-muted-foreground mt-2">Crie um feedback para um taquígrafo</p>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/feedbacks")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Feedback</CardTitle>
              <CardDescription>Preencha os dados do feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORRETIVO">Corretivo</SelectItem>
                      <SelectItem value="POSITIVO">Positivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taquigrafo">Taquígrafo *</Label>
                  <Select
                    value={formData.taquigId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, taquigId: parseInt(value) })}
                  >
                    <SelectTrigger id="taquigrafo">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título (opcional)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Correção de pontuação"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Descreva o feedback..."
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionType">Tipo de Sessão</Label>
                  <Select
                    value={formData.sessionType}
                    onValueChange={(value: any) => setFormData({ ...formData, sessionType: value })}
                  >
                    <SelectTrigger id="sessionType">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      <SelectItem value="PLENARIO">Plenário</SelectItem>
                      <SelectItem value="COMISSAO">Comissão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionNum">Número da Sessão</Label>
                  <Input
                    id="sessionNum"
                    value={formData.sessionNum}
                    onChange={(e) => setFormData({ ...formData, sessionNum: e.target.value })}
                    placeholder="Ex: 123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Avaliação (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Imagem (opcional)</label>
                <ImageUpload
                  onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })}
                  currentImage={formData.imageUrl}
                  onRemove={() => setFormData({ ...formData, imageUrl: "" })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/feedbacks")}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "Salvando..." : "Salvar Feedback"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
