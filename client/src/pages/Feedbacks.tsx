import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Search, Filter, Eye, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Feedbacks() {
  const { feedbackRole } = useAuthWithProfile();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CORRETIVO" | "POSITIVO">("ALL");
  const [readFilter, setReadFilter] = useState<"ALL" | "READ" | "UNREAD">("ALL");

  const { data: feedbacksList, isLoading } = trpc.feedbacks.list.useQuery({
    type: typeFilter !== "ALL" ? typeFilter : undefined,
    isRead: readFilter === "READ" ? true : readFilter === "UNREAD" ? false : undefined,
    search: search || undefined,
  });

  const getFeedbackTypeColor = (type: string) => {
    return type === "CORRETIVO" ? "destructive" : "default";
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return "-";
    return "⭐".repeat(Math.round(rating));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feedbacks</h1>
            <p className="text-muted-foreground mt-2">
              {feedbackRole === "TAQUIGRAFO" && "Acompanhe os feedbacks recebidos"}
              {feedbackRole === "REVISOR" && "Gerencie os feedbacks enviados"}
              {(feedbackRole === "MASTER" || feedbackRole === "DIRETOR") && "Visualize todos os feedbacks do sistema"}
            </p>
          </div>
          {feedbackRole === "REVISOR" && (
            <Link href="/feedbacks/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Feedback
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título ou conteúdo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="CORRETIVO">Corretivo</SelectItem>
                    <SelectItem value="POSITIVO">Positivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {feedbackRole === "TAQUIGRAFO" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={readFilter} onValueChange={(value: any) => setReadFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="UNREAD">Não lidos</SelectItem>
                      <SelectItem value="READ">Lidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feedbacks List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : feedbacksList && feedbacksList.length > 0 ? (
          <div className="grid gap-4">
            {feedbacksList.map((item: any) => {
              const feedback = item.feedback;
              const otherUser = feedbackRole === "TAQUIGRAFO" ? item.revisor : item.taquigrafo;

              return (
                <Link key={feedback.id} href={`/feedbacks/${feedback.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getFeedbackTypeColor(feedback.type)}>
                              {feedback.type}
                            </Badge>
                            {feedback.sessionType && (
                              <Badge variant="outline">
                                {feedback.sessionType} {feedback.sessionNum}
                              </Badge>
                            )}
                            {feedbackRole === "TAQUIGRAFO" && (
                              feedback.isRead ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )
                            )}
                          </div>

                          <div>
                            {feedback.title && (
                              <h3 className="font-semibold text-lg">{feedback.title}</h3>
                            )}
                            <p className="text-muted-foreground line-clamp-2">
                              {feedback.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {feedbackRole === "TAQUIGRAFO" ? "De" : "Para"}: {otherUser?.name || "Usuário"}
                            </span>
                            {feedback.rating && (
                              <span>Avaliação: {getRatingStars(feedback.rating)}</span>
                            )}
                            <span>
                              {formatDistanceToNow(new Date(feedback.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>

                          {feedback.categories && feedback.categories.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {feedback.categories.map((cat: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum feedback encontrado</h3>
              <p className="text-muted-foreground text-center">
                {feedbackRole === "REVISOR" 
                  ? "Comece criando um novo feedback para os taquígrafos."
                  : "Você ainda não recebeu nenhum feedback."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
