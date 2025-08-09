import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, X, Filter } from 'lucide-react'
import { useTemplate } from '@/contexts/TemplateContext'
import { chartDataService } from '@/services/chartDataService'

export const TemplateFilters: React.FC = () => {
  const { 
    filters, 
    filterOptions, 
    loading, 
    updateFilters, 
    resetFilters, 
    applyFilters 
  } = useTemplate()

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof typeof filters]
    if (key === 'dateRange') {
      const dateRange = value as typeof filters.dateRange
      return dateRange?.from && dateRange?.to
    }
    return value !== undefined && value !== null && value !== '' && value !== 'all'
  })

  return (
    <div className="w-full bg-card border rounded-lg">
      {/* Header com título e ações */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Filter className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Filtros</h2>
            <p className="text-sm text-muted-foreground">Configure os parâmetros para análise</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </Button>
          )}
          
          <Button
            onClick={applyFilters}
            disabled={loading}
            className="gap-2"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Aplicar Filtros
          </Button>
          
          {/* Debug button to inspect current filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(JSON.stringify(filters, null, 2))}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            Debug Filtros
          </Button>

          {/* Debug Receita Total - sem filtros */}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await chartDataService.executeQuery(
                "SELECT SUM(COALESCE(deal_amount_total, 0)) as total_revenue, COUNT(*) as total_deals FROM deals_normalized"
              );
              alert(JSON.stringify(res, null, 2));
            }}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            Debug Receita Total
          </Button>
        </div>
      </div>

      {/* Grid de filtros com layout responsivo */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Primeira linha - Período ocupa largura completa */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Período</label>
              <div className="w-fit">
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilters({ dateRange: range })}
                />
              </div>
            </div>
          </div>

          {/* Segunda linha - Outros filtros com espaçamento adequado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Vendedor */}
            <div className="space-y-2 min-w-0">
              <label className="text-sm font-medium text-foreground">Vendedor</label>
              <Select
                value={filters.seller || 'all'}
                onValueChange={(value) => updateFilters({ seller: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os vendedores" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">Todos os vendedores</SelectItem>
                  {filterOptions.sellers.filter(seller => seller && seller.trim()).map((seller) => (
                    <SelectItem key={seller} value={seller}>
                      {seller}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pipeline */}
            <div className="space-y-2 min-w-0">
              <label className="text-sm font-medium text-foreground">Pipeline</label>
              <Select
                value={filters.pipeline || 'all'}
                onValueChange={(value) => updateFilters({ pipeline: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os pipelines" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">Todos os pipelines</SelectItem>
                  {filterOptions.pipelines.filter(pipeline => pipeline && pipeline.trim()).map((pipeline) => (
                    <SelectItem key={pipeline} value={pipeline}>
                      {pipeline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estágio do Negócio */}
            <div className="space-y-2 min-w-0">
              <label className="text-sm font-medium text-foreground">Estágio</label>
              <Select
                value={filters.dealStage || 'all'}
                onValueChange={(value) => updateFilters({ dealStage: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os estágios" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">Todos os estágios</SelectItem>
                  {filterOptions.dealStages.filter(stage => stage && stage.trim()).map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Origem do Negócio */}
            <div className="space-y-2 min-w-0">
              <label className="text-sm font-medium text-foreground">Origem</label>
              <Select
                value={filters.dealSource || 'all'}
                onValueChange={(value) => updateFilters({ dealSource: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {filterOptions.dealSources.filter(source => source && source.trim()).map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campanha */}
            <div className="space-y-2 min-w-0">
              <label className="text-sm font-medium text-foreground">Campanha</label>
              <Select
                value={filters.campaign || 'all'}
                onValueChange={(value) => updateFilters({ campaign: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as campanhas" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  {filterOptions.campaigns.filter(campaign => campaign && campaign.trim()).map((campaign) => (
                    <SelectItem key={campaign} value={campaign}>
                      {campaign}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Filtros Ativos */}
        {hasActiveFilters && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">Filtros ativos:</span>
              
              {filters.dateRange?.from && filters.dateRange?.to && (
                <Badge variant="secondary" className="gap-1">
                  Período: {filters.dateRange.from.toLocaleDateString()} - {filters.dateRange.to.toLocaleDateString()}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilters({ dateRange: undefined })}
                  />
                </Badge>
              )}
              
              {filters.seller && (
                <Badge variant="secondary" className="gap-1">
                  Vendedor: {filters.seller}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilters({ seller: undefined })}
                  />
                </Badge>
              )}
              
              {filters.pipeline && (
                <Badge variant="secondary" className="gap-1">
                  Pipeline: {filters.pipeline}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilters({ pipeline: undefined })}
                  />
                </Badge>
              )}
              
              {filters.dealStage && (
                <Badge variant="secondary" className="gap-1">
                  {filters.dealStage}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilters({ dealStage: undefined })}
                  />
                </Badge>
              )}
              
              {filters.dealSource && (
                <Badge variant="secondary" className="gap-1">
                  {filters.dealSource}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilters({ dealSource: undefined })}
                  />
                </Badge>
              )}
              
              {filters.campaign && (
                <Badge variant="secondary" className="gap-1">
                  {filters.campaign}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilters({ campaign: undefined })}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
