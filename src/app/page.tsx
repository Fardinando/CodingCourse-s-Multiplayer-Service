'use client';
import { useEffect, useState } from 'react';
import { authSupabase } from '@/lib/supabase';
import { Layout, Gamepad2, Users, Save, LogOut, Key, Loader2, Plus } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lobbyCode, setLobbyCode] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    authSupabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session) fetchGames(session.access_token);
      setLoading(false);
    });
  }, []);

  const fetchGames = async (token: string) => {
    try {
      const res = await fetch('/api/games/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
    }
  };

  const createLobby = async () => {
    const res = await fetch('/api/lobby/create', { 
      method: 'POST',
      body: JSON.stringify({ username: user?.email, variables })
    });
    const data = await res.json();
    setLobbyCode(data.code);
  };

  const addVariable = () => {
    if (!newVarName) return;
    setVariables(prev => ({ ...prev, [newVarName]: newVarValue }));
    setNewVarName('');
    setNewVarValue('');
  };

  const removeVariable = (key: string) => {
    const next = { ...variables };
    delete next[key];
    setVariables(next);
  };

  const syncVariables = async () => {
    if (!lobbyCode) return;
    setIsSyncing(true);
    await fetch('/api/lobby/update', {
      method: 'POST',
      body: JSON.stringify({ code: lobbyCode, variables })
    });
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleLogin = async () => {
    window.location.href = 'https://codingcourse-livid.vercel.app/login';
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#09090b] text-blue-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <header className="flex justify-between items-center glass p-6 rounded-2xl border border-white/10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
              <Gamepad2 /> Multiplayer Hub
            </h1>
            <p className="text-gray-400 text-sm">Powered by CodingCourse Auth</p>
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{user.email}</span>
              <button onClick={() => authSupabase.auth.signOut().then(() => window.location.reload())} 
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20">
              Fazer Login
            </button>
          )}
        </header>

        {user ? (
          <div className="grid md:grid-cols-2 gap-8">
              <section className="glass p-8 rounded-3xl space-y-6 border border-white/5">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="text-blue-400" /> Servidor Multiplayer</h2>
                
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                  {lobbyCode ? (
                    <div className="space-y-4 text-center">
                      <div className="space-y-1">
                        <p className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-bold">Código Secreto do Servidor</p>
                        <p className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">{lobbyCode}</p>
                      </div>
                      
                      <div className="border-t border-white/10 pt-4 space-y-4 text-left">
                        <h3 className="text-sm font-bold text-gray-400 flex justify-between items-center">
                          VARIÁVEIS DO SERVIDOR
                          {isSyncing ? <Loader2 className="animate-spin" size={14} /> : <span className="text-[10px] text-green-500">SINCRONIZADO</span>}
                        </h3>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {Object.entries(variables).map(([k, v]) => (
                            <div key={k} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/5 group">
                              <span className="text-xs font-mono text-blue-300 w-1/3 truncate">{k}</span>
                              <input 
                                value={v} 
                                onChange={(e) => {
                                  setVariables(prev => ({ ...prev, [k]: e.target.value }));
                                }}
                                onBlur={syncVariables}
                                className="bg-transparent border-none text-xs flex-1 outline-none focus:text-white"
                              />
                              <button onClick={() => removeVariable(k)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                                <Plus size={14} className="rotate-45" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <input 
                            placeholder="Nome (ex: playerX)" 
                            value={newVarName} 
                            onChange={e => setNewVarName(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs flex-1 outline-none focus:border-blue-500/50"
                          />
                          <button onClick={addVariable} className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 py-4">
                      <div className="text-center space-y-2">
                        <p className="text-gray-400 text-sm">Crie um servidor para habilitar o multiplayer no seu jogo.</p>
                      </div>
                      <button onClick={createLobby} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-xl shadow-blue-600/30">
                        ATIVAR MEU SUBSERVIDOR
                      </button>
                    </div>
                  )}
                </div>
              </section>

            <section className="glass p-8 rounded-3xl space-y-6 border border-white/5">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Save className="text-purple-400" /> Seus Jogos Salvos</h2>
              <div className="space-y-4">
                {games.length > 0 ? games.map((game, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
                    <div>
                      <p className="font-medium">{game.game_name}</p>
                      <p className="text-xs text-gray-500">{new Date(game.updated_at).toLocaleDateString()}</p>
                    </div>
                    <button className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">Carregar</button>
                  </div>
                )) : (
                  <div className="text-center py-10 text-gray-500">Nenhum jogo salvo no Supabase B</div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-32 glass rounded-3xl space-y-4 border border-white/5">
            <Key className="mx-auto text-blue-500" size={48} />
            <h2 className="text-2xl font-bold">Acesso Restrito</h2>
            <p className="text-gray-400">Você precisa estar logado no <b>CodingCourse</b> para acessar o Hub.</p>
          </div>
        )}
      </div>
    </div>
  );
}
