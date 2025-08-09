import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export const AuthPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Brand - IMPROVED */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 crypto-gradient rounded-2xl flex items-center justify-center mx-auto shadow-neon">
            <BarChart3 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="brand-title text-4xl">
            Nalk
          </h1>
          <p className="helper-text text-lg">
            Plataforma de analytics e integração de dados
          </p>
        </div>

        {/* Auth Card - IMPROVED with exact padding */}
        <Card className="auth-card">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="metric-title text-2xl">Bem-vindo</CardTitle>
            <CardDescription className="helper-text text-base">
              Faça login ou crie sua conta para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(64 99% 58%)', // --primary
                      brandAccent: 'hsl(64 95% 50%)', 
                      brandButtonText: 'hsl(202 10% 18%)', // --primary-foreground
                      defaultButtonBackground: 'hsl(var(--secondary))',
                      defaultButtonBackgroundHover: 'hsl(var(--secondary))',
                      defaultButtonBorder: 'hsl(var(--border))',
                      defaultButtonText: 'hsl(var(--secondary-foreground))',
                      dividerBackground: 'hsl(var(--border))',
                      inputBackground: 'hsl(var(--background))',
                      inputBorder: 'hsl(var(--border))',
                      inputBorderHover: 'hsl(var(--primary))',
                      inputBorderFocus: 'hsl(var(--primary))',
                      inputText: 'hsl(var(--foreground))',
                      inputLabelText: 'hsl(var(--foreground))',
                      inputPlaceholder: 'hsl(var(--muted-foreground))',
                      messageText: 'hsl(var(--muted-foreground))',
                      messageTextDanger: 'hsl(var(--destructive))',
                      anchorTextColor: 'hsl(var(--primary))',
                      anchorTextHoverColor: 'hsl(var(--primary))',
                    },
                    space: {
                      spaceSmall: '4px',
                      spaceMedium: '8px',
                      spaceLarge: '16px',
                      labelBottomMargin: '8px',
                      anchorBottomMargin: '4px',
                      emailInputSpacing: '4px',
                      socialAuthSpacing: '4px',
                      buttonPadding: '12px 16px',
                      inputPadding: '12px 16px',
                    },
                    fontSizes: {
                      baseBodySize: '14px',
                      baseInputSize: '14px',
                      baseLabelSize: '14px',
                      baseButtonSize: '14px',
                    },
                    fonts: {
                      bodyFontFamily: `'Gantari', system-ui, sans-serif`,
                      buttonFontFamily: `'Gantari', system-ui, sans-serif`,
                      inputFontFamily: `'Gantari', system-ui, sans-serif`,
                      labelFontFamily: `'Gantari', system-ui, sans-serif`,
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '8px',
                      buttonBorderRadius: '8px',
                      inputBorderRadius: '8px',
                    },
                  },
                },
                className: {
                  anchor: 'text-primary hover:text-primary/80 font-medium',
                  button: 'nalk-gradient text-primary-foreground font-medium hover:opacity-90 transition-opacity',
                  container: 'space-y-4',
                  divider: 'border-border',
                  input: 'bg-background border-input text-foreground font-sans focus:border-primary focus:ring-1 focus:ring-primary',
                  label: 'text-foreground font-medium font-sans',
                  loader: 'text-primary',
                  message: 'text-muted-foreground font-sans',
                }
              }}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'E-mail',
                    password_label: 'Senha',
                    email_input_placeholder: 'Seu e-mail',
                    password_input_placeholder: 'Sua senha',
                    button_label: 'Entrar',
                    loading_button_label: 'Entrando...',
                    social_provider_text: 'Entrar com {{provider}}',
                    link_text: 'Já tem uma conta? Entre aqui'
                  },
                  sign_up: {
                    email_label: 'E-mail',
                    password_label: 'Senha',
                    email_input_placeholder: 'Seu e-mail',
                    password_input_placeholder: 'Sua senha',
                    button_label: 'Criar conta',
                    loading_button_label: 'Criando conta...',
                    social_provider_text: 'Cadastrar-se com {{provider}}',
                    link_text: 'Não tem uma conta? Cadastre-se',
                    confirmation_text: 'Verifique seu e-mail para confirmar sua conta'
                  },
                  magic_link: {
                    email_input_placeholder: 'Seu e-mail',
                    button_label: 'Enviar link mágico',
                    loading_button_label: 'Enviando link mágico...',
                    link_text: 'Enviar um link mágico por e-mail',
                    confirmation_text: 'Verifique seu e-mail para o link mágico'
                  },
                  forgotten_password: {
                    email_label: 'E-mail',
                    password_label: 'Senha',
                    email_input_placeholder: 'Seu e-mail',
                    button_label: 'Enviar instruções',
                    loading_button_label: 'Enviando instruções...',
                    link_text: 'Esqueceu sua senha?',
                    confirmation_text: 'Verifique seu e-mail para instruções de redefinição de senha'
                  },
                  update_password: {
                    password_label: 'Nova senha',
                    password_input_placeholder: 'Sua nova senha',
                    button_label: 'Atualizar senha',
                    loading_button_label: 'Atualizando senha...',
                    confirmation_text: 'Sua senha foi atualizada'
                  },
                  verify_otp: {
                    email_input_placeholder: 'Seu e-mail',
                    phone_input_placeholder: 'Seu telefone',
                    token_input_placeholder: 'Seu token',
                    button_label: 'Verificar token',
                    loading_button_label: 'Verificando...',
                  }
                }
              }}
              providers={[]}
              redirectTo={`${window.location.origin}/analytics`}
            />
          </CardContent>
        </Card>

        <div className="text-center helper-text text-sm">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-primary hover:text-primary/80 transition-colors">
            Termos de Serviço
          </a>{' '}
          e{' '}
          <a href="#" className="text-primary hover:text-primary/80 transition-colors">
            Política de Privacidade
          </a>
        </div>
      </div>
    </div>
  )
}