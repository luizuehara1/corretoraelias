import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

/**
 * IMPORTANTE: Para que estas variÃ¡veis funcionem na Vercel, vocÃª deve cadastrar
 * cada uma delas nas "Environment Variables" do projeto no painel da Vercel
 * com exatamente os mesmos nomes listados abaixo.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
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
  const whitelist = ['luiz.uehara1@gmail.com'];
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
 * Saves a new lead to the "leads" collection
 */
export const saveLead = async (leadData: { name: string; phone: string; email?: string; interest?: string; message?: string }) => {
  try {
    const docRef = await addDoc(collection(db, "leads"), {
      ...leadData,
      createdAt: serverTimestamp(),
      source: "Website Corretora Elias"
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding lead: ", error);
    throw error;
  }
};

export { onAuthStateChanged };
export type { User };
export default app;
