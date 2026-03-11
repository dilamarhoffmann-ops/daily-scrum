# Fluxograma de Autenticação - Gestor GN

O diagrama abaixo descreve o ciclo de vida de um usuário e as verificações de segurança realizadas durante o processo de login.

## 🔄 Ciclo de Vida do Usuário

1. **CADASTRO (Registro)**
   - Usuário preenche dados.
   - Criado com `allowed: false` (Bloqueado).
   - Armazenado no Supabase / LocalStorage.

2. **LIBERAÇÃO (Gestor)**
   - Gestor acessa "Configurações".
   - Ativa `allowed: true`.
   - Se necessário, atribui Cargo/Área.

3. **PRIMEIRO LOGIN**
   - Sistema valida credenciais.
   - Verifica se `allowed == true`.
   - Se `requiresPasswordChange == true`, obriga definição de nova senha pessoal.

## 🛡️ Checks de Segurança (Pseudo-code)

```typescript
function loginWorkflow(credentials) {
  const user = findUser(credentials.email);
  
  if (!user) throw Error("E-mail não encontrado");
  
  if (user.password !== credentials.password) throw Error("Senha inválida");
  
  if (!user.allowed) {
    return { status: "BLOCKED", message: "Aguardando liberação do Gestor" };
  }
  
  if (user.requiresPasswordChange) {
    return { status: "REQUIRE_RESET", nextStep: "ModalForceChange" };
  }
  
  return { status: "SUCCESS", user };
}
```

## 🎨 Estados Visuais de Feedback

- **Bloqueado**: Modal vermelho com ícone de cadeado (`ShieldCheck` da Lucide).
- **Sucesso**: Transição suave para o Dashboard via `onLogin`.
- **Aprovação**: Toast informativo verde após solicitação de cadastro.
