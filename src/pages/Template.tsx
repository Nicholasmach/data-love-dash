import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Layout } from "lucide-react"
import { NavLink } from "react-router-dom"

import { TemplateProvider } from "@/contexts/TemplateContext"
import { TemplateFilters } from "@/components/template/TemplateFilters"
import { TemplateCharts } from "@/components/template/TemplateCharts"
import { FilterDebug } from "@/components/debug/FilterDebug"

const Template = () => {
  // Real-time updates - listen to database changes
  useEffect(() => {
    const channel = supabase
      .channel("template-deals-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deals_normalized",
        },
        (payload) => {
          console.log("Deal data updated in template:", payload)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <TemplateProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground metric-title flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <Layout className="w-6 h-6 text-primary" />
              </div>
              Dashboard Template
            </h1>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                8 Gráficos Prontos
              </Badge>
              <NavLink
                to="/nalk-ai"
                className="px-3 py-1 bg-primary/10 text-primary rounded text-sm font-medium hover:bg-primary/20"
              >
                Nalk AI
              </NavLink>
            </div>
          </div>
          <p className="text-muted-foreground">
            Dashboard pré-configurado com 8 gráficos ultra modernos e filtros sincronizados em tempo real
          </p>
        </div>

        {/* Filters Section */}
        <TemplateFilters />

        {/* Charts Grid */}
        <TemplateCharts />

        {/* Debug */}
        <FilterDebug />
      </div>
    </TemplateProvider>
  )
}

export default Template
