import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

/**
 * IMPORTANTE: Para que estas variáveis funcionem na Vercel, você deve cadastrar
 * cada uma delas nas "Environment Variables" do projeto no painel da Vercel
 * com exatamente os mesmos nomes listados abaixo.
 */
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId); 
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

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
 * Checks if a user is an admin by looking at a "whitelist" in Firestore
 * or a hardcoded list for initial setup.
 * If the user is on the whitelist but does not have a record in Firestore,
 * we automatically provision the record securely.
 */
export const checkIfAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  // Whitelist hardcoded based on the current user email provided in metadata
  const whitelist = ['luiz.uehara1@gmail.com', 'eliasborgess@creci.org.com.br'];
  const isWhitelisted = whitelist.includes(user.email || '');

  try {
    const existsInDb = await checkIsAdmin(user.uid);

    if (existsInDb) {
      return true;
    }

    // Provision automatically if whitelisted but not in DB yet
    if (isWhitelisted) {
      console.log(`Usuário herda permissão da lista. Provisionando registro admins/${user.uid} automaticamente...`);
      try {
        await setDoc(doc(db, "admins", user.uid), {
          uid: user.uid,
          email: user.email || '',
          nome: user.displayName || user.email?.split('@')[0] || 'Administrador',
          role: "admin",
          ativo: true,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Erro ao registrar admin no firestore, prosseguindo por estar na lista:", err);
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking or provisioning admin status:", error);
    // Safe fallback to email whitelist if Firestore fails
    if (isWhitelisted) {
      return true;
    }
    return false;
  }
};

/**
 * Listens to visits in real-time
 */
export const subscribeToVisits = (callback: (visits: any[]) => void) => {
  const q = query(collection(db, "visits"), orderBy("date", "desc"), orderBy("time", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

/**
 * Listens to properties in real-time
 */
export const subscribeToProperties = (callback: (properties: any[]) => void, isAdmin: boolean = false) => {
  // Fetch the entire collection and sort/filter in memory.
  // This is highly secure, prevents any "Firestore Index Missing" issues,
  // and enables robust fallback checks for published properties.
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

    // Handle filtering based on role / status
    if (!isAdmin) {
      // Return only published ones
      list = list.filter(p => p.publicadoNoSite === true || p.publicado === true);
    }
    
    // Sort in memory by createdAt desc (or default index fallback)
    list.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bTime = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return bTime - aTime;
    });

    callback(list);
  }, (error) => {
    console.error("Erro no listener de imóveis:", error);
  });
};


/**
 * Listens to blocked slots in real-time
 */
export const subscribeToBlockedSlots = (callback: (slots: any[]) => void) => {
  const q = query(collection(db, "blocked_slots"), orderBy("date", "desc"), orderBy("time", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  const docData: any = {
    codigo: codeValue || "REF" + Math.floor(Math.random() * 10000),
    codigoImovel: codeValue || "REF" + Math.floor(Math.random() * 10000),

    titulo: tituloValue,
    nomeEdificio: propertyData.condominium || propertyData.nomeEdificio || "",

    tipoImovel: propertyData.type || propertyData.tipoImovel || "",
    tipoNegocio: tipoNegocioValue,
    category: propertyData.category || "Residencial",
    purpose: (tipoNegocioValue === "Venda e Locação" ? "Venda" : tipoNegocioValue) as any,
    status: statusStr,
    statusVenda,
    statusLocacao,

    publicado: propertyData.publicado !== undefined ? !!propertyData.publicado : publicado,
    publicadoNoSite: propertyData.publicadoNoSite !== undefined ? !!propertyData.publicadoNoSite : publicadoNoSite,

    vendido,
    alugado,
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

export const seedDefaultSettingsIfEmpty = async () => {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.warn("Usuário sem permissão para criar configurações padrão: não autenticado.");
      return;
    }

    const isUserAdmin = await checkIfAdmin(user);

    if (!isUserAdmin) {
      console.warn("Usuário sem permissão para criar configurações padrão: não é admin.");
      return;
    }

    const collectionsToSeed = [
      { name: "tiposImovel", defaults: [ "Apartamento", "Casa", "Casa em Condomínio", "Sobrado", "Terreno", "Terreno em Condomínio", "Sala Comercial", "Ponto Comercial", "Galpão", "Chácara", "Sítio", "Área Industrial", "Área Comercial", "Kitnet", "Studio", "Cobertura", "Loft" ] },
      { name: "tiposNegocio", defaults: [ "Venda", "Locação", "Venda e Locação" ] },
      { name: "statusImovel", defaults: [ "Disponível", "Vendido", "Alugado", "Reservado", "Em negociação", "Rascunho", "Indisponível" ] },
      { name: "faixasPreco", defaults: [ "Até R$ 300 mil", "R$ 300 mil a R$ 500 mil", "R$ 500 mil a R$ 800 mil", "R$ 800 mil a R$ 1 milhão", "Acima de R$ 1 milhão" ] },
      { name: "cidades", defaults: [ "Sorocaba", "Votorantim", "Itu", "Salto", "Araçoiaba da Serra" ] },
      { name: "caracteristicas", defaults: [ "Mobiliado", "Semi mobiliado", "Decorado", "Novo", "Usado", "Reformado", "Alto padrão", "Andar alto", "Andar baixo", "Sol da manhã", "Sol da tarde", "Fechadura eletrônica", "Varanda gourmet", "Churrasqueira privativa", "Piscina privativa", "Quintal" ] },
      { name: "instalacoes", defaults: [ "Ar condicionado", "Aquecimento a gás", "Gás central", "Interfone", "Portão eletrônico", "Fechadura eletrônica", "Energia solar", "Gerador" ] },
      { name: "acabamentos", defaults: [ "Porcelanato", "Piso laminado", "Piso vinílico", "Piso cerâmico", "Mármore", "Granito", "Teto rebaixado", "Iluminação em LED", "Móveis planejados" ] },
      { name: "lazer", defaults: [ "Piscina", "Academia", "Salão de festas", "Espaço gourmet", "Brinquedoteca", "Playground", "Quadra poliesportiva", "Sauna", "Pet place", "Mini mercado" ] },
      { name: "ambientes", defaults: [ "Sala de estar", "Sala de jantar", "Sala de TV", "Cozinha", "Varanda", "Despensa", "Home office", "Escritório", "Closet", "Suíte master", "Lavabo", "Quintal" ] },
      { name: "caracteristicasApartamento", defaults: [ "Sacada", "Varanda gourmet", "Piso laminado", "Porcelanato", "Box Blindex", "Armários embutidos" ] },
      { name: "caracteristicasEmpreendimento", defaults: [ "Elevador", "Portaria 24 horas", "Segurança 24h", "Bicicletário", "Salão de festas", "Vagas para visitantes" ] },
      { name: "proximidades", defaults: [ "Mercado", "Supermercado", "Farmácia", "Padaria", "Academia", "Escola", "Universidade", "Hospital", "Shopping", "Restaurante", "Ponto de ônibus", "Acesso rápido ao centro", "Shopping Iguatemi Esplanada", "Shopping Cidade Sorocaba" ] }
    ];

    for (const coll of collectionsToSeed) {
      try {
        const snap = await getDocs(collection(db, coll.name));
        const validDocs = snap.docs.filter(d => d.id !== "init" && d.data()?.init !== true);
        if (validDocs.length === 0) {
          console.log(`Seeding default options for ${coll.name}...`);
          const batch = writeBatch(db);
          coll.defaults.forEach((val, idx) => {
            const cleanId = `${coll.name.toLowerCase().substring(0, 3)}_${idx}_${Date.now()}`;
            const docRef = doc(db, coll.name, cleanId);
            batch.set(docRef, {
              id: cleanId,
              nome: val,
              label: val,
              value: val,
              ativo: true,
              ordem: idx,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          });
          await batch.commit();
        }
      } catch (colError) {
        console.warn(`Erro ao semear coleção ${coll.name} (leitura / escrita negada pelas regras):`, colError);
      }
    }

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
      }
    } catch (bairrosError) {
      console.warn("Erro ao semear bairros:", bairrosError);
    }

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

  } catch (error) {
    console.error("Error during seedDefaultSettingsIfEmpty:", error);
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
 * Adds a new property to the inventory
 */
export const addPropertyToInventory = async (propertyData: any) => {
  try {
    const firestoreData = buildStandardPropertyDoc(propertyData, true);
    const docRef = await addDoc(collection(db, "imoveis"), firestoreData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding property: ", error);
    throw error;
  }
};

/**
 * Updates an existing property
 */
export const updatePropertyInInventory = async (id: string, propertyData: any) => {
  try {
    const docRef = doc(db, "imoveis", id);
    const firestoreData = buildStandardPropertyDoc(propertyData, false);
    await updateDoc(docRef, firestoreData);
    return { success: true };
  } catch (error) {
    console.error("Error updating property: ", error);
    throw error;
  }
};


/**
 * Deletes a property
 */
export const deletePropertyFromInventory = async (id: string) => {
  try {
    const docRef = doc(db, "imoveis", id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting property: ", error);
    throw error;
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
    const q = query(collection(db, "visits"), orderBy("date", "desc"), orderBy("time", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    const q = query(collection(db, "blocked_slots"), orderBy("date", "desc"), orderBy("time", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  });
};

export { onAuthStateChanged };
export type { User };
export default app;
