import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Filter, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useDynamicFilters } from "@/hooks/useDynamicFilters"

interface DashboardFiltersProps {
  onFiltersChange?: (filters: any) => void
  onApplyFilters?: () => void
}

export const DashboardFilters = ({ onFiltersChange, onApplyFilters }: DashboardFiltersProps) => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })
  const [selectedSeller, setSelectedSeller] = useState<string>("")
  const [selectedStage, setSelectedStage] = useState<string>("")

  const { sellers, stages, isLoading } = useDynamicFilters()

  const handleFilterChange = () => {
    const filters = {
      dateRange,
      seller: selectedSeller,
      stage: selectedStage
    }
    onFiltersChange?.(filters)
  }

  const handleApplyFilters = () => {
    handleFilterChange()
    onApplyFilters?.()
  }

  return (
    <Card className="crypto-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground metric-title">
          <Filter className="w-5 h-5 text-primary" />
          Filtros do Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground helper-text">Período</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal crypto-input border-border",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecionar período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to
                  }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from,
                      to: range?.to
                    })
                  }}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Seller Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground helper-text">Vendedor</Label>
            <Select 
              value={selectedSeller} 
              onValueChange={(value) => {
                setSelectedSeller(value)
              }}
            >
              <SelectTrigger className="crypto-input border-border" disabled={isLoading}>
                <SelectValue placeholder={isLoading ? "Carregando..." : "Selecionar vendedor"} />
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {sellers.map((seller) => (
                  <SelectItem key={seller.value} value={seller.value}>
                    {seller.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stage Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground helper-text">Estágio</Label>
            <Select 
              value={selectedStage} 
              onValueChange={(value) => {
                setSelectedStage(value)
              }}
            >
              <SelectTrigger className="crypto-input border-border" disabled={isLoading}>
                <SelectValue placeholder={isLoading ? "Carregando..." : "Selecionar estágio"} />
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {stages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Apply Filters Button */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground helper-text">Aplicar</Label>
            <div className="flex gap-2 flex-col">
              <Button 
                onClick={handleApplyFilters}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Aplicar Filtros
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    const today = new Date()
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
                    setDateRange({ from: lastMonth, to: today })
                  }}
                >
                  30 dias
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setDateRange({ from: undefined, to: undefined })
                    setSelectedSeller("")
                    setSelectedStage("")
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}