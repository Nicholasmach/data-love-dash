import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Users, TrendingUp, Calendar, Target, BarChart3 } from "lucide-react";

const COLORS = ['#dff53a', '#afb0b4', '#2a3032', '#4ade80', '#f59e0b'];

export default function DealsAnalytics() {
  const { data: deals, isLoading } = useQuery({
    queryKey: ["deals-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals_normalized")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando dados...</div>;
  }

  if (!deals || deals.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Nenhum dado encontrado. Execute uma sincronização primeiro.</p>
      </div>
    );
  }

  // Métricas gerais
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + (deal.deal_amount_total || 0), 0);
  const wonDeals = deals.filter(deal => deal.win).length;
  const avgDealValue = totalValue / totalDeals;

  // Dados por estágio
  const dealsByStage = deals.reduce((acc, deal) => {
    const stage = deal.deal_stage_name || 'Sem Estágio';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stageData = Object.entries(dealsByStage).map(([name, value]) => ({ name, value }));

  // Dados por campanha
  const dealsByCampaign = deals.reduce((acc, deal) => {
    const campaign = deal.campaign_name || 'Sem Campanha';
    acc[campaign] = (acc[campaign] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const campaignData = Object.entries(dealsByCampaign)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Deals por mês
  const dealsByMonth = deals.reduce((acc, deal) => {
    if (deal.deal_created_at) {
      const month = new Date(deal.deal_created_at).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const monthData = Object.entries(dealsByMonth)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Ganhos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wonDeals}</div>
            <p className="text-xs text-muted-foreground">
              {((wonDeals / totalDeals) * 100).toFixed(1)}% taxa de conversão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgDealValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals por Estágio */}
        <Card>
          <CardHeader>
            <CardTitle>Deals por Estágio</CardTitle>
            <CardDescription>Distribuição de deals pelos estágios do funil</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deals por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Deals por Mês</CardTitle>
            <CardDescription>Tendência de criação de deals ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Campanhas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Campanhas</CardTitle>
            <CardDescription>Campanhas com maior número de deals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={campaignData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}