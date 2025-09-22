// Gestionnaire de données pour localStorage et gestion des rapports
class DataManager {
    constructor() {
        this.storageKey = 'rapportsApp';
        this.maxBrouillons = 10;
        this.maxRapports = 20;
    }

    // === GESTION DU STOCKAGE ===

    loadAppData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return {
                    brouillons: data.brouillons || [],
                    rapports: data.rapports || []
                };
            }
        } catch (error) {
            console.error('Erreur lecture localStorage:', error);
        }
        return { brouillons: [], rapports: [] };
    }

    saveAppData(data) {
        try {
            const dataToSave = {
                ...data,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Erreur sauvegarde localStorage:', error);
            
            if (error.name === 'QuotaExceededError') {
                console.log('Tentative de nettoyage automatique...');
                this.cleanOldData(data);
            }
        }
    }

    cleanOldData(data) {
        try {
            const cleaned = {
                brouillons: data.brouillons ? data.brouillons.slice(0, this.maxBrouillons) : [],
                rapports: data.rapports ? data.rapports.slice(0, this.maxRapports) : [],
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(cleaned));
            console.log('Nettoyage automatique effectué');
            Utils.showToast('Données anciennes supprimées pour économiser l\'espace', 'info');
        } catch (error) {
            console.error('Erreur lors du nettoyage:', error);
        }
    }

    // === GESTION DES BROUILLONS ===

    getBrouillons() {
        const data = this.loadAppData();
        return data.brouillons || [];
    }

    addBrouillon(brouillon) {
        const data = this.loadAppData();
        data.brouillons = data.brouillons || [];
        data.brouillons.unshift(brouillon);
        
        this.saveAppData(data);
        this.updateBrouillonsUI(data.brouillons);
    }

    updateBrouillonWithReport(brouillonId, reportContent) {
        const data = this.loadAppData();
        const brouillon = data.brouillons.find(b => b.id === brouillonId);
        
        if (brouillon) {
            brouillon.generatedReport = reportContent;
            brouillon.status = 'ready';
            brouillon.title = this.extractTitleFromContent(reportContent);
            
            this.saveAppData(data);
            this.updateBrouillonsUI(data.brouillons);
        }
    }

    updateBrouillonStatus(brouillonId, status) {
        const data = this.loadAppData();
        const brouillon = data.brouillons.find(b => b.id === brouillonId);
        
        if (brouillon) {
            brouillon.status = status;
            if (status === 'error') {
                brouillon.title = 'Erreur lors de la génération';
            }
            
            this.saveAppData(data);
            this.updateBrouillonsUI(data.brouillons);
        }
    }

    deleteBrouillon(brouillonId) {
        const data = this.loadAppData();
        data.brouillons = data.brouillons.filter(b => b.id !== brouillonId);
        
        this.saveAppData(data);
        this.updateBrouillonsUI(data.brouillons);
        Utils.showToast('Brouillon supprimé', 'success');
    }

    editBrouillon(brouillonId) {
        const data = this.loadAppData();
        const brouillon = data.brouillons.find(b => b.id === brouillonId);
        
        if (brouillon) {
            const modal = Utils.createModal(
                'Éditer le rapport',
                `
                    <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                        Titre du rapport:
                    </label>
                    <input type="text" id="editTitle" class="modal-input" value="${Utils.escapeHtml(brouillon.title || 'Nouveau rapport')}">
                    
                    <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                        Contenu du rapport:
                    </label>
                    <textarea id="editContent" class="modal-textarea">${Utils.escapeHtml(brouillon.generatedReport || '')}</textarea>
                `,
                [
                    { text: 'Annuler', class: 'btn-secondary', onclick: 'this.closest("[data-modal]").remove()' },
                    { text: '💾 Sauvegarder', class: 'btn-primary', onclick: `window.dataManager.saveEditedBrouillon('${brouillonId}', this)` }
                ]
            );
        }
    }

    saveEditedBrouillon(brouillonId, buttonElement) {
        const modal = buttonElement.closest('[data-modal]');
        const newTitle = modal.querySelector('#editTitle').value.trim();
        const newContent = modal.querySelector('#editContent').value.trim();
        
        if (!newTitle || !newContent) {
            Utils.showToast('Veuillez remplir le titre et le contenu', 'error');
            return;
        }
        
        const data = this.loadAppData();
        const brouillon = data.brouillons.find(b => b.id === brouillonId);
        
        if (brouillon) {
            brouillon.title = newTitle;
            brouillon.generatedReport = newContent;
            brouillon.isModified = true;
            
            this.saveAppData(data);
            this.updateBrouillonsUI(data.brouillons);
            
            modal.remove();
            Utils.showToast('Rapport modifié avec succès', 'success');
        }
    }

    async validateBrouillon(brouillonId) {
        if (!confirm('Valider ce rapport ? Il sera déplacé dans les rapports finalisés et converti en PDF.')) {
            return;
        }

        const data = this.loadAppData();
        const brouillonIndex = data.brouillons.findIndex(b => b.id === brouillonId);
        
        if (brouillonIndex !== -1) {
            const brouillon = data.brouillons[brouillonIndex];
            
            // Création du rapport
            const rapport = {
                id: Utils.generateId('rapport_'),
                title: brouillon.title || `Rapport - ${new Date().toLocaleDateString()}`,
                content: brouillon.generatedReport,
                validatedAt: new Date().toISOString(),
                createdAt: brouillon.createdAt,
                sharedWith: [],
                status: 'validated',
                isModified: brouillon.isModified,
                sourceType: brouillon.sourceType,
                sourceInfo: brouillon.sourceInfo,
                hasPdf: false,
                pdfGenerated: false
            };

            // Génération du PDF
            try {
                Utils.showToast('Génération du PDF en cours...', 'info');
                const pdf = await Utils.generatePDF(rapport.title, rapport.content);
                rapport.pdfData = pdf.output('datauristring');
                rapport.hasPdf = true;
                rapport.pdfGenerated = true;
                Utils.showToast('PDF généré avec succès', 'success');
            } catch (error) {
                console.error('Erreur génération PDF:', error);
                Utils.showToast('Erreur lors de la génération du PDF', 'error');
            }

            data.rapports = data.rapports || [];
            data.rapports.unshift(rapport);
            data.brouillons.splice(brouillonIndex, 1);
            
            this.saveAppData(data);
            
            this.updateBrouillonsUI(data.brouillons);
            this.updateRapportsUI(data.rapports);
            
            Utils.showToast('Rapport validé et converti en PDF', 'success');
        }
    }

    // === GESTION DES RAPPORTS FINALISÉS ===

    getRapports() {
        const data = this.loadAppData();
        return data.rapports || [];
    }

    viewRapport(rapportId) {
        const data = this.loadAppData();
        const rapport = data.rapports.find(r => r.id === rapportId);
        
        if (rapport) {
            const pdfButton = rapport.hasPdf ? 
                `<button class="btn-primary" onclick="window.dataManager.downloadPDF('${rapportId}')" style="margin-right: 10px;">📄 Télécharger PDF</button>` : '';
            
            const modal = Utils.createModal(
                `📋 ${rapport.title}`,
                `
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; color: #666;">
                        <strong>Validé le:</strong> ${Utils.formatDate(rapport.validatedAt)}
                        ${rapport.isModified ? '<br><em>⚠️ Rapport modifié après génération</em>' : ''}
                        ${rapport.hasPdf ? '<br><strong>📄 PDF disponible</strong>' : ''}
                    </div>
                    <div style="line-height: 1.6; font-size: 15px; white-space: pre-wrap;">
                        ${Utils.escapeHtml(rapport.content)}
                    </div>
                `,
                [
                    pdfButton,
                    { text: '📤 Partager', class: 'btn-primary', onclick: `window.dataManager.shareRapport('${rapportId}'); this.closest('[data-modal]').remove();` },
                    { text: 'Fermer', class: 'btn-secondary', onclick: 'this.closest("[data-modal]").remove()' }
                ]
            );
        }
    }

    async shareRapport(rapportId) {
        const data = this.loadAppData();
        const rapport = data.rapports.find(r => r.id === rapportId);
        
        if (rapport) {
            const shareText = `${rapport.title}\n\n${rapport.content}`;
            
            // Tentative de partage natif
            const shared = await Utils.shareContent(rapport.title, shareText);
            
            if (!shared) {
                // Fallback : copie dans le presse-papier
                const copied = await Utils.copyToClipboard(shareText);
                if (copied) {
                    Utils.showToast('Rapport copié dans le presse-papier', 'success');
                } else {
                    Utils.showToast('Erreur lors du partage', 'error');
                }
            }
        }
    }

    exportRapport(rapportId) {
        const data = this.loadAppData();
        const rapport = data.rapports.find(r => r.id === rapportId);
        
        if (rapport) {
            const textContent = `${rapport.title}\n\nValidé le: ${Utils.formatDate(rapport.validatedAt)}\n\n${rapport.content}`;
            const blob = new Blob([textContent], { type: 'text/plain' });
            const filename = `${rapport.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
            
            Utils.downloadFile(blob, filename);
            Utils.showToast('Rapport exporté', 'success');
        }
    }

    downloadPDF(rapportId) {
        const data = this.loadAppData();
        const rapport = data.rapports.find(r => r.id === rapportId);
        
        if (rapport && rapport.pdfData) {
            // Conversion du data URI en blob
            const byteCharacters = atob(rapport.pdfData.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            const filename = `${rapport.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            Utils.downloadFile(blob, filename);
            Utils.showToast('PDF téléchargé', 'success');
        } else {
            Utils.showToast('PDF non disponible', 'error');
        }
    }

    filterRapports(searchTerm) {
        const data = this.loadAppData();
        const rapports = data.rapports || [];
        
        if (!searchTerm) {
            this.updateRapportsUI(rapports);
            return;
        }

        const filtered = rapports.filter(rapport => 
            rapport.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rapport.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.updateRapportsUI(filtered);
    }

    // === MÉTHODES UTILITAIRES ===

    extractTitleFromContent(content) {
        if (!content) return 'Rapport généré - En attente de validation';
        
        // Recherche des patterns de titre
        const patterns = [
            /titre\s*[:=]\s*([^\n\r]+)/i,
            /title\s*[:=]\s*([^\n\r]+)/i,
            /client\s*[:=]\s*([^\n\r]+)/i,
            /^([^\n\r]{10,80})/  // Première ligne si pas trop courte/longue
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                return match[1].trim().replace(/^[#\-*=\s]+|[#\-*=\s]+$/g, '');
            }
        }
        
        return 'Rapport généré - En attente de validation';
    }

    // === MISE À JOUR DE L'INTERFACE ===

    updateBrouillonsUI(brouillons) {
        const container = document.getElementById('brouillonsList');
        if (!container) return;
        
        if (!brouillons || brouillons.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📄</div>
                    <p>Aucun brouillon pour le moment</p>
                    <p class="empty-subtitle">Enregistrez ou importez votre premier rapport vocal !</p>
                </div>
            `;
            return;
        }

        container.innerHTML = brouillons.map(brouillon => {
            const date = Utils.formatDate(brouillon.createdAt);
            let statusClass = '';
            let statusIcon = '📄';
            
            if (brouillon.status === 'generating') {
                statusClass = 'status-generating';
                statusIcon = '⏳';
            } else if (brouillon.status === 'error') {
                statusClass = 'status-error';
                statusIcon = '⚠️';
            }

            const content = brouillon.generatedReport || 'Génération en cours...';
            const truncatedContent = Utils.truncateText(content, 100);

            const sourceIndicator = brouillon.sourceType === 'upload' ? '📁' : '🎤';

            return `
                <div class="report-item ${statusClass}">
                    <div class="report-header">
                        <div class="report-title">${statusIcon} ${sourceIndicator} ${Utils.escapeHtml(brouillon.title || 'Nouveau rapport')}</div>
                        <div class="report-date">${date}</div>
                    </div>
                    <div class="report-content">${Utils.escapeHtml(truncatedContent)}</div>
                    <div class="report-actions">
                        ${brouillon.status === 'ready' ? `
                            <button class="action-btn edit-btn" onclick="window.dataManager.editBrouillon('${brouillon.id}')">✏️ Éditer</button>
                            <button class="action-btn validate-btn" onclick="window.dataManager.validateBrouillon('${brouillon.id}')">✅ Valider</button>
                        ` : ''}
                        ${brouillon.status === 'generating' ? `
                            <div class="loading-spinner"></div>
                        ` : ''}
                        ${brouillon.status === 'error' ? `
                            <button class="action-btn edit-btn" disabled>🔄 Audio non disponible</button>
                        ` : ''}
                        <button class="action-btn delete-btn" onclick="window.dataManager.deleteBrouillon('${brouillon.id}')">🗑️ Supprimer</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateRapportsUI(rapports) {
        const container = document.getElementById('rapportsList');
        const counter = document.getElementById('rapportsCount');
        const pdfCounter = document.getElementById('pdfCount');
        
        if (counter) {
            counter.textContent = rapports ? rapports.length : 0;
        }
        
        if (pdfCounter) {
            const pdfCount = rapports ? rapports.filter(r => r.hasPdf).length : 0;
            pdfCounter.textContent = pdfCount;
        }
        
        if (!container) return;
        
        if (!rapports || rapports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📋</div>
                    <p>Aucun rapport finalisé</p>
                    <p class="empty-subtitle">Validez vos brouillons pour les voir ici !</p>
                </div>
            `;
            return;
        }

        container.innerHTML = rapports.map(rapport => {
            const dateValidated = new Date(rapport.validatedAt).toLocaleDateString();
            const truncatedContent = Utils.truncateText(rapport.content, 150);
            const sourceIndicator = rapport.sourceType === 'upload' ? '📁' : '🎤';
            const pdfIndicator = rapport.hasPdf ? '📄' : '';
            
            return `
                <div class="report-item" onclick="window.dataManager.viewRapport('${rapport.id}')">
                    <div class="report-header">
                        <div class="report-title">📋 ${pdfIndicator} ${sourceIndicator} ${Utils.escapeHtml(rapport.title)}</div>
                        <div class="report-date">Validé le ${dateValidated}</div>
                    </div>
                    <div class="report-content">${Utils.escapeHtml(truncatedContent)}</div>
                    <div class="report-actions">
                        <button class="action-btn view-btn" onclick="event.stopPropagation(); window.dataManager.viewRapport('${rapport.id}')">👁️ Voir</button>
                        ${rapport.hasPdf ? `
                            <button class="action-btn download-pdf-btn" onclick="event.stopPropagation(); window.dataManager.downloadPDF('${rapport.id}')">📄 PDF</button>
                        ` : ''}
                        <button class="action-btn share-btn" onclick="event.stopPropagation(); window.dataManager.shareRapport('${rapport.id}')">📤 Partager</button>
                        <button class="action-btn export-btn" onclick="event.stopPropagation(); window.dataManager.exportRapport('${rapport.id}')">💾 Export TXT</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}