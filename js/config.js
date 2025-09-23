// Configuration globale de l'application
const CONFIG = {
    N8N_WEBHOOK_URL: 'https://andreaprogra.app.n8n.cloud/webhook/88303112-848e-4b93-8758-5c2b16ecc52e',
    APP_VERSION: '1.0.0',
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_AUDIO_FORMATS: [
        'audio/mp3',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav',
        'audio/webm',
        'audio/ogg',
        'audio/m4a'
    ],
    RECORDER_OPTIONS: {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
        }
    },
    PREFERRED_FORMATS: [
        'audio/mp4',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus'
    ]
};

// Base de données utilisateurs locale
const USERS_DB = [
    { 
        id: 1, 
        username: "commercial1", 
        password: "pass123", 
        nom: "Jean Dupont",
        deviceId: null,
        isActive: true,
        registeredAt: "2024-09-01T10:00:00Z"
    },
    { 
        id: 2, 
        username: "commercial2", 
        password: "pass456", 
        nom: "Marie Martin",
        deviceId: null,
        isActive: true,
        registeredAt: "2024-09-01T10:00:00Z"
    },
    { 
        id: 3, 
        username: "manager1", 
        password: "pass789", 
        nom: "Paul Durand",
        deviceId: null,
        isActive: true,
        registeredAt: "2024-09-01T10:00:00Z"
    }
];

// Pages disponibles
const PAGES = {
    LOGIN: 'loginPage',
    BROUILLON: 'brouillonPage',
    RAPPORTS: 'rapportsPage'
};