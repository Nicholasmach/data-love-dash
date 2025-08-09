import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Settings, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useState } from "react"
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
    
    // Simula verificação do status após um tempo
    setTimeout(() => {
      checkSyncStatus()
    }, 5000)
    
    toast({
      title: "Sincronização iniciada",
      description: "A coleta de deals foi iniciada em background",
    })
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
        toast({
          title: "Sincronização concluída",
          description: `${data.total_deals || 0} deals foram sincronizados com sucesso`,
        })
      } else if (data?.status === 'running') {
        setRDSyncStatus('syncing')
        // Verifica novamente em 10 segundos
        setTimeout(() => checkSyncStatus(), 10000)
      } else {
        setRDSyncStatus('error')
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
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 animate-pulse">
              Sincronizando...
            </Badge>
          )
        case 'completed':
          return (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Sincronizado
            </Badge>
          )
        case 'error':
          return (
            <Badge className="bg-red-100 text-red-800 border-red-200">
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
      <Card key={integration.id} className="compact-card group interactive-hover">
        <CardHeader className="pb-3">
          <div className="perfect-align">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-border/20 flex items-center justify-center p-1">
                {integration.logo}
              </div>
              <div className="flex-1">
                <CardTitle className="metric-title text-base group-hover:text-primary transition-colors">
                  {integration.name}
                  {isRDStation && rdSyncStatus === 'syncing' && (
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin text-primary inline" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(integration.status)}
                </div>
              </div>
            </div>
            
            <Switch
              checked={isConnected}
              onCheckedChange={() => handleToggleIntegration(integration.id, integration.status)}
              disabled={integration.status === 'coming_soon' || (isRDStation && rdSyncStatus === 'syncing')}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <CardDescription className="helper-text text-sm mb-3 leading-relaxed">
            {integration.description}
          </CardDescription>

          {isConnected && integration.status !== 'coming_soon' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full neon-button"
              onClick={() => handleConfigureIntegration(integration.id)}
              disabled={isRDStation && rdSyncStatus === 'syncing'}
            >
              <Settings className="w-4 h-4 mr-2" />
              {isRDStation && rdSyncStatus === 'syncing' ? 'Sincronizando...' : 'Configurar'}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* IMPROVED Header */}
      <div className="space-y-4">
        <div>
          <h1 className="metric-title text-3xl">Integrações</h1>
          <p className="helper-text text-base mt-2">
            Conecte suas ferramentas e centralize todos os dados em um só lugar
          </p>
        </div>

        {/* IMPROVED Estatísticas */}
        <Card className="compact-card bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
          <div className="compact-grid grid-cols-1 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="helper-text text-xs font-medium">Integrações Ativas</p>
                <p className="metric-value text-xl">{connectedIntegrations.size}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="helper-text text-xs font-medium">Disponíveis</p>
                <p className="metric-value text-xl">{integrations.filter(i => i.status === 'available').length}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="helper-text text-xs font-medium">Em Breve</p>
                <p className="metric-value text-xl">{integrations.filter(i => i.status === 'coming_soon').length}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Integrações Conectadas */}
      {connectedList.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Integrações Conectadas
            </CardTitle>
            <CardDescription>
              Suas integrações ativas e funcionando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedList.map(renderIntegrationCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integrações Disponíveis */}
      {availableList.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              Integrações Disponíveis
            </CardTitle>
            <CardDescription>
              Conecte novas ferramentas ao seu workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableList.map(renderIntegrationCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {integrations.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma integração encontrada para esta categoria.
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
  )
}

export default Integrations