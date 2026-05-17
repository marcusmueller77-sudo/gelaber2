import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore'
import {
  getStorage,
  ref,
  uploadBytes,
  getBytes,
  getDownloadURL
} from 'firebase/storage'
import * as pdfjsLib from 'pdfjs-dist'

// Firebase-Konfiguration aus Umgebungsvariablen laden
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Firebase App initialisieren
const app = initializeApp(firebaseConfig)

// Firebase Services
const auth = getAuth(app)
export { auth }
const db = getFirestore(app)
const storage = getStorage(app)
console.log('Storage Bucket:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
export { db, storage }

// PDF.js Worker setzen
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// Persistenz aktivieren
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn('Fehler beim Setzen der Auth-Persistenz:', err)
})

// ============= AUTHENTIFIZIERUNG =============

/**
 * Admin mit E-Mail und Passwort anmelden
 */
export const loginAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error('Login-Fehler:', error)
    throw error
  }
}

/**
 * Admin abmelden
 */
export const logoutAdmin = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Logout-Fehler:', error)
    throw error
  }
}

/**
 * Authentifizierungsstatus überwachen
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

/**
 * Aktuellen authentifizierten User abrufen
 */
export const getCurrentUser = () => auth.currentUser

// ============= DOKUMENTE =============

/**
 * PDF-Text extrahieren mit pdf.js
 */
export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
    
    let fullText = ''
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }
    
    return fullText
  } catch (error) {
    console.error('PDF-Extraktions-Fehler:', error)
    throw new Error('Fehler beim Extrahieren des PDF-Textes')
  }
}

/**
 * Dokument hochladen
 */
export const uploadDocument = async (file, documentName, language, voiceId = '21m00Tcm4TlvDq8ikWAM') => {
  try {
    // Sicherstellen, dass ein authentifizierter User vorhanden ist
    const user = auth.currentUser
    console.log('Auth currentUser beim Upload:', user)
    if (!user) {
      throw new Error('NOT_AUTHENTICATED')
    }

    // Text aus PDF extrahieren
    const extractedText = await extractTextFromPDF(file)

    // PDF als Base64 kodieren (Data URL ohne Präfix speichern)
    const base64Pdf = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const result = reader.result
          const commaIndex = typeof result === 'string' ? result.indexOf(',') : -1
          const b64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result
          resolve(b64)
        } catch (e) {
          reject(e)
        }
      }
      reader.onerror = (e) => reject(e)
      reader.readAsDataURL(file)
    })

    // Dokument direkt in Firestore speichern (Base64 statt Storage)
    const docRef = await addDoc(collection(db, 'documents'), {
      name: documentName,
      language: language,
      voiceId: voiceId,
      pdfBase64: base64Pdf,
      extractedText: extractedText,
      createdAt: serverTimestamp(),
      createdBy: user.uid
    })

    return {
      id: docRef.id,
      name: documentName,
      language: language,
      voiceId: voiceId,
      extractedText: extractedText,
      createdAt: new Date()
    }
  } catch (error) {
    console.error('Dokument-Upload-Fehler:', error)
    throw error
  }
}

/**
 * Alle Dokumente abrufen
 */
export const getDocuments = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'documents'))
    const documents = []
    
    querySnapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return documents
  } catch (error) {
    console.error('Fehler beim Abrufen der Dokumente:', error)
    throw error
  }
}

/**
 * Einzelnes Dokument abrufen
 */
export const getDocument = async (docId) => {
  try {
    const docRef = doc(db, 'documents', docId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      }
    }
    
    return null
  } catch (error) {
    console.error('Fehler beim Abrufen des Dokuments:', error)
    throw error
  }
}

/**
 * Dokument löschen
 */
export const deleteDocument = async (docId) => {
  try {
    // Zuerst die Firestore-Referenz löschen
    await deleteDoc(doc(db, 'documents', docId))
  } catch (error) {
    console.error('Fehler beim Löschen des Dokuments:', error)
    throw error
  }
}

// ============= PATIENTEN =============

/**
 * Neuen Patienten erstellen
 */
export const createPatient = async (name) => {
  try {
    const patientRef = await addDoc(collection(db, 'patients'), {
      name: name,
      assignedDocumentId: null,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid
    })
    
    return {
      id: patientRef.id,
      name: name,
      assignedDocumentId: null,
      createdAt: new Date()
    }
  } catch (error) {
    console.error('Fehler beim Erstellen des Patienten:', error)
    throw error
  }
}

/**
 * Alle Patienten abrufen
 */
export const getPatients = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'patients'))
    const patients = []
    
    querySnapshot.forEach(doc => {
      patients.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return patients
  } catch (error) {
    console.error('Fehler beim Abrufen der Patienten:', error)
    throw error
  }
}

/**
 * Einzelnen Patienten abrufen
 */
export const getPatient = async (patientId) => {
  try {
    const docRef = doc(db, 'patients', patientId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      }
    }
    
    return null
  } catch (error) {
    console.error('Fehler beim Abrufen des Patienten:', error)
    throw error
  }
}

/**
 * Dokument für Patienten zuweisen
 */
export const assignDocumentToPatient = async (patientId, documentId) => {
  try {
    const patientRef = doc(db, 'patients', patientId)
    await updateDoc(patientRef, {
      assignedDocumentId: documentId
    })
  } catch (error) {
    console.error('Fehler beim Zuweisen des Dokuments:', error)
    throw error
  }
}

/**
 * Patienten löschen
 */
export const deletePatient = async (patientId) => {
  try {
    await deleteDoc(doc(db, 'patients', patientId))
  } catch (error) {
    console.error('Fehler beim Löschen des Patienten:', error)
    throw error
  }
}

export default {
  auth,
  db,
  storage,
  loginAdmin,
  logoutAdmin,
  onAuthChange,
  getCurrentUser,
  extractTextFromPDF,
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  createPatient,
  getPatients,
  getPatient,
  assignDocumentToPatient,
  deletePatient
}
