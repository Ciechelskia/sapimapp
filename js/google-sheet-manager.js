// Gestionnaire Google Sheets pour la gestion dynamique des utilisateurs
class GoogleSheetsManager {
    constructor() {
        // REMPLACEZ CET ID PAR L'ID DE VOTRE GOOGLE SHEETS
        this.SHEET_ID = '1f2SdNqwV83bU-h3OoVvkJPRm2WnJpPqPz7r3KML9KE';
        this.SHEET_NAME = 'Feuille1'; // Nom de votre feuille (généralement "Feuille1")
        this.cache = {
            users: [],
            lastUpdate: null,
            cacheDuration: 60000 // Cache pendant 1 minute
        };
    }

    // Construction de l'URL de l'API Google Sheets publique
    getSheetUrl() {
        return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${this.SHEET_NAME}`;
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

    // Parse les données brutes de Google Sheets
    parseSheetData(data) {
        const users = [];
        
        if (!data.table || !data.table.rows) {
            console.warn('⚠️ Aucune donnée trouvée dans Google Sheets');
            return users;
        }
        
        const rows = data.table.rows;
        
        // Ignorer la première ligne (headers)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            
            if (!row.c || row.c.length < 5) continue; // Ligne vide ou incomplète
            
            try {
                const user = {
                    id: i,
                    username: this.getCellValue(row.c[0]), // Colonne A
                    password: this.getCellValue(row.c[1]), // Colonne B
                    nom: this.getCellValue(row.c[2]),      // Colonne C
                    role: this.getCellValue(row.c[3]),     // Colonne D
                    statut: this.getCellValue(row.c[4]),   // Colonne E
                    dateCreation: this.getCellValue(row.c[5]), // Colonne F
                    deviceId: this.getCellValue(row.c[6]),     // Colonne G
                    derniereConnexion: this.getCellValue(row.c[7]), // Colonne H
                    isActive: this.getCellValue(row.c[4]) === 'actif' // Basé sur la colonne statut
                };
                
                // Vérifier que l'utilisateur a au minimum username et password
                if (user.username && user.password) {
                    users.push(user);
                    console.log(`👤 Utilisateur ajouté: ${user.username} (${user.statut})`);
                }
                
            } catch (error) {
                console.error(`❌ Erreur parsing ligne ${i}:`, error);
            }
        }
        
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
        return users.find(user => user.username === username);
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
            
            if (user.password !== password) {
                console.log(`❌ Mot de passe incorrect pour: ${username}`);
                return { success: false, error: 'Mot de passe incorrect' };
            }
            
            if (!user.isActive || user.statut !== 'actif') {
                console.log(`❌ Compte inactif: ${username}`);
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
        // Note: Pour une vraie mise à jour dans Google Sheets, il faudrait l'API avec authentification
        // Pour l'instant, on met à jour seulement en local
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
        // Note: Même principe que updateUserDeviceId
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

    // Statistiques des utilisateurs
    async getUserStats() {
        const users = await this.getUsers();
        return {
            total: users.length,
            actifs: users.filter(u => u.isActive).length,
            inactifs: users.filter(u => !u.isActive).length,
            commerciaux: users.filter(u => u.role === 'commercial').length,
            managers: users.filter(u => u.role === 'manager').length
        };
    }
}

// Configuration et initialisation
window.GoogleSheetsManager = GoogleSheetsManager;