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
import { auth, db, checkIfAdmin, getAuthErrorMessage } from '../lib/firebase';
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

  const checkAdminAccess = async (user: any): Promise<boolean> => {
    if (!user) return false;
    const uid = user.uid;
    const email = user.email?.toLowerCase().trim() || '';

    console.log("Verificando permissões administrativas pós-autenticação para o usuário:", email, "UID:", uid);

    // List of exact document IDs we need to check, as requested by the user
    const docIds = ['eliasborgess@hotmail.com', 'CBVxeK4uubadkRaDOaRmb2H96nx2'];
    if (email) docIds.push(email);
    if (uid) docIds.push(uid);

    const uniqueDocIds = Array.from(new Set(docIds));
    const collections = ['admins', 'administradores'];

    for (const coll of collections) {
      for (const docId of uniqueDocIds) {
        try {
          const docRef = doc(db, coll, docId);
          const snap = await getDoc(docRef);
          
          if (snap.exists()) {
            const data = snap.data();
            console.log(`Dados encontrados em ${coll}/${docId}:`, data);
            
            // "Se qualquer documento existir com ativo true e role admin, liberar o painel"
            const isAtivo = data.ativo === true;
            const isRoleAdmin = data.role === 'admin' || data.role === 'master' || data.tipo === 'master';
            
            if (isAtivo && isRoleAdmin) {
              console.log(`Acesso administrativo CONFIRMADO via documento ${coll}/${docId}!`);
              return true;
            }
          }
        } catch (err: any) {
          console.warn(`Erro ao consultar documento ${coll}/${docId}:`, err.message || err);
        }
      }
    }

    // Safety fallback checking original checkIfAdmin function to keep everything compatible
    try {
      if (typeof checkIfAdmin === 'function') {
        const fallbackCheck = await checkIfAdmin(user);
        if (fallbackCheck) {
          console.log("Acesso administrativo CONFIRMADO pelo helper fallback checkIfAdmin!");
          return true;
        }
      }
    } catch (err) {
      console.error("Erro no fallback checkIfAdmin:", err);
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
    const emailToUse = email.trim().toLowerCase();
    console.log("Iniciando login Firebase Auth com:", emailToUse);

    try {
      // 1. Sign in with Email and Password
      const credential = await signInWithEmailAndPassword(auth, emailToUse, password.trim());
      console.log("Login Firebase Auth OK:", credential.user.uid, credential.user.email);

      // 2. Verify panel access in Firestore (Only after login succeeds)
      let hasAccess = false;
      try {
        hasAccess = await checkAdminAccess(credential.user);
      } catch (firestoreErr: any) {
        console.error("Erro ao consultar Firestore pós-login:", firestoreErr);
        await signOut(auth);
        setError('Usuário autenticado no Firebase Auth, mas ocorreu um erro de comunicação com o banco de dados ao verificar permissões.');
        setLoading(false);
        return;
      }
      
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
        setError('E-mail ou senha corretos no Firebase Auth, porém este usuário não possui papel de administrador ativo no banco de dados Firestore.');
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      
      if (err.code === 'auth/api-key-not-valid' || err.message?.includes('API key not valid')) {
        setError(getAuthErrorMessage(err));
      } else if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(err.code)) {
        console.warn('Tentativa de login administrativo malsucedida (credenciais inválidas):', err.code);
        setError('Usuário ou senha inválidos no Firebase Auth. Redefina a senha desse usuário no Firebase Authentication.');
      } else {
        console.error('Erro no login administrativo:', err.code, err.message);
        setError(getAuthErrorMessage(err));
      }
    }
  };

  const handleResetPasswordForElias = async () => {
    cleanMessages();
    setLoading(true);
    try {
      console.log("Executando sendPasswordResetEmail para eliasborgess@hotmail.com");
      await sendPasswordResetEmail(auth, "eliasborgess@hotmail.com");
      setSuccess("E-mail de redefinição de senha enviado com sucesso para eliasborgess@hotmail.com.");
      setLoading(false);
    } catch (err: any) {
      console.error("Erro ao enviar redefinição para Elias:", err);
      setError(`Erro ao enviar redefinição de senha: ${err.message || err.code}`);
      setLoading(false);
    }
  };

  const runDirectTest = async () => {
    cleanMessages();
    setLoading(true);
    console.log("Iniciando teste direto de login com eliasborgess@hotmail.com / Elias10");
    try {
      const credential = await signInWithEmailAndPassword(auth, "eliasborgess@hotmail.com", "Elias10");
      console.log("Teste Direto - Login Firebase Auth OK:", credential.user.uid, credential.user.email);
      
      const hasAccess = await checkAdminAccess(credential.user);
      if (hasAccess) {
        setSuccess('Teste Direto OK! Acesso administrativo autorizado. Carregando painel...');
        setTimeout(() => {
          setLoading(false);
          onSuccess();
          onClose();
        }, 1200);
      } else {
        await signOut(auth);
        setError('Teste Direto: Autenticado com sucesso no Firebase Auth, mas sem permissão ativa no Firestore.');
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      console.warn("Teste Direto - Falhou:", err.code, err.message);
      if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(err.code)) {
        setError('Usuário ou senha inválidos no Firebase Auth. Redefina a senha desse usuário no Firebase Authentication.');
      } else {
        setError(`Erro no Teste Direto (${err.code || 'Desconhecido'}): ${err.message}`);
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
      console.log("Login Firebase OK:", credential.user.uid, credential.user.email);
      
      let hasAccess = false;
      try {
        hasAccess = (await checkAdminAccess(credential.user)) || (await checkIfAdmin(credential.user));
      } catch (firestoreErr: any) {
        console.error("Erro ao verificar permissões no Firestore após login Google:", firestoreErr);
        await signOut(auth);
        setError('Usuário autenticado, mas ocorreu erro ao verificar permissões.');
        setLoading(false);
        return;
      }
      
      if (hasAccess) {
        setSuccess('Acesso via Google autorizado! Carregando painel...');
        setTimeout(() => {
          setLoading(false);
          onSuccess();
          onClose();
        }, 1200);
      } else {
        await signOut(auth);
        setError('Usuário autenticado, porém sem permissão administrativa.');
        setLoading(false);
      }
    } catch (err: any) {
      console.warn('Erro ao fazer login com Google Popup, tentando redirect:', err);
      
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
        setError(getAuthErrorMessage(err));
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

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-4 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                        <span className="sr-only">Autenticando...</span>
                      </>
                    ) : (
                      <>
                        <span>Entrar</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleForgotPassword}
                    className="py-4 bg-slate-800 hover:bg-slate-700/85 border border-white/5 text-slate-300 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Redefinir Senha</span>
                  </button>
                </div>

                {/* Elias Direct Test Box */}
                <div className="w-full mt-4 p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-left">
                    <Shield size={14} className="text-brand-orange shrink-0 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Testes Rápidos de Administrador</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-left leading-normal">
                    Ações de atalho para o e-mail <strong>eliasborgess@hotmail.com</strong>:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={runDirectTest}
                      className="py-2.5 bg-brand-orange/10 hover:bg-brand-orange/20 border border-brand-orange/30 text-brand-orange rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 text-center"
                    >
                      Testar Login (Elias)
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleResetPasswordForElias}
                      className="py-2.5 bg-slate-850 hover:bg-slate-800 border border-white/10 text-slate-300 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 text-center"
                    >
                      Redefinir Elias
                    </button>
                  </div>
                </div>

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
