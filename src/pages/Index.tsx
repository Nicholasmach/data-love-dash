import { useAuth } from '@/components/AuthProvider'
import { AuthPage } from '@/components/AuthPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Zap, Users, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const Index = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/analytics')
    }
  }, [user, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto shadow-elegant">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              DataViz Pro
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Plataforma completa de visualização de dados com ETL automatizado. 
            Conecte seus CRMs e visualize insights em dashboards profissionais.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              size="lg" 
              className="bg-gradient-primary text-white shadow-elegant hover:shadow-lg transition-all"
              onClick={() => navigate('/analytics')}
            >
              Acessar Analytics
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary/20 hover:bg-primary/5"
              onClick={() => navigate('/integrations')}
            >
              Ver Integrações
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <Card className="shadow-card border-border/50 hover:shadow-elegant transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Dashboards Inteligentes</CardTitle>
              <CardDescription>
                Visualizações automáticas dos seus dados de CRM com insights em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Métricas automáticas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Gráficos interativos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Atualizações em tempo real</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50 hover:shadow-elegant transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <CardTitle>ETL Automatizado</CardTitle>
              <CardDescription>
                Sincronização automática dos dados dos seus CRMs favoritos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>RD Station, Pipedrive, HubSpot</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Sincronização por hora</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Edge Functions seguras</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50 hover:shadow-elegant transition-all">
            <CardHeader>
              <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-info" />
              </div>
              <CardTitle>Gestão de Equipe</CardTitle>
              <CardDescription>
                Controle de acesso e permissões para toda sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Níveis de permissão</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Auditoria de acesso</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Convites por email</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
};

export default Index;
