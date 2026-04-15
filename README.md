# 🎮 CodingCourse Multiplayer Service

O **CodingCourse Multiplayer Service** é uma infraestrutura de backend de alto desempenho projetada para transformar jogos single-player em experiências multiplayer em tempo real. Este sistema permite que alunos criem e gerenciem múltiplos servidores de jogo de forma intuitiva através do dashboard [codingcms.vercel.app](https://codingcms.vercel.app).

---

## 📖 Guia de Início Rápido (Tutorial)

### Passo 1: Acesso ao Dashboard
Acesse [codingcms.vercel.app](https://codingcms.vercel.app) e faça login com suas credenciais do **CodingCourse** (Usuário e Código de Acesso). Somente alunos ativos vinculados à tabela `students` do Supabase possuem acesso.

### Passo 2: Criando seu Servidor
Na barra lateral esquerda, clique no ícone de **Plus (+)**. O sistema gerará um código único de 6 dígitos (Ex: `XJ82K1`). Este código identifica o seu servidor de jogo.

### Passo 3: Conectando seu Jogo
Use o script de conexão abaixo no seu projeto. Substitua `SEU-CÓDIGO` pelo código que você gerou no passo anterior.

```javascript
async function conectarAoMultiplayer(codigo) {
    const res = await fetch(`https://codingcms.vercel.app/api/lobby/join/${codigo}`);
    const data = await res.json();
    
    if (data.error) {
        console.error("Servidor não encontrado!");
        return;
    }

    console.log("Conectado ao canal:", data.channel);
    console.log("Variáveis atuais:", data.variables);
}
```

### Passo 4: Sincronização em Tempo Real
No Dashboard, adicione variáveis como `pos_x`, `pontuacao` ou `status`. Sempre que você alterar esses valores no Dashboard, o seu jogo poderá ler os novos valores fazendo uma chamada ao endpoint de `join`.

---

## 🛠️ Referência Técnica da API

A URL base da API é: `https://codingcms.vercel.app/api`

### 1. Entrar/Consultar Lobby
**GET** `/lobby/join/{CODE}`
Retorna o estado atual do servidor e suas variáveis.
```json
{
  "code": "X7K2B9",
  "channel": "uuid-canal",
  "variables": { "status": "online", "players": "2" },
  "owner": "username",
  "createdAt": "2024-04-15..."
}
```

### 2. Atualizar Variáveis
**POST** `/lobby/update`
Atualiza ou cria novas variáveis no Redis.
```json
{
  "code": "X7K2B9",
  "variables": { "pos_x": "100", "hp": "50" }
}
```

### 3. Listar Servidores do Aluno
**POST** `/lobby/list`
Retorna todos os lobbies ativos do usuário.
```json
{ "username": "seu_usuario" }
```

### 4. Criar Novo Servidor
**POST** `/lobby/create`
Gera um novo código e canal no Redis.
```json
{ "username": "seu_usuario", "variables": {} }
```

### 5. Deletar Servidor
**POST** `/lobby/delete`
Remove permanentemente o servidor do Redis e da lista do aluno.
```json
{ "username": "seu_usuario", "code": "X7K2B9" }
```

---

## 🤖 Prompts para Inteligência Artificial

### Prompt para Programação (ChatGPT/Claude)
> "Aja como um desenvolvedor Jedi de jogos. Use as especificações do sistema CodingCMS disponível no GitHub https://github.com/Fardinando/CodingCourse-s-Multiplayer-Service para criar um jogo onde o servidor controla a gravidade e a cor do cenário em tempo real via API. Leia o repositório para entender a estrutura de rotas e o uso do Redis."

### 🌟 O PROMPT MESTRE (Treinamento de IA)
Use o prompt abaixo se a IA tiver acesso à internet ou ao GitHub para que ela aprenda a programar usando as regras do seu sistema:

> "Sua tarefa agora é ser o desenvolvedor sênior do meu sistema Multiplayer Hub. Entre no repositório https://github.com/Fardinando/CodingCourse-s-Multiplayer-Service, leia os arquivos 'app/api/[[...route]]/route.ts' e 'lib/supabase.ts'. Entenda como o Redis (ioredis) armazena os lobbies e como a tabela 'students' do Supabase fura o login. Com base nisso, crie uma lógica de sincronização para um jogo de plataforma multiplayer usando JavaScript Fetch API."

---

## ⚙️ Configuração do Ambiente (Para Administradores)

Se você estiver clonando este repositório para deploy próprio no Vercel, configure:

- `REDIS_URL`: URL de conexão TCP do Redis.
- `NEXT_PUBLIC_AUTH_SUPABASE_URL`: URL do Supabase A (Alunos).
- `NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY`: Key Anon do Supabase A.
- `GAME_SUPABASE_SERVICE_ROLE_KEY`: Key Administrativa do Supabase B (Games).

---

Desenvolvido para o ecossistema **CodingCourse**. Transformando código em novos mundos.
