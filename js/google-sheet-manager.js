// Gestionnaire Google Sheets pour la gestion dynamique des utilisateurs - Version CSV finale
class GoogleSheetsManager {
    constructor() {
        // ID de votre Google Sheets corrigé
        this.SHEET_ID = '1I2SdNqwVB3bU-h3GoYvKjPRm2WhjpPdPc77rJKML9KEr';
        this.SHEET_NAME = 'Feuille 1';
        this.cache = {
            users: [],
            lastUpdate: null,
            cacheDuration: 60000 // Cache pendant 1 minute
        };
    }

    // Construction de l'URL pour l'export CSV (qui fonctionne !)
    getSheetUrl() {
        return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/export?format=csv&gid=0`;
    }

    // Récupère les utilisateurs depuis Google Sheets en CSV
    async fetchUsers() {
        try {
            console.log('🔄 Récupération des utilisateurs depuis Google Sheets (CSV)...');
            
            const response = await fetch(this.getSheetUrl());
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            console.log('📄 CSV reçu, taille:', csvText.length, 'caractères');
            
            const users = this.parseCSVData(csvText);
            
            // Mise à jour du cache
            this.cache.users = users;
            this.cache.lastUpdate = new Date();
            
            console.log(`✅ ${users.length} utilisateurs récupérés depuis Google Sheets`);
            return users;
            
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
            
            // En cas d'erreur, utiliser le cache si disponible
            if (this.cache.users.length > 0) {
                console.log('🔄 Utilisation du cache utilisateurs');
                return this.cache.users;
            }
            
            // Dernier recours : utilisateurs par défaut
            console.log('🔄 Utilisation des utilisateurs par défaut');
            return this.getDefaultUsers();
        }
    }

    // Parse les données CSV
    parseCSVData(csvText) {
        const users = [];
        const lines = csvText.trim().split('\n');
        
        console.log(`📊 Nombre de lignes CSV trouvées: ${lines.length}`);
        
        // Afficher les premières lignes pour debug
        console.log('🔍 Première ligne (headers):', lines[0]);
        if (lines.length > 1) {
            console.log('🔍 Deuxième ligne (premier utilisateur):', lines[1]);
        }
        
        // Ignorer la première ligne (headers) et traiter les données
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                console.log(`⚠️ Ligne ${i} ignorée: vide`);
                continue;
            }
            
            try {
                // Parser la ligne CSV
                const cols = this.parseCSVLine(line);
                console.log(`📝 Ligne ${i} parsée:`, cols);
                
                if (cols.length < 5) {
                    console.log(`⚠️ Ligne ${i} ignorée: moins de 5 colonnes (${cols.length})`);
                    continue;
                }
                
                const username = cols[0] ? cols[0].trim() : '';
                const password = cols[1] ? cols[1].trim() : '';
                const nom = cols[2] ? cols[2].trim() : '';
                const role = cols[3] ? cols[3].trim() : '';
                const statutBrut = cols[4] ? cols[4].trim() : '';
                
                // Vérifier que ce ne sont pas des headers
                if (username.toLowerCase() === 'username' || 
                    password.toLowerCase() === 'password' ||
                    nom.toLowerCase() === 'nom') {
                    console.log(`📋 Ligne ${i} ignorée: ligne de titre détectée`);
                    continue;
                }
                
                // Vérifier que username et password existent
                if (!username || !password) {
                    console.log(`⚠️ Ligne ${i} ignorée: username (${username}) ou password manquant`);
                    continue;
                }
                
                // CORRECTION FINALE: Nettoyer le statut une seule fois pour cohérence
                const statutNettoye = statutBrut 
                ? statutBrut.replace(/[\u200B-\u200D\uFEFF\u00A0"]/g, '').trim().toLowerCase() 
                : 'inactif';

                
                const user = {
                    id: users.length + 1,
                    username: username,
                    password: password,
                    nom: nom || 'Nom non défini',
                    role: role || 'commercial',
                    statut: statutNettoye,  // Utiliser le statut nettoyé
                    dateCreation: cols[5] ? cols[5].trim() : null,
                    deviceId: cols[6] ? cols[6].trim() : null,
                    derniereConnexion: cols[7] ? cols[7].trim() : null,
                    // Utiliser le statut déjà nettoyé pour la cohérence
                    isActive: (statutNettoye.toLowerCase() === 'actif')
                };
                
                users.push(user);
                console.log(`👤 Utilisateur CSV ajouté: ${user.username} (${user.statut}) - Actif: ${user.isActive}`);
                
            } catch (error) {
                console.error(`❌ Erreur parsing ligne ${i}:`, error);
            }
        }
        
        console.log(`✅ Parsing CSV terminé: ${users.length} utilisateurs valides trouvés`);
        return users;
    }

    // Parser une ligne CSV (gère les virgules dans les guillemets)
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // Ajouter le dernier élément
        result.push(current);
        
        // Nettoyer les guillemets au début/fin
        return result.map(item => {
            item = item.trim();
            if (item.startsWith('"') && item.endsWith('"')) {
                item = item.slice(1, -1);
            }
            return item;
        });
    }

    // Utilisateurs par défaut en cas d'erreur
    getDefaultUsers() {
        return [
            {
                id: 1,
                username: "commercial1",
                password: "pass123",
                nom: "Jean Dupont (défaut)",
                role: "commercial",
                statut: "inactif",
                deviceId: null,
                isActive: false,
                dateCreation: new Date().toISOString()
            },
            {
                id: 2,
                username: "andreac",
                password: "pass123",
                nom: "Andrea Ciechels (défaut)",
                role: "commercial",
                statut: "actif",
                deviceId: null,
                isActive: true,
                dateCreation: new Date().toISOString()
            },
            {
                id: 3,
                username: "cocoh",
                password: "pass123",
                nom: "Corentin Havouis (défaut)",
                role: "manager",
                statut: "actif",
                deviceId: null,
                isActive: true,
                dateCreation: new Date().toISOString()
            }
        ];
    }

    // Récupère les utilisateurs (avec cache)
    async getUsers(forceRefresh = false) {
        // Vérifier le cache
        if (!forceRefresh && this.cache.users.length > 0 && this.cache.lastUpdate) {
            const timeDiff = new Date() - this.cache.lastUpdate;
            if (timeDiff < this.cache.cacheDuration) {
                console.log('🔄 Utilisation du cache utilisateurs');
                return this.cache.users;
            }
        }
        
        // Récupérer depuis Google Sheets
        return await this.fetchUsers();
    }

    // Trouve un utilisateur par username
    async findUser(username) {
        const users = await this.getUsers();
        const foundUser = users.find(user => user.username === username);
        console.log(`🔍 Recherche utilisateur "${username}": ${foundUser ? 'trouvé' : 'non trouvé'}`);
        if (foundUser) {
            console.log(`📋 Utilisateur trouvé:`, {
                username: foundUser.username,
                nom: foundUser.nom,
                role: foundUser.role,
                statut: foundUser.statut,
                isActive: foundUser.isActive
            });
        }
        return foundUser;
    }

    // Authentifie un utilisateur
    async authenticateUser(username, password) {
        try {
            console.log(`🔐 Tentative d'authentification: ${username}`);
            
            const user = await this.findUser(username);
            
            if (!user) {
                console.log(`❌ Utilisateur introuvable: ${username}`);
                return { success: false, error: 'Utilisateur introuvable' };
            }
            
            console.log(`🔍 Utilisateur trouvé: ${user.username}, statut: ${user.statut}, actif: ${user.isActive}`);
            
            if (user.password !== password) {
                console.log(`❌ Mot de passe incorrect pour: ${username}`);
                return { success: false, error: 'Mot de passe incorrect' };
            }
            
            // CORRECTION FINALE: Vérification simplifiée car le statut est déjà nettoyé
            if (!user.isActive) {
                console.log(`❌ Compte inactif: ${username} (statut: ${user.statut}, isActive: ${user.isActive})`);
                return { 
                    success: false, 
                    error: 'Compte suspendu - Contactez l\'administrateur pour réactiver votre abonnement' 
                };
            }
            
            console.log(`✅ Authentification réussie: ${username}`);
            return { success: true, user: user };
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'authentification:', error);
            return { 
                success: false, 
                error: 'Erreur de connexion - Vérifiez votre connexion internet' 
            };
        }
    }

    // Met à jour le device ID d'un utilisateur (simulation)
    async updateUserDeviceId(username, deviceId) {
        console.log(`📱 Association device ${deviceId} à l'utilisateur ${username}`);
        const users = await this.getUsers();
        const user = users.find(u => u.username === username);
        if (user) {
            user.deviceId = deviceId;
            return true;
        }
        return false;
    }

    // Met à jour la dernière connexion (simulation)
    async updateLastConnection(username) {
        console.log(`⏰ Mise à jour dernière connexion: ${username}`);
        const users = await this.getUsers();
        const user = users.find(u => u.username === username);
        if (user) {
            user.derniereConnexion = new Date().toISOString();
            return true;
        }
        return false;
    }

    // Force la mise à jour du cache
    async refreshCache() {
        console.log('🔄 Actualisation forcée du cache utilisateurs');
        return await this.fetchUsers();
    }

    // Statistiques des utilisateurs avec logs détaillés
    async getUserStats() {
        const users = await this.getUsers();
        const stats = {
            total: users.length,
            actifs: users.filter(u => u.isActive).length,
            inactifs: users.filter(u => !u.isActive).length,
            commerciaux: users.filter(u => u.role === 'commercial').length,
            managers: users.filter(u => u.role === 'manager').length
        };
        
        console.log(`📊 Statistiques utilisateurs:`, stats);
        return stats;
    }
}