import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { kv } from '@vercel/kv'
import { authSupabase, gameAdmin } from '@/lib/supabase'

export const runtime = 'edge'
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
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const channel = crypto.randomUUID()
    const serverData = {
      channel,
      variables: body.variables || {},
      owner: body.username || 'anon'
    }
    await kv.set(`lobby:${code}`, JSON.stringify(serverData), { ex: 7200 }) // 2 horas
    return c.json({ code, ...serverData })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// POST /api/lobby/update
app.post('/lobby/update', async (c) => {
  try {
    const { code, variables } = await c.req.json()
    const existing = await kv.get(`lobby:${code.toUpperCase()}`)
    if (!existing) return c.json({ error: 'Servidor não encontrado' }, 404)
    
    const serverData = typeof existing === 'string' ? JSON.parse(existing) : existing
    serverData.variables = { ...serverData.variables, ...variables }
    
    await kv.set(`lobby:${code.toUpperCase()}`, JSON.stringify(serverData), { ex: 7200 })
    return c.json({ success: true, variables: serverData.variables })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// GET /api/lobby/join/:code
app.get('/lobby/join/:code', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const data = await kv.get(`lobby:${code}`)
    if (!data) return c.json({ error: 'Servidor expirado ou inexistente' }, 404)
    
    const serverData = typeof data === 'string' ? JSON.parse(data) : data
    return c.json(serverData)
  } catch (err: any) {
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
