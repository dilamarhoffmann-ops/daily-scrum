---
name: design_apoio
description: Sistema de design global para o projeto Gestor GN. Contém paleta de cores, tipografia, componentes visuais e animações.
tags: [design, ui, ux, theme, colors, premium]
---

# Design Apoio (Gestor GN)

Este documento define a autoridade visual e o sistema de design para a aplicação **Gestor GN**. Toda e qualquer alteração na interface deve seguir rigorosamente estas definições para manter a consistência e o aspecto premium da plataforma.

## 🎨 Paleta de Cores (The "Apoio" Palette)

O projeto utiliza tons frios e profissionais, focados em confiança e clareza, com acentos vibrantes para destaque.

| Token | Descrição | Valor |
|-------|-----------|-------|
| `--deep-navy` | Base escura principal (Sidebar) | `#021024` |
| `--deep-blue` | Azul profundo secundário | `#052659` |
| `--primary` | Azul marca principal | `#5483B3` |
| `--light-blue` | Azul suave para bordas/elementos | `#7DA0CA` |
| `--ice-blue` | Fundo claro e contrastes | `#C1E8FF` |
| `--accent-orange` | Cor de destaque/ação | `#f59e0b` |

## 📐 Tipografia

- **Fonte**: `'Inter', sans-serif` (Google Fonts).
- **Peso Base**: `Medium (500)`.
- **Cabeçalhos**: `Bold (700)` ou `Black (900)` para títulos principais.
- **Espaçamento**: Usar `tracking-tight` em títulos e `tracking-widest` em labels de formulários caps.

## ✨ Elementos Visuais "Premium"

### 🛡️ Glassmorphism
Usado em modais e cards flutuantes.
- **Blur**: `12px` a `24px`.
- **Borda**: `1px solid rgba(255, 255, 255, 0.2)`.
- **Sombra**: `shadow-2xl` com opacidade reduzida.

### 🔘 Botões e Interação
- **Raio**: `rounded-xl` (12px) ou `rounded-2xl` (16px).
- **Hover**: Efeito `lift` (translateY(-2px)) e `glow` suave.
- **Transição**: `cubic-bezier(0.4, 0, 0.2, 1)`.

## 📂 Recursos Técnicos

A implementação CSS bruta está localizada em `resources/global.css`.

### Classes Principais
- `.glass-card`: Card com efeito de vidro.
- `.premium-input`: Input estilizado com foco suave.
- `.btn-premium`: Estilizador base para botões da marca.
- `.animate-slide-up`: Animação de entrada suave vinda de baixo.

## 🚫 Regras Proibitivas (Purple Ban)
- **Não usar tons de violeta/roxo** a menos que solicitado explicitamente.
- **Evitar bordas secas**; usar sempre arredondamento suave.
- **Evitar sombras pretas pesadas**; usar sombras coloridas suaves (ex: azul marinho com transparência).
