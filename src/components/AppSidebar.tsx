import { Database, Settings, Users, TrendingUp, LogOut, Bot, Link, Layout } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { supabase } from '@/integrations/supabase/client'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Nalk AI", url: "/nalk-ai", icon: Bot },
  { title: "Integrações", url: "/integrations", icon: Link },
  { title: "Admin", url: "/admin", icon: Users },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { toast } = useToast()
  const currentPath = location.pathname
  const collapsed = state === 'collapsed'

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/"
    }
    return currentPath.startsWith(path)
  }
  
  const getNavClass = (isActiveRoute: boolean) => 
    isActiveRoute 
      ? "nav-active font-medium" 
      : "hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive",
      })
    }
  }

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r"
    >
      <SidebarHeader className={cn("border-b border-border transition-all duration-300", collapsed ? "p-4" : "p-6")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("bg-primary rounded-lg flex items-center justify-center shrink-0 transition-all duration-300", collapsed ? "w-8 h-8" : "w-10 h-10")}>
              <TrendingUp className={cn("text-primary-foreground transition-all duration-300", collapsed ? "w-5 h-5" : "w-6 h-6")} />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="brand-title text-2xl whitespace-nowrap">Nalk</h1>
                <p className="helper-text text-xs whitespace-nowrap">Analytics Platform</p>
              </div>
            )}
          </div>
          <SidebarTrigger className="h-6 w-6 shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-card">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-6 text-xs uppercase tracking-wider helper-text font-medium">
              Navegação
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className={cn("transition-all duration-300", collapsed ? "px-3 mt-3" : "px-3 mt-4")}>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink 
                            to={item.url} 
                            className={cn(
                              "flex items-center justify-center rounded-lg transition-all duration-300 mx-auto",
                              "w-10 h-10",
                              getNavClass(isActive(item.url))
                            )}
                          >
                            <item.icon className="w-5 h-5" />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink 
                        to={item.url} 
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300",
                          getNavClass(isActive(item.url))
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="metric-title text-sm">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("border-t border-border transition-all duration-300", collapsed ? "p-3" : "p-3")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-10 h-10 mx-auto p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Sair
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <LogOut className="w-4 h-4" />
            <span className="ml-2">Sair</span>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
