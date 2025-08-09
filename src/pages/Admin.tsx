import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Users, Shield, Settings, Search, UserPlus, MoreVertical } from "lucide-react"
import { useState } from "react"

const Admin = () => {
  const [searchTerm, setSearchTerm] = useState("")
  
  const users = [
    {
      id: 1,
      name: "Ana Silva",
      email: "ana.silva@empresa.com",
      role: "Admin",
      status: "Ativo",
      lastLogin: "2 horas atrás",
      initials: "AS"
    },
    {
      id: 2,
      name: "Carlos Santos",
      email: "carlos.santos@empresa.com",
      role: "Editor",
      status: "Ativo",
      lastLogin: "1 dia atrás",
      initials: "CS"
    },
    {
      id: 3,
      name: "Maria Oliveira",
      email: "maria.oliveira@empresa.com",
      role: "Visualizador",
      status: "Ativo",
      lastLogin: "3 dias atrás",
      initials: "MO"
    },
    {
      id: 4,
      name: "João Ferreira",
      email: "joao.ferreira@empresa.com",
      role: "Editor",
      status: "Inativo",
      lastLogin: "1 semana atrás",
      initials: "JF"
    }
  ]

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'default'
      case 'Editor':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'text-primary'
      case 'Editor':
        return 'text-warning'
      default:
        return 'text-muted-foreground'
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="perfect-align">
        <div>
          <h1 className="metric-title text-3xl">Administração</h1>
          <p className="helper-text">
            Gerencie usuários, permissões e configurações da plataforma
          </p>
        </div>
        <Button className="neon-button">
          <UserPlus className="w-4 h-4 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      {/* IMPROVED Estatísticas */}
      <div className="compact-grid grid-cols-1 md:grid-cols-3">
        <Card className="compact-card border-border/50">
          <CardHeader className="perfect-align space-y-0 pb-2">
            <CardTitle className="helper-text text-xs font-medium">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="metric-value text-2xl">{users.length}</div>
            <p className="helper-text text-xs">
              +2 este mês
            </p>
          </CardContent>
        </Card>

        <Card className="compact-card border-border/50">
          <CardHeader className="perfect-align space-y-0 pb-2">
            <CardTitle className="helper-text text-xs font-medium">
              Usuários Ativos
            </CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="metric-value text-2xl">
              {users.filter(u => u.status === 'Ativo').length}
            </div>
            <p className="helper-text text-xs">
              nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card className="compact-card border-border/50">
          <CardHeader className="perfect-align space-y-0 pb-2">
            <CardTitle className="helper-text text-xs font-medium">
              Administradores
            </CardTitle>
            <Settings className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="metric-value text-2xl">
              {users.filter(u => u.role === 'Admin').length}
            </div>
            <p className="helper-text text-xs">
              com acesso total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* IMPROVED Busca e Filtros */}
      <Card className="compact-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="metric-title text-lg">Gerenciar Usuários</CardTitle>
          <CardDescription className="helper-text">
            Visualize e gerencie todos os usuários da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="metric-title text-sm">{user.name}</h3>
                    <p className="helper-text text-xs">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <Badge 
                      variant={getRoleBadgeVariant(user.role)}
                      className={`${getRoleColor(user.role)} text-xs px-2 py-1`}
                    >
                      {user.role}
                    </Badge>
                    <p className="helper-text text-xs mt-1">
                      {user.lastLogin}
                    </p>
                  </div>

                  <Badge 
                    variant={user.status === 'Ativo' ? 'default' : 'secondary'}
                    className={`text-xs px-2 py-1 ${user.status === 'Ativo' ? 'bg-primary/20 text-primary border-primary/30' : ''}`}
                  >
                    {user.status}
                  </Badge>

                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurações Gerais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>Permissões de Acesso</CardTitle>
            <CardDescription>
              Configure os níveis de acesso e permissões
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Administrador</h4>
                <p className="text-sm text-muted-foreground">Acesso total à plataforma</p>
              </div>
              <Badge className="bg-primary text-primary-foreground">Full Access</Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Editor</h4>
                <p className="text-sm text-muted-foreground">Pode criar e editar dashboards</p>
              </div>
              <Badge variant="secondary">Read/Write</Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Visualizador</h4>
                <p className="text-sm text-muted-foreground">Apenas visualização</p>
              </div>
              <Badge variant="outline">Read Only</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>Configurações da Plataforma</CardTitle>
            <CardDescription>
              Configurações gerais e de segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Políticas de Segurança
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Configurações Gerais
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Logs de Auditoria
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Admin