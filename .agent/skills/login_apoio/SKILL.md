---
name: login_apoio
description: Sistema de autenticação, registro e segurança de acesso do Gestor GN.
tags: [auth, login, password, security, registration]
---

# 🔐 Skill: Login Apoio (Gestor GN)

Este documento descreve o funcionamento técnico e os processos de negócio da camada de autenticação do **Gestor GN**. O sistema utiliza um fluxo de autenticação customizado, integrando **React**, **Supabase** e persistência local, seguindo as diretrizes visuais da `design_apoio`.

## 🏗️ Arquitetura de Autenticação

O sistema de login é centralizado na `LoginView.tsx` e gerenciado pelo estado `isAuthenticated` na raiz da aplicação (`App.tsx`).

### 1. Fluxo de Entrada (Login)
O login não utiliza provedores externos (como Clerk). O processo segue estas etapas:
- **Identificação**: O e-mail é normalizado (`trim` e `toLowerCase`).
- **Validação de Acesso**: O sistema verifica a flag `allowed`. Se `false`, o acesso é bloqueado mesmo com senha correta.
- **Verificação de Senha**: Comparação direta entre a senha fornecida e a armazenada (encriptação futura via Supabase Edge Functions).
- **Troca Obrigatória**: Se `requiresPasswordChange` for `true`, o usuário é redirecionado para o modal de troca de senha antes de acessar o Dashboard.

### 2. Registro de Novos Usuários
Qualquer pessoa pode solicitar um cadastro através da tela de login.
- **Status Inicial**: Novos usuários são criados com `allowed: false` e `role: 'Usuario'`.
- **Fluxo de Aprovação**: Somente um **Gestor** pode visualizar e liberar o acesso na `ConfigurationView`.
- **Notificação**: O sistema exibe um alerta informando que um gestor precisa liberar o acesso.

## 🔑 Gestão de Senhas

### Alteração e Reset
Não existe um botão automático de "Esqueci minha senha" para evitar abusos. 
- **Reset Manual**: Deve ser solicitado diretamente a um Gestor. O Gestor redefine a senha na área administrativa e marca o usuário com `requiresPasswordChange: true`.
- **Senha Temporária**: Ao logar com uma senha resetada, o usuário visualiza o modal de **Alteração Obrigatória**, garantindo que ele defina sua própria senha privada.

## ✨ Interface & Experience (Design Apoio)

A `LoginView` utiliza o ápice do sistema de design premium:
- **BG Dinâmico**: Gradientes animados (`animate-pulse`) e cores da paleta Apoio (`--ice-blue`, `--primary-blue`, `--deep-blue`).
- **Glassmorphism**: O formulário é um `.glass-card` com blur intensivo e bordas sutis.
- **Micro-interações**: Feedback de `isLoading` nos botões e animações de entrada (`animate-slide-up`).

## 🛠️ Guia do Desenvolvedor

### Adicionando Usuários Iniciais
Para adicionar usuários que já nascem com acesso (admins/diretoria), edite `constants.ts`:

```typescript
export const INITIAL_USERS: User[] = [
  { 
    name: 'Nome', 
    email: 'email@empresa.com', 
    role: 'Gestor', 
    allowed: true, 
    area: 'Diretoria' 
  },
  // ...
];
```

### Hooks e Funções Chave
| Local | Função | Descrição |
|-------|--------|-----------|
| `LoginView.tsx` | `handleSubmit` | Processa validação de e-mail e senha. |
| `LoginView.tsx` | `handleRegister` | Cria payload para nova solicitação de acesso. |
| `App.tsx` | `onForcePasswordChange` | Atualiza a senha no banco e limpa a flag de troca obrigatória. |

## 🚫 Regras de Segurança
- **Purple Ban**: Proibido uso de roxo/violeta em alertas de erro; usar `rose-500` (Erro) ou `amber-500` (Aviso).
- **Regex**: Validação rigorosa de e-mail corporativo no frontend.
- **Lockdown**: Nenhuma função do sistema (Premissas, Due Diligence, etc) é montada se `isAuthenticated` for `false`.
