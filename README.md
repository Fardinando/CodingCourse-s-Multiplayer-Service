# 🎮 CodingCourse Multiplayer Service

O **CodingCourse Multiplayer Service** é uma infraestrutura de backend de alto desempenho projetada para transformar jogos single-player em experiências multiplayer em tempo real. Utilizando uma arquitetura híbrida de Redis e Supabase, o sistema permite que alunos gerenciem múltiplos servidores de jogo de forma intuitiva.

🚀 **Acesse o Dashboard:** [codingcms.vercel.app](https://codingcms.vercel.app)

---

## ✨ Funcionalidades

- **Gerenciador de Lobbies**: Crie, monitore e delete múltiplos servidores de jogo simultaneamente.
- **Sincronização Real-Time**: Variáveis de estado (HP, posição, inventário) sincronizadas via Redis.
- **Login Integrado**: Autenticação segura via tabela `students` do Supabase.
- **API REST**: Endpoints simplificados para fácil integração com qualquer motor de jogo (Unity, Godot, Construct, JS Puro).
- **Manual do Aluno**: Tutorial interativo incluso no repositório.

## 🛠️ Tecnologias

- **Framework**: [Next.js 14](https://nextjs.org/)
- **API Engine**: [Hono.js](https://hono.dev/)
- **Real-Time Storage**: [Redis (ioredis)](https://redis.io/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Estética**: Tailwind CSS com Glassmorphism.

## 🚀 Como Configurar (Deploy)

Para rodar sua própria instância deste serviço no Vercel, você precisará configurar as seguintes variáveis de ambiente:

### Supabase (Banco A - Auth/Alunos)
- `NEXT_PUBLIC_AUTH_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY`: Chave Anon do projeto.

### Redis (Multiplayer)
- `REDIS_URL`: URL de conexão TCP (Redis Marketplace ou Upstash).

### Segurança
- `GAME_SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço para bypass de RLS em operações administrativas.

## 📚 Documentação e Tutorial

O repositório conta com guias detalhados para alunos e desenvolvedores:

- [📄 Tutorial de Integração](./TUTORIAL_MULTIPLAYER.html): Passo a passo de como conectar seu jogo ao Hub.
- [📝 Guia Técnico](./DOCUMENTACAO_HUB.html): Referência completa da API para desenvolvedores sêniores.

## 🔌 Exemplo Rápido de Uso (API)

**Conectar a uma sala:**
```javascript
fetch('https://codingcms.vercel.app/api/lobby/join/CODIGO_SALA')
  .then(res => res.json())
  .then(data => console.log(data.variables));
```

---

Desenvolvido para o ecossistema **CodingCourse**. Transformando código em universos.
