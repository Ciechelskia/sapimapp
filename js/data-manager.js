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
                    rapports: data.rapports || [],
                    folders: data.folders || []
                };
            }
        } catch (error) {
            console.error('Erreur lecture localStorage:', error);
        }
        return { brouillons: [], rapports: [], folders: [] };
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
                folders: data.folders || [],
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(cleaned));
            console.log('Nettoyage automatique effectué');
            Utils.showToast(t('toast.users.updated'), 'info');
        } catch (error) {
            console.error('Erreur lors du nettoyage:', error);
        }
    }

    // === GESTION DES DOSSIERS ===

    getFolders() {
        const data = this.loadAppData();
        return data.folders || [];
    }

    createFolder(folderName) {
        if (!folderName || !folderName.trim()) {
            Utils.showToast(t('toast.folder.error.empty'), 'error');
            return null;
        }

        const data = this.loadAppData();
        data.folders = data.folders || [];

        // Vérifier si le dossier existe déjà
        if (data.folders.find(f => f.name.toLowerCase() === folderName.toLowerCase())) {
            Utils.showToast(t('toast.folder.error.exists'), 'error');
            return null;
        }

        const folder = {
            id: Utils.generateId('folder_'),
            name: folderName.trim(),
            createdAt: new Date().toISOString(),
            color: this.getRandomFolderColor()
        };

        data.folders.push(folder);
        this.saveAppData(data);
        
        Utils.showToast(t('toast.folder.created', { name: folderName }), 'success');
        return folder;
    }

    deleteFolder(folderId) {
        if (!confirm(t('folder.delete.confirm'))) {
            return;
        }

        const data = this.loadAppData();
        
        // Déplacer tous les rapports du dossier vers "Sans dossier"
        if (data.rapports) {
            data.rapports.forEach(rapport => {
                if (rapport.folderId === folderId) {
                    rapport.folderId = null;
                }
            });
        }

        data.folders = data.folders.filter(f => f.id !== folderId);
        this.saveAppData(data);
        
        this.updateRapportsUI(data.rapports);
        Utils.showToast(t('toast.folder.deleted'), 'success');
    }

    renameFolder(folderId) {
        const data = this.loadAppData();
        const folder = data.folders.find(f => f.id === folderId);
        
        if (!folder) return;

        const modal = Utils.createModal(
            t('modal.folder.rename.title'),
            `
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                    ${t('modal.folder.rename.label')}
                </label>
                <input type="text" id="folderNameInput" class="modal-input" value="${Utils.escapeHtml(folder.name)}" placeholder="${t('modal.folder.rename.placeholder')}">
            `,
            [
                { text: t('modal.edit.cancel'), class: 'btn-secondary', onclick: 'this.closest("[data-modal]").remove()' },
                { text: t('modal.edit.save'), class: 'btn-primary', onclick: `window.dataManager.saveFolderRename('${folderId}', this)` }
            ]
        );
    }

    saveFolderRename(folderId, buttonElement) {
        const modal = buttonElement.closest('[data-modal]');
        const newName = modal.querySelector('#folderNameInput').value.trim();
        
        if (!newName) {
            Utils.showToast(t('toast.folder.error.empty'), 'error');
            return;
        }

        const data = this.loadAppData();
        const folder = data.folders.find(f => f.id === folderId);
        
        if (folder) {
            folder.name = newName;
            this.saveAppData(data);
            this.updateRapportsUI(data.rapports);
            modal.remove();
            Utils.showToast(t('toast.folder.renamed'), 'success');
        }
    }

    moveRapportToFolder(rapportId, newFolderId) {
        const data = this.loadAppData();
        const rapport = data.rapports.find(r => r.id === rapportId);
        
        if (rapport) {
            rapport.folderId = newFolderId;
            this.saveAppData(data);
            this.updateRapportsUI(data.rapports);
            
            const folderName = newFolderId ? data.folders.find(f => f.id === newFolderId)?.name : t('folder.none');
            Utils.showToast(t('toast.report.moved', { folder: folderName }), 'success');
        }
    }

    getRandomFolderColor() {
        const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showCreateFolderModal() {
        const modal = Utils.createModal(
            t('modal.folder.create.title'),
            `
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                    ${t('modal.folder.create.label')}
                </label>
                <input type="text" id="newFolderName" class="modal-input" placeholder="${t('modal.folder.create.placeholder')}" autofocus>
            `,
            [
                { text: t('modal.edit.cancel'), class: 'btn-secondary', onclick: 'this.closest("[data-modal]").remove()' },
                { text: t('modal.folder.create.button'), class: 'btn-primary', onclick: 'window.dataManager.handleCreateFolder(this)' }
            ]
        );

        // Enter pour valider
        const input = modal.querySelector('#newFolderName');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.dataManager.handleCreateFolder(e.target);
            }
        });
    }

    handleCreateFolder(element) {
        const modal = element.closest('[data-modal]');
        const input = modal.querySelector('#newFolderName');
        const folderName = input.value.trim();

        if (this.createFolder(folderName)) {
            modal.remove();
            this.updateRapportsUI(this.getRapports());
        }
    }

    showMoveFolderModal(rapportId) {
        const data = this.loadAppData();
        const folders = data.folders || [];
        const rapport = data.rapports.find(r => r.id === rapportId);

        const foldersOptions = [
            `<option value="">${t('folder.none')}</option>`,
            ...folders.map(folder => 
                `<option value="${folder.id}" ${rapport.folderId === folder.id ? 'selected' : ''}>
                    📁 ${Utils.escapeHtml(folder.name)}
                </option>`
            )
        ].join('');

        const modal = Utils.createModal(
            t('modal.move.title'),
            `
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                    ${t('modal.move.label')}
                </label>
                <select id="folderSelect" class="modal-input" style="cursor: pointer;">
                    ${foldersOptions}
                </select>
            `,
            [
                { text: t('modal.edit.cancel'), class: 'btn-secondary', onclick: 'this.closest("[data-modal]").remove()' },
                { text: t('modal.move.button'), class: 'btn-primary', onclick: `window.dataManager.handleMoveRapport('${rapportId}', this)` }
            ]
        );
    }

    handleMoveRapport(rapportId, buttonElement) {
        const modal = buttonElement.closest('[data-modal]');
        const select = modal.querySelector('#folderSelect');
        const folderId = select.value || null;

        this.moveRapportToFolder(rapportId, folderId);
        modal.remove();
    }

    toggleFolder(folderId) {
        const content = document.getElementById(`folder-content-${folderId}`);
        const arrow = document.getElementById(`folder-arrow-${folderId}`);
        
        if (!content || !arrow) return;
        
        const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
        
        if (isOpen) {
            // Fermer
            content.style.maxHeight = '0px';
            content.style.padding = '0 25px';
            arrow.style.transform = 'rotate(0deg)';
        } else {
            // Ouvrir
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.padding = '0 25px';
            arrow.style.transform = 'rotate(90deg)';
            
            // Ajuster la hauteur après l'animation
            setTimeout(() => {
                content.style.maxHeight = 'fit-content';
            }, 400);
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
                brouillon.title = t('drafts.status.error');
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
        Utils.showToast(t('toast.draft.deleted'), 'success');
    }

    editBrouillon(brouillonId) {
        const data = this.loadAppData();
        const brouillon = data.brouillons.find(b => b.id === brouillonId);
        
        if (brouillon) {
            const modal = Utils.createModal(
                t('modal.edit.title'),
                `
                    <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                        ${t('modal.edit.title.label')}
                    </label>
                    <input type="text" id="editTitle" class="modal-input" value="${Utils.escapeHtml(brouillon.title || t('new.report'))}">
                    
                    <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                        ${t('modal.edit.content.label')}
                    </label>
                    <textarea id="editContent" class="modal-textarea">${Utils.escapeHtml(brouillon.generatedReport || '')}</textarea>
                `,
                [
                    { text: t('modal.edit.cancel'), class: 'btn-secondary', onclick: 'this.closest("[data-modal]").remove()' },
                    { text: t('modal.edit.save'), class: 'btn-primary', onclick: `window.dataManager.saveEditedBrouillon('${brouillonId}', this)` }
                ]
            );
        }
    }

    saveEditedBrouillon(brouillonId, buttonElement) {
        const modal = buttonElement.closest('[data-modal]');
        const newTitle = modal.querySelector('#editTitle').value.trim();
        const newContent = modal.querySelector('#editContent').value.trim();
        
        if (!newTitle || !newContent) {
            Utils.showToast(t('toast.draft.error.empty'), 'error');
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
            Utils.showToast(t('toast.draft.saved'), 'success');
        }
    }

    async validateBrouillon(brouillonId) {
        const data = this.loadAppData();
        const folders = data.folders || [];

        // Si des dossiers existent, proposer le choix
        if (folders.length > 0) {
            const foldersOptions = [
                `<option value="">${t('folder.none')}</option>`,
                ...folders.map(folder => 
                    `<option value="${folder.id}">📁 ${Utils.escapeHtml(folder.name)}</option>`
                )
            ].join('');

            const modal = Utils.createModal(
                t('modal.validate.title'),
                `
                    <p style="margin-bottom: 20px;">${t('modal.validate.message')}</p>
                    <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                        ${t('modal.validate.folder.label')}
                    </label>
                    <select id="validateFolderSelect" class="modal-input" style="cursor: pointer;">
                        ${foldersOptions}
                    </select>
                `,
                [
                    { text: t('modal.edit.cancel'), class: 'btn-secondary', onclick: 'this.closest("[data-modal]").remove()' },
                    { text: t('drafts.action.validate'), class: 'btn-primary', onclick: `window.dataManager.confirmValidateBrouillon('${brouillonId}', this)` }
                ]
            );
        } else {
            // Pas de dossiers, validation directe
            this.confirmValidateBrouillon(brouillonId);
        }
    }

    async confirmValidateBrouillon(brouillonId, buttonElement = null) {
        let selectedFolderId = null;

        if (buttonElement) {
            const modal = buttonElement.closest('[data-modal]');
            const select = modal.querySelector('#validateFolderSelect');
            selectedFolderId = select.value || null;
            modal.remove();
        }

        const data = this.loadAppData();
        const brouillonIndex = data.brouillons.findIndex(b => b.id === brouillonId);
        
        if (brouillonIndex !== -1) {
            const brouillon = data.brouillons[brouillonIndex];
            
            // Création du rapport
            const rapport = {
                id: Utils.generateId('rapport_'),
                title: brouillon.title || `${t('new.report')} - ${new Date().toLocaleDateString()}`,
                content: brouillon.generatedReport,
                validatedAt: new Date().toISOString(),
                createdAt: brouillon.createdAt,
                folderId: selectedFolderId,
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
                Utils.showToast(t('toast.report.pdf.generating'), 'info');
                const pdf = await Utils.generatePDF(rapport.title, rapport.content);
                rapport.pdfData = pdf.output('datauristring');
                rapport.hasPdf = true;
                rapport.pdfGenerated = true;
                Utils.showToast(t('toast.report.pdf.generated'), 'success');
            } catch (error) {
                console.error('Erreur génération PDF:', error);
                Utils.showToast(t('toast.report.pdf.error'), 'error');
            }

            data.rapports = data.rapports || [];
            data.rapports.unshift(rapport);
            data.brouillons.splice(brouillonIndex, 1);
            
            this.saveAppData(data);
            
            this.updateBrouillonsUI(data.brouillons);
            this.updateRapportsUI(data.rapports);
            
            Utils.showToast(t('toast.draft.validated'), 'success');
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
            const validatedDate = Utils.formatDate(rapport.validatedAt);
            const modifiedWarning = rapport.isModified ? `<br><em>${t('modal.view.modified')}</em>` : '';
            const pdfAvailable = rapport.hasPdf ? `<br><strong>${t('modal.view.pdf.available')}</strong>` : '';
            
            const modal = Utils.createModal(
                `📋 ${rapport.title}`,
                `
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; color: #666;">
                        <strong>${t('date.validated')}:</strong> ${validatedDate}
                        ${modifiedWarning}
                        ${pdfAvailable}
                    </div>
                    <div style="line-height: 1.6; font-size: 15px; white-space: pre-wrap;">
                        ${Utils.escapeHtml(rapport.content)}
                    </div>
                `,
                []
            );
        }
    }

    async shareRapport(rapportId) {
        const data = this.loadAppData();
        const rapport = data.rapports.find(r => r.id === rapportId);
        
        if (!rapport) return;
        
        if (rapport.hasPdf && rapport.pdfData) {
            try {
                const byteCharacters = atob(rapport.pdfData.split(',')[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
                
                const filename = `${rapport.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
                
                if (navigator.share && navigator.canShare) {
                    const file = new File([pdfBlob], filename, { type: 'application/pdf' });
                    
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: rapport.title,
                            text: `${t('new.report')}: ${rapport.title}`,
                            files: [file]
                        });
                        Utils.showToast(t('toast.report.shared'), 'success');
                        return;
                    }
                }
                
                const pdfUrl = URL.createObjectURL(pdfBlob);
                const emailSubject = encodeURIComponent(`${t('new.report')}: ${rapport.title}`);
                const emailBody = encodeURIComponent(
                    `Bonjour,\n\n${t('new.report')}: ${rapport.title}\n\n` +
                    `${t('date.generated')}: ${Utils.formatDate(rapport.validatedAt)}\n\n` +
                    `Le PDF est disponible en téléchargement : ${pdfUrl}\n\n` +
                    `Cordialement`
                );
                
                const mailtoLink = `mailto:?subject=${emailSubject}&body=${emailBody}`;
                window.open(mailtoLink, '_blank');
                
                const a = document.createElement('a');
                a.href = pdfUrl;
                a.download = filename;
                a.click();
                
                setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
                
                Utils.showToast(t('toast.report.share.email'), 'success');
                
            } catch (error) {
                console.error('Erreur lors du partage PDF:', error);
                Utils.showToast(t('toast.report.share.error'), 'error');
                this.shareRapportAsText(rapport);
            }
        } else {
            Utils.showToast(t('toast.report.share.text'), 'info');
            this.shareRapportAsText(rapport);
        }
    }

    async shareRapportAsText(rapport) {
        const shareText = `${rapport.title}\n\n${rapport.content}`;
        
        const shared = await Utils.shareContent(rapport.title, shareText);
        
        if (!shared) {
            const copied = await Utils.copyToClipboard(shareText);
            if (copied) {
                Utils.showToast(t('toast.report.share.copied'), 'success');
            } else {
                Utils.showToast(t('toast.report.share.error'), 'error');
            }
        }
    }

    exportRapport(rapportId) {
        const data = this.loadAppData();
        const rapport = data.rapports.find(r => r.id === rapportId);
        
        if (rapport) {
            const textContent = `${rapport.title}\n\n${t('date.validated')}: ${Utils.formatDate(rapport.validatedAt)}\n\n${rapport.content}`;
            const blob = new Blob([textContent], { type: 'text/plain' });
            const filename = `${rapport.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
            
            Utils.downloadFile(blob, filename);
            Utils.showToast(t('toast.report.exported'), 'success');
        }
    }

    downloadPDF(rapportId) {
        const data = this.loadAppData();
        const rapport = data.rapports.find(r => r.id === rapportId);
        
        if (rapport && rapport.pdfData) {
            const byteCharacters = atob(rapport.pdfData.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            const filename = `${rapport.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            Utils.downloadFile(blob, filename);
            Utils.showToast(t('toast.report.pdf.downloaded'), 'success');
        } else {
            Utils.showToast(t('toast.report.pdf.unavailable'), 'error');
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
        if (!content) return t('report.title.default');
        
        const patterns = [
            /titre\s*[:=]\s*([^\n\r]+)/i,
            /title\s*[:=]\s*([^\n\r]+)/i,
            /client\s*[:=]\s*([^\n\r]+)/i,
            /^([^\n\r]{10,80})/
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                return match[1].trim().replace(/^[#\-*=\s]+|[#\-*=\s]+$/g, '');
            }
        }
        
        return t('report.title.default');
    }

    // === MISE À JOUR DE L'INTERFACE ===

    updateBrouillonsUI(brouillons) {
        const container = document.getElementById('brouillonsList');
        if (!container) return;
        
        if (!brouillons || brouillons.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📄</div>
                    <p>${t('drafts.empty')}</p>
                    <p class="empty-subtitle">${t('drafts.empty.subtitle')}</p>
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

            const content = brouillon.generatedReport || t('status.generating');
            const truncatedContent = Utils.truncateText(content, 100);

            const sourceIndicator = brouillon.sourceType === 'upload' ? '📁' : '🎤';

            return `
                <div class="report-item ${statusClass}">
                    <div class="report-header">
                        <div class="report-title">${statusIcon} ${sourceIndicator} ${Utils.escapeHtml(brouillon.title || t('new.report'))}</div>
                        <div class="report-date">${date}</div>
                    </div>
                    <div class="report-content">${Utils.escapeHtml(truncatedContent)}</div>
                    <div class="report-actions">
                        ${brouillon.status === 'ready' ? `
                            <button class="action-btn edit-btn" onclick="window.dataManager.editBrouillon('${brouillon.id}')">${t('drafts.action.edit')}</button>
                            <button class="action-btn validate-btn" onclick="window.dataManager.validateBrouillon('${brouillon.id}')">${t('drafts.action.validate')}</button>
                        ` : ''}
                        ${brouillon.status === 'generating' ? `
                            <div class="loading-spinner"></div>
                        ` : ''}
                        ${brouillon.status === 'error' ? `
                            <button class="action-btn edit-btn" disabled>${t('drafts.action.audio.unavailable')}</button>
                        ` : ''}
                        <button class="action-btn delete-btn" onclick="window.dataManager.deleteBrouillon('${brouillon.id}')">${t('drafts.action.delete')}</button>
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
        
        const data = this.loadAppData();
        const folders = data.folders || [];

        if (!rapports || rapports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📋</div>
                    <p>${t('reports.empty')}</p>
                    <p class="empty-subtitle">${t('reports.empty.subtitle')}</p>
                </div>
            `;
            return;
        }

        // Grouper par dossier
        const rapportsParDossier = {
            null: rapports.filter(r => !r.folderId)
        };

        folders.forEach(folder => {
            rapportsParDossier[folder.id] = rapports.filter(r => r.folderId === folder.id);
        });

        let html = '';

        // Afficher les dossiers repliables
        folders.forEach(folder => {
            const folderRapports = rapportsParDossier[folder.id] || [];
            
            html += `
                <div class="folder-section" style="
                    margin-bottom: 20px; 
                    border: 2px solid ${folder.color}; 
                    border-radius: 20px; 
                    padding: 0;
                    background: linear-gradient(135deg, ${folder.color}08, ${folder.color}03);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    overflow: hidden;
                    transition: all 0.3s ease;
                ">
                    <!-- En-tête cliquable du dossier -->
                    <div onclick="window.dataManager.toggleFolder('${folder.id}')" style="
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        padding: 20px 25px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        background: linear-gradient(135deg, ${folder.color}15, ${folder.color}08);
                    " onmouseover="this.style.background='linear-gradient(135deg, ${folder.color}25, ${folder.color}15)'" 
                       onmouseout="this.style.background='linear-gradient(135deg, ${folder.color}15, ${folder.color}08)'">
                        
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <span id="folder-arrow-${folder.id}" style="font-size: 20px; transition: transform 0.3s ease; color: ${folder.color};">▶</span>
                            <h3 style="margin: 0; color: ${folder.color}; font-size: 20px; display: flex; align-items: center; gap: 12px; font-weight: 700;">
                                📁 ${Utils.escapeHtml(folder.name)}
                                <span style="background: ${folder.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 8px ${folder.color}40;">
                                    ${folderRapports.length}
                                </span>
                            </h3>
                        </div>
                        
                        <div onclick="event.stopPropagation();" style="display: flex; gap: 10px;">
                            <button class="action-btn" style="background: var(--gradient-warning); color: white; padding: 8px 16px; font-size: 12px; border-radius: 20px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);" onclick="window.dataManager.renameFolder('${folder.id}')">
                                ✏️ ${t('folder.action.rename')}
                            </button>
                            <button class="action-btn" style="background: var(--gradient-error); color: white; padding: 8px 16px; font-size: 12px; border-radius: 20px; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);" onclick="window.dataManager.deleteFolder('${folder.id}')">
                                🗑️ ${t('folder.action.delete')}
                            </button>
                        </div>
                    </div>
                    
                    <!-- Contenu repliable du dossier -->
                    <div id="folder-content-${folder.id}" style="
                        max-height: 0;
                        overflow: hidden;
                        transition: max-height 0.4s ease, padding 0.4s ease;
                        padding: 0 25px;
                    ">
                        <div style="padding: 20px 0; border-top: 2px solid ${folder.color}30;">
                            <div class="reports-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                ${folderRapports.length > 0 ? folderRapports.map(rapport => this.renderRapportCard(rapport)).join('') : `
                                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--gray-500); font-style: italic;">
                                        <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;">📭</div>
                                        ${t('folder.empty')}
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Rapports sans dossier
        const rapportsSansDossier = rapportsParDossier[null] || [];
        if (rapportsSansDossier.length > 0) {
            html += `
                <div class="folder-section" style="
                    margin-bottom: 25px; 
                    border: 2px solid var(--gray-300); 
                    border-radius: 20px; 
                    padding: 25px; 
                    background: linear-gradient(135deg, var(--gray-100), var(--gray-50));
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--gray-300);">
                        <h3 style="margin: 0; color: var(--gray-700); font-size: 20px; display: flex; align-items: center; gap: 12px; font-weight: 700;">
                            📄 ${t('folder.none')}
                            <span style="background: var(--gray-500); color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);">
                                ${rapportsSansDossier.length}
                            </span>
                        </h3>
                    </div>
                    <div class="reports-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        ${rapportsSansDossier.map(rapport => this.renderRapportCard(rapport)).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    renderRapportCard(rapport) {
        const dateValidated = new Date(rapport.validatedAt).toLocaleDateString();
        const truncatedContent = Utils.truncateText(rapport.content, 150);
        const sourceIndicator = rapport.sourceType === 'upload' ? '📁' : '🎤';
        const pdfIndicator = rapport.hasPdf ? '📄' : '';
        
        return `
            <div class="report-item" onclick="window.dataManager.viewRapport('${rapport.id}')">
                <div class="report-header">
                    <div class="report-title">📋 ${pdfIndicator} ${sourceIndicator} ${Utils.escapeHtml(rapport.title)}</div>
                    <div class="report-date">${t('reports.validated.on')} ${dateValidated}</div>
                </div>
                <div class="report-content">${Utils.escapeHtml(truncatedContent)}</div>
                <div class="report-actions">
                    <button class="action-btn view-btn" onclick="event.stopPropagation(); window.dataManager.viewRapport('${rapport.id}')">${t('reports.action.view')}</button>
                    ${rapport.hasPdf ? `
                        <button class="action-btn download-pdf-btn" onclick="event.stopPropagation(); window.dataManager.downloadPDF('${rapport.id}')">${t('reports.action.pdf')}</button>
                    ` : ''}
                    <button class="action-btn share-btn" onclick="event.stopPropagation(); window.dataManager.shareRapport('${rapport.id}')">${t('reports.action.share')}</button>
                    <button class="action-btn export-btn" onclick="event.stopPropagation(); window.dataManager.exportRapport('${rapport.id}')">${t('reports.action.export')}</button>
                    <button class="action-btn" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white;" onclick="event.stopPropagation(); window.dataManager.showMoveFolderModal('${rapport.id}')">📂 ${t('reports.action.move')}</button>
                </div>
            </div>
        `;
    }
}