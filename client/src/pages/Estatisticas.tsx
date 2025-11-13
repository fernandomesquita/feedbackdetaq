import DashboardLayout from "@/components/DashboardLayout";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, MessageSquare, Bell, Book, ThumbsUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const COLORS = {
  CORRETIVO: "#ef4444",
  POSITIVO: "#22c55e",
  ENTENDI: "#3b82f6",
  OBRIGADO: "#8b5cf6",
  VOU_MELHORAR: "#f59e0b",
};

export default function Estatisticas() {
  const { feedbackRole, user } = useAuthWithProfile();

  const { data: generalStats, isLoading: loadingGeneral } = trpc.statistics.general.useQuery();
  const { data: feedbackStats, isLoading: loadingFeedbacks } = trpc.statistics.feedbacks.useQuery();
  const { data: reactionStats } = trpc.statistics.reactions.useQuery();
  const { data: averageRating } = trpc.statistics.averageRating.useQuery();
  const { data: topTaquigrafos } = trpc.statistics.topTaquigrafos.useQuery({ limit: 10 });
  const { data: topRevisores } = trpc.statistics.topRevisores.useQuery({ limit: 10 });
  const { data: quesitoStats } = trpc.statistics.quesitosGlobal.useQuery();

  const canViewAll = feedbackRole === "MASTER" || feedbackRole === "DIRETOR";

  if (loadingGeneral || loadingFeedbacks) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Preparar dados para gráficos
  const feedbackTypeData = feedbackStats?.byType.map((item: any) => ({
    name: item.type === "CORRETIVO" ? "Corretivos" : "Positivos",
    value: item.count,
    type: item.type,
  })) || [];

  const feedbackReadData = feedbackStats?.byReadStatus.map((item: any) => ({
    name: item.isRead ? "Lidos" : "Não Lidos",
    value: item.count,
  })) || [];

  const monthlyData = feedbackStats?.byMonth.map((item: any) => ({
    month: item.month,
    feedbacks: item.count,
  })) || [];

  const reactionData = reactionStats?.map((item: any) => ({
    name: item.type === "ENTENDI" ? "Entendi" : item.type === "OBRIGADO" ? "Obrigado" : "Vou Melhorar",
    value: item.count,
    type: item.type,
  })) || [];

  const quesitoData = quesitoStats?.map((item: any) => ({
    name: item.quesitoTitulo,
    usos: Number(item.totalUsos || 0),
    revisores: Number(item.totalRevisores || 0),
    taquigrafos: Number(item.totalTaquigrafos || 0),
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Estatísticas
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize métricas e indicadores do sistema
          </p>
        </div>

        {/* Cards de Métricas Gerais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Feedbacks</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats?.totalFeedbacks || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Feedbacks registrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comentários</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats?.totalComments || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Comentários em feedbacks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reações</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats?.totalReactions || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Reações registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avisos</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats?.totalAvisos || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avisos publicados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Termos Padronizados</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats?.totalTerms || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Glossário de padronização
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Usuários cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Feedbacks por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Feedbacks por Tipo</CardTitle>
              <CardDescription>Distribuição entre corretivos e positivos</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={feedbackTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {feedbackTypeData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status de Leitura */}
          <Card>
            <CardHeader>
              <CardTitle>Status de Leitura</CardTitle>
              <CardDescription>Feedbacks lidos vs não lidos</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackReadData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={feedbackReadData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedbacks por Mês */}
          {monthlyData.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Feedbacks por Mês</CardTitle>
                <CardDescription>Evolução nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="feedbacks" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Reações */}
          {reactionData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reações</CardTitle>
                <CardDescription>Distribuição por tipo de reação</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reactionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reactionData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Média de Avaliação */}
          {averageRating && (
            <Card>
              <CardHeader>
                <CardTitle>Índice de Qualidade</CardTitle>
                <CardDescription>Baseado na proporção de feedbacks positivos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-primary mb-2">
                      {averageRating.rating}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      de 5.0
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      {averageRating.positivos} positivos / {averageRating.corretivos} corretivos
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quesitos Mais Usados (apenas para MASTER/DIRETOR) */}
        {canViewAll && quesitoData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quesitos Mais Usados em Feedbacks
              </CardTitle>
              <CardDescription>Distribuição de uso dos quesitos nos feedbacks</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={quesitoData} layout="vertical" margin={{ left: 120, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={110} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold mb-2">{payload[0].payload.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Usos totais: <span className="font-semibold text-foreground">{payload[0].value}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Revisores: <span className="font-semibold text-foreground">{payload[0].payload.revisores}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Taquígrafos: <span className="font-semibold text-foreground">{payload[0].payload.taquigrafos}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="usos" fill="#8b5cf6" name="Quantidade de Usos" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Rankings (apenas para MASTER/DIRETOR) */}
        {canViewAll && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Taquígrafos */}
            {topTaquigrafos && topTaquigrafos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Taquígrafos</CardTitle>
                  <CardDescription>Mais feedbacks recebidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topTaquigrafos.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.taquigrafoName || "Sem nome"}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.feedbackCount} feedbacks</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Revisores */}
            {topRevisores && topRevisores.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Revisores</CardTitle>
                  <CardDescription>Mais feedbacks criados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topRevisores.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.revisorName || "Sem nome"}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.feedbackCount} feedbacks</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
