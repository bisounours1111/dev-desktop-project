import React, { createContext, useContext, useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDze1LjysMb5lfYtnOALNzV12Axv-d8M7U",
  authDomain: "minecraftcliver-b6796.firebaseapp.com",
  projectId: "minecraftcliver-b6796",
  storageBucket: "minecraftcliver-b6796.firebasestorage.app",
  messagingSenderId: "443793790673",
  appId: "1:443793790673:web:c2a9c0c6d808306b8157f0",
  measurementId: "G-7786VVC39P",
};

const debug = false;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effacer le localStorage en mode développement
  useEffect(() => {
    if (debug) {
      localStorage.clear();
      sessionStorage.clear();
      setCurrentUser(null);
      setUserRole(null);
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (userDoc.exists()) {
      setUserRole(userDoc.data().role);
    }
    return userCredential;
  }

  async function updateEmail(email, user = auth.currentUser) {
    if (user) {
      await firebaseUpdateEmail(user, email);
    }
  }

  async function updatePassword(password, user = auth.currentUser) {
    if (user) {
      await firebaseUpdatePassword(user, password);
    }
  }

  async function updateProfile(profile) {
    const user = auth.currentUser;
    if (user) {
      // Convertir le username en displayName pour Firebase
      const firebaseProfile = {
        ...profile,
        displayName: profile.username,
      };
      await firebaseUpdateProfile(user, firebaseProfile);

      // Mettre à jour également dans la base de données Firestore
      await updateDoc(doc(db, "users", user.uid), {
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
      setCurrentUser({
        ...currentUser,
        ...profile,
      });
    }
  }

  async function register(
    email,
    username,
    password,
    firstName,
    lastName,
    companyName,
    positionId,
    role = 2
  ) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Mettre à jour le profil Firebase avec le username
    await firebaseUpdateProfile(userCredential.user, {
      displayName: username,
    });

    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      username,
      firstName,
      lastName,
      companyName,
      role,
      createdAt: new Date().toISOString(),
    });
    return userCredential;
  }

  function logout() {
    setUserRole(null);
    setCurrentUser(null);
    setLoading(true);
    localStorage.clear();
    sessionStorage.clear();
    setUserRole(null);
    setLoading(false);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
          setCurrentUser({
            ...user,
            ...userDoc.data(),
          });
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    register,
    logout,
    updateEmail,
    updatePassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
