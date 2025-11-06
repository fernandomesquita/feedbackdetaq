import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeedbackCommentsProps {
  feedbackId: number;
}

export function FeedbackComments({ feedbackId }: FeedbackCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const utils = trpc.useUtils();

  const { data: comments, isLoading } = trpc.comments.listByFeedback.useQuery({ feedbackId });

  const createMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      utils.comments.listByFeedback.invalidate({ feedbackId });
      toast.success("Comentário adicionado");
    },
    onError: () => {
      toast.error("Erro ao adicionar comentário");
    },
  });

  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.listByFeedback.invalidate({ feedbackId });
      toast.success("Comentário removido");
    },
    onError: () => {
      toast.error("Erro ao remover comentário");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Digite um comentário");
      return;
    }
    createMutation.mutate({ feedbackId, content: newComment });
  };

  const handleDelete = (commentId: number) => {
    if (confirm("Deseja realmente excluir este comentário?")) {
      deleteMutation.mutate({ commentId });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Form de novo comentário */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicione um comentário..."
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={createMutation.isPending || !newComment.trim()}>
            <Send className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "Enviando..." : "Comentar"}
          </Button>
        </div>
      </form>

      {/* Lista de comentários */}
      <div className="space-y-3">
        {comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <Card key={comment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{comment.userName || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  {user?.id === comment.userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </div>
        )}
      </div>
    </div>
  );
}
