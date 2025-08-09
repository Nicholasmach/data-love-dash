import { useEffect } from "react"
import { DashboardBuilder } from "@/components/dashboard/DashboardBuilder"
import { supabase } from "@/integrations/supabase/client"
import { Badge } from "@/components/ui/badge"
import { BarChart3 } from "lucide-react"

const Analytics = () => {

  // Real-time updates - listen to database changes
  useEffect(() => {
    const channel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals_normalized'
        },
        (payload) => {
          console.log('Deal data updated:', payload)
          // Force refresh of analytics data
          window.location.reload()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground metric-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            Analytics Dashboard
          </h1>
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
            Dados em tempo real
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Construa dashboards personalizados com drag-and-drop, grid de 12 colunas e filtros globais
        </p>
      </div>

      {/* Dashboard Builder */}
      <DashboardBuilder />
    </div>
  )
}

export default Analytics