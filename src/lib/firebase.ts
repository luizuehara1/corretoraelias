import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy, onSnapshot, setDoc, writeBatch, runTransaction } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, getRedirectResult, signOut, onAuthStateChanged, User } from "firebase/auth";

/**
 * IMPORTANTE: Para que estas variáveis funcionem na Vercel/Produção, você deve cadastrar
 * cada uma delas nas "Environment Variables" do projeto na Vercel (Production, Preview, Development)
 * com exatamente os nomes VITE_FIREBASE_*.
 */
import appletConfig from '../../firebase-applet-config.json';

// Detect preview / AI Studio sandbox environment
const isPreviewEnv = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.includes('ais-dev-') ||
  window.location.hostname.includes('ais-pre-') ||
  window.location.hostname.includes('run.app')
);

// Usar sandbox do AI Studio caso esteja no ambiente de teste/preview e não tenha VITE_FIREBASE_PROJECT_ID definido explicitamente
const useSandbox = import.meta.env.VITE_USE_SANDBOX === "true" || (isPreviewEnv && !import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Configuração padrão de produção da Corretora Elias como fallback seguro
const corretoraEliasConfig = {
  apiKey: "AIzaSyAD7BfSNDgmzczkUPWfK-e1AR6M6PGsNQM",
  authDomain: "corretoraelias.firebaseapp.com",
  projectId: "corretoraelias",
  storageBucket: "corretoraelias.firebasestorage.app",
  messagingSenderId: "47614426836",
  appId: "1:47614426836:web:993da2426ded2cefab0541",
  measurementId: "G-7GDVXR7D66",
  firestoreDatabaseId: ""
};

const getEffectiveFirebaseConfig = () => {
  // Se houver VITE_FIREBASE_API_KEY no ambiente Vercel/Produção, priorizá-la
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (envApiKey && envApiKey !== "undefined" && envApiKey.trim() !== "") {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || corretoraEliasConfig.authDomain,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || corretoraEliasConfig.projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || corretoraEliasConfig.storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || corretoraEliasConfig.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || corretoraEliasConfig.appId,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || corretoraEliasConfig.measurementId,
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || ""
    };
  }

  // Se estiver no ambiente de preview/sandbox do AI Studio
  if (useSandbox && appletConfig?.apiKey) {
    return {
      apiKey: appletConfig.apiKey,
      authDomain: appletConfig.authDomain,
      projectId: appletConfig.projectId,
      storageBucket: appletConfig.storageBucket,
      messagingSenderId: appletConfig.messagingSenderId,
      appId: appletConfig.appId,
      measurementId: appletConfig.measurementId,
      firestoreDatabaseId: appletConfig.firestoreDatabaseId || "ai-studio-c0d6d2a4-ed2a-427d-bc4a-8acf1b44087e"
    };
  }

  // Fallback seguro em produção para que a página nunca fique em branco
  return {
    ...corretoraEliasConfig,
    apiKey: corretoraEliasConfig.apiKey || appletConfig.apiKey,
    authDomain: corretoraEliasConfig.authDomain || appletConfig.authDomain,
    projectId: corretoraEliasConfig.projectId || appletConfig.projectId,
    appId: corretoraEliasConfig.appId || appletConfig.appId,
  };
};

const firebaseConfig = getEffectiveFirebaseConfig();

// Log de diagnóstico seguro
console.log("Firebase config carregado:", {
  apiKeyPresente: Boolean(firebaseConfig.apiKey),
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  useSandbox
});

// Evitar dupla inicialização do app Firebase
let app: any;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
  console.error("Erro ao inicializar Firebase app:", e);
  app = getApps().length ? getApp() : initializeApp(corretoraEliasConfig);
}

// Inicializar Firestore e Auth usando a mesma instância singleton
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "default" && firebaseConfig.firestoreDatabaseId !== ""
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


/**
 * Tradutor centralizado de erros do Firebase Auth para mensagens amigáveis em português
 */
export function getAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  const msg = error?.message || '';

  if (code === 'auth/api-key-not-valid' || msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
    return 'A configuração de autenticação do site está inválida. Verifique se as variáveis VITE_FIREBASE_* do ambiente de produção estão cadastradas corretamente na Vercel.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Este domínio ainda não está autorizado no Firebase Authentication (Acesse Firebase Console -> Authentication -> Settings -> Authorized Domains).';
  }
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(code)) {
    return 'E-mail ou senha inválidos.';
  }
  if (code === 'auth/user-disabled') {
    return 'Esta conta de usuário foi desativada no Firebase Console.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Muitas tentativas malsucedidas. Tente novamente mais tarde.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Este e-mail já está em uso por outra conta.';
  }
  if (code === 'auth/weak-password') {
    return 'A senha fornecida é muito fraca. Digite pelo menos 6 caracteres com maior complexidade.';
  }
  if (code === 'auth/invalid-email') {
    return 'Formato de e-mail inválido.';
  }
  if (code === 'auth/popup-blocked') {
    return 'O popup de login foi bloqueado pelo navegador. Permita popups para este site.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'A janela de login do Google foi fechada antes de concluir.';
  }

  return msg || 'Ocorreu um erro ao autenticar. Tente novamente.';
}

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const isMobileOrSafari = typeof navigator !== 'undefined' && (
    /iPhone|iPad|iPod|Safari/i.test(navigator.userAgent) &&
    !/Chrome/i.test(navigator.userAgent)
  );

  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.includes('ais-dev-') &&
    !window.location.hostname.includes('ais-pre-') &&
    !window.location.hostname.includes('run.app');

  if (!isIframe && (isMobileOrSafari || isProduction)) {
    console.log("Detectado ambiente móvel/Safari ou Produção fora de iframe: usando signInWithRedirect por padrão.");
    try {
      await signInWithRedirect(auth, provider);
      return;
    } catch (redirectErr) {
      console.error("Erro ao iniciar login via redirect:", redirectErr);
    }
  }

  try {
    return await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error("Erro no popup Google:", error);

    if (isIframe) {
      alert("O navegador bloqueou o popup de login dentro do painel de visualização do AI Studio. Por favor, clique no botão 'Abrir em uma nova aba' (Open in a new tab) no topo direito da tela para fazer login com sucesso.");
      return;
    }

    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request" ||
      error.code === "auth/unauthorized-domain" ||
      error.message?.includes("Cross-Origin-Opener-Policy") ||
      error.message?.includes("popup")
    ) {
      console.warn("Popup bloqueado ou com erro. Tentando redirect...");
      await signInWithRedirect(auth, provider);
      return;
    }

    throw error;
  }
};

export const logout = () => signOut(auth);
export { signInWithRedirect, getRedirectResult };

/**
 * Checks if a user has admin status directly by records in admins/administradores collections.
 */
export const checkIsAdmin = async (uid: string | undefined): Promise<boolean> => {
  if (!uid) return false;
  try {
    const adminRef = doc(db, "admins", uid);
    const administradorRef = doc(db, "administradores", uid);

    const [adminSnap, administradorSnap] = await Promise.all([
      getDoc(adminRef),
      getDoc(administradorRef)
    ]);

    return adminSnap.exists() || administradorSnap.exists();
  } catch (error) {
    console.error("Error in checkIsAdmin:", error);
    return false;
  }
};

/**
 * Core CRM Roles and Permissions definition
 */
export const CRM_PERMISSIONS: Record<string, string[]> = {
  "Administrador": ["*"],
  "Líder": ["crm", "aprovar_imovel", "publicar_imovel", "reprovar_imovel", "solicitar_alteracoes", "contratos", "clientes", "visitas", "agenda", "imoveis", "financeiro_leitura", "usuarios"],
  "Corretor": ["crm", "clientes", "agenda", "visitas", "propostas", "contratos", "meus_imoveis"],
  "Assistente": ["crm", "clientes", "agenda", "visitas", "cadastro_imoveis", "documentos"],
  "Financeiro": ["financeiro", "relatorios", "locacoes", "comissoes"],
  "Marketing": ["publicacoes", "seo", "blog", "imoveis"],
  "Proprietário": []
};

/**
 * Loads user profile by checking UID and email in the standardized "usuarios" collection.
 * Provides fallback to legacy collections and whitelists, with automatic initial provisioning.
 */
export const carregarPerfilSeguro = async (user: User | null): Promise<any> => {
  if (!user) return null;

  const uid = user.uid;
  const email = user.email?.toLowerCase() || '';

  // 1. Direct Lookup by UID in "usuarios"
  try {
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (error) {
    console.warn("Erro ao buscar usuário por UID:", error);
  }

  // 2. Email Lookup for Pre-Registered users in "usuarios"
  if (email) {
    try {
      const q = query(collection(db, "usuarios"), where("email", "==", email));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const docSnap = qSnap.docs[0];
        const data = docSnap.data();
        
        // Map the UID to this pre-registered document
        const updatedData = { 
          ...data, 
          uid: uid, 
          foto: user.photoURL || data.foto || "",
          updatedAt: new Date().toISOString() 
        };
        
        await setDoc(doc(db, "usuarios", uid), updatedData);
        if (docSnap.id !== uid) {
          try {
            await deleteDoc(doc(db, "usuarios", docSnap.id));
          } catch (delErr) {
            console.warn("Could not delete legacy pre-registered doc:", delErr);
          }
        }
        return { id: uid, ...updatedData };
      }
    } catch (error) {
      console.warn("Erro ao buscar usuário pré-cadastrado por email:", error);
    }
  }

  // 3. Fallback to Initial Administrator Whitelist
  const whitelist = ['luiz.uehara1@gmail.com', 'eliasborgess@creci.org.com.br', 'eliasborgess@hotmail.com'];
  if (email && whitelist.includes(email)) {
    const adminData = {
      uid: uid,
      nome: user.displayName || "Administrador Inicial",
      email: email,
      telefone: "",
      cargo: "Administrador",
      perfil: "Administrador",
      permissoes: ["*"],
      status: "Ativo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, "usuarios", uid), adminData);
      return { id: uid, ...adminData };
    } catch (err) {
      console.warn("Erro ao registrar admin inicial whitelist:", err);
    }
    return { id: uid, ...adminData };
  }

  // 4. Backward compatibility with legacy collections
  const caminhos = [
    ["admins", uid],
    ["administradores", uid],
    ["users", uid],
    ["perfis", uid],
    ["profiles", uid],
    ["proprietarios", uid]
  ];

  for (const [colecao, id] of caminhos) {
    try {
      const snap = await getDoc(doc(db, colecao, id));
      if (snap.exists()) {
        const data = snap.data();
        const isLegacyAdmin = ["admins", "administradores"].includes(colecao);
        const mappedData = {
          uid: uid,
          nome: data.nome || data.name || user.displayName || "Usuário",
          email: email,
          telefone: data.telefone || data.phone || "",
          cargo: isLegacyAdmin ? "Administrador" : (data.cargo || "Proprietário"),
          perfil: isLegacyAdmin ? "Administrador" : (data.perfil || "Proprietário"),
          permissoes: isLegacyAdmin ? ["*"] : (data.permissoes || []),
          status: "Ativo",
          foto: user.photoURL || data.foto || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        // Migrate to "usuarios" collection
        await setDoc(doc(db, "usuarios", uid), mappedData);
        return { id: uid, ...mappedData };
      }
    } catch (error) {
      console.warn(`Erro ao carregar perfil em ${colecao}:`, error);
    }
  }

  // 5. Default to Proprietário (Portal do Proprietário)
  return {
    uid,
    email,
    nome: user.displayName || "Usuário Proprietário",
    foto: user.photoURL || "",
    perfil: "Proprietário",
    cargo: "Proprietário",
    status: "Ativo",
    permissoes: []
  };
};

/**
 * Checks if a user has any CRM access (role other than Proprietário).
 * Replaces the old single-admin verification to grant dashboard entry.
 */
export const checkIfAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  try {
    const profile = await carregarPerfilSeguro(user);
    if (!profile) return false;
    // Authorized for CRM if they are not a standard Proprietário
    return ["Administrador", "Líder", "Corretor", "Assistente", "Financeiro", "Marketing"].includes(profile.perfil);
  } catch (error) {
    console.error("Erro em checkIfAdmin:", error);
    // Hardcoded whitelist safety net
    const whitelist = ['luiz.uehara1@gmail.com', 'eliasborgess@creci.org.com.br', 'eliasborgess@hotmail.com'];
    return whitelist.includes(user.email?.toLowerCase() || '');
  }
};

/**
 * Recursively cleans data before sending to Firestore:
 * - Removes keys with value `undefined`
 * - Replaces `NaN` with `0`
 * - Preserves null, strings, numbers, booleans, arrays, objects, and Firestore FieldValues
 */
export function sanitizeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (typeof data === 'number') {
    return Number.isNaN(data) ? 0 : data;
  }
  if (typeof data !== 'object') {
    return data;
  }
  // Preserve Firestore FieldValues or Timestamp / Date objects
  if (data.constructor && data.constructor.name && (data.constructor.name === 'FieldValue' || data.constructor.name === 'Timestamp' || data.constructor.name === 'Date')) {
    return data;
  }
  if (typeof data.toDate === 'function') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item)).filter(item => item !== undefined);
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      const sanitized = sanitizeFirestoreData(value);
      if (sanitized !== undefined) {
        cleaned[key] = sanitized;
      }
    }
  }
  return cleaned;
}

const LOCAL_IMOVEIS_KEY = "rb_imoveis_cache_v1";

export const getLocalCache = (key: string = LOCAL_IMOVEIS_KEY): any[] => {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveToLocalCache = (collectionName: string, item: any) => {
  try {
    if (typeof window === 'undefined') return;
    if (collectionName === "imoveis") {
      const current = getLocalCache(LOCAL_IMOVEIS_KEY);
      const index = current.findIndex(p => (p.id && p.id === item.id) || (item.codigo && p.codigo === item.codigo));
      if (index >= 0) {
        current[index] = { ...current[index], ...item };
      } else {
        current.unshift(item);
      }
      localStorage.setItem(LOCAL_IMOVEIS_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn("Erro ao salvar no localStorage cache:", e);
  }
};

export const updateLocalCacheList = (collectionName: string, list: any[]) => {
  try {
    if (typeof window === 'undefined') return;
    if (collectionName === "imoveis") {
      localStorage.setItem(LOCAL_IMOVEIS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn("Erro ao atualizar localStorage cache:", e);
  }
};

export const removeFromLocalCache = (collectionName: string, id: string) => {
  try {
    if (typeof window === 'undefined') return;
    if (collectionName === "imoveis") {
      const current = getLocalCache(LOCAL_IMOVEIS_KEY);
      const filtered = current.filter(p => p.id !== id && p.codigo !== id);
      localStorage.setItem(LOCAL_IMOVEIS_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("Erro ao remover do localStorage cache:", e);
  }
};

/**
 * Listens to visits in real-time
 */
export const subscribeToVisits = (callback: (visits: any[]) => void) => {
  const q = query(collection(db, "visits"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    list.sort((a, b) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (b.time || "").localeCompare(a.time || "");
    });
    callback(list);
  }, (error) => {
    console.warn("Erro ou reconexão no listener de visitas:", error);
    callback([]);
  });
};

/**
 * Listens to properties in real-time
 */
export const subscribeToProperties = (callback: (properties: any[]) => void, isAdmin: boolean = false) => {
  // First deliver cached properties immediately so UI never hangs or waits empty
  const initialLocal = getLocalCache(LOCAL_IMOVEIS_KEY);
  if (initialLocal && initialLocal.length > 0) {
    let filteredLocal = initialLocal;
    if (!isAdmin) {
      filteredLocal = filteredLocal.filter(p => p.publicadoNoSite === true || p.publicado === true);
    }
    callback(filteredLocal);
  }

  const q = query(collection(db, "imoveis"));
  
  return onSnapshot(q, (snapshot) => {
    let list = snapshot.docs
      .filter(doc => doc.id !== "init" && doc.data()?.init !== true)
      .map(doc => {
        const data = doc.data();
        
        // Resolve standard identification values
        const codigoImovelValue = data.codigoImovel || data.codigo || data.referencia || doc.id;
        const titleValue = data.tituloAnuncio || data.titulo || data.title || "";
        const typeValue = data.tipoImovel || data.tipo || data.type || "";
        const cityValue = data.cidade || data.city || "";
        const neighborhoodValue = data.bairro || data.neighborhood || "";
        const statusValue = data.status || "Disponível";
        
        const priceValueNum = Number(data.valorVenda || data.valorLocacao || data.priceValue || 0);
        const formattedPrice = data.preco || data.price || (priceValueNum ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(priceValueNum) : "Sob Consulta");

        const bedsValue = data.dormitorios !== undefined ? Number(data.dormitorios) : (data.quartos !== undefined ? Number(data.quartos) : Number(data.beds || 0));
        const bathsValue = data.banheiros !== undefined ? Number(data.banheiros) : Number(data.baths || 0);
        const suitesValue = data.suites !== undefined ? Number(data.suites) : 0;
        const parkingCoveredValue = data.vagas !== undefined ? Number(data.vagas) : Number(data.parkingCovered || 0);
        
        const areaValue = data.areaPrivativa || data.areaTotal || data.area || "";
        const imagePrincipal = data.fotoPrincipal || data.imagens?.[0] || data.fotos?.[0] || data.image || "";
        const fotosList = data.fotos || data.imagens || data.additionalImages || [];
        const additionalImgsList = data.fotos ? data.fotos.slice(1) : (data.imagens ? data.imagens.slice(1) : data.additionalImages || []);

        return {
          id: doc.id,
          // Mapped UI fields for React component compatibility
          title: titleValue,
          type: typeValue,
          city: cityValue,
          neighborhood: neighborhoodValue,
          price: data.price || formattedPrice,
          description: data.descricaoDetalhada || data.descricao || data.description || "",
          descricaoDetalhada: data.descricaoDetalhada || data.descricaoCompleta || data.descricao || data.description || "",
          tituloAnuncio: data.tituloAnuncio || data.titulo || data.title || "",
          subtituloAnuncio: data.subtituloAnuncio || "",
          descricaoCurta: data.descricaoCurta || "",
          diferenciaisAnuncio: data.diferenciaisAnuncio || "",
          textoWhatsapp: data.textoWhatsapp || "",
          textoInstagram: data.textoInstagram || "",
          tituloSEO: data.tituloSEO || "",
          descricaoSEO: data.descricaoSEO || "",
          palavrasChaveSEO: data.palavrasChaveSEO || "",
          mostrarNosFiltros: data.mostrarNosFiltros !== undefined ? data.mostrarNosFiltros : (data.mostrarCatalogo !== undefined ? data.mostrarCatalogo : true),
          mostrarValorNoSite: data.mostrarValorNoSite !== undefined ? data.mostrarValorNoSite : true,
          beds: bedsValue,
          suites: suitesValue,
          baths: bathsValue,
          parkingCovered: parkingCoveredValue,
          area: areaValue.toString(),
          image: imagePrincipal,
          additionalImages: additionalImgsList,
          status: statusValue,
          priceValue: priceValueNum,
          category: data.category || "Residencial",
          location: data.endereco || data.location || "",
          condominium: data.nomeEdificio || data.condominium || "",
          condoValue: data.valorCondominio || data.condoValue || "",
          purpose: data.tipoNegocio || data.purpose || "Venda",
          tipoNegocio: data.tipoNegocio || data.purpose || "Venda",
          featured: data.destaque || data.destaqueNaHome || data.featured || false,
          coords: data.coords || [-23.5018, -47.4581],
          createdAt: data.criadoEm || data.createdAt,
          updatedAt: data.atualizadoEm || data.updatedAt,
          
          valorVenda: Number(data.valorVenda || 0),
          valorAluguel: Number(data.valorAluguel || 0),
          valorLocacao: Number(data.valorLocacao || data.valorAluguel || 0),
          valorCondominio: Number(data.valorCondominio || 0),
          valorIptu: Number(data.valorIptuAnual || data.valorIptu || 0),
          valorIptuAnual: Number(data.valorIptuAnual || data.valorIptu || 0),
          taxaLixo: Number(data.taxaLixoAnual || data.taxaLixo || 0),
          taxaLixoAnual: Number(data.taxaLixoAnual || data.taxaLixo || 0),
          iptuMensal: Number(data.iptuMensal || 0),
          taxaLixoMensal: Number(data.taxaLixoMensal || 0),
          valorTotalMensal: Number(data.valorTotalMensal || 0),
          
          garantiaLocaticia: data.garantiaLocaticia || "",
          permitePet: data.permitePet || "",
          mobiliadoStatus: data.mobiliadoStatus || "",
          mobiliado: data.mobiliadoStatus === "Sim" || data.mobiliadoStatus === "Semi mobiliado" || !!data.mobiliado,
          tempoMinimoContrato: data.tempoMinimoContrato || "",
          statusLocacao: data.statusLocacao || "",
          observacoesLocacao: data.observacoesLocacao || "",
          
          taxaGas: Number(data.taxaGas || 0),
          taxaAgua: Number(data.taxaAgua || 0),
          taxaLuz: Number(data.taxaLuz || 0),
          seguroIncendio: Number(data.seguroIncendio || 0),
          taxasAdicionais: Number(data.taxasAdicionais || 0),
          
          aceitaFGTS: !!data.aceitaFGTS,
          aceitaPermuta: !!data.aceitaPermuta,
          aceitaFinanciamento: !!data.aceitaFinanciamento,
          imovelAlugado: !!data.imovelAlugado,
          eEdificio: !!data.eEdificio,
          estaEmCondominio: !!data.estaEmCondominio,
          alugado: !!data.alugado,
          statusVenda: data.statusVenda || (statusValue === "Vendido" ? "Vendido" : "Disponível"),
          disponivelParaVenda: data.disponivelParaVenda !== undefined ? !!data.disponivelParaVenda : true,
          disponivelParaLocacao: data.disponivelParaLocacao !== undefined ? !!data.disponivelParaLocacao : true,
          contratoLocacaoAtivo: !!data.contratoLocacaoAtivo,
          gestaoLocacao: data.gestaoLocacao || null,

          // Exact Firestore standard fields
          codigo: data.codigo || codigoImovelValue,
          codigoImovel: codigoImovelValue,
          titulo: data.titulo || titleValue,
          nomeEdificio: data.nomeEdificio || data.condominium || "",
          tipoImovel: typeValue,
          publicado: data.publicado === true,
          publicadoNoSite: data.publicadoNoSite === true,
          vendido: data.vendido === true,
          disponivelParaVisita: data.disponivelParaVisita !== false,
          disponivelParaProposta: data.disponivelParaProposta !== false,
          endereco: data.endereco || data.location || "",
          numero: data.numero || "",
          complemento: data.complemento || "",
          bairro: neighborhoodValue,
          cidade: cityValue,
          estado: data.estado || "SP",
          matriculaImovel: data.matriculaImovel || "",
          criImovel: data.criImovel || "",
          dormitorios: bedsValue,
          salas: data.salas || 0,
          vagas: parkingCoveredValue,
          areaPrivativa: Number(data.areaPrivativa || parseFloat(areaValue) || 0),
          areaTotal: Number(data.areaTotal || parseFloat(areaValue) || 0),
          observacoes: data.observacoes || "",
          fotos: fotosList,
          fotoPrincipal: imagePrincipal,
          destaque: data.destaque || false,
          destaqueNaHome: data.destaqueNaHome || false,
          caracteristicas: data.caracteristicas || [],
          ambientes: data.ambientes || [],
          caracteristicasEmpreendimento: data.caracteristicasEmpreendimento || [],
          lazer: data.lazer || [],
          instalacoes: data.instalacoes || [],
          acabamentos: data.acabamentos || [],
          proximidades: data.proximidades || [],
        };
      });

    // Merge with unsynced local cached properties
    const cachedItems = getLocalCache(LOCAL_IMOVEIS_KEY);
    if (cachedItems && cachedItems.length > 0) {
      const firestoreIds = new Set(list.map(p => p.id));
      const firestoreCodigos = new Set(list.map(p => p.codigo).filter(Boolean));
      const localOnly = cachedItems.filter(p => !firestoreIds.has(p.id) && (!p.codigo || !firestoreCodigos.has(p.codigo)));
      if (localOnly.length > 0) {
        list = [...localOnly, ...list];
      }
    }

    // Handle filtering based on role / status
    if (!isAdmin) {
      // Return only published ones
      list = list.filter(p => p.publicadoNoSite === true || p.publicado === true);
    }
    
    // Sort in memory by createdAt desc
    list.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bTime = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return bTime - aTime;
    });

    // Update local cache
    updateLocalCacheList("imoveis", list);

    callback(list);
  }, (error) => {
    console.warn("Erro no listener de imóveis, utilizando cache local:", error);
    const cachedList = getLocalCache(LOCAL_IMOVEIS_KEY);
    let filtered = cachedList;
    if (!isAdmin) {
      filtered = filtered.filter(p => p.publicadoNoSite === true || p.publicado === true);
    }
    callback(filtered);
  });
};


/**
 * Listens to blocked slots in real-time
 */
export const subscribeToBlockedSlots = (callback: (slots: any[]) => void) => {
  const q = query(collection(db, "blocked_slots"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    list.sort((a, b) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (b.time || "").localeCompare(a.time || "");
    });
    callback(list);
  }, (error) => {
    console.error("Erro no listener de horários bloqueados:", error);
    callback([]);
  });
};

/**
 * Saves a property submission for approval
 */
export const submitProperty = async (propertyData: any) => {
  try {
    const docRef = await addDoc(collection(db, "property_submissions"), {
      ...propertyData,
      status: 'pending',
      submittedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error submitting property: ", error);
    throw error;
  }
};

/**
 * Gets all pending submissions
 */
export const getSubmissions = async () => {
  try {
    const q = query(collection(db, "property_submissions"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting submissions: ", error);
    throw error;
  }
};

/**
 * Approves a property submission
 */
export const approveProperty = async (submissionId: string) => {
  try {
    const docRef = doc(db, "property_submissions", submissionId);
    await updateDoc(docRef, { status: 'approved' });
    return { success: true };
  } catch (error) {
    console.error("Error approving property: ", error);
    throw error;
  }
};

/**
 * Rejects a property submission
 */
export const rejectProperty = async (submissionId: string) => {
  try {
    const docRef = doc(db, "property_submissions", submissionId);
    await updateDoc(docRef, { status: 'rejected' });
    return { success: true };
  } catch (error) {
    console.error("Error rejecting property: ", error);
    throw error;
  }
};

/**
 * Gets all published properties
 */
export const getProperties = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "imoveis"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting properties: ", error);
    throw error;
  }
};

/**
 * Helper to construct the exact requested standard property document.
 */
const buildStandardPropertyDoc = (propertyData: any, isNew: boolean) => {
  let statusStr = propertyData.status || "Disponível";
  if (statusStr === "ativo") statusStr = "Disponível";
  if (statusStr === "inativo") statusStr = "Inativo";
  if (statusStr === "vendido") statusStr = "Vendido";

  // Point 4: "Publish to site" sets publicado: true, publicadoNoSite: true
  // Respect manually set value or fall back depending on the draft status
  let publicado = propertyData.publicado !== undefined ? propertyData.publicado : (statusStr !== "Inativo");
  let publicadoNoSite = propertyData.publicadoNoSite !== undefined ? propertyData.publicadoNoSite : (statusStr !== "Inativo");

  if (statusStr === "Vendido") {
    publicado = true;
    publicadoNoSite = true;
  }

  const tituloValue = propertyData.title || propertyData.titulo || "";
  const codeValue = propertyData.codigo || propertyData.codigoImovel || "";
  const mainImage = propertyData.image || propertyData.fotoPrincipal || "";
  const additionalImgs = propertyData.additionalImages || propertyData.fotos?.slice(1) || [];
  const fotosArray = [mainImage, ...additionalImgs].filter(Boolean);

  const tipoNegocioValue = propertyData.tipoNegocio || propertyData.purpose || "Venda";
  const valorVenda = (tipoNegocioValue === "Locação") ? 0 : Number(propertyData.valorVenda || 0);
  const valorAluguel = (tipoNegocioValue === "Venda") ? 0 : Number(propertyData.valorAluguel || 0);

  const ptBRcurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  let priceStr = "";
  let priceValue = 0;

  if (tipoNegocioValue === "Venda") {
    priceStr = ptBRcurrency.format(valorVenda);
    priceValue = valorVenda;
  } else if (tipoNegocioValue === "Locação") {
    priceStr = `${ptBRcurrency.format(valorAluguel)}/mês`;
    priceValue = valorAluguel;
  } else if (tipoNegocioValue === "Venda e Locação") {
    priceStr = `Venda: ${ptBRcurrency.format(valorVenda)} | Locação: ${ptBRcurrency.format(valorAluguel)}/mês`;
    priceValue = valorVenda || valorAluguel;
  }

  // Point 5: "Vendido" status fields enforcement
  // Point 6: "Disponível" status fields enforcement
  let vendido = statusStr === "Vendido" || propertyData.statusVenda === "Vendido";
  let statusVenda = propertyData.statusVenda || (vendido ? "Vendido" : "Disponível");
  let statusLocacao = propertyData.statusLocacao || (tipoNegocioValue === "Venda" ? "" : "Disponível para locação");
  let alugado = statusLocacao === "Alugado";

  if (vendido) {
    statusStr = "Vendido";
    statusVenda = "Vendido";
  }

  const existingGLoc = propertyData.gestaoLocacao || {};

  let disponivelParaVisita = propertyData.disponivelParaVisita !== undefined ? !!propertyData.disponivelParaVisita : true;
  let disponivelParaProposta = propertyData.disponivelParaProposta !== undefined ? !!propertyData.disponivelParaProposta : true;
  let disponivelParaVenda = (tipoNegocioValue === "Venda" || tipoNegocioValue === "Venda e Locação") && !vendido;
  let disponivelParaLocacao = (tipoNegocioValue === "Locação" || tipoNegocioValue === "Venda e Locação") && !alugado && !vendido;

  if (vendido) {
    disponivelParaVisita = false;
    disponivelParaProposta = false;
    disponivelParaVenda = false;
    disponivelParaLocacao = false;
  } else if (alugado) {
    if (tipoNegocioValue === "Locação") {
      disponivelParaVisita = false;
      disponivelParaProposta = false;
      disponivelParaLocacao = false;
    } else if (tipoNegocioValue === "Venda e Locação") {
      disponivelParaVisita = !!existingGLoc.permitirVisitaMesmoAlugado;
      disponivelParaProposta = !!existingGLoc.manterDisponivelParaVenda;
      disponivelParaLocacao = false;
    }
  }

  const gestaoLocacao = {
    statusLocacao: statusLocacao,
    alugado: alugado,
    contratoAtivo: existingGLoc.contratoAtivo !== undefined ? !!existingGLoc.contratoAtivo : alugado,
    locacaoEmDia: existingGLoc.locacaoEmDia !== undefined ? !!existingGLoc.locacaoEmDia : true,

    locatarioNome: existingGLoc.locatarioNome || "",
    locatarioCpfCnpj: existingGLoc.locatarioCpfCnpj || "",
    locatarioRgIe: existingGLoc.locatarioRgIe || "",
    locatarioWhatsapp: existingGLoc.locatarioWhatsapp || "",
    locatarioEmail: existingGLoc.locatarioEmail || "",
    locatarioEndereco: existingGLoc.locatarioEndereco || "",

    dataInicioLocacao: existingGLoc.dataInicioLocacao || "",
    dataFimLocacao: existingGLoc.dataFimLocacao || "",
    valorAluguelContratado: Number(existingGLoc.valorAluguelContratado || valorAluguel || 0),
    valorCaucao: Number(existingGLoc.valorCaucao || 0),
    garantiaLocaticia: existingGLoc.garantiaLocaticia || propertyData.garantiaLocaticia || "",
    diaVencimentoAluguel: existingGLoc.diaVencimentoAluguel || "",
    observacoesLocacao: existingGLoc.observacoesLocacao || propertyData.observacoesLocacao || "",

    permitirVisitaMesmoAlugado: existingGLoc.permitirVisitaMesmoAlugado !== undefined ? !!existingGLoc.permitirVisitaMesmoAlugado : false,
    manterDisponivelParaVenda: existingGLoc.manterDisponivelParaVenda !== undefined ? !!existingGLoc.manterDisponivelParaVenda : true
  };

  const finalCode = codeValue || "REF" + Math.floor(Math.random() * 10000);
  const prefix = propertyData.codigoPrefixo || getPrefixoCodigoImovel(propertyData.type || propertyData.tipoImovel || "");
  const numericPart = propertyData.codigoNumero || (finalCode ? parseInt(finalCode.replace(/\D/g, '')) || 0 : 0);
  const finalSlug = (finalCode || "").toLowerCase();

  const docData: any = {
    codigo: finalCode,
    codigoImovel: finalCode,
    codigoPrefixo: prefix,
    codigoNumero: numericPart,
    slug: finalSlug,

    titulo: tituloValue,
    nomeEdificio: propertyData.condominium || propertyData.nomeEdificio || "",

    tipoImovel: propertyData.type || propertyData.tipoImovel || "",
    tipoNegocio: tipoNegocioValue,
    category: propertyData.category || "Residencial",
    purpose: (tipoNegocioValue === "Venda e Locação" ? "Venda" : tipoNegocioValue) as any,
    status: statusStr,
    statusImovel: statusStr,
    statusVenda,
    statusLocacao,

    publicado: propertyData.publicado !== undefined ? !(!propertyData.publicado) : publicado,
    publicadoNoSite: propertyData.publicadoNoSite !== undefined ? !(!propertyData.publicadoNoSite) : publicadoNoSite,

    vendido,
    alugado,
    reservado: statusStr === "Reservado",
    disponivelParaVisita,
    disponivelParaProposta,
    mostrarNosFiltros: propertyData.mostrarNosFiltros !== undefined ? !!propertyData.mostrarNosFiltros : (propertyData.mostrarCatalogo !== undefined ? !!propertyData.mostrarCatalogo : true),
    mostrarValorNoSite: propertyData.mostrarValorNoSite !== undefined ? !!propertyData.mostrarValorNoSite : true,
    disponivelParaVenda,
    disponivelParaLocacao,
    contratoLocacaoAtivo: gestaoLocacao.contratoAtivo,
    gestaoLocacao,

    price: priceStr,
    priceValue: priceValue,

    valorVenda,
    valorAluguel,
    valorLocacao: valorAluguel, // Map valorLocacao for compatibility
    valorCondominio: Number(propertyData.valorCondominio || propertyData.condoValue?.toString().replace(/\D/g, '') || 0),
    valorIptu: Number(propertyData.valorIptuAnual || propertyData.valorIptu || 0),
    valorIptuAnual: Number(propertyData.valorIptuAnual || propertyData.valorIptu || 0),
    taxaLixo: Number(propertyData.taxaLixoAnual || propertyData.taxaLixo || 0),
    taxaLixoAnual: Number(propertyData.taxaLixoAnual || propertyData.taxaLixo || 0),
    iptuMensal: Number(propertyData.iptuMensal || 0),
    taxaLixoMensal: Number(propertyData.taxaLixoMensal || 0),
    valorTotalMensal: Number(propertyData.valorTotalMensal || 0),

    garantiaLocaticia: propertyData.garantiaLocaticia || "",
    permitePet: propertyData.permitePet || "",
    mobiliadoStatus: propertyData.mobiliadoStatus || "",
    mobiliado: propertyData.mobiliadoStatus === "Sim" || propertyData.mobiliadoStatus === "Semi mobiliado" || !!propertyData.mobiliado,
    tempoMinimoContrato: propertyData.tempoMinimoContrato || "",
    observacoesLocacao: propertyData.observacoesLocacao || "",

    taxaGas: Number(propertyData.taxaGas || 0),
    taxaAgua: Number(propertyData.taxaAgua || 0),
    taxaLuz: Number(propertyData.taxaLuz || 0),
    seguroIncendio: Number(propertyData.seguroIncendio || 0),
    taxasAdicionais: Number(propertyData.taxasAdicionais || 0),

    aceitaFGTS: !!propertyData.aceitaFGTS,
    aceitaPermuta: !!propertyData.aceitaPermuta,
    aceitaFinanciamento: !!propertyData.aceitaFinanciamento,
    imovelAlugado: !!propertyData.imovelAlugado,
    eEdificio: !!propertyData.eEdificio,
    estaEmCondominio: !!propertyData.estaEmCondominio,

    endereco: propertyData.location || propertyData.endereco || "",
    numero: propertyData.numero || "",
    complemento: propertyData.complemento || "",
    bairro: propertyData.neighborhood || propertyData.bairro || "",
    cidade: propertyData.city || propertyData.cidade || "",
    estado: propertyData.estado || propertyData.state || "SP",
    cep: propertyData.cep || "",
    latitude: propertyData.latitude !== undefined ? String(propertyData.latitude) : (propertyData.coords?.[0] !== undefined ? String(propertyData.coords[0]) : ""),
    longitude: propertyData.longitude !== undefined ? String(propertyData.longitude) : (propertyData.coords?.[1] !== undefined ? String(propertyData.coords[1]) : ""),
    referencia: propertyData.referencia || propertyData.codigoImovel || propertyData.codigo || "",
    enderecoCompleto: `${propertyData.location || propertyData.endereco || ""}, ${propertyData.numero || ""} - ${propertyData.neighborhood || propertyData.bairro || ""}, ${propertyData.city || propertyData.cidade || "Sorocaba"}/${propertyData.estado || propertyData.state || "SP"}`,

    matriculaImovel: propertyData.matriculaImovel || "",
    criImovel: propertyData.criImovel || "",

    dormitorios: Number(propertyData.beds !== undefined ? propertyData.beds : propertyData.dormitorios || 0),
    suites: Number(propertyData.suites || 0),
    banheiros: Number(propertyData.baths !== undefined ? propertyData.baths : propertyData.banheiros || 0),
    salas: Number(propertyData.salas || 0),
    vagas: Number(propertyData.parkingCovered !== undefined ? propertyData.parkingCovered : propertyData.vagas || 0),
    areaPrivativa: Number(propertyData.areaUseful || propertyData.areaPrivativa || parseFloat(propertyData.area) || 0),
    areaTotal: Number(propertyData.areaTotal || parseFloat(propertyData.area) || 0),

    descricao: propertyData.descricaoDetalhada || propertyData.description || propertyData.descricao || "",
    descricaoCompleta: propertyData.descricaoDetalhada || propertyData.description || propertyData.descricao || "",
    descricaoDetalhada: propertyData.descricaoDetalhada || propertyData.description || propertyData.descricao || "",
    tituloAnuncio: propertyData.tituloAnuncio || propertyData.titulo || propertyData.title || "",
    subtituloAnuncio: propertyData.subtituloAnuncio || "",
    descricaoCurta: propertyData.descricaoCurta || "",
    diferenciaisAnuncio: propertyData.diferenciaisAnuncio || "",
    textoWhatsapp: propertyData.textoWhatsapp || "",
    textoInstagram: propertyData.textoInstagram || "",
    tituloSEO: propertyData.tituloSEO || "",
    descricaoSEO: propertyData.descricaoSEO || "",
    palavrasChaveSEO: propertyData.palavrasChaveSEO || "",
    observacoes: propertyData.observacoes || "",

    fotos: (propertyData.fotos && Array.isArray(propertyData.fotos) && propertyData.fotos.length > 0)
      ? propertyData.fotos.map((f: any, idx: number) => {
          if (typeof f === 'string') {
            return {
              url: f,
              secureUrl: f,
              publicId: '',
              originalFilename: '',
              ordem: idx
            };
          }
          return {
            url: f.url || f.secureUrl || '',
            secureUrl: f.secureUrl || f.url || '',
            publicId: f.publicId || '',
            originalFilename: f.originalFilename || '',
            ordem: f.ordem !== undefined ? Number(f.ordem) : idx
          };
        })
      : (fotosArray.map((url, i) => ({
          url,
          secureUrl: url,
          publicId: '',
          originalFilename: '',
          ordem: i
        }))),
    fotoPrincipal: propertyData.fotoPrincipal || mainImage || "",
    image: propertyData.fotoPrincipal || mainImage || "",
    additionalImages: propertyData.additionalImages || (Array.isArray(propertyData.fotos) 
      ? propertyData.fotos.slice(1).map((f: any) => typeof f === 'string' ? f : (f.secureUrl || f.url || '')) 
      : additionalImgs),

    destaque: propertyData.featured === true || propertyData.destaque === true,
    destaqueNaHome: propertyData.featured === true || propertyData.destaqueNaHome === true,

    caracteristicas: propertyData.caracteristicas || [],
    ambientes: propertyData.ambientes || [],
    caracteristicasEmpreendimento: propertyData.caracteristicasEmpreendimento || [],
    lazer: propertyData.lazer || [],
    instalacoes: propertyData.instalacoes || [],
    acabamentos: propertyData.acabamentos || [],
    proximidades: propertyData.proximidades || [],
    coords: propertyData.coords || [-23.5018, -47.4581],

    atualizadoEm: serverTimestamp()
  };

  if (isNew) {
    docData.criadoEm = serverTimestamp();
  }

  return docData;
};

/**
 * Subscribes to dynamic options collections for dropdowns and checklists.
 * Point 1: Ignores "init" documents
 * Point 7: Filters active === true, orders by ordem asc
 */
export const subscribeToCollectionOptions = (collectionName: string, callback: (items: any[]) => void) => {
  const q = collection(db, collectionName);
  return onSnapshot(q, (snapshot) => {
    let items = snapshot.docs
      .filter((doc) => doc.id !== "init" && doc.data()?.init !== true)
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

    // Filter: active === true
    items = items.filter((item: any) => item.ativo === true);

    // Sort: ordem asc
    items.sort((a: any, b: any) => {
      const orderA = a.ordem !== undefined ? Number(a.ordem) : 999;
      const orderB = b.ordem !== undefined ? Number(b.ordem) : 999;
      return orderA - orderB;
    });

    callback(items);
  }, (error) => {
    console.error(`Erro ao sincronizar opções da coleção ${collectionName}:`, error);
    throw handleFirestoreError(error, 'get', collectionName);
  });
};

export const getConfigOptions = async (collectionName: string) => {
  try {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs
      .filter((docItem) => docItem.id !== "init" && docItem.data()?.init !== true)
      .map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));
  } catch (error) {
    console.error(`Erro ao buscar opções de ${collectionName}:`, error);
    throw handleFirestoreError(error, 'get', collectionName);
  }
};

export const addConfigOption = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error(`Erro ao adicionar opção em ${collectionName}:`, error);
    throw handleFirestoreError(error, 'create', collectionName);
  }
};

export const updateConfigOption = async (collectionName: string, id: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error(`Erro ao atualizar opção em ${collectionName}:`, error);
    throw handleFirestoreError(error, 'update', `${collectionName}/${id}`);
  }
};

export const deleteConfigOption = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error(`Erro ao deletar opção de ${collectionName}:`, error);
    throw handleFirestoreError(error, 'delete', `${collectionName}/${id}`);
  }
};

export const toggleConfigOption = async (collectionName: string, id: string, ativo: boolean) => {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, { ativo, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error(`Erro ao alterar status da opção de ${collectionName}:`, error);
    throw handleFirestoreError(error, 'update', `${collectionName}/${id}`);
  }
};

export const reorderConfigOptions = async (collectionName: string, items: any[]) => {
  try {
    const batch = writeBatch(db);
    items.forEach((item, index) => {
      const docRef = doc(db, collectionName, item.id);
      batch.update(docRef, { ordem: index, updatedAt: serverTimestamp() });
    });
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error(`Erro ao reordenar opções de ${collectionName}:`, error);
    throw handleFirestoreError(error, 'update', collectionName);
  }
};

export function gerarValue(label: string) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function seedOptionsIfMissing(collectionName: string, options: string[], grupo?: string): Promise<number> {
  try {
    const ref = collection(db, collectionName);
    const snap = await getDocs(ref);

    // Get existing values or labels normalized
    const existentes = new Set(
      snap.docs
        .filter((docItem) => docItem.id !== "init" && docItem.data()?.init !== true)
        .map((docItem) => {
          const d = docItem.data();
          const val = d.value || d.val || d.nome || d.label || "";
          return String(val).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        })
    );

    const batch = writeBatch(db);
    let count = 0;

    options.forEach((label, index) => {
      const value = gerarValue(label);
      const normalizedValue = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (!existentes.has(normalizedValue)) {
        const docRef = doc(collection(db, collectionName));
        const cleanId = docRef.id;

        batch.set(docRef, {
          id: cleanId,
          nome: label,
          label: label,
          value: value,
          grupo: grupo || collectionName,
          ativo: true,
          ordem: snap.size + index + 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }

    console.log(`${count} opções adicionadas em ${collectionName}`);
    return count;
  } catch (error) {
    console.error(`Erro ao semear opções para ${collectionName}:`, error);
    return 0; // Don't crash if a single collection fails
  }
}

export const seedDefaultSettingsIfEmpty = async (): Promise<{ success: boolean; counts: Record<string, number>; message: string }> => {
  const reports: Record<string, number> = {};
  try {
    const user = auth.currentUser;

    if (!user) {
      console.warn("Usuário sem permissão para criar configurações padrão: não autenticado.");
      return { success: false, counts: {}, message: "Usuário não autenticado." };
    }

    const isUserAdmin = await checkIfAdmin(user);

    if (!isUserAdmin) {
      console.warn("Usuário sem permissão para criar configurações padrão: não é admin.");
      return { success: false, counts: {}, message: "Usuário não é administrador." };
    }

    // 1. CARACTERÍSTICAS GERAIS
    const caracteristicasOptions = [
      "Aceita financiamento", "Aceita FGTS", "Aceita permuta", "Imóvel mobiliado", "Imóvel semi-mobiliado",
      "Imóvel desocupado", "Imóvel alugado", "Imóvel novo", "Imóvel reformado", "Imóvel na planta",
      "Pronto para morar", "Documentação em ordem", "Escritura definitiva", "Aceita proposta", "Sol da manhã",
      "Sol da tarde", "Face norte", "Face leste", "Face oeste", "Face sul", "Vista livre",
      "Vista para área verde", "Vista para cidade", "Alto padrão", "Condomínio fechado", "Portaria 24 horas",
      "Segurança 24 horas", "Monitoramento por câmeras", "Controle de acesso", "Rua tranquila", "Localização privilegiada",
      "Próximo ao centro", "Excelente para investimento", "Baixo custo de manutenção", "Ideal para família", "Ideal para renda",
      "Ideal para comércio", "Permite pets", "Quintal privativo", "Área gourmet", "Varanda gourmet",
      "Sacada", "Sacada envidraçada", "Planejados", "Ar-condicionado", "Aquecimento solar", "Energia solar",
      "Gás encanado", "Água individualizada", "Luz individualizada"
    ];

    // 2. AMBIENTES
    const ambientesOptions = [
      "Sala de estar", "Sala de jantar", "Sala de TV", "Sala integrada", "Cozinha", "Cozinha americana",
      "Cozinha planejada", "Copa", "Lavanderia", "Área de serviço", "Despensa", "Escritório",
      "Home office", "Lavabo", "Banheiro social", "Suíte", "Suíte master", "Closet",
      "Dormitório", "Quarto de hóspedes", "Varanda", "Sacada", "Varanda gourmet", "Terraço",
      "Área gourmet", "Espaço gourmet", "Churrasqueira privativa", "Quintal", "Jardim", "Corredor lateral",
      "Garagem coberta", "Garagem descoberta", "Depósito", "Hobby box", "Porão", "Sótão",
      "Mezanino", "Edícula", "Banheiro externo", "Dependência de empregada", "Área técnica", "Hall de entrada",
      "Living", "Sala dois ambientes", "Sala ampla", "Cozinha integrada", "Área externa", "Piscina privativa",
      "Sauna privativa"
    ];

    // 3. PROXIMIDADES
    const proximidadesOptions = [
      "Próximo a mercado", "Próximo a supermercado", "Próximo a padaria", "Próximo a farmácia", "Próximo a hospital",
      "Próximo a posto de saúde", "Próximo a escola", "Próximo a faculdade", "Próximo a creche", "Próximo a shopping",
      "Próximo a restaurante", "Próximo a academia", "Próximo a banco", "Próximo a lotérica", "Próximo a posto de combustível",
      "Próximo a ponto de ônibus", "Próximo a terminal de ônibus", "Próximo a avenida principal", "Próximo a rodovia", "Próximo a comércio local",
      "Próximo ao centro", "Próximo a parque", "Próximo a praça", "Próximo a igreja", "Próximo a condomínio empresarial",
      "Próximo a centro comercial", "Próximo a escolas particulares", "Próximo a escolas públicas", "Próximo a clínicas", "Próximo a pet shop",
      "Próximo a salão de beleza", "Próximo a lojas", "Próximo a serviços essenciais", "Fácil acesso à Raposo Tavares", "Fácil acesso à Castelo Branco",
      "Fácil acesso ao centro de Sorocaba", "Fácil acesso ao Campolim", "Fácil acesso à Zona Industrial", "Fácil acesso a Votorantim", "Fácil acesso a Itu",
      "Fácil acesso a Porto Feliz", "Região valorizada", "Bairro tranquilo", "Rua residencial", "Região com alto potencial de valorização"
    ];

    // 4. INSTALAÇÕES
    const instalacoesOptions = [
      "Ar-condicionado", "Infraestrutura para ar-condicionado", "Aquecimento solar", "Aquecimento a gás", "Boiler",
      "Energia solar", "Placas solares", "Gás encanado", "Gás individualizado", "Água individualizada",
      "Energia individualizada", "Internet cabeada", "Fibra óptica disponível", "Interfone", "Portão eletrônico",
      "Fechadura eletrônica", "Sistema de alarme", "Câmeras de segurança", "Cerca elétrica", "Sensor de presença",
      "Automação residencial", "Tomadas USB", "Iluminação em LED", "Projeto luminotécnico", "Infraestrutura para carregador elétrico",
      "Caixa d’água", "Cisterna", "Poço artesiano", "Sistema de irrigação", "Exaustor",
      "Coifa", "Cooktop", "Forno embutido", "Armários planejados", "Elevador",
      "Elevador privativo", "Acesso PCD", "Rampa de acesso", "Gerador", "Sistema de reaproveitamento de água",
      "Preparação para energia fotovoltaica"
    ];

    // 5. ACABAMENTOS
    const acabamentosOptions = [
      "Piso porcelanato", "Piso cerâmico", "Piso laminado", "Piso vinílico", "Piso de madeira",
      "Piso frio", "Mármore", "Granito", "Bancadas em granito", "Bancadas em mármore",
      "Bancadas em quartzo", "Revestimento 3D", "Gesso", "Sanca em gesso", "Teto rebaixado",
      "Iluminação embutida", "Esquadrias de alumínio", "Esquadrias pretas", "Janelas amplas", "Portas de madeira",
      "Porta pivotante", "Porta balcão", "Box blindex", "Nicho no banheiro", "Cuba esculpida",
      "Metais de alto padrão", "Louças modernas", "Pintura nova", "Acabamento premium", "Acabamento alto padrão",
      "Acabamento moderno", "Acabamento clean", "Móveis planejados", "Armários embutidos", "Cozinha planejada",
      "Banheiros planejados", "Closets planejados", "Paisagismo", "Fachada moderna", "Fachada contemporânea",
      "Pé direito alto", "Pé direito duplo"
    ];

    // 6. LAZER
    const lazerOptions = [
      "Piscina", "Piscina adulto", "Piscina infantil", "Piscina aquecida", "Deck molhado",
      "Academia", "Espaço fitness", "Salão de festas", "Salão gourmet", "Espaço gourmet",
      "Churrasqueira", "Quiosque com churrasqueira", "Playground", "Brinquedoteca", "Quadra poliesportiva",
      "Quadra de tênis", "Quadra de beach tennis", "Campo de futebol", "Espaço pet", "Pet place",
      "Pet care", "Coworking", "Sala de reuniões", "Cinema", "Sala de jogos", "Espaço teen",
      "Espaço kids", "Sauna", "Spa", "Ofurô", "Jacuzzi", "Redário",
      "Horta comunitária", "Praça interna", "Jardim", "Bosque", "Pista de caminhada",
      "Ciclovia interna", "Bicicletário", "Market interno", "Mini mercado", "Portaria 24 horas",
      "Portaria remota", "Segurança 24 horas", "Controle de acesso", "Câmeras de segurança", "Zeladoria",
      "Elevador", "Garagem coberta", "Vagas para visitantes", "Hall social", "Hall de entrada",
      "Lounge", "Rooftop", "Solarium", "Espaço delivery", "Lavanderia compartilhada"
    ];

    // 7. CARACTERÍSTICAS DO APARTAMENTO
    const caracteristicasApartamentoOptions = [
      "Andar alto", "Andar baixo", "Frente", "Fundos", "Lateral",
      "Vista livre", "Sol da manhã", "Sol da tarde", "Sacada", "Sacada gourmet",
      "Sacada envidraçada", "Varanda", "Varanda gourmet", "Churrasqueira na varanda", "Cozinha integrada",
      "Sala integrada", "Planta inteligente", "Ambientes integrados", "Suíte master", "Closet",
      "Lavabo", "Depósito privativo", "Hobby box", "Vaga coberta", "Vaga demarcada",
      "Duas vagas", "Três vagas", "Elevador social", "Elevador de serviço", "Entrada social",
      "Entrada de serviço", "Hall privativo", "Apartamento mobiliado", "Apartamento reformado", "Apartamento novo",
      "Infraestrutura para ar-condicionado", "Fechadura eletrônica"
    ];

    // 8. CARACTERÍSTICAS DO EMPREENDIMENTO
    const caracteristicasEmpreendimentoOptions = [
      "Torre única", "Múltiplas torres", "Condomínio clube", "Condomínio fechado", "Fachada moderna",
      "Fachada contemporânea", "Alto padrão construtivo", "Hall social decorado", "Elevadores modernos", "Portaria 24 horas",
      "Portaria remota", "Controle de acesso", "Guarita blindada", "Segurança monitorada", "Circuito de câmeras",
      "Vagas para visitantes", "Gerador de energia", "Acesso PCD", "Paisagismo", "Área verde",
      "Área de convivência", "Espaço delivery", "Administração condominial", "Baixo custo condominial", "Medidores individuais",
      "Gás encanado", "Água individualizada", "Energia individualizada", "Coleta seletiva", "Bicicletário",
      "Infraestrutura para carro elétrico", "Projeto sustentável", "Captação de água da chuva", "Energia fotovoltaica"
    ];

    // 9. OPÇÕES DE CATEGORIA DO IMÓVEL
    const categoriasImovelOptions = [
      "Residencial", "Comercial", "Industrial", "Rural", "Terreno",
      "Condomínio", "Lançamento", "Alto Padrão", "Investimento", "Temporada",
      "Misto", "Corporativo", "Galpão / Logística", "Área Comercial", "Área Rural",
      "Casa em Condomínio", "Apartamento", "Sala Comercial", "Loja", "Prédio Comercial",
      "Chácara", "Sítio", "Fazenda"
    ];

    // 10. TIPOS DE IMÓVEL
    const tiposImovelOptions = [
      "Apartamento", "Casa", "Casa em Condomínio", "Sobrado", "Cobertura",
      "Duplex", "Studio", "Kitnet", "Sala Comercial", "Loja",
      "Galpão", "Prédio Comercial", "Terreno", "Terreno em Condomínio", "Área Comercial",
      "Área Industrial", "Chácara", "Sítio", "Fazenda", "Barracão",
      "Ponto Comercial", "Flat", "Loft", "Casa Térrea"
    ];

    const extraLegacyDefaults = {
      tiposNegocio: [ "Venda", "Locação", "Venda e Locação" ],
      statusImovel: [ "Disponível", "Vendido", "Alugado", "Reservado", "Em negociação", "Rascunho", "Indisponível" ],
      faixasPreco: [ "Até R$ 300 mil", "R$ 300 mil a R$ 500 mil", "R$ 500 mil a R$ 800 mil", "R$ 800 mil a R$ 1 milhão", "Acima de R$ 1 milhão" ],
      cidades: [ "Sorocaba", "Votorantim", "Itu", "Salto", "Araçoiaba da Serra" ]
    };

    // Run custom-built function to seed each without crashing others
    reports["caracteristicas"] = await seedOptionsIfMissing("caracteristicas", caracteristicasOptions);
    reports["ambientes"] = await seedOptionsIfMissing("ambientes", ambientesOptions);
    reports["proximidades"] = await seedOptionsIfMissing("proximidades", proximidadesOptions);
    reports["instalacoes"] = await seedOptionsIfMissing("instalacoes", instalacoesOptions);
    reports["acabamentos"] = await seedOptionsIfMissing("acabamentos", acabamentosOptions);
    reports["lazer"] = await seedOptionsIfMissing("lazer", lazerOptions);
    reports["caracteristicasApartamento"] = await seedOptionsIfMissing("caracteristicasApartamento", caracteristicasApartamentoOptions);
    reports["caracteristicasEmpreendimento"] = await seedOptionsIfMissing("caracteristicasEmpreendimento", caracteristicasEmpreendimentoOptions);
    reports["categoriasImovel"] = await seedOptionsIfMissing("categoriasImovel", categoriasImovelOptions);
    reports["tiposImovel"] = await seedOptionsIfMissing("tiposImovel", tiposImovelOptions);

    // Seed extras
    for (const [name, defaults] of Object.entries(extraLegacyDefaults)) {
      reports[name] = await seedOptionsIfMissing(name, defaults);
    }

    // Seed Bairros
    try {
      const snapBairros = await getDocs(collection(db, "bairros"));
      const validBairros = snapBairros.docs.filter(d => d.id !== "init" && d.data()?.init !== true);
      if (validBairros.length === 0) {
        console.log(`Seeding default bairros...`);
        const defaultBairros = [
          "Centro", "Campolim", "Jardim América", "Jardim Europa", "Jardim Faculdade", 
          "Jardim Vergueiro", "Jardim São Carlos", "Jardim Simus", "Jardim Santa Rosália", "Condomínio Alphaville Nova Esplanada"
        ];
        const batch = writeBatch(db);
        defaultBairros.forEach((val, idx) => {
          const cleanId = `bai_${idx}_${Date.now()}`;
          const docRef = doc(db, "bairros", cleanId);
          batch.set(docRef, {
            id: cleanId,
            nome: val,
            label: val,
            value: val,
            cidadeId: "fc_0",
            cidadeNome: "Sorocaba",
            cidade: "Sorocaba",
            estado: "SP",
            ativo: true,
            ordem: idx,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
        reports["bairros"] = defaultBairros.length;
      }
    } catch (bairrosError) {
      console.warn("Erro ao semear bairros:", bairrosError);
    }

    // Seed home, sections, company, appearance settings if missing
    try {
      const homeRef = doc(db, "siteSettings", "home");
      const homeSnap = await getDoc(homeRef);
      if (!homeSnap.exists()) {
        await setDoc(homeRef, {
          homeTitle: "RB Sorocaba - Negócios Imobiliários de Alto Padrão",
          homeSubtitle: "Seu novo estilo de vida começa aqui. Encontre as melhores casas e apartamentos em Sorocaba.",
          homeBadge: "ALTO PADRÃO",
          homePrimaryButtonText: "Ver Catálogo",
          homePrimaryButtonLink: "#catalogo",
          homeSecondaryButtonText: "Falar no WhatsApp",
          homeSecondaryButtonLink: "https://wa.me/5515991143213",
          homeBackgroundImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
          homeHeroEffectEnabled: true,
          homeHighlightText: "A imobiliária de confiança da sua família",
          homeCommerceCall: "Atendimento exclusivo e personalizado de ponta a ponta",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (homeError) {
      console.warn("Erro ao semear siteSettings (home):", homeError);
    }

    try {
      const secRef = doc(db, "siteSettings", "sections");
      const secSnap = await getDoc(secRef);
      if (!secSnap.exists()) {
        await setDoc(secRef, {
          featuredTitle: "Imóveis em Destaque",
          featuredSubtitle: "Confira nossa seleção exclusiva de propriedades de alto padrão em Sorocaba",
          aboutTitle: "Sobre a RB Sorocaba",
          aboutText: "Com anos de experiência no mercado imobiliário de Sorocaba, nos especializamos na curadoria de imóveis de médio e alto padrão, oferecendo segurança, sofisticação e atendimento ultra-personalizado.",
          aboutImageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
          brokersTitle: "Nossos Corretores",
          brokersSubtitle: "Profissionais altamente capacitados prontos para apresentar o seu novo lar",
          contactTitle: "Fale Conosco",
          contactSupportText: "Tem alguma dúvida ou deseja agendar uma visita especial? Deixe sua mensagem.",
          ctaTitle: "Pronto para Conquistar o Seu Espaço?",
          ctaText: "Converse com um de nossos assessores e tenha acesso a oportunidades exclusivas antes mesmo de irem ao mercado.",
          ctaButtonText: "Enviar Mensagem via WhatsApp",
          ctaButtonLink: "https://wa.me/5515991143213",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (sectionsError) {
      console.warn("Erro ao semear siteSettings (sections):", sectionsError);
    }

    try {
      const compRef = doc(db, "siteSettings", "company");
      const compSnap = await getDoc(compRef);
      if (!compSnap.exists()) {
        await setDoc(compRef, {
          nomeFantasia: "RB Sorocaba Negócios Imobiliários",
          razaoSocial: "RB Sorocaba Negócios Imobiliários Ltda",
          cnpj: "00.000.000/0001-00",
          creciPj: "CRECI 123456-J",
          creciResponsavel: "CRECI 278765-F",
          telefone: "(15) 99114-3213",
          whatsapp: "+55 (15) 99114-3213",
          email: "atendimento@rbsorocaba.com.br",
          site: "www.rbsorocaba.com.br",
          endereco: "Av. Campolim",
          numero: "1200",
          complemento: "Sala 45",
          bairro: "Campolim",
          cidade: "Sorocaba",
          estado: "SP",
          cep: "18047-620",
          responsavelLegal: "Elias Borges",
          cpfResponsavel: "000.000.000-00",
          cargoResponsavel: "Diretor Comercial",
          logoCabecalhoUrl: "",
          marcaDaguaUrl: "",
          logoRodapeUrl: "",
          faviconUrl: "",
          textoRodapeContratos: "Este documento é confidencial e exclusivo da proposta de intermediação imobiliária.",
          fraseInstitucional: "Ética, sofisticação e transparência na realização de seus sonhos.",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (companyError) {
      console.warn("Erro ao semear siteSettings (company):", companyError);
    }

    try {
      const appRef = doc(db, "siteSettings", "appearance");
      const appSnap = await getDoc(appRef);
      if (!appSnap.exists()) {
        await setDoc(appRef, {
          primaryColor: "#050505",
          secondaryColor: "#fb923c",
          backgroundColor: "#fcfcfc",
          textColor: "#1c1917",
          logoUrl: "https://i.postimg.cc/L6NcpGfc/ELIAS.jpg",
          navbarLogoUrl: "",
          footerLogoUrl: "",
          faviconUrl: "",
          defaultPropertyImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
          defaultHeroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
          effectsEnabled: true,
          animationsEnabled: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (appearanceError) {
      console.warn("Erro ao semear siteSettings (appearance):", appearanceError);
    }

    return { success: true, counts: reports, message: "Opções padrão adicionadas com sucesso." };
  } catch (error) {
    console.error("Error during seedDefaultSettingsIfEmpty:", error);
    return { success: false, counts: reports, message: `Erro ao executar o seed: ${error}` };
  }
};

/**
 * Publishes or unpublishes property directly from site.
 * Point 4: Toggles publicado and publicadoNoSite.
 */
export const publishPropertyToSite = async (id: string, isPublished: boolean) => {
  try {
    const docRef = doc(db, "imoveis", id);
    await updateDoc(docRef, {
      publicado: isPublished,
      publicadoNoSite: isPublished,
      atualizadoEm: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error(`Erro ao ${isPublished ? 'publicar' : 'remover'} o imóvel:`, error);
    throw error;
  }
};

/**
 * Gets the property code prefix based on its type
 */
export const getPrefixoCodigoImovel = (tipoImovel: string): string => {
  const tipo = String(tipoImovel || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const mapa: { [key: string]: string } = {
    "apartamento": "AP",
    "casa": "CA",
    "terreno": "TE",
    "cobertura": "CO",
    "sala comercial": "SA",
    "sobrado": "SO",
    "galpao": "GA",
    "chacara": "CH",
    "kitnet": "KI",
    "studio": "ST",
    "loja": "LJ",
    "predio comercial": "PC",
    "duplex": "DU"
  };

  if (mapa[tipo]) return mapa[tipo];

  for (const key of Object.keys(mapa)) {
    if (tipo.includes(key)) {
      return mapa[key];
    }
  }

  return "IM";
};

/**
 * Generates the next sequential property code using Firestore Transaction
 */
export const gerarCodigoImovelComTransaction = async (tipoImovel: string): Promise<string> => {
  const prefixo = getPrefixoCodigoImovel(tipoImovel);
  const counterRef = doc(db, "counters", `imoveis_${prefixo}`);

  try {
    const codigo = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextNumber = 1;

      if (counterSnap.exists()) {
        nextNumber = counterSnap.data().nextNumber || 1;
      }

      const codigoGerado = `${prefixo}${String(nextNumber).padStart(3, "0")}`;

      transaction.set(counterRef, {
        prefixo,
        nextNumber: nextNumber + 1,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return codigoGerado;
    });

    return codigo;
  } catch (error) {
    console.error(`Erro ao gerar código por transação para o prefixo ${prefixo}:`, error);
    // Safe distinct fallback
    const randSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${prefixo}${randSuffix}`;
  }
};

/**
 * Obtains the current code preview (read-only real-time preview)
 */
export const obterPreviaCodigoImovel = async (tipoImovel: string): Promise<string> => {
  const prefixo = getPrefixoCodigoImovel(tipoImovel);
  const counterRef = doc(db, "counters", `imoveis_${prefixo}`);
  try {
    const snap = await getDoc(counterRef);
    let nextNumber = 1;
    if (snap.exists()) {
      nextNumber = snap.data().nextNumber || 1;
    }
    return `${prefixo}${String(nextNumber).padStart(3, "0")}`;
  } catch (error) {
    console.error("Erro ao obter prévia de código:", error);
    return `${prefixo}001`;
  }
};

/**
 * Searches a property in the inventory collection by its code or its raw Firestore ID as fallback
 */
export const getImovelByCodigo = async (codigoParam: string) => {
  const codigoOriginal = String(codigoParam || "").trim();
  if (!codigoOriginal) return null;
  const codigoUpper = codigoOriginal.toUpperCase();
  const codigoLower = codigoOriginal.toLowerCase();

  const tentativas = [
    { field: "codigoImovel", value: codigoUpper },
    { field: "codigo", value: codigoUpper },
    { field: "slug", value: codigoLower },
    { field: "referencia", value: codigoUpper }
  ];

  for (const tentative of tentativas) {
    try {
      const q = query(
        collection(db, "imoveis"),
        where(tentative.field, "==", tentative.value)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docItem = snap.docs[0];
        return {
          id: docItem.id,
          ...docItem.data()
        } as any;
      }
    } catch (e) {
      console.warn(`Erro ao buscar no Firestore por ${tentative.field}:`, e);
    }
  }

  // Fallback by direct Firestore ID lookup
  try {
    const ref = doc(db, "imoveis", codigoOriginal);
    const byId = await getDoc(ref);
    if (byId.exists()) {
      return {
        id: byId.id,
        ...byId.data()
      } as any;
    }
  } catch (e) {
    console.warn("Erro ao buscar no Firestore por ID do imóvel:", e);
  }

  return null;
};

/**
 * Adds a new property to the inventory
 */
export const addPropertyToInventory = async (propertyData: any) => {
  let code = propertyData.codigo || propertyData.codigoImovel || "";
  try {
    const isCodeEmptyOrTemporary = !code || String(code).toUpperCase().startsWith("REF");

    if (isCodeEmptyOrTemporary) {
      const tipo = propertyData.type || propertyData.tipoImovel || "Outros";
      code = await gerarCodigoImovelComTransaction(tipo);
    } else {
      code = String(code).trim().toUpperCase();
    }

    const dataWithCode = {
      ...propertyData,
      codigo: code,
      codigoImovel: code
    };

    const firestoreData = sanitizeFirestoreData(buildStandardPropertyDoc(dataWithCode, true));
    const docRef = await addDoc(collection(db, "imoveis"), firestoreData);
    
    // Save to local cache backup
    try {
      const cacheItem = { id: docRef.id, ...firestoreData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      saveToLocalCache("imoveis", cacheItem);
    } catch (e) {
      console.warn("Erro ao salvar cache de imóvel:", e);
    }

    return { success: true, id: docRef.id, codigo: code };
  } catch (error) {
    console.error("Erro ao adicionar imóvel no Firestore, salvando no cache local:", error);
    try {
      const tempId = "local_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const fallbackCode = code || ("REF" + Math.floor(Math.random() * 10000));
      const dataWithCode = { ...propertyData, codigo: fallbackCode, codigoImovel: fallbackCode };
      const fallbackData = sanitizeFirestoreData(buildStandardPropertyDoc(dataWithCode, true));
      const cacheItem = { id: tempId, ...fallbackData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      saveToLocalCache("imoveis", cacheItem);
      return { success: true, id: tempId, codigo: fallbackCode, localFallback: true };
    } catch (fallbackError) {
      console.error("Erro fatal ao salvar imóvel no cache de backup:", fallbackError);
      throw error;
    }
  }
};

/**
 * Updates an existing property
 */
export const updatePropertyInInventory = async (id: string, propertyData: any) => {
  let code = propertyData.codigo || propertyData.codigoImovel || "";
  try {
    const docRef = doc(db, "imoveis", id);

    const isCodeEmptyOrTemporary = !code || String(code).toUpperCase().startsWith("REF");

    if (isCodeEmptyOrTemporary) {
      const tipo = propertyData.type || propertyData.tipoImovel || "Outros";
      code = await gerarCodigoImovelComTransaction(tipo);
    } else {
      code = String(code).trim().toUpperCase();
    }

    const dataWithCode = {
      ...propertyData,
      codigo: code,
      codigoImovel: code
    };

    const firestoreData = sanitizeFirestoreData(buildStandardPropertyDoc(dataWithCode, false));
    await updateDoc(docRef, firestoreData);
    
    // Update local cache
    try {
      saveToLocalCache("imoveis", { id, ...firestoreData, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn("Erro ao atualizar cache de imóvel:", e);
    }

    return { success: true, id };
  } catch (error) {
    console.warn("Erro ao atualizar no Firestore, atualizando cache local:", error);
    try {
      const dataWithCode = { ...propertyData, codigo: code, codigoImovel: code };
      const fallbackData = sanitizeFirestoreData(buildStandardPropertyDoc(dataWithCode, false));
      saveToLocalCache("imoveis", { id, ...fallbackData, updatedAt: new Date().toISOString() });
      return { success: true, id, localFallback: true };
    } catch (e) {
      throw error;
    }
  }
};


/**
 * Deletes a property
 */
export const deletePropertyFromInventory = async (id: string) => {
  try {
    const docRef = doc(db, "imoveis", id);
    await deleteDoc(docRef);
    removeFromLocalCache("imoveis", id);
    return { success: true };
  } catch (error) {
    console.warn("Erro ao deletar imóvel do Firestore, removendo do cache local:", error);
    removeFromLocalCache("imoveis", id);
    return { success: true };
  }
};

/**
 * Saves a new lead to the "leads" collection
 */
export const saveLead = async (leadData: { name: string; phone: string; email?: string; interest?: string; message?: string }) => {
  try {
    const docRef = await addDoc(collection(db, "leads"), {
      ...leadData,
      createdAt: serverTimestamp(),
      source: "Website RB SOROCABA NEGOCIOS IMOBILIARIOS"
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding lead: ", error);
    throw error;
  }
};

/**
 * Updates a visit's status
 */
export const updateVisitStatus = async (visitId: string, status: 'pending' | 'confirmed' | 'cancelled') => {
  try {
    const docRef = doc(db, "visits", visitId);
    await updateDoc(docRef, { 
      status,
      updatedAt: serverTimestamp() 
    });
    return { success: true };
  } catch (error) {
    throw handleFirestoreError(error, 'update', `visits/${visitId}`);
  }
};

/**
 * Deletes a visit
 */
export const deleteVisit = async (visitId: string) => {
  try {
    const docRef = doc(db, "visits", visitId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    throw handleFirestoreError(error, 'delete', `visits/${visitId}`);
  }
};

/**
 * Error handler for Firestore operations
 */
export function handleFirestoreError(error: any, operationType: string, path: string) {
  const errorInfo = {
    error: error.message || 'Unknown error',
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || 'anonymous',
      email: auth.currentUser?.email || 'N/A',
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || true,
      providerInfo: auth.currentUser?.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName || '',
        email: p.email || ''
      })) || []
    }
  };
  return new Error(JSON.stringify(errorInfo));
}

/**
 * Schedules a new visit
 */
export const scheduleVisit = async (visitData: { 
  propertyId: string | number;
  propertyName: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  message?: string;
}) => {
  try {
    const docRef = await addDoc(collection(db, "visits"), {
      ...visitData,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    throw handleFirestoreError(error, 'create', 'visits');
  }
};

/**
 * Gets all visits
 */
export const getVisits = async () => {
  try {
    const q = query(collection(db, "visits"));
    const querySnapshot = await getDocs(q);
    const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    list.sort((a, b) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (b.time || "").localeCompare(a.time || "");
    });
    return list;
  } catch (error) {
    throw handleFirestoreError(error, 'list', 'visits');
  }
};

/**
 * Blocks a specific time slot
 */
export const blockSlot = async (slotData: { date: string; time: string; reason?: string }) => {
  try {
    const docRef = await addDoc(collection(db, "blocked_slots"), {
      ...slotData,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    throw handleFirestoreError(error, 'create', 'blocked_slots');
  }
};

/**
 * Gets all blocked slots
 */
export const getBlockedSlots = async () => {
  try {
    const q = query(collection(db, "blocked_slots"));
    const querySnapshot = await getDocs(q);
    const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    list.sort((a, b) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (b.time || "").localeCompare(a.time || "");
    });
    return list;
  } catch (error) {
    throw handleFirestoreError(error, 'list', 'blocked_slots');
  }
};

/**
 * Unblocks a slot
 */
export const unblockSlot = async (slotId: string) => {
  try {
    await deleteDoc(doc(db, "blocked_slots", slotId));
    return { success: true };
  } catch (error) {
    throw handleFirestoreError(error, 'delete', `blocked_slots/${slotId}`);
  }
};

/**
 * Toggles a property in user's favorites
 */
export const toggleFavorite = async (userId: string, propertyId: string) => {
  try {
    const favRef = doc(db, "favorites", userId, "items", propertyId);
    const favDoc = await getDoc(favRef);
    
    if (favDoc.exists()) {
      await deleteDoc(favRef);
      return { action: 'removed' };
    } else {
      await setDoc(doc(db, "favorites", userId), { lastUpdated: serverTimestamp() }, { merge: true });
      await setDoc(favRef, {
        addedAt: serverTimestamp(),
      });
      return { action: 'added' };
    }
  } catch (error) {
    throw handleFirestoreError(error, 'write', `favorites/${userId}/items/${propertyId}`);
  }
};

/**
 * Listens to user favorites
 */
export const subscribeToFavorites = (userId: string, callback: (propertyIds: string[]) => void) => {
  const q = collection(db, "favorites", userId, "items");
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.id));
  }, (error) => {
    console.warn("Erro no listener de favoritos:", error);
    callback([]);
  });
};

/**
 * Listens to all registered system users in real-time
 */
export const subscribeToUsers = (callback: (users: any[]) => void) => {
  const q = collection(db, "usuarios");
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    list.sort((a: any, b: any) => (a.nome || '').localeCompare(b.nome || ''));
    callback(list);
  }, (error) => {
    console.warn("Erro no listener de usuários:", error);
    callback([]);
  });
};

/**
 * Creates or updates a user document in the "usuarios" collection
 */
export const salvarUsuario = async (userId: string | null, userData: any) => {
  try {
    const emailLower = String(userData.email || '').trim().toLowerCase();
    const finalId = userId || emailLower;
    
    const docRef = doc(db, "usuarios", finalId);
    const docData = {
      ...userData,
      email: emailLower,
      updatedAt: new Date().toISOString()
    };
    if (!userId) {
      docData.createdAt = new Date().toISOString();
    }
    
    await setDoc(docRef, docData, { merge: true });
    return { success: true, id: finalId };
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    throw error;
  }
};

/**
 * Deletes a user document
 */
export const deletarUsuario = async (userId: string) => {
  try {
    await deleteDoc(doc(db, "usuarios", userId));
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    throw error;
  }
};

/**
 * Listens to in-app notifications in real-time
 */
export const subscribeToNotifications = (callback: (notifs: any[]) => void, email?: string, perfil?: string) => {
  let q;
  const isPowerUser = perfil === 'Administrador' || perfil === 'Líder';
  
  if (isPowerUser) {
    q = query(collection(db, "notificacoes"));
  } else if (email) {
    // Satisfy security rules for regular users by querying their specific notifications directly
    q = query(
      collection(db, "notificacoes"),
      where("destinatarioEmail", "==", email)
    );
  } else {
    q = query(collection(db, "notificacoes"), where("destinatarioPerfil", "==", "none"));
  }

  return onSnapshot(q, (snapshot) => {
    let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (email || perfil) {
      list = list.filter((n: any) => {
        const matchesEmail = email && String(n.destinatarioEmail || '').toLowerCase() === email.toLowerCase();
        const matchesPerfil = perfil && n.destinatarioPerfil === perfil;
        return matchesEmail || matchesPerfil || n.destinatarioPerfil === '*';
      });
    }
    
    // Sort in memory by createdAt descending
    list.sort((a: any, b: any) => {
      const timeA = a.createdAt ? (a.createdAt.toDate?.() ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
      const timeB = b.createdAt ? (b.createdAt.toDate?.() ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
      return timeB - timeA;
    });

    callback(list);
  }, (error) => {
    console.warn("Erro no listener de notificações:", error);
    callback([]);
  });
};

/**
 * Creates a new in-app notification
 */
export const criarNotificacao = async (notifData: any) => {
  try {
    const docRef = await addDoc(collection(db, "notificacoes"), {
      ...notifData,
      lido: false,
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    return { success: false, error };
  }
};

/**
 * Marks a specific in-app notification as read
 */
export const marcarNotificacaoComoLida = async (notifId: string) => {
  try {
    await updateDoc(doc(db, "notificacoes", notifId), {
      lido: true
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return { success: false, error };
  }
};

export { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail };
export type { User };
export default app;
