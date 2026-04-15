'use client';
import { useEffect, useState } from 'react';
import { authSupabase } from '@/lib/supabase';
import { Layout, Gamepad2, Users, Save, LogOut, Key, Loader2, Plus, ShieldCheck, Server, ChevronRight, Activity, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Lobbies Management
  const [userLobbies, setUserLobbies] = useState<any[]>([]);
  const [activeLobby, setActiveLobby] = useState<any>(null);
  const [localVariables, setLocalVariables] = useState<Record<string, string>>({});
  
  // Login States
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authError, setAuthError] = useState('');

  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('hub_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchLobbies(userData.username);
    }
    setLoading(false);
  }, []);

  const fetchLobbies = async (username: string) => {
    try {
      const res = await fetch('/api/lobby/list', {
        method: 'POST',
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      const lobbies = Array.isArray(data) ? data : [];
      setUserLobbies(lobbies);
      
      // Select first lobby if none active
      if (lobbies.length > 0 && !activeLobby) {
        selectLobby(lobbies[0]);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const selectLobby = (lobby: any) => {
    setActiveLobby(lobby);
    setLocalVariables(lobby.variables || {});
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
        const userData = { ...data, email: data.username };
        localStorage.setItem('hub_user', JSON.stringify(userData));
        setUser(userData);
        fetchLobbies(data.username);
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
    setUserLobbies([]);
    setActiveLobby(null);
  };

  const createLobby = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/lobby/create', { 
        method: 'POST',
        body: JSON.stringify({ username: user.username, variables: {} })
      });
      const data = await res.json();
      if (data.code) {
        await fetchLobbies(user.username);
        selectLobby(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const addVariable = () => {
    if (!newVarName) return;
    const next = { ...localVariables, [newVarName]: newVarValue };
    setLocalVariables(next);
    setNewVarName('');
    setNewVarValue('');
    syncVariables(next);
  };

  const removeVariable = (key: string) => {
    const next = { ...localVariables };
    delete next[key];
    setLocalVariables(next);
    syncVariables(next);
  };

  const syncVariables = async (vars = localVariables) => {
    if (!activeLobby) return;
    setIsSyncing(true);
    try {
      await fetch('/api/lobby/update', {
        method: 'POST',
        body: JSON.stringify({ code: activeLobby.code, variables: vars })
      });
      // Refresh list to keep data in sync
      fetchLobbies(user.username);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
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
                <div className="flex items-center gap-1 justify-end">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                   <p className="text-[10px] text-blue-400 uppercase tracking-wider">Online</p>
                </div>
              </div>
              <button onClick={handleLogout} 
                      className="p-3 hover:bg-red-500/20 rounded-xl text-red-400 transition-all border border-transparent hover:border-red-500/30">
                <LogOut size={20} />
              </button>
            </div>
          )}
        </header>

        {user ? (
          <div className="grid md:grid-cols-12 gap-8">
            {/* Sidebar: Lobbies List */}
            <section className="md:col-span-4 space-y-6">
                <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Server size={14} /> Meus Servidores
                        </h2>
                        <button onClick={createLobby} disabled={isCreating} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all">
                            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                        {userLobbies.length > 0 ? userLobbies.map((lobby) => (
                            <button 
                                key={lobby.code}
                                onClick={() => selectLobby(lobby)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center group ${
                                    activeLobby?.code === lobby.code 
                                    ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                }`}
                            >
                                <div className="space-y-1">
                                    <p className="text-lg font-black tracking-tight">{lobby.code}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">{Object.keys(lobby.variables || {}).length} variáveis</p>
                                </div>
                                <ChevronRight size={16} className={`transition-transform ${activeLobby?.code === lobby.code ? 'text-blue-400 translate-x-0' : 'text-gray-600 -translate-x-2'}`} />
                            </button>
                        )) : (
                            <div className="text-center py-10 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                                <p className="text-xs uppercase font-bold">Nenhum servidor</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content: Selected Lobby Management */}
            <section className="md:col-span-8">
              {activeLobby ? (
                  <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Activity size={120} />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10">
                          <div className="space-y-1">
                              <p className="text-[10px] text-blue-400 uppercase tracking-[0.3em] font-bold">Servidor Selecionado</p>
                              <h2 className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">{activeLobby.code}</h2>
                          </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6 relative z-10">
                          <div className="flex justify-between items-center">
                              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                  Configurações de Tempo Real
                                  {isSyncing ? <Loader2 className="animate-spin text-blue-400" size={14} /> : <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>}
                              </h3>
                          </div>

                          <div className="grid gap-3">
                              {Object.entries(localVariables).map(([k, v]) => (
                                <div key={k} className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-blue-500/20 transition-all">
                                  <div className="w-1/3">
                                      <p className="text-[10px] text-blue-400 uppercase font-bold mb-0.5">Nome</p>
                                      <p className="text-sm font-mono text-white truncate">{k}</p>
                                  </div>
                                  <div className="flex-1">
                                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Valor Atual</p>
                                      <input 
                                        value={v} 
                                        onChange={(e) => {
                                          const next = { ...localVariables, [k]: e.target.value };
                                          setLocalVariables(next);
                                        }}
                                        onBlur={() => syncVariables()}
                                        className="bg-transparent border-none text-sm w-full outline-none text-white focus:text-blue-300 transition-colors"
                                      />
                                  </div>
                                  <button onClick={() => removeVariable(k)} className="p-2 text-red-500/40 hover:text-red-500 transition-colors">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              ))}
                          </div>

                          <div className="pt-4 space-y-4">
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest ml-1">Adicionar Nova Variável</p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                    placeholder="Nome (ex: playerX)" 
                                    value={newVarName} 
                                    onChange={e => setNewVarName(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm flex-1 outline-none focus:border-blue-500/50 transition-all"
                                />
                                <input 
                                    placeholder="Valor Inicial" 
                                    value={newVarValue} 
                                    onChange={e => setNewVarValue(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm flex-1 outline-none focus:border-blue-500/50 transition-all"
                                />
                                <button onClick={addVariable} className="p-4 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                                    <Plus size={20} />
                                </button>
                              </div>
                          </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-widest pt-4 px-2">
                          <p>ID do Canal: {activeLobby.channel}</p>
                          <p>Criado em: {new Date(activeLobby.createdAt).toLocaleDateString()}</p>
                      </div>
                  </div>
              ) : (
                  <div className="h-full flex items-center justify-center glass rounded-[2.5rem] border border-white/5 min-h-[400px]">
                      <div className="text-center space-y-4 max-w-xs opacity-40">
                          <Server size={64} className="mx-auto" />
                          <p className="text-sm font-bold uppercase tracking-widest">Selecione ou crie um servidor para começar</p>
                      </div>
                  </div>
              )}
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
