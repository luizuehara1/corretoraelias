import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy, onSnapshot, setDoc } from "firebase/firestore";
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
 * Checks if a user is an admin by looking at a "whitelist" in Firestore
 * or a hardcoded list for initial setup.
 */
export const checkIfAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  // Whitelist hardcoded based on the current user email provided in metadata
  const whitelist = ['luiz.uehara1@gmail.com', 'eliasborgess@creci.org.com.br'];
  if (whitelist.includes(user.email || '')) return true;

  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists();
  } catch (error) {
    console.error("Error checking admin status:", error);
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
  let q = query(collection(db, "imoveis"), orderBy("createdAt", "desc"));
  
  if (!isAdmin) {
    q = query(collection(db, "imoveis"), where("status", "==", "ativo"), orderBy("createdAt", "desc"));
  }
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => {
      const data = doc.data();
      // Map Firestore fields (Portuguese) back to App fields (English) 
      // to avoid breaking the entire UI logic while keeping data as requested
      return {
        id: doc.id,
        title: data.titulo || data.title,
        type: data.tipo || data.type,
        city: data.cidade || data.city,
        neighborhood: data.bairro || data.neighborhood,
        price: data.preco || data.price,
        description: data.descricao || data.description,
        beds: data.quartos || data.beds,
        baths: data.banheiros || data.baths,
        parkingCovered: data.vagas || data.parkingCovered,
        area: data.area || data.area,
        image: data.imagens?.[0] || data.image,
        additionalImages: data.imagens?.slice(1) || data.additionalImages || [],
        status: data.status || "ativo",
        priceValue: data.priceValue,
        category: data.category,
        location: data.location,
        condominium: data.condominium,
        condoValue: data.condoValue,
        purpose: data.purpose,
        featured: data.featured,
        coords: data.coords,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      };
    }));
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
 * Adds a new property to the inventory
 */
export const addPropertyToInventory = async (propertyData: any) => {
  try {
    const firestoreData = {
      titulo: propertyData.title,
      tipo: propertyData.type,
      cidade: propertyData.city,
      bairro: propertyData.neighborhood,
      preco: propertyData.price,
      priceValue: propertyData.priceValue,
      descricao: propertyData.description || "",
      quartos: propertyData.beds || 0,
      banheiros: propertyData.baths || 0,
      vagas: propertyData.parkingCovered || 0,
      area: propertyData.area,
      imagens: [propertyData.image, ...(propertyData.additionalImages || [])].filter(Boolean),
      status: propertyData.status || "ativo",
      category: propertyData.category,
      location: propertyData.location,
      condominium: propertyData.condominium || "",
      condoValue: propertyData.condoValue || "",
      purpose: propertyData.purpose || "Venda",
      featured: propertyData.featured || false,
      coords: propertyData.coords || [-23.5018, -47.4581],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

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
    const firestoreData = {
      titulo: propertyData.title,
      tipo: propertyData.type,
      cidade: propertyData.city,
      bairro: propertyData.neighborhood,
      preco: propertyData.price,
      priceValue: propertyData.priceValue,
      descricao: propertyData.description || "",
      quartos: propertyData.beds || 0,
      banheiros: propertyData.baths || 0,
      vagas: propertyData.parkingCovered || 0,
      area: propertyData.area,
      imagens: [propertyData.image, ...(propertyData.additionalImages || [])].filter(Boolean),
      status: propertyData.status || "ativo",
      category: propertyData.category,
      location: propertyData.location,
      condominium: propertyData.condominium || "",
      condoValue: propertyData.condoValue || "",
      purpose: propertyData.purpose || "Venda",
      featured: propertyData.featured || false,
      coords: propertyData.coords || [-23.5018, -47.4581],
      updatedAt: serverTimestamp(),
    };
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
const handleFirestoreError = (error: any, operationType: string, path: string) => {
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
};

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
