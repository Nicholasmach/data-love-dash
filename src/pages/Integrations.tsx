import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Settings, CheckCircle, AlertCircle, RefreshCw, Zap, TrendingUp, Database, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { RDStationConfigModal } from "@/components/RDStationConfigModal"
import { supabase } from "@/integrations/supabase/client"
import facebookLogo from "@/assets/logos/facebook-logo.png"

// Componentes de Logo
const RDStationLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#1E5BF0"/>
    <path d="M8 12h4c3.314 0 6 2.686 6 6v2h-4c-3.314 0-6-2.686-6-6v-2z" fill="white"/>
    <path d="M18 8h4v4h-4z" fill="white"/>
    <path d="M18 8v8h6v-6c0-1.1-.9-2-2-2h-4z" fill="white" opacity="0.7"/>
  </svg>
)

const HubSpotLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#FF7A59"/>
    <circle cx="16" cy="16" r="3" fill="white"/>
    <circle cx="10" cy="10" r="2" fill="white"/>
    <circle cx="22" cy="22" r="2" fill="white"/>
    <path d="M13 13l6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const PipedriveLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#24A86A"/>
    <path d="M8 12h16v2H8zm0 4h12v2H8zm0 4h8v2H8z" fill="white"/>
    <circle cx="22" cy="10" r="2" fill="white"/>
  </svg>
)

const GoogleAdsLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#4285F4"/>
    <path d="M16 8l-8 8 8 8V8z" fill="#EA4335"/>
    <path d="M16 8l8 8-8 8V8z" fill="#34A853"/>
    <path d="M16 8v16" stroke="#FBBC04" strokeWidth="2"/>
  </svg>
)

const GoogleAnalyticsLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#F9AB00"/>
    <rect x="8" y="20" width="3" height="8" fill="white"/>
    <rect x="14" y="16" width="3" height="12" fill="white"/>
    <rect x="20" y="12" width="3" height="16" fill="white"/>
  </svg>
)

interface Integration {
  id: string
  name: string
  description: string
  category: string
  status: 'connected' | 'available' | 'coming_soon'
  logo: React.ReactNode
}

const integrations: Integration[] = [
  {
    id: 'rd-station',
    name: 'RD Station CRM',
    description: 'Sincronize leads, contatos e oportunidades do seu CRM',
    category: 'CRM',
    status: 'connected',
    logo: <RDStationLogo />
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Integre dados do seu CRM e automação de marketing',
    category: 'CRM',
    status: 'available',
    logo: <HubSpotLogo />
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Conecte seu pipeline de vendas e oportunidades',
    category: 'CRM',
    status: 'available',
    logo: <PipedriveLogo />
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Monitore performance de campanhas e conversões',
    category: 'Publicidade',
    status: 'available',
    logo: <GoogleAdsLogo />
  },
  {
    id: 'facebook-ads',
    name: 'Facebook Ads',
    description: 'Acompanhe métricas de campanhas no Meta',
    category: 'Publicidade',
    status: 'available',
    logo: <img src={facebookLogo} alt="Facebook" className="w-8 h-8 object-contain" />
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Analise comportamento e conversões do seu site',
    category: 'Analytics',
    status: 'coming_soon',
    logo: <GoogleAnalyticsLogo />
  }
]

const Integrations = () => {
  const { toast } = useToast()
  const [connectedIntegrations, setConnectedIntegrations] = useState(
    new Set(['rd-station'])
  )
  const [isRDConfigOpen, setIsRDConfigOpen] = useState(false)
  const [rdSyncStatus, setRDSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle')
  const [syncProgress, setSyncProgress] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)

  // Polling para verificar status da sincronização
  useEffect(() => {
    if (rdSyncStatus === 'syncing') {
      const interval = setInterval(() => {
        checkSyncStatus()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [rdSyncStatus])

  const handleToggleIntegration = (integrationId: string, currentStatus: string) => {
    if (currentStatus === 'coming_soon') {
      toast({
        title: "Em breve",
        description: "Esta integração estará disponível em breve.",
        variant: "default",
      })
      return
    }

    if (connectedIntegrations.has(integrationId)) {
      setConnectedIntegrations(prev => {
        const newSet = new Set(prev)
        newSet.delete(integrationId)
        return newSet
      })
      toast({
        title: "Integração desconectada",
        description: "A integração foi desconectada com sucesso.",
      })
    } else {
      setConnectedIntegrations(prev => new Set([...prev, integrationId]))
      toast({
        title: "Integração conectada",
        description: "A integração foi conectada com sucesso.",
      })
    }
  }

  const handleConfigureIntegration = (integrationId: string) => {
    if (integrationId === 'rd-station') {
      setIsRDConfigOpen(true)
    } else {
      toast({
        title: "Configurações",
        description: `Configurando integração ${integrationId}...`,
      })
    }
  }

  const handleRDConfigSave = (config: any) => {
    console.log('RD Station config saved:', config)
    setRDSyncStatus('syncing')
    setSyncProgress(0)
    
    // Inicia verificação do status imediatamente
    setTimeout(() => {
      checkSyncStatus()
    }, 2000)
  }

  const checkSyncStatus = async () => {
    try {
      // Verifica o último job de sincronização
      const { data, error } = await supabase
        .from('rd_sync_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Erro ao verificar status:', error)
        setRDSyncStatus('error')
        return
      }

      if (data?.status === 'completed') {
        setRDSyncStatus('completed')
        setSyncProgress(100)
        setTotalRecords(data.total_deals || 0)
        toast({
          title: "Sincronização concluída! 🎉",
          description: `${data.total_deals || 0} deals foram sincronizados com sucesso`,
        })
      } else if (data?.status === 'running') {
        setRDSyncStatus('syncing')
        // Simula progresso baseado no tempo decorrido
        const elapsed = new Date().getTime() - new Date(data.created_at).getTime()
        const estimatedProgress = Math.min(90, (elapsed / (5 * 60 * 1000)) * 100) // 5 min estimado
        setSyncProgress(estimatedProgress)
        
        // Verifica novamente em 5 segundos
        setTimeout(() => checkSyncStatus(), 5000)
      } else {
        setRDSyncStatus('error')
        setSyncProgress(0)
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      setRDSyncStatus('error')
    }
  }

  const getStatusBadge = (status: string) => {
    // Status especial para RD Station baseado no sync status
    if (status === 'connected') {
      switch (rdSyncStatus) {
        case 'syncing':
          return (
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/30 animate-pulse">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Sincronizando {Math.round(syncProgress)}%
              </Badge>
            </div>
          )
        case 'completed':
          return (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              {totalRecords} deals sincronizados
            </Badge>
          )
        case 'error':
          return (
            <Badge className="bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Erro na sincronização
            </Badge>
          )
        default:
          return <Badge className="bg-green-100 text-green-800 border-green-200">Conectado</Badge>
      }
    }
    
    switch (status) {
      case 'available':
        return <Badge variant="outline">Disponível</Badge>
      case 'coming_soon':
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Em breve</Badge>
      default:
        return null
    }
  }

  const connectedList = integrations.filter(i => connectedIntegrations.has(i.id))
  const availableList = integrations.filter(i => !connectedIntegrations.has(i.id))

  const renderIntegrationCard = (integration: Integration) => {
    const isConnected = connectedIntegrations.has(integration.id)
    const isRDStation = integration.id === 'rd-station'
    
    return (
      <Card key={integration.id} className="group border border-border/50 rounded-xl bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-200">
                  {integration.logo}
                </div>
                {isConnected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background"></div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                  {integration.name}
                </h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(integration.status)}
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary/50 rounded-md">
                    {integration.category}
                  </span>
                </div>
              </div>
            </div>
            
            <Switch
              checked={isConnected}
              onCheckedChange={() => handleToggleIntegration(integration.id, integration.status)}
              disabled={integration.status === 'coming_soon' || (isRDStation && rdSyncStatus === 'syncing')}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {integration.description}
          </p>

          {/* Progress bar para RD Station durante sync */}
          {isRDStation && rdSyncStatus === 'syncing' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary">Processando dados</span>
                <span className="text-xs text-muted-foreground">{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {isConnected && integration.status !== 'coming_soon' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full group-hover:border-primary/50 group-hover:text-primary transition-colors"
              onClick={() => handleConfigureIntegration(integration.id)}
              disabled={isRDStation && rdSyncStatus === 'syncing'}
            >
              <Settings className="w-4 h-4 mr-2" />
              {isRDStation && rdSyncStatus === 'syncing' ? 'Processando...' : 'Configurar'}
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Integrações
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conecte suas ferramentas favoritas e centralize todos os dados em um só lugar. 
            Configure em minutos e comece a ter insights poderosos.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                  <p className="text-2xl font-bold text-foreground">{connectedIntegrations.size}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 hover:from-emerald-500/15 hover:to-emerald-500/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disponíveis</p>
                  <p className="text-2xl font-bold text-foreground">{integrations.filter(i => i.status === 'available').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:from-blue-500/15 hover:to-blue-500/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dados Sync</p>
                  <p className="text-2xl font-bold text-foreground">{totalRecords > 0 ? `${(totalRecords / 1000).toFixed(1)}k` : '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-orange-500/10 to-orange-500/5 hover:from-orange-500/15 hover:to-orange-500/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Segurança</p>
                  <p className="text-xl font-bold text-foreground">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrações Conectadas */}
        {connectedList.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Integrações Conectadas</h2>
                <p className="text-sm text-muted-foreground">Suas ferramentas ativas e sincronizadas</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {connectedList.map(renderIntegrationCard)}
            </div>
          </div>
        )}

        {/* Separator */}
        {connectedList.length > 0 && availableList.length > 0 && (
          <Separator className="my-12" />
        )}

        {/* Integrações Disponíveis */}
        {availableList.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Explore Mais Integrações</h2>
                <p className="text-sm text-muted-foreground">Conecte novas ferramentas e expanda suas possibilidades</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {availableList.map(renderIntegrationCard)}
            </div>
          </div>
        )}

        {/* Empty State */}
        {integrations.length === 0 && (
          <Card className="border-dashed border-2 border-border/50 bg-transparent">
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma integração encontrada</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Novas integrações estão sendo adicionadas regularmente. Fique atento!
              </p>
            </CardContent>
          </Card>
        )}

        {/* RD Station Configuration Modal */}
        <RDStationConfigModal
          isOpen={isRDConfigOpen}
          onClose={() => setIsRDConfigOpen(false)}
          onSave={handleRDConfigSave}
        />
      </div>
    </div>
  )
}

export default Integrations