import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import Redis from 'ioredis'
import { authSupabase, gameAdmin } from '@/lib/supabase'

// Conexão Redis via TCP (compatível com a REDIS_URL do Vercel Marketplace)
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

const app = new Hono().basePath('/api')

// Habilitar CORS para alunos
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// Coletor de Erros Global
app.onError((err, c) => {
  console.error('API Error:', err.message)
  return c.json({ error: 'Erro interno', detail: err.message }, 500)
})

// Validar aluno na tabela students do Supabase A
async function validateStudent(username?: string, accessCode?: string) {
  if (!username || !accessCode) return null
  try {
    const { data, error } = await authSupabase
      .from('students')
      .select('id, username')
      .eq('username', username)
      .eq('access_code', accessCode)
      .single()
    if (error) {
      console.error('Erro students:', error.message)
      return null
    }
    return data
  } catch (e: any) {
    console.error('Falha Supabase A:', e.message)
    return null
  }
}

// POST /api/games/list
app.post('/games/list', async (c) => {
  try {
    const body = await c.req.json()
    const student = await validateStudent(body.username, body.accessCode)
    if (!student) return c.json({ error: 'Usuário ou código inválido' }, 401)

    if (gameAdmin) {
      const { data, error } = await gameAdmin
        .from('user_games')
        .select('*')
        .eq('user_id', student.id)
      if (error) return c.json({ error: error.message }, 400)
      return c.json(data || [])
    }
    return c.json([])
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// POST /api/games/save
app.post('/games/save', async (c) => {
  try {
    const body = await c.req.json()
    const student = await validateStudent(body.username, body.accessCode)
    if (!student) return c.json({ error: 'Não autorizado' }, 401)

    if (gameAdmin) {
      const { data, error } = await gameAdmin
        .from('user_games')
        .upsert({
          user_id: student.id,
          game_name: body.gameName,
          data: body.gameData,
          updated_at: new Date().toISOString()
        })
        .select()
      if (error) return c.json({ error: error.message }, 400)
      return c.json(data?.[0] || {})
    }
    return c.json({ status: 'ok' })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// POST /api/lobby/create
app.post('/lobby/create', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const username = body.username || 'anon';
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const channel = Math.random().toString(36) + '-' + Date.now();
    
    const serverData = {
      code,
      channel,
      variables: body.variables || {},
      owner: username,
      createdAt: new Date().toISOString()
    }
    
    if (!redis) return c.json({ error: "Storage driver missing" }, 500);

    // Salvar o lobby individual
    await redis.set(`lobby:${code}`, JSON.stringify(serverData), 'EX', 14400) // 4 horas
    
    // Adicionar à lista de lobbies do usuário
    await redis.sadd(`user_lobbies:${username}`, code);
    await redis.expire(`user_lobbies:${username}`, 14400);
    
    return c.json(serverData)
  } catch (err: any) {
    console.error("Lobby Create Error:", err.message);
    return c.json({ error: err.message }, 500)
  }
})

// POST /api/lobby/list
app.post('/lobby/list', async (c) => {
  try {
    if (!redis) return c.json({ error: 'Redis não configurado' }, 500);
    const { username } = await c.req.json();
    
    // Pegar todos os códigos do usuário
    const codes = await redis.smembers(`user_lobbies:${username}`);
    if (!codes || codes.length === 0) return c.json([]);
    
    // Buscar detalhes de cada um e filtrar os que já expiraram
    const lobbies = [];
    for (const code of codes) {
      const data = await redis.get(`lobby:${code}`);
      if (data) {
        lobbies.push(JSON.parse(data));
      } else {
        // Remover código expirado da lista do usuário
        await redis.srem(`user_lobbies:${username}`, code);
      }
    }
    
    return c.json(lobbies.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// POST /api/lobby/delete
app.post('/lobby/delete', async (c) => {
  try {
    if (!redis) return c.json({ error: 'Redis não configurado' }, 500);
    const { username, code } = await c.req.json();
    
    // Remover do set do usuário
    await redis.srem(`user_lobbies:${username}`, code.toUpperCase());
    
    // Deletar os dados do lobby
    await redis.del(`lobby:${code.toUpperCase()}`);
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// POST /api/lobby/update
app.post('/lobby/update', async (c) => {
  try {
    if (!redis) return c.json({ error: 'Redis não configurado' }, 500);
    const { code, variables } = await c.req.json()
    const existing = await redis.get(`lobby:${code.toUpperCase()}`)
    if (!existing) return c.json({ error: 'Servidor não encontrado' }, 404)
    
    const serverData = JSON.parse(existing)
    serverData.variables = { ...serverData.variables, ...variables }
    
    await redis.set(`lobby:${code.toUpperCase()}`, JSON.stringify(serverData), 'EX', 7200)
    return c.json({ success: true, variables: serverData.variables })
  } catch (e: any) {
    console.error("Lobby Update Error:", e.message);
    return c.json({ error: e.message }, 500)
  }
})

// GET /api/lobby/join/:code
app.get('/lobby/join/:code', async (c) => {
  try {
    if (!redis) return c.json({ error: 'Redis não configurado' }, 500);
    const code = c.req.param('code').toUpperCase()
    const data = await redis.get(`lobby:${code}`)
    if (!data) {
      console.warn(`Lobby not found: ${code}`);
      return c.json({ error: 'Servidor expirado ou inexistente' }, 404)
    }
    
    const serverData = JSON.parse(data)
    return c.json(serverData)
  } catch (err: any) {
    console.error("Lobby Join Error:", err.message);
    return c.json({ error: err.message }, 500)
  }
})

// Health check
app.get('/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }))

// EXPORTAR TODOS OS MÉTODOS HTTP
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
