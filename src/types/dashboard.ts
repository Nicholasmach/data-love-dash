// Dashboard Builder Types - Metabase inspired
export interface DashboardParameter {
  id: string
  slug: string
  type: 'text' | 'number' | 'date' | 'select' | 'category'
  label: string
  default?: any
  values?: string[]
  semantic?: string
}

export interface ParameterMapping {
  [parameterSlug: string]: string // Maps parameter slug to field/variable name
}

export interface GridPosition {
  col: number      // Grid column (0-11)
  row: number      // Grid row
  sizeX: number    // Width in grid units
  sizeY: number    // Height in grid units
}

export interface DashboardCard {
  id: string
  dashboard_id: string
  card_id: string
  
  // Grid layout
  col: number
  row: number
  size_x: number
  size_y: number
  
  // Configuration
  parameter_mappings: ParameterMapping
  visualization_settings_override?: any
  series?: number
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  name: string
  description?: string
  display: 'table' | 'scalar' | 'line' | 'bar' | 'area' | 'pie' | 'composed'
  dataset_query: {
    type: 'native' | 'query'
    native?: {
      query: string
      template_tags?: Record<string, any>
    }
    query?: any // MBQL-like structure
  }
  visualization_settings: any
  collection_id?: string
  archived: boolean
  cache_ttl?: number
  created_at: string
  updated_at: string
}

export interface Dashboard {
  id: string
  name: string
  description?: string
  parameters: DashboardParameter[]
  auto_apply_filters: boolean
  cache_ttl?: number
  refresh_interval_sec?: number
  archived: boolean
  
  // Populated data
  cards: (DashboardCard & { card: Card })[]
  
  created_at: string
  updated_at: string
}

export interface DashboardFilters {
  [parameterSlug: string]: any
}

// Frontend specific types
export interface GridItem extends GridPosition {
  i: string // item id
  isDraggable?: boolean
  isResizable?: boolean
  static?: boolean
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
}

export interface DashboardState {
  dashboard: Dashboard | null
  parameters: DashboardFilters
  layout: GridItem[]
  isEditing: boolean
  isDirty: boolean
}

// Chart data types
export interface ChartData {
  [key: string]: any
}

export interface QueryResult {
  data: ChartData[]
  columns: string[]
  rows_affected?: number
  execution_time_ms?: number
  cached?: boolean
}

// Cache related
export interface CacheStatus {
  cached: boolean
  cache_key: string
  ttl_seconds?: number
  expires_at?: string
}