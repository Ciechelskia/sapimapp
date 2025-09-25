// Gestionnaire Google Sheets pour la gestion dynamique des utilisateurs
class GoogleSheetsManager {
    constructor() {
        // ID de votre Google Sheets corrigé
        this.SHEET_ID = '1I2SdNqwVB3bU-h3GoYvKjPRm2WhjpPdPc77rJKML9KE';
        this.SHEET_NAME = 'Feuille 1'; // Nom de votre feuille
        this.cache = {
            users: [],
            lastUpdate: null,
            cacheDuration: 60000 // Cache pendant 1 minute
        };
    }

    // Construction de l'URL de l'API Google Sheets publique
    getSheetUrl() {
        return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(this.SHEET_NAME)}`;
    }

    // Récupère les utilisateurs depuis Google Sheets
    async fetchUsers() {
        try {
            console.log('🔄 Récupération des utilisateurs depuis Google Sheets...');
            
            const response = await fetch(this.getSheetUrl());
            const textData = await response.text();
            
            // Google Sheets renvoie du JSONP, on extrait le JSON
            const jsonData = textData.substring(47).slice(0, -2);
            const data = JSON.parse(jsonData);
            
            const users = this.parseSheetData(data);
            
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

    // Parse les données brutes de Google Sheets - CORRIGÉ
    parseSheetData(data) {
        const users = [];
        
        if (!data.table || !data.table.rows) {
            console.warn('⚠️ Aucune donnée trouvée dans Google Sheets');
            return users;
        }
        
        const rows = data.table.rows;
        console.log(`📊 Nombre total de lignes trouvées: ${rows.length}`);
        
        // CORRECTION : Commencer à l'index 1 pour ignorer les headers ET vérifier que ce ne sont pas des headers
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            
            if (!row.c || row.c.length < 5) {
                console.log(`⚠️ Ligne ${i} ignorée: données incomplètes`);
                continue;
            }
            
            try {
                const username = this.getCellValue(row.c[0]);
                const password = this.getCellValue(row.c[1]);
                const nom = this.getCellValue(row.c[2]);
                const role = this.getCellValue(row.c[3]);
                const statut = this.getCellValue(row.c[4]);
                
                // CORRECTION PRINCIPALE : Ignorer si c'est une ligne de titre
                if (username === 'Username' || username === 'username' || 
                    password === 'Password' || password === 'password' ||
                    nom === 'Nom' || role === 'Role' || statut === 'Statut') {
                    console.log(`📋 Ligne ${i} ignorée: ligne de titre détectée`);
                    continue;
                }
                
                // Vérifier que l'utilisateur a au minimum username et password valides
                if (!username || !password || username.trim() === '' || password.trim() === '') {
                    console.log(`⚠️ Ligne ${i} ignorée: username ou password vide`);
                    continue;
                }
                
                const user = {
                    id: users.length + 1, // ID basé sur l'ordre des utilisateurs valides
                    username: username,
                    password: password,
                    nom: nom || 'Nom non défini',
                    role: role || 'commercial',
                    statut: statut || 'inactif',
                    dateCreation: this.getCellValue(row.c[5]),
                    deviceId: this.getCellValue(row.c[6]),
                    derniereConnexion: this.getCellValue(row.c[7]),
                    isActive: (statut && statut.toLowerCase() === 'actif')
                };
                
                users.push(user);
                console.log(`👤 Utilisateur ajouté: ${user.username} (${user.statut}) - Actif: ${user.isActive}`);
                
            } catch (error) {
                console.error(`❌ Erreur parsing ligne ${i}:`, error);
            }
        }
        
        console.log(`✅ Parsing terminé: ${users.length} utilisateurs valides trouvés`);
        return users;
    }

    // Extrait la valeur d'une cellule Google Sheets
    getCellValue(cell) {
        if (!cell) return null;
        if (cell.v !== undefined) return cell.v;
        if (cell.f !== undefined) return cell.f;
        return null;
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
            
            if (!user.isActive || user.statut !== 'actif') {
                console.log(`❌ Compte inactif: ${username} (statut: ${user.statut})`);
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