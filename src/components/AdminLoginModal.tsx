import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { X, Mail, Lock, Shield, ArrowRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cleanMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const verifyUserAccess = async (user: any): Promise<boolean> => {
    if (!user) return false;
    const uid = user.uid;
    const userEmail = user.email?.toLowerCase() || '';

    // Hardcoded whitelist safety net
    const whitelist = [
      'luiz.uehara1@gmail.com', 
      'eliasborgess@creci.org.com.br', 
      'eliasborgess@hotmail.com'
    ];
    if (userEmail && whitelist.includes(userEmail)) {
      return true;
    }

    const collections = ['admins', 'administradores', 'usuarios', 'users'];

    // 1. Check by UID document in collections
    for (const coll of collections) {
      try {
        const docRef = doc(db, coll, uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (coll === 'usuarios' || coll === 'users') {
            const perfil = data.perfil || data.role;
            if (perfil && perfil !== 'Proprietário') {
              return true;
            }
          } else {
            return true;
          }
        }
      } catch (err) {
        console.warn(`Verificação de UID falhou em ${coll} (esperado se não houver regra ou doc):`, err);
      }
    }

    // 2. Check by Email document in collections
    if (userEmail) {
      for (const coll of collections) {
        try {
          const docRef = doc(db, coll, userEmail);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            return true;
          }
        } catch (err) {
          console.warn(`Verificação de email-doc falhou em ${coll}:`, err);
        }
      }
    }

    // 3. Query by "email" == userEmail in collections
    if (userEmail) {
      for (const coll of collections) {
        try {
          const q = query(collection(db, coll), where("email", "==", userEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            if (coll === 'usuarios' || coll === 'users') {
              const data = snap.docs[0].data();
              const perfil = data.perfil || data.role;
              if (perfil && perfil !== 'Proprietário') {
                return true;
              }
            } else {
              return true;
            }
          }
        } catch (err) {
          console.warn(`Verificação por query falhou em ${coll}:`, err);
        }
      }
    }

    return false;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    cleanMessages();

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }
    if (!password) {
      setError('Por favor, digite sua senha.');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign in with Email and Password
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // 2. Verify panel access in Firestore
      const hasAccess = await verifyUserAccess(credential.user);
      
      if (hasAccess) {
        setSuccess('Acesso autorizado! Carregando painel...');
        setTimeout(() => {
          setLoading(false);
          onSuccess();
          onClose();
        }, 1200);
      } else {
        // Log out user as they are unauthorized
        await signOut(auth);
        setError('Você não tem permissão para acessar o painel administrativo.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Erro no login administrativo:', err);
      setLoading(false);
      
      // Friendly messages in Portuguese
      if (
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/user-not-found'
      ) {
        setError('E-mail ou senha inválidos. Verifique as credenciais e tente novamente.');
      } else if (err.code === 'auth/invalid-email') {
        setError('O formato do e-mail digitado é inválido.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas malsucedidas. Sua conta foi temporariamente bloqueada. Tente novamente mais tarde.');
      } else {
        setError(err.message || 'Ocorreu um erro ao tentar realizar o login.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    cleanMessages();
    setLoading(true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      // Try popup first
      const credential = await signInWithPopup(auth, provider);
      const hasAccess = await verifyUserAccess(credential.user);
      
      if (hasAccess) {
        setSuccess('Acesso via Google autorizado! Carregando painel...');
        setTimeout(() => {
          setLoading(false);
          onSuccess();
          onClose();
        }, 1200);
      } else {
        await signOut(auth);
        setError('Você não tem permissão para acessar o painel.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Erro ao fazer login com Google Popup, tentando redirect:', err);
      
      // Fallback to Redirect on failure (e.g. popup blocked)
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.message?.includes('popup') ||
        err.message?.includes('Cross-Origin-Opener-Policy')
      ) {
        try {
          await signInWithRedirect(auth, provider);
          // Redirect will reload page, loading remains true
          return;
        } catch (redirectErr: any) {
          console.error('Erro ao redirecionar para login do Google:', redirectErr);
          setError('Não foi possível iniciar o login por redirecionamento. Verifique seu navegador.');
          setLoading(false);
        }
      } else {
        setError(err.message || 'Erro ao autenticar com o Google.');
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    cleanMessages();

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail para receber o link de recuperação.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess('Enviamos um link de redefinição de senha para o seu e-mail.');
      setLoading(false);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      setLoading(false);
      if (err.code === 'auth/user-not-found') {
        setError('Nenhum usuário cadastrado com este e-mail.');
      } else if (err.code === 'auth/invalid-email') {
        setError('O formato do e-mail é inválido.');
      } else {
        setError(err.message || 'Ocorreu um erro ao tentar enviar o e-mail de recuperação.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 md:p-12 max-w-md w-full relative overflow-hidden shadow-2xl text-white"
        >
          {/* Subtle glow decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-8 right-8 w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white rounded-full flex items-center justify-center transition-all cursor-pointer z-10"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 bg-brand-orange/15 rounded-2xl flex items-center justify-center text-brand-orange">
              <Shield size={32} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">
                {mode === 'login' ? (
                  <>Acesso <span className="text-brand-orange">Restrito</span></>
                ) : (
                  <>Recuperar <span className="text-brand-orange">Acesso</span></>
                )}
              </h3>
              <p className="text-slate-400 text-xs font-medium">
                {mode === 'login' 
                  ? 'Entre no portal administrativo da RB Sorocaba.' 
                  : 'Digite seu e-mail para receber as instruções.'}
              </p>
            </div>

            {/* Error/Success Feedbacks */}
            {error && (
              <div className="w-full p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl flex items-start gap-3">
                <AlertTriangle size={16} className="shrink-0 text-red-500 mt-0.5" />
                <p className="leading-relaxed text-left">{error}</p>
              </div>
            )}

            {success && (
              <div className="w-full p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl flex items-start gap-3">
                <CheckCircle size={16} className="shrink-0 text-emerald-500 mt-0.5" />
                <p className="leading-relaxed text-left">{success}</p>
              </div>
            )}

            {mode === 'login' ? (
              /* --- LOGIN FORM --- */
              <form onSubmit={handleEmailLogin} className="w-full space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">E-mail</label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@rbsorocaba.com.br"
                      className="w-full bg-white/5 border border-white/10 outline-none rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-white placeholder:text-slate-500 focus:border-brand-orange focus:bg-slate-800/80 transition-all duration-300"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <Mail size={16} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Senha</label>
                    <button
                      type="button"
                      onClick={() => {
                        cleanMessages();
                        setMode('forgot');
                      }}
                      className="text-[10px] font-bold text-brand-orange hover:text-brand-orange/80 uppercase tracking-wider transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 outline-none rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-white placeholder:text-slate-500 focus:border-brand-orange focus:bg-slate-800/80 transition-all duration-300"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <Lock size={16} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="w-full flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Ou</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Google Sign-In */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700/85 border border-white/5 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Entrar com Google</span>
                </button>
              </form>
            ) : (
              /* --- FORGOT PASSWORD FORM --- */
              <form onSubmit={handleForgotPassword} className="w-full space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Seu E-mail</label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@rbsorocaba.com.br"
                      className="w-full bg-white/5 border border-white/10 outline-none rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-white placeholder:text-slate-500 focus:border-brand-orange focus:bg-slate-800/80 transition-all duration-300"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <Mail size={16} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar Link de Recuperação</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    cleanMessages();
                    setMode('login');
                  }}
                  className="w-full text-center text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-wider transition-colors pt-2 block"
                >
                  Voltar para o Login
                </button>
              </form>
            )}

            <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] leading-none">
              <Info size={12} className="text-brand-orange shrink-0" />
              <span>Apenas para colaboradores autorizados</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
