'use client';
import { useEffect, useState } from 'react';
import { authSupabase } from '@/lib/supabase';
import { Layout, Gamepad2, Users, Save, LogOut, Key, Loader2, Plus, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lobbyCode, setLobbyCode] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Login States
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check for local session first
    const savedUser = localStorage.getItem('hub_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchGames(userData.username, userData.access_code);
    }
    setLoading(false);
  }, []);

  const fetchGames = async (username: string, accessCode: string) => {
    try {
      const res = await fetch('/api/games/list', {
        method: 'POST',
        body: JSON.stringify({ username, accessCode })
      });
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
    }
  };

  const internalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    
    try {
      const { data, error } = await authSupabase
        .from('students')
        .select('*')
        .eq('username', loginUser)
        .eq('access_code', loginPass)
        .single();

      if (error || !data) {
        setAuthError('Usuário ou Código de Acesso incorretos.');
      } else {
        const userData = { ...data, email: data.username }; // Compatibility
        localStorage.setItem('hub_user', JSON.stringify(userData));
        setUser(userData);
        fetchGames(data.username, data.access_code);
      }
    } catch (err) {
      setAuthError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hub_user');
    setUser(null);
    setGames([]);
    setLobbyCode('');
  };

  const createLobby = async () => {
    const res = await fetch('/api/lobby/create', { 
      method: 'POST',
      body: JSON.stringify({ username: user?.username, variables })
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#09090b] text-blue-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <header className="flex justify-between items-center glass p-6 rounded-2xl border border-white/10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
              <Gamepad2 /> Multiplayer Hub
            </h1>
            <p className="text-gray-400 text-sm">Painel de Controle CodingCourse</p>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user.username}</p>
                <p className="text-[10px] text-blue-400 uppercase tracking-wider">Aluno Ativo</p>
              </div>
              <button onClick={handleLogout} 
                      className="p-3 hover:bg-red-500/20 rounded-xl text-red-400 transition-all border border-transparent hover:border-red-500/30">
                <LogOut size={20} />
              </button>
            </div>
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
                            className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs flex-1 outline-none focus:border-blue-500/50"
                          />
                          <button onClick={addVariable} className="p-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
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
              <h2 className="text-xl font-semibold flex items-center gap-2"><Save className="text-purple-400" /> Meus Jogos (Supabase)</h2>
              <div className="space-y-4">
                {games.length > 0 ? games.map((game, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
                    <div>
                      <p className="font-medium">{game.game_name}</p>
                      <p className="text-xs text-gray-500">{new Date(game.updated_at).toLocaleDateString()}</p>
                    </div>
                    <button className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/20">Carregar</button>
                  </div>
                )) : (
                  <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                    <Save size={32} className="opacity-20" />
                    <p>Nenhum jogo salvo encontrado.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="max-w-md mx-auto py-20 px-8 glass rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck size={120} />
            </div>
            
            <div className="text-center space-y-6 relative z-10">
              <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
                <Key className="text-blue-500" size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Bem-vindo</h2>
                <p className="text-gray-400 text-sm">Insira suas credenciais do CodingCourse</p>
              </div>

              <form onSubmit={internalLogin} className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Usuário</label>
                  <input 
                    type="text"
                    required
                    placeholder="ex: fardinando"
                    value={loginUser}
                    onChange={e => setLoginUser(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Código de Acesso</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••"
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                    />
                </div>
                
                {authError && (
                  <p className="text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center">{authError}</p>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Entrar no Hub"}
                </button>
              </form>
              
              <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-4">Sistema de Autenticação Seguro</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
