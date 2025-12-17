import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Chrome,
  ExternalLink,
  Settings,
  Plus,
  Trash2,
  Edit2,
  X,
  LogOut,
  Box
} from 'lucide-react';
import { 
  ref, 
  onValue, 
  push, 
  update, 
  remove, 
  set 
} from 'firebase/database';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';

// Import local files
import { db, auth, googleProvider, APP_ID, ADMIN_EMAIL } from './config/firebase';
import { GlassCard } from './components/GlassCard';
import { Button } from './components/Button';

export default function AppHub() {
  const [view, setView] = useState('home'); // home, login, admin
  const [apps, setApps] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Admin Form State
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', url: '', iconUrl: '', category: '' });

  // Login State
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // --- Auth Effect ---
  useEffect(() => {
    const initAuth = async () => {
      if (auth.currentUser) return;
      try {
        let signedIn = false;
        // Check Custom Token (Canvas/Local Environment fallback)
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
            signedIn = true;
          } catch (e) { console.warn("Custom token skipped:", e); }
        }
        // Fallback Anonymous
        if (!signedIn) {
          try {
            await signInAnonymously(auth);
          } catch (anonError) {
            if (anonError.code !== 'auth/admin-restricted-operation' && anonError.code !== 'auth/operation-not-allowed') {
              throw anonError;
            }
          }
        }
      } catch (error) {
        if (error.code !== 'auth/admin-restricted-operation') {
           setAuthError(`Mode Tamu Terbatas: ${error.message}`);
        }
      } finally {
        setTimeout(() => setIsLoading(false), 2000); 
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user && !user.isAnonymous && user.email === ADMIN_EMAIL) {
        setIsAuthenticated(true);
        if (view === 'login') setView('admin');
      } else {
        setIsAuthenticated(false);
        // Proteksi jika user non-admin mencoba masuk
        if (user && !user.isAnonymous && user.email !== ADMIN_EMAIL && (view === 'login' || view === 'admin')) {
            alert(`Akses ditolak. Hanya untuk ${ADMIN_EMAIL}`);
            signOut(auth).then(() => {
                setView('home');
                signInAnonymously(auth).catch(() => {}); 
            });
        }
      }
    });
    return () => unsubscribe();
  }, [view]);

  // --- Data Sync Effect ---
  useEffect(() => {
    const appsRef = ref(db, `artifacts/${APP_ID}/public/data/apps`);
    const unsubscribe = onValue(appsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedApps = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          loadedApps.push({ id: key, ...data[key] });
        });
      }
      loadedApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setApps(loadedApps);
      setIsLoading(false);
    }, (error) => {
      console.error("Database read error:", error);
      setIsLoading(false);
    });
    return () => unsubscribe(); 
  }, [firebaseUser]);

  // --- Actions ---
  const handleGoogleLogin = async () => {
    setLoginError('');
    setIsLoginLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setLoginError(`Gagal Login: ${error.message}`);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('home');
    signInAnonymously(auth).catch(() => {});
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus aplikasi ini?')) {
      try {
        const itemRef = ref(db, `artifacts/${APP_ID}/public/data/apps/${id}`);
        await remove(itemRef);
      } catch (error) {
        alert("Gagal menghapus (Cek Permission): " + error.message);
      }
    }
  };

  const handleEdit = (item) => {
    setEditingApp(item);
    setFormData(item);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 800000) { 
        alert("Gambar max 800KB!"); return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, iconUrl: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!firebaseUser) return alert("Koneksi terputus.");

    try {
      if (editingApp) {
        const itemRef = ref(db, `artifacts/${APP_ID}/public/data/apps/${editingApp.id}`);
        await update(itemRef, { ...formData });
      } else {
        const listRef = ref(db, `artifacts/${APP_ID}/public/data/apps`);
        await set(push(listRef), { ...formData, createdAt: new Date().toISOString() });
      }
      setEditingApp(null);
      setFormData({ name: '', description: '', url: '', iconUrl: '', category: '' });
    } catch (error) {
      alert("Gagal menyimpan (Cek Permission): " + error.message);
    }
  };

  // --- Views ---

  const renderHome = () => (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-16 relative">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-4 drop-shadow-sm">
          Bhavanix <span className="text-blue-600 font-light">by Haf</span>
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium opacity-80">
          Koleksi aplikasi dan proyek eksperimental yang dikurasi dengan sepenuh hati.
        </p>
      </div>

      {authError && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="flex-shrink-0 mt-0.5" />
          <p className="text-sm mt-1">{authError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((item) => (
            <GlassCard key={item.id} className="group hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md bg-white">
                    <img 
                      src={item.iconUrl || "https://via.placeholder.com/100"} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {e.target.src = 'https://placehold.co/100x100?text=App'}}
                    />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-white/50 rounded-full text-gray-600 uppercase tracking-wider">
                    {item.category || 'App'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                  {item.name}
                </h3>
                <p className="text-gray-600 mb-6 line-clamp-2 flex-grow">
                  {item.description}
                </p>
                <a href={item.url} target="_blank" rel="noreferrer" className="mt-auto w-full block">
                  <Button variant="primary" className="w-full rounded-xl py-3 group-hover:bg-blue-600/90">
                    Buka Aplikasi <ExternalLink size={16} />
                  </Button>
                </a>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {!isLoading && apps.length === 0 && (
        <div className="text-center py-20 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/30">
          <Box size={48} className="mx-auto text-gray-500 mb-4 opacity-50" />
          <p className="text-gray-600 text-lg">Belum ada aplikasi.</p>
        </div>
      )}
    </div>
  );

  const renderLogin = () => (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Admin Area</h2>
          <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 py-1 px-2 rounded-lg inline-block">
             Hanya untuk: {ADMIN_EMAIL}
          </p>
        </div>
        <div className="space-y-4">
          <Button onClick={handleGoogleLogin} variant="google" className="w-full py-3 flex items-center justify-center gap-3 text-base" disabled={isLoginLoading}>
            {isLoginLoading ? <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div> : <Chrome size={20} className="text-blue-500" />}
            {isLoginLoading ? 'Menghubungkan...' : 'Sign in with Google'}
          </Button>
          {loginError && (
            <div className="p-3 bg-red-100/50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
              {loginError}
            </div>
          )}
          <Button variant="ghost" onClick={() => setView('home')} className="w-full">Kembali ke Home</Button>
        </div>
      </GlassCard>
    </div>
  );

  const renderAdmin = () => (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Admin</h2>
          <div className="flex items-center gap-2 mt-1">
             <div className="text-xs text-green-600 font-medium flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Online
             </div>
             <span className="text-xs text-gray-400">{firebaseUser?.email}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setView('home')} variant="secondary"><Monitor size={18} /> Preview</Button>
          <Button onClick={handleLogout} variant="danger"><LogOut size={18} /> Logout</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <GlassCard className="p-6 sticky top-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              {editingApp ? <Edit2 size={20} /> : <Plus size={20} />}
              {editingApp ? 'Edit Aplikasi' : 'Tambah Aplikasi'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nama</label>
                <input required className="w-full mt-1 px-3 py-2 bg-white/50 rounded-lg border border-gray-200 outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Kategori</label>
                <input className="w-full mt-1 px-3 py-2 bg-white/50 rounded-lg border border-gray-200 outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="e.g. Productivity" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Deskripsi</label>
                <textarea required rows="3" className="w-full mt-1 px-3 py-2 bg-white/50 rounded-lg border border-gray-200 outline-none resize-none" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Icon (Upload)</label>
                <div className="flex items-center gap-4 p-3 bg-white/50 rounded-lg border border-gray-200">
                  <div className="relative w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-300">
                    {formData.iconUrl ? <img src={formData.iconUrl} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={24} /></div>}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"><Upload size={16} /> {formData.iconUrl ? 'Ganti' : 'Pilih'}</div>
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">URL</label>
                <input required className="w-full mt-1 px-3 py-2 bg-white/50 rounded-lg border border-gray-200 outline-none" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="flex-1" disabled={!firebaseUser}>{editingApp ? 'Simpan' : 'Tambah'}</Button>
                {editingApp && <Button variant="ghost" onClick={() => { setEditingApp(null); setFormData({ name: '', description: '', url: '', iconUrl: '', category: '' }); }}><X size={20} /></Button>}
              </div>
            </form>
          </GlassCard>
        </div>
        <div className="lg:col-span-2 space-y-4">
          {apps.map((item) => (
            <GlassCard key={item.id} className="p-4 flex items-center gap-4 hover:bg-white/50">
              <img src={item.iconUrl || "https://via.placeholder.com/50"} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-200" onError={(e) => {e.target.src = 'https://placehold.co/50x50?text=App'}} />
              <div className="flex-grow">
                <h4 className="font-bold text-gray-800">{item.name}</h4>
                <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={18} /></button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full relative font-sans text-gray-900 overflow-x-hidden selection:bg-blue-300 selection:text-blue-900">
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/30 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/30 blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse delay-700"></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>
      <div className="flex flex-col min-h-screen">
        <nav className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <img src="https://i.postimg.cc/28wwVRYh/Icon-Bhavanix.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-tight text-gray-800">Bhavanix</span>
          </div>
          <div>
            {isAuthenticated && view !== 'home' ? (
               <Button variant="secondary" onClick={() => setView('home')} className="text-sm py-1 px-3">Exit Admin</Button>
            ) : (
              <button onClick={() => setView(isAuthenticated ? 'admin' : 'login')} className="text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-white/30" title="Admin Area">
                <Settings size={20} />
              </button>
            )}
          </div>
        </nav>
        <main className="flex-grow flex flex-col justify-center">
          {view === 'home' && renderHome()}
          {view === 'login' && renderLogin()}
          {view === 'admin' && renderAdmin()}
        </main>
        <footer className="w-full py-8 text-center text-gray-500 text-sm bg-white/20 backdrop-blur-md border-t border-white/20 mt-auto">
          <div className="flex flex-col items-center gap-2">
            <p className="flex items-center gap-1 justify-center flex-wrap">
              Made with <span className="text-red-500 animate-pulse">❤️</span> by 
              <a href="https://www.instagram.com/luthafiyyan_/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-indigo-600 font-medium transition-colors">Luthafiyyan</a> 
              Powered by Caffeine & Good Vibes ☕✨
            </p>
          </div>
        </footer>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}
