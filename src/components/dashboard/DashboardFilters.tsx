import React, { useState, useEffect, useCallback } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { DashboardParameter, DashboardFilters as FiltersType } from '@/types/dashboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Filter, RotateCcw, Play } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface DashboardFiltersProps {
  className?: string
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({ className = '' }) => {
  const { dashboard, parameters, updateParameters, resetParameters } = useDashboard()
  const [localFilters, setLocalFilters] = useState<FiltersType>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Sync local filters with context
  useEffect(() => {
    setLocalFilters(parameters)
    setHasChanges(false)
  }, [parameters])

  // Auto-apply filters with debounce
  useEffect(() => {
    if (!dashboard?.auto_apply_filters) return

    const timeout = setTimeout(() => {
      if (hasChanges) {
        updateParameters(localFilters)
      }
    }, 600) // 600ms debounce

    return () => clearTimeout(timeout)
  }, [localFilters, hasChanges, dashboard?.auto_apply_filters, updateParameters])

  const handleFilterChange = useCallback((parameterSlug: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [parameterSlug]: value
    }))
    setHasChanges(true)
  }, [])

  const handleApplyFilters = useCallback(() => {
    updateParameters(localFilters)
    setHasChanges(false)
  }, [localFilters, updateParameters])

  const handleResetFilters = useCallback(() => {
    resetParameters()
  }, [resetParameters])

  const renderParameterInput = (parameter: DashboardParameter) => {
    const value = localFilters[parameter.slug]
    
    switch (parameter.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFilterChange(parameter.slug, e.target.value)}
            placeholder={parameter.label}
            className="crypto-input"
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleFilterChange(parameter.slug, e.target.value ? Number(e.target.value) : null)}
            placeholder={parameter.label}
            className="crypto-input"
          />
        )
      
      case 'select':
        return (
          <Select 
            value={value || ''} 
            onValueChange={(newValue) => handleFilterChange(parameter.slug, newValue)}
          >
            <SelectTrigger className="crypto-input">
              <SelectValue placeholder={parameter.label} />
            </SelectTrigger>
            <SelectContent>
              {parameter.values?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'category':
        return (
          <Select 
            value={value || ''} 
            onValueChange={(newValue) => handleFilterChange(parameter.slug, newValue)}
          >
            <SelectTrigger className="crypto-input">
              <SelectValue placeholder={parameter.label} />
            </SelectTrigger>
            <SelectContent>
              {parameter.values?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="crypto-input justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : parameter.label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleFilterChange(parameter.slug, date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )
      
      default:
        return null
    }
  }

  if (!dashboard?.parameters?.length) {
    return null
  }

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== null && value !== undefined && value !== ''
  )

  return (
    <div className={`dashboard-filters crypto-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filtros do Dashboard</h3>
          {dashboard.auto_apply_filters && (
            <Badge variant="secondary" className="text-xs">
              Auto-apply
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
          
          {!dashboard.auto_apply_filters && hasChanges && (
            <Button
              size="sm"
              onClick={handleApplyFilters}
              className="neon-button"
            >
              <Play className="w-4 h-4 mr-1" />
              Apply
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {dashboard.parameters.map((parameter) => (
          <div key={parameter.id} className="space-y-2">
            <Label htmlFor={parameter.slug} className="text-sm font-medium">
              {parameter.label}
            </Label>
            {renderParameterInput(parameter)}
          </div>
        ))}
      </div>
      
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(localFilters).map(([key, value]) => {
                if (!value) return null
                const param = dashboard.parameters.find(p => p.slug === key)
                return (
                  <Badge key={key} variant="outline" className="text-xs">
                    {param?.label}: {String(value)}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}