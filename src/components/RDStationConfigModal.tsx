import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Settings, RefreshCw, Database, Calendar, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface RDStationConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: RDStationConfig) => void
}

interface RDStationConfig {
  apiKey: string
  startDate: string
  incrementalSync: boolean
  autoSync: boolean
}

export const RDStationConfigModal = ({ isOpen, onClose, onSave }: RDStationConfigModalProps) => {
  const { toast } = useToast()
  const [config, setConfig] = useState<RDStationConfig>({
    apiKey: '',
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 ano atrás
    incrementalSync: false,
    autoSync: false
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null)

  const validateDateRange = (startDate: string): { isValid: boolean; message?: string } => {
    const start = new Date(startDate)
    const now = new Date()
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const diffInDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 3600 * 24))
    
    if (diffInDays > 365) {
      return { 
        isValid: false, 
        message: "Por segurança e performance, o período máximo é de 1 ano. Ajuste a data de início." 
      }
    }
    
    if (start > now) {
      return { 
        isValid: false, 
        message: "A data de início não pode ser futura." 
      }
    }
    
    return { isValid: true }
  }

  const handleSync = async () => {
    if (!config.apiKey || !config.startDate) {
      toast({
        title: "Campos obrigatórios",
        description: "API Key e Data de Início são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Validar período de data
    const validation = validateDateRange(config.startDate)
    if (!validation.isValid) {
      toast({
        title: "Período inválido",
        description: validation.message,
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)
    setSyncProgress({ current: 0, total: 100 })
    
    try {
      // Inicia sincronização em background com abordagem otimizada
      const { error } = await supabase.functions.invoke('rd-station-sync', {
        body: {
          apiKey: config.apiKey,
          startDate: config.startDate,
          incrementalSync: false,
          batchSize: 200, // Tamanho do batch para evitar timeouts
          useStreaming: true // Processamento em streaming
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      // Salva configuração e fecha modal imediatamente
      onSave(config)
      toast({
        title: "Sincronização iniciada ✨",
        description: "Os dados estão sendo processados em background. Você será notificado quando concluir.",
      })
      
      // Fecha o modal imediatamente para melhor UX
      onClose()
      
    } catch (error: any) {
      toast({
        title: "Erro na sincronização",
        description: error.message || "Não foi possível iniciar a sincronização.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border border-border/50 rounded-lg shadow-lg max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="metric-title text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            Sincronizar RD Station CRM
          </DialogTitle>
          <DialogDescription className="helper-text">
            Configure a sincronização dos deals do seu RD Station CRM
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* API Configuration */}
          <Card className="bg-card border border-border/50 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="metric-title text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Configuração da API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="metric-title text-sm">Token da API *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Seu token de API do RD Station CRM"
                  className="bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  disabled={isSyncing}
                />
                <p className="helper-text text-xs">
                  Obtenha seu token no painel administrativo do RD Station CRM
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate" className="metric-title text-sm">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  min={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  disabled={isSyncing}
                />
                <p className="helper-text text-xs">
                  Período máximo: 1 ano | Data selecionada: {config.startDate ? new Date(config.startDate).toLocaleDateString('pt-BR') : 'Nenhuma'}
                </p>
                {config.startDate && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="helper-text text-xs text-primary font-medium">
                      📊 Período selecionado: {Math.ceil((new Date().getTime() - new Date(config.startDate).getTime()) / (1000 * 3600 * 24))} dias
                    </p>
                  </div>
                )}
              </div>

              {/* Progress indicator durante sync */}
              {isSyncing && syncProgress && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span className="helper-text text-sm">Processando dados...</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: '20%' }}
                    />
                  </div>
                  <p className="helper-text text-xs text-center">
                    O processo pode levar alguns minutos. Você pode fechar este modal.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSyncing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing || !config.apiKey || !config.startDate}
            className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-bold transition-colors duration-300 hover:bg-primary/90"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Iniciar Sincronização
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}