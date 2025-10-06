// Application principale - Gestion de l'authentification et navigation
class AppManager {
    constructor() {
        this.currentUser = null;
        this.currentPage = PAGES.LOGIN;
        
        // Initialisation des managers
        this.audioManager = new AudioManager();
        this.dataManager = new DataManager();
        this.sheetsManager = new GoogleSheetsManager();
        
        // Initialiser le gestionnaire de langues
        window.languageManager = new LanguageManager();
        this.languageManager = window.languageManager;
        
        // Exposition globale pour les événements
        window.dataManager = this.dataManager;
        window.app = this;
        
        this.initializeApp();
        this.bindEvents();
    }

    // === INITIALISATION ===

    initializeApp() {
        this.logout();
        this.showPage(PAGES.LOGIN);
        
        // Ajouter les styles CSS pour les animations toast
        this.addToastStyles();
        
        // Injecter les styles du sélecteur de langue
        this.languageManager.injectStyles();
        
        // Créer et insérer les sélecteurs de langue (login + header)
        this.initLanguageSelector();
        
        // Écouter les changements de langue
        window.addEventListener('languageChanged', (e) => {
            this.onLanguageChanged(e.detail.language);
        });
        
        // Charger les utilisateurs en mémoire
        this.loadUsersToMemory();
    }

    // Charger les utilisateurs depuis USERS_DB dans la mémoire
    loadUsersToMemory() {
        if (typeof USERS_DB !== 'undefined') {
            console.log(`📋 ${USERS_DB.length} utilisateurs chargés depuis USERS_DB`);
        } else {
            console.warn('⚠️ USERS_DB non défini dans config.js');
        }
    }

    // Initialiser les sélecteurs de langue (login ET header)
    initLanguageSelector() {
        // Sélecteur dans le header (après connexion)
        const headerContainer = document.getElementById('languageSelectorContainer');
        if (headerContainer) {
            const headerSelector = this.languageManager.createLanguageSelector();
            headerContainer.appendChild(headerSelector);
        }
        
        // Sélecteur sur la page de login (avant connexion)
        const loginContainer = document.getElementById('loginLanguageSelector');
        if (loginContainer) {
            const loginSelector = this.languageManager.createLanguageSelector();
            loginContainer.appendChild(loginSelector);
        }
    }

    // Gérer le changement de langue
    onLanguageChanged(newLang) {
        console.log(`🌍 Changement de langue détecté: ${newLang}`);
        
        // Mettre à jour toute l'interface
        this.languageManager.updateUI();
        
        // Recharger les données avec les nouvelles traductions
        if (this.currentPage === PAGES.BROUILLON) {
            this.loadBrouillonsData();
        } else if (this.currentPage === PAGES.RAPPORTS) {
            this.loadRapportsData();
        }
        
        // Mettre à jour le titre de la page
        document.title = t('app.title');
    }

    addToastStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // Login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Navigation
        this.bindNavigationEvents();

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.dataManager.filterRapports(e.target.value);
            }, 300));
        }
    }

    bindNavigationEvents() {
        const navBrouillon = document.getElementById('navBrouillon');
        const navRapports = document.getElementById('navRapports');
        const logoutBtn = document.getElementById('logoutBtn');

        if (navBrouillon) {
            navBrouillon.addEventListener('click', () => {
                this.showPage(PAGES.BROUILLON);
            });
        }

        if (navRapports) {
            navRapports.addEventListener('click', () => {
                this.showPage(PAGES.RAPPORTS);
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    // === GESTION DES PAGES ===

    showPage(pageId) {
        // Masquer toutes les pages
        ['loginPage', 'brouillonPage', 'rapportsPage'].forEach(id => {
            const page = document.getElementById(id);
            if (page) page.style.display = 'none';
        });

        // Afficher la page demandée
        if (pageId === 'loginPage' && !this.currentUser) {
            const loginPage = document.getElementById('loginPage');
            if (loginPage) loginPage.style.display = 'block';
            const header = document.getElementById('header');
            if (header) header.style.display = 'none';
        } else if (this.currentUser) {
            const targetPage = document.getElementById(pageId);
            if (targetPage) targetPage.style.display = 'block';
            const header = document.getElementById('header');
            if (header) header.style.display = 'flex';
        }

        this.currentPage = pageId;
        this.updateNavigation();
        
        // Chargement des données selon la page
        if (pageId === PAGES.BROUILLON) {
            this.loadBrouillonsData();
        } else if (pageId === PAGES.RAPPORTS) {
            this.loadRapportsData();
        }
    }

    updateNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (this.currentPage === PAGES.BROUILLON) {
            const navBrouillon = document.getElementById('navBrouillon');
            if (navBrouillon) navBrouillon.classList.add('active');
        } else if (this.currentPage === PAGES.RAPPORTS) {
            const navRapports = document.getElementById('navRapports');
            if (navRapports) navRapports.classList.add('active');
        }
    }

    // === AUTHENTIFICATION LOCALE (USERS_DB) ===

    async handleLogin() {
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        const errorDiv = document.getElementById('errorMessage');
        const loadingDiv = document.getElementById('loadingMessage');
        const loginBtn = document.getElementById('loginBtn');

        if (!usernameEl || !passwordEl) return;

        const username = usernameEl.value.trim();
        const password = passwordEl.value.trim();

        // Validation
        if (!username || !password) {
            this.showError(t('login.error.empty'));
            return;
        }

        // Reset UI
        if (errorDiv) errorDiv.style.display = 'none';
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (loginBtn) loginBtn.disabled = true;

        try {
            // Authentification locale via USERS_DB
            console.log('🔐 Authentification locale via USERS_DB...');
            
            // Chercher l'utilisateur dans USERS_DB
            const user = USERS_DB.find(u => u.username === username);
            
            if (!user) {
                throw new Error(t('login.error.notfound'));
            }
            
            if (user.password !== password) {
                throw new Error(t('login.error.wrongpass'));
            }
            
            if (!user.isActive) {
                throw new Error(t('login.error.inactive'));
            }

            // Vérification Device ID - Maximum 2 appareils
            const deviceId = Utils.generateDeviceId();

            // Récupérer les appareils enregistrés depuis localStorage (car USERS_DB est statique)
            const storageKey = `user_devices_${username}`;
            let registeredDevices = [];
            
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    registeredDevices = JSON.parse(stored);
                }
            } catch (e) {
                console.warn('Erreur lecture devices:', e);
                registeredDevices = [];
            }

            // Vérifier si l'appareil actuel est déjà enregistré
            const isDeviceRegistered = registeredDevices.includes(deviceId);

            // Si l'appareil n'est pas enregistré et qu'on a déjà 2 appareils
            if (!isDeviceRegistered && registeredDevices.length >= 2) {
                throw new Error(t('login.error.device.limit'));
            }

            // Enregistrer le nouvel appareil si pas encore enregistré
            if (!isDeviceRegistered) {
                registeredDevices.push(deviceId);
                localStorage.setItem(storageKey, JSON.stringify(registeredDevices));
                console.log(`✅ Device ${registeredDevices.length}/2 enregistré pour ${username}`);
            } else {
                console.log(`✅ Device déjà enregistré (${registeredDevices.indexOf(deviceId) + 1}/2)`);
            }

            // Connexion réussie
            this.currentUser = {
                ...user,
                deviceId: JSON.stringify(registeredDevices),
                loginTime: new Date().toISOString()
            };

            this.updateUserInterface();
            this.showPage(PAGES.BROUILLON);
            Utils.showToast(t('login.welcome', { name: this.currentUser.nom }), 'success');

        } catch (error) {
            console.error('❌ Erreur lors de l\'authentification:', error);
            this.showError(error.message);
        } finally {
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (loginBtn) loginBtn.disabled = false;
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    updateUserInterface() {
        if (this.currentUser) {
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.getElementById('userAvatar');
            const userRoleEl = document.getElementById('userRole');
            
            if (userNameEl) userNameEl.textContent = this.currentUser.nom;
            if (userAvatarEl) {
                const initials = this.currentUser.nom.split(' ').map(n => n[0]).join('').substring(0, 2);
                userAvatarEl.textContent = initials;
            }
            
            // Rôle traduit avec compteur d'appareils
            if (userRoleEl) {
                const roleKey = `role.${this.currentUser.role}`;
                let devices = [];
                try {
                    devices = JSON.parse(this.currentUser.deviceId || '[]');
                } catch (e) {
                    devices = this.currentUser.deviceId ? [this.currentUser.deviceId] : [];
                }
                userRoleEl.textContent = `${t(roleKey)} (${devices.length}/2 📱)`;
            }
            
            // Forcer la mise à jour du sélecteur de langue dans le header
            if (this.languageManager) {
                this.languageManager.updateAllLanguageSelectors();
            }
        }
    }

    logout() {
        this.currentUser = null;
        
        // Reset audio manager
        if (this.audioManager) {
            this.audioManager.resetRecording();
        }
        
        // Reset formulaire
        const loginForm = document.getElementById('loginForm');
        const errorMessage = document.getElementById('errorMessage');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (loginForm) loginForm.reset();
        if (errorMessage) errorMessage.style.display = 'none';
        if (loadingMessage) loadingMessage.style.display = 'none';
        
        this.showPage(PAGES.LOGIN);
    }

    // === CHARGEMENT DES DONNÉES ===

    loadBrouillonsData() {
        const brouillons = this.dataManager.getBrouillons();
        this.dataManager.updateBrouillonsUI(brouillons);
    }

    loadRapportsData() {
        const rapports = this.dataManager.getRapports();
        this.dataManager.updateRapportsUI(rapports);
    }

    // === MÉTHODES PUBLIQUES ===

    getCurrentUser() {
        return this.currentUser;
    }

    getDataManager() {
        return this.dataManager;
    }

    getAudioManager() {
        return this.audioManager;
    }

    getSheetsManager() {
        return this.sheetsManager;
    }

    // Redirection pour compatibilité
    editBrouillon(id) { return this.dataManager.editBrouillon(id); }
    validateBrouillon(id) { return this.dataManager.validateBrouillon(id); }
    deleteBrouillon(id) { return this.dataManager.deleteBrouillon(id); }
    saveEditedBrouillon(id, btn) { return this.dataManager.saveEditedBrouillon(id, btn); }
    viewRapport(id) { return this.dataManager.viewRapport(id); }
    shareRapport(id) { return this.dataManager.shareRapport(id); }
    exportRapport(id) { return this.dataManager.exportRapport(id); }
    downloadPDF(id) { return this.dataManager.downloadPDF(id); }
}

// === INITIALISATION ===

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Vérification des dépendances
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG non défini. Vérifiez que config.js est chargé.');
        return;
    }

    if (typeof USERS_DB === 'undefined') {
        console.error('USERS_DB non défini. Vérifiez que config.js contient USERS_DB.');
        return;
    }

    if (typeof Utils === 'undefined') {
        console.error('Utils non défini. Vérifiez que utils.js est chargé.');
        return;
    }

    if (typeof TRANSLATIONS === 'undefined') {
        console.error('TRANSLATIONS non défini. Vérifiez que translations.js est chargé.');
        return;
    }

    if (typeof LanguageManager === 'undefined') {
        console.error('LanguageManager non défini. Vérifiez que language-manager.js est chargé.');
        return;
    }

    // Initialisation de l'app
    try {
        window.appManager = new AppManager();
        console.log('✅ Application initialisée avec succès (Mode local USERS_DB + 2 appareils max)');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
});

// Nettoyage lors de la fermeture
window.addEventListener('beforeunload', function() {
    if (window.appManager && window.appManager.audioManager) {
        window.appManager.audioManager.stopAudioStream();
    }
});

// Gestion des erreurs globales
window.addEventListener('error', function(event) {
    console.error('Erreur globale:', event.error);
    
    if (typeof Utils !== 'undefined' && typeof t === 'function') {
        Utils.showToast(t('toast.error.unexpected'), 'error');
    }
});

// Exposition globale pour les événements onclick (compatibilité)
window.editBrouillon = function(id) { 
    if (window.dataManager) window.dataManager.editBrouillon(id); 
};
window.validateBrouillon = function(id) { 
    if (window.dataManager) window.dataManager.validateBrouillon(id); 
};
window.deleteBrouillon = function(id) { 
    if (window.dataManager) window.dataManager.deleteBrouillon(id); 
};
window.saveEditedBrouillon = function(id, btn) { 
    if (window.dataManager) window.dataManager.saveEditedBrouillon(id, btn); 
};
window.viewRapport = function(id) { 
    if (window.dataManager) window.dataManager.viewRapport(id); 
};
window.shareRapport = function(id) { 
    if (window.dataManager) window.dataManager.shareRapport(id); 
};
window.exportRapport = function(id) { 
    if (window.dataManager) window.dataManager.exportRapport(id); 
};
window.downloadPDF = function(id) { 
    if (window.dataManager) window.dataManager.downloadPDF(id); 
};