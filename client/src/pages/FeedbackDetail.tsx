import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2, CheckCircle2, User, Calendar, Star } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { FeedbackComments } from "@/components/FeedbackComments";
import { FeedbackReactions } from "@/components/FeedbackReactions";
import { useEffect } from "react";

export default function FeedbackDetail() {
  const [, params] = useRoute("/feedbacks/:id");
  const [, setLocation] = useLocation();
  const { user, feedbackRole } = useAuthWithProfile();
  const feedbackId = params?.id ? parseInt(params.id) : 0;

  const { data: feedbackData, isLoading } = trpc.feedbacks.getById.useQuery(
    { id: feedbackId },
    { enabled: feedbackId > 0 }
  );

  const markAsReadMutation = trpc.feedbacks.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("Feedback marcado como lido");
    },
  });

  const deleteMutation = trpc.feedbacks.delete.useMutation({
    onSuccess: () => {
      toast.success("Feedback excluído com sucesso");
      setLocation("/feedbacks");
    },
    onError: () => {
      toast.error("Erro ao excluir feedback");
    },
  });

  useEffect(() => {
    if (feedbackData && !feedbackData.feedback.isRead && feedbackRole === "TAQUIGRAFO") {
      markAsReadMutation.mutate({ id: feedbackId });
    }
  }, [feedbackData, feedbackRole, feedbackId]);

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este feedback?")) {
      deleteMutation.mutate({ id: feedbackId });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!feedbackData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Feedback não encontrado</p>
          <Button onClick={() => setLocation("/feedbacks")} className="mt-4">
            Voltar para feedbacks
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const { feedback, revisor, taquigrafo } = feedbackData;
  const canEdit = user?.id === feedback.revisorId && feedbackRole === "REVISOR";
  const canDelete = feedbackRole === "MASTER" || feedbackRole === "DIRETOR" || canEdit;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/feedbacks")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => setLocation(`/feedbacks/${feedbackId}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={feedback.type === "CORRETIVO" ? "destructive" : "default"}>
                      {feedback.type}
                    </Badge>
                    {feedback.sessionType && (
                      <Badge variant="outline">
                        {feedback.sessionType} {feedback.sessionNum}
                      </Badge>
                    )}
                    {feedback.isRead && feedbackRole === "TAQUIGRAFO" && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Lido
                      </Badge>
                    )}
                  </div>
                  {feedback.title && (
                    <CardTitle className="text-2xl">{feedback.title}</CardTitle>
                  )}
                </div>
                {feedback.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg">{feedback.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Revisor</p>
                    <p className="font-medium">{revisor?.name || "Desconhecido"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Taquígrafo</p>
                    <p className="font-medium">{taquigrafo?.name || "Desconhecido"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {format(new Date(feedback.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Quesitos */}
            {feedbackData.quesitos && feedbackData.quesitos.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Quesitos Avaliados</h3>
                {feedbackData.quesitos.map((item: any, index: number) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-semibold">
                        {index + 1}. {item.quesito?.titulo || "Quesito"}
                      </Badge>
                    </div>
                    {item.quesito?.descricao && (
                      <p className="text-sm text-muted-foreground italic">
                        {item.quesito.descricao}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm font-medium mb-2 text-muted-foreground">Texto Original:</p>
                        <div className="bg-background p-3 rounded border">
                          <p className="whitespace-pre-wrap text-sm">{item.textoOriginal}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2 text-muted-foreground">Texto Revisado:</p>
                        <div className="bg-background p-3 rounded border border-primary/30">
                          <p className="whitespace-pre-wrap text-sm">{item.textoRevisado}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback: Content antigo para feedbacks sem quesitos */
              feedback.content && (
                <div>
                  <h3 className="font-semibold mb-2">Conteúdo do Feedback</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{feedback.content}</p>
                  </div>
                </div>
              )
            )}

            {/* Image */}
            {feedback.imageUrl && (
              <div>
                <h3 className="font-semibold mb-2">Imagem Anexada</h3>
                <img
                  src={feedback.imageUrl}
                  alt="Anexo do feedback"
                  className="rounded-lg border max-w-full h-auto"
                />
              </div>
            )}

            {/* Categories */}
            {feedback.categories && feedback.categories.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Categorias</h3>
                <div className="flex gap-2 flex-wrap">
                  {feedback.categories.map((cat: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Read info */}
            {feedback.readAt && (
              <div className="text-sm text-muted-foreground">
                Lido em {format(new Date(feedback.readAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reactions */}
        <Card>
          <CardHeader>
            <CardTitle>Reações</CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackReactions feedbackId={feedbackId} />
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Comentários</CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackComments feedbackId={feedbackId} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
