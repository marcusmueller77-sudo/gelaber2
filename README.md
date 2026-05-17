# gelaber2 - Medizinischer Aufklärungsassistent

Eine vollständige Web-App für medizinische Aufklärung mit Text-to-Speech, Spracherkennung und KI-gestütztem Frage-Antwort-System.

## 🚀 Features

- **Admin-Dashboard**: Verwaltung von Dokumenten und Patienten
- **PDF-Verwaltung**: Automatische Text-Extraktion aus PDF-Dokumenten
- **Text-to-Speech**: ElevenLabs API für natürliche Sprachausgabe (Deutsch & Englisch)
- **Spracherkennung**: Web Speech API für Patientenfragen
- **KI-Assistenz**: Mistral AI für intelligente Antworten basierend auf Aufklärungsbögen
- **Tablet-Optimiert**: Große, leicht bedienbare Oberfläche (48px+ Buttons)
- **Mehrsprachig**: Deutsch und Englisch via i18next
- **Sicherheit**: Firebase Authentication & Firestore Security Rules
- **Automatischer Logout**: Nach 30 Minuten Inaktivität

## 📋 Tech-Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Firebase (Firestore, Storage, Authentication)
- **APIs**: ElevenLabs TTS, Mistral AI Chat, Web Speech API
- **Internationalisierung**: i18next
- **PDF-Verarbeitung**: pdf.js
- **Hosting**: Vercel

## 🔧 Installation & Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Öffne `.env` und trage deine API-Keys ein:

```env
# Firebase (erhältlich in Firebase Console)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# ElevenLabs (https://elevenlabs.io/)
VITE_ELEVENLABS_API_KEY=...

# Mistral AI (https://mistral.ai/)
VITE_MISTRAL_API_KEY=...
```

### 3. Firebase Security Rules

**Firestore Security Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Dokumente: Lesbar für alle, schreibbar nur für authentifizierte Benutzer
    match /documents/{document=**} {
      allow read;
      allow create, update, delete: if request.auth != null;
    }
    
    // Patienten: Lesbar und schreibbar nur für authentifizierte Benutzer
    match /patients/{document=**} {
      allow read, create, update, delete: if request.auth != null;
    }
  }
}
```

**Storage Security Rules:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Alle dürfen lesen (für PDF-Anzeige)
    match /{allPaths=**} {
      allow read;
      // Nur authentifizierte Nutzer dürfen schreiben
      allow write: if request.auth != null;
    }
  }
}
```

### 4. Admin-Benutzer erstellen

1. Gehe zu Firebase Console
2. Authentication → Users
3. Erstelle einen neuen User mit E-Mail und Passwort
4. Verwende diese Anmeldedaten im Admin-Login

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die App läuft dann unter `http://localhost:5173`

## 📱 Verwendung

### Admin-Workflow

1. **Anmelden**: Mit Admin-E-Mail und Passwort
2. **Dokumente hochladen**:
   - Gehe zum "Dokumente"-Tab
   - Lade ein PDF hoch
   - Gib Name und Sprache an
   - Text wird automatisch extrahiert
3. **Patienten erstellen**:
   - Gehe zum "Patienten"-Tab
   - Erstelle einen neuen Patienten
   - Weise ein Dokument zu
4. **Sitzung starten**:
   - Wähle einen Patienten
   - Klicke "Sitzung starten"
   - Übergebe das Tablet dem Patienten

### Patient-Workflow

1. **Aufklärungsbogen anhören**:
   - Großer Play-Button
   - Sätze werden hervorgehoben beim Vorlesen
   - Pause/Stop möglich
2. **Fragen stellen**:
   - Mikrofon-Button drücken und halten
   - Frage sprechen
   - KI antwortet basierend auf Aufklärungsbogen
   - Antwort wird vorgelesen
3. **Automatischer Logout**:
   - Nach 30 Minuten Inaktivität

## 🛠️ Deployment auf Vercel

1. Repository zu GitHub pushen
2. In Vercel Projekt erstellen
3. Umgebungsvariablen eintragen
4. Deploy! 🚀

## 📝 Projektstruktur

```
gelaber2/
├── src/
│   ├── pages/
│   │   ├── Login.jsx              # Admin-Login
│   │   ├── AdminDashboard.jsx     # Admin-Verwaltung
│   │   └── PatientView.jsx        # Patient-Oberfläche
│   ├── components/
│   │   ├── DocumentUpload.jsx     # PDF-Upload
│   │   ├── PatientManager.jsx     # Patienten-Verwaltung
│   │   ├── TextPlayer.jsx         # Satz-für-Satz Vorlesen
│   │   └── QuestionButton.jsx     # Spracherkennung & KI
│   ├── services/
│   │   ├── firebase.js            # Firebase-Integration
│   │   ├── elevenlabs.js          # Text-to-Speech
│   │   └── mistral.js             # KI-Integration
│   ├── i18n/
│   │   ├── de.json                # Deutsche Übersetzungen
│   │   ├── en.json                # Englische Übersetzungen
│   │   └── i18n.js                # i18next-Konfiguration
│   ├── App.jsx                    # Haupt-App & Routing
│   ├── main.jsx                   # Entry-Point
│   └── index.css                  # Globale Styles
├── index.html                     # HTML-Template
├── vite.config.js                 # Vite-Konfiguration
├── tailwind.config.js             # Tailwind-Konfiguration
├── postcss.config.js              # PostCSS-Konfiguration
├── package.json                   # Dependencies
├── .env                           # Umgebungsvariablen
├── .gitignore                     # Git-Ignore
└── vercel.json                    # Vercel-Konfiguration
```

## 🔒 Sicherheit

- **Firebase Authentication**: Sichere Admin-Anmeldung
- **Firestore Security Rules**: Datenschutz auf Datenbankebene
- **API-Keys**: Alle Keys werden über Umgebungsvariablen verwaltet
- **HTTPS Only**: Automatisch auf Vercel
- **Browser-Zurück deaktiviert**: Patient kann nicht zurück navigieren
- **Fullscreen Mode**: Kiosk-Modus für Patientensicherheit

## 🌍 Mehrsprachigkeit

Die App unterstützt:
- Deutsch (de)
- Englisch (en)

Die Sprache wird automatisch erkannt oder kann manuel gewechselt werden.

## 📞 Support & Troubleshooting

### Fehler: "Firebase not configured"
- Überprüfe, dass alle `VITE_FIREBASE_*` Variablen in `.env` eingetragen sind

### Fehler: "No Speech Detected"
- Web Speech API wird nicht in allen Browsern unterstützt
- Chrome/Edge empfohlen auf Desktop, Chrome auf Android

### PDF-Extraktion funktioniert nicht
- Überprüfe, dass das PDF mit Text (nicht nur Bilder) durchsuchbar ist
- Versuche ein anderes PDF-Format

### Kein Audio
- ElevenLabs API Key überprüfen
- Browserberechtigungen für Audio-Ausgabe prüfen

## 📄 Lizenz

Entwickelt für medizinische Aufklärung

---

**gelaber2** - Assistier dem Patienten, verstehbar und beruhigend. 🏥
