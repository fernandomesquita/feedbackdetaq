import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";

interface QuesitoItem {
  quesitoId: number;
  textoOriginal: string;
  textoRevisado: string;
}

export default function FeedbackNew() {
  const [, setLocation] = useLocation();
  const { feedbackRole } = useAuthWithProfile();
  const [formData, setFormData] = useState({
    type: "CORRETIVO" as "CORRETIVO" | "POSITIVO",
    rating: 0,
    sessionType: "" as "PLENARIO" | "COMISSAO" | "NONE" | "",
    sessionNum: "",
    imageUrl: "",
    taquigId: 0,
  });

  const [quesitos, setQuesitos] = useState<QuesitoItem[]>([
    { quesitoId: 0, textoOriginal: "", textoRevisado: "" }
  ]);

  // Query para buscar taquígrafos
  const { data: users } = trpc.users.listByRole.useQuery({ role: "TAQUIGRAFO" });

  // Query para buscar quesitos ativos
  const { data: quesitosDisponiveis } = trpc.quesitos.list.useQuery({ isActive: true });

  const createMutation = trpc.feedbacks.create.useMutation({
    onSuccess: () => {
      toast.success("Feedback criado com sucesso");
      setLocation("/feedbacks");
    },
    onError: (error) => {
      toast.error("Erro ao criar feedback: " + error.message);
    },
  });

  const handleAddQuesito = () => {
    setQuesitos([...quesitos, { quesitoId: 0, textoOriginal: "", textoRevisado: "" }]);
  };

  const handleRemoveQuesito = (index: number) => {
    if (quesitos.length === 1) {
      toast.error("Deve haver pelo menos um quesito");
      return;
    }
    setQuesitos(quesitos.filter((_, i) => i !== index));
  };

  const handleQuesitoChange = (index: number, field: keyof QuesitoItem, value: any) => {
    const updated = [...quesitos];
    updated[index] = { ...updated[index], [field]: field === 'quesitoId' ? parseInt(value) : value };
    setQuesitos(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.taquigId === 0) {
      toast.error("Selecione um taquígrafo");
      return;
    }

    // Validar quesitos
    const quesitosValidos = quesitos.filter(
      q => q.quesitoId > 0 && q.textoOriginal.trim() && q.textoRevisado.trim()
    );

    if (quesitosValidos.length === 0) {
      toast.error("Adicione pelo menos um quesito completo");
      return;
    }

    createMutation.mutate({
      type: formData.type,
      rating: formData.rating > 0 ? Math.round(formData.rating) : undefined,
      sessionType: formData.sessionType && formData.sessionType !== "NONE" ? formData.sessionType : undefined,
      sessionNum: formData.sessionNum || undefined,
      imageUrl: formData.imageUrl || undefined,
      taquigId: formData.taquigId,
      quesitos: quesitosValidos.map((q, index) => ({
        quesitoId: q.quesitoId,
        textoOriginal: q.textoOriginal,
        textoRevisado: q.textoRevisado,
        ordem: index,
      })),
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
      <div className="space-y-6 max-w-4xl">
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
                      <SelectItem value="NONE">Nenhuma</SelectItem>
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
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quesitos de Feedback *</CardTitle>
              <CardDescription>
                Adicione os quesitos que compõem este feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {quesitos.map((quesito, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Quesito {index + 1}</Label>
                    {quesitos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuesito(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`quesito-${index}`}>Selecione o Quesito *</Label>
                    <Select
                      value={quesito.quesitoId.toString()}
                      onValueChange={(value) => handleQuesitoChange(index, 'quesitoId', value)}
                    >
                      <SelectTrigger id={`quesito-${index}`}>
                        <SelectValue placeholder="Escolha um quesito..." />
                      </SelectTrigger>
                      <SelectContent>
                        {quesitosDisponiveis?.map((q: any) => (
                          <SelectItem key={q.id} value={q.id.toString()}>
                            {q.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`original-${index}`}>Texto Original *</Label>
                    <Textarea
                      id={`original-${index}`}
                      value={quesito.textoOriginal}
                      onChange={(e) => handleQuesitoChange(index, 'textoOriginal', e.target.value)}
                      placeholder="Digite o texto original do taquígrafo..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`revisado-${index}`}>Texto Revisado *</Label>
                    <Textarea
                      id={`revisado-${index}`}
                      value={quesito.textoRevisado}
                      onChange={(e) => handleQuesitoChange(index, 'textoRevisado', e.target.value)}
                      placeholder="Digite a versão revisada..."
                      rows={4}
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddQuesito}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Quesito
              </Button>

              <div className="flex justify-end gap-2 pt-4 border-t">
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
