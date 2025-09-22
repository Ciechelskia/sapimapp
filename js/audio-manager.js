// Gestionnaire audio pour l'enregistrement et le traitement des fichiers
class AudioManager {
    constructor() {
        this.isRecording = false;
        this.audioRecorder = null;
        this.audioStream = null;
        this.recordedBlob = null;
        this.audioChunks = [];
        this.uploadedFile = null;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.recordBtn = document.getElementById('recordBtn');
        this.playBtn = document.getElementById('playBtn');
        this.reRecordBtn = document.getElementById('reRecordBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.audioFileInput = document.getElementById('audioFileInput');
        this.sendAudioBtn = document.getElementById('sendAudioBtn');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.uploadStatus = document.getElementById('uploadStatus');
        this.audioControls = document.getElementById('audioControls');
    }

    bindEvents() {
        if (this.recordBtn) {
            this.recordBtn.addEventListener('click', () => this.toggleRecording());
        }

        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => this.playRecording());
        }

        if (this.reRecordBtn) {
            this.reRecordBtn.addEventListener('click', () => this.resetRecording());
        }

        if (this.uploadBtn) {
            this.uploadBtn.addEventListener('click', () => this.audioFileInput.click());
        }

        if (this.audioFileInput) {
            this.audioFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        if (this.sendAudioBtn) {
            this.sendAudioBtn.addEventListener('click', () => this.sendAudio());
        }
    }

    // === ENREGISTREMENT AUDIO ===

    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(CONFIG.RECORDER_OPTIONS);
            this.audioStream = stream;

            // Détection automatique du meilleur format supporté
            let options = {};
            let selectedFormat = null;
            
            for (const format of CONFIG.PREFERRED_FORMATS) {
                if (MediaRecorder.isTypeSupported(format)) {
                    selectedFormat = format;
                    options = { mimeType: format };
                    break;
                }
            }
            
            console.log('Format audio sélectionné:', selectedFormat || 'Défaut du navigateur');
            
            this.audioRecorder = new MediaRecorder(stream, options);
            this.audioChunks = [];

            this.audioRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.audioRecorder.onstop = () => {
                const blobType = selectedFormat || 'audio/wav';
                this.recordedBlob = new Blob(this.audioChunks, { type: blobType });
                console.log('Blob créé:', this.recordedBlob.size, 'bytes, type:', blobType);
                
                // Reset du fichier uploadé si on enregistre
                this.uploadedFile = null;
                this.updateUploadStatus('');
                this.uploadBtn.classList.remove('active');
                
                this.updateRecordingUI(false);
                this.stopAudioStream();
            };

            this.audioRecorder.start();
            this.isRecording = true;
            this.updateRecordingUI(true);
            
            console.log('Enregistrement démarré avec succès');

        } catch (error) {
            console.error('Erreur microphone:', error);
            
            let errorMessage = 'Erreur d\'accès au microphone: ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Permission refusée. Autorisez l\'accès au microphone.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'Aucun microphone détecté.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage += 'Enregistrement audio non supporté par ce navigateur.';
            } else {
                errorMessage += error.message;
            }
            
            Utils.showToast(errorMessage, 'error');
        }
    }

    stopRecording() {
        if (this.audioRecorder && this.isRecording) {
            this.audioRecorder.stop();
            this.isRecording = false;
        }
    }

    stopAudioStream() {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
    }

    playRecording() {
        const audioToPlay = this.uploadedFile || this.recordedBlob;
        
        if (audioToPlay) {
            const audioUrl = URL.createObjectURL(audioToPlay);
            const audio = new Audio(audioUrl);
            
            audio.play().catch(error => {
                console.error('Erreur lecture audio:', error);
                Utils.showToast('Erreur lors de la lecture audio', 'error');
            });
            
            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
            });
        }
    }

    resetRecording() {
        this.recordedBlob = null;
        this.uploadedFile = null;
        this.isRecording = false;
        this.stopAudioStream();
        
        // Reset UI
        this.updateRecordingUI(false);
        this.updateUploadStatus('');
        this.uploadBtn.classList.remove('active');
        
        if (this.recordingStatus) {
            this.recordingStatus.textContent = 'Appuyer pour enregistrer';
        }
        
        if (this.audioControls) {
            this.audioControls.classList.remove('show');
        }
        
        if (this.sendAudioBtn) {
            this.sendAudioBtn.classList.remove('show');
        }
    }

    // === UPLOAD DE FICHIERS ===

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validation du type de fichier
        if (!Utils.isValidAudioFile(file)) {
            Utils.showToast('Format de fichier non supporté', 'error');
            return;
        }

        // Validation de la taille
        if (!Utils.isValidFileSize(file)) {
            Utils.showToast(`Fichier trop volumineux (max: ${Utils.formatFileSize(CONFIG.MAX_FILE_SIZE)})`, 'error');
            return;
        }

        // Fichier valide
        this.uploadedFile = file;
        
        // Reset de l'enregistrement si on upload
        this.recordedBlob = null;
        this.resetRecordingUI();
        
        // Mise à jour de l'interface
        this.updateUploadStatus(`✅ ${file.name} (${Utils.formatFileSize(file.size)})`);
        this.uploadBtn.classList.add('active');
        
        // Affichage des contrôles
        if (this.audioControls) {
            this.audioControls.classList.add('show');
        }
        
        if (this.sendAudioBtn) {
            this.sendAudioBtn.classList.add('show');
        }

        Utils.showToast('Fichier audio chargé avec succès', 'success');
    }

    // === ENVOI AUDIO ===

    async sendAudio() {
        const audioSource = this.uploadedFile || this.recordedBlob;
        
        if (!audioSource) {
            Utils.showToast('Aucun audio à envoyer', 'error');
            return;
        }

        if (this.sendAudioBtn) {
            this.sendAudioBtn.disabled = true;
            this.sendAudioBtn.textContent = '📤 Envoi en cours...';
        }

        try {
            console.log('=== DÉBUT ENVOI AUDIO ===');
            
            let audioBlob;
            let sourceInfo;
            
            if (this.uploadedFile) {
                audioBlob = this.uploadedFile;
                sourceInfo = `Fichier uploadé: ${this.uploadedFile.name}`;
            } else {
                audioBlob = this.recordedBlob;
                sourceInfo = 'Enregistrement vocal';
            }
            
            console.log(sourceInfo, 'Taille:', audioBlob.size, 'bytes');
            
            const audioBase64 = await Utils.blobToBase64(audioBlob);
            console.log('Conversion base64 réussie, taille:', audioBase64.length, 'caractères');
            
            // Création du brouillon
            const brouillonId = Utils.generateId('brouillon_');
            const brouillon = {
                id: brouillonId,
                generatedReport: '',
                isModified: false,
                createdAt: new Date().toISOString(),
                status: 'generating',
                title: 'Génération en cours...',
                sourceType: this.uploadedFile ? 'upload' : 'recording',
                sourceInfo: sourceInfo
            };

            // Ajout du brouillon via le DataManager
            if (window.dataManager) {
                window.dataManager.addBrouillon(brouillon);
            }
            
            // Reset de l'interface
            this.resetRecording();

            // Appel du webhook N8n
            console.log('Appel N8n...');
            await this.callN8nWebhook(audioBase64, brouillonId);
            console.log('=== ENVOI AUDIO TERMINÉ ===');

            Utils.showToast('Audio envoyé pour traitement', 'success');

        } catch (error) {
            console.error('Erreur dans sendAudio:', error);
            Utils.showToast('Erreur lors de l\'envoi: ' + error.message, 'error');
        } finally {
            if (this.sendAudioBtn) {
                this.sendAudioBtn.disabled = false;
                this.sendAudioBtn.textContent = '📤 Envoyer pour traitement';
            }
        }
    }

    async callN8nWebhook(audioBase64, brouillonId) {
        try {
            console.log('=== APPEL N8N WEBHOOK ===');
            
            const currentUser = window.app ? window.app.getCurrentUser() : null;
            const payload = {
                audioData: audioBase64,
                userId: currentUser ? currentUser.username : 'unknown',
                timestamp: new Date().toISOString()
            };

            console.log('URL N8n:', CONFIG.N8N_WEBHOOK_URL);
            console.log('Payload size:', JSON.stringify(payload).length, 'caractères');

            const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (response.ok) {
                const result = await response.json();
                console.log('N8n success result:', result);
                console.log('=== DEBUG RÉPONSE N8N ===', result);
                console.log('result.content:', result.content);
                console.log('result.title:', result.title);
                console.log('Toutes les clés:', Object.keys(result));
                
                // Mise à jour du brouillon avec le contenu reçu
                if (window.dataManager) {
                    const reportContent = result.content || result.title || 'Erreur: contenu non reçu de N8n';
                    window.dataManager.updateBrouillonWithReport(brouillonId, reportContent);
                }
            } else {
                const errorText = await response.text();
                console.error('N8n HTTP error:', response.status, errorText);
                throw new Error(`N8n HTTP ${response.status}: ${errorText}`);
            }

        } catch (error) {
            console.error('Exception dans callN8nWebhook:', error);
            
            // Mise à jour du statut d'erreur
            if (window.dataManager) {
                window.dataManager.updateBrouillonStatus(brouillonId, 'error');
            }
            
            throw error;
        }
    }

    // === MISE À JOUR DE L'INTERFACE ===

    updateRecordingUI(recording) {
        if (!this.recordBtn || !this.recordingStatus) return;

        if (recording) {
            this.recordBtn.textContent = '⏹️';
            this.recordBtn.classList.add('recording');
            this.recordingStatus.textContent = '🔴 Enregistrement en cours...';
            
            if (this.audioControls) {
                this.audioControls.classList.remove('show');
            }
            if (this.sendAudioBtn) {
                this.sendAudioBtn.classList.remove('show');
            }
        } else {
            this.recordBtn.textContent = '⏺️';
            this.recordBtn.classList.remove('recording');
            this.recordingStatus.textContent = '✅ Enregistrement terminé';
            
            if (this.audioControls) {
                this.audioControls.classList.add('show');
            }
            if (this.sendAudioBtn) {
                this.sendAudioBtn.classList.add('show');
            }
        }
    }

    resetRecordingUI() {
        if (this.recordBtn) {
            this.recordBtn.textContent = '⏺️';
            this.recordBtn.classList.remove('recording');
        }
    }

    updateUploadStatus(message) {
        if (this.uploadStatus) {
            this.uploadStatus.textContent = message;
        }
    }

    // === MÉTHODES PUBLIQUES ===

    hasAudioReady() {
        return !!(this.recordedBlob || this.uploadedFile);
    }

    getCurrentAudioInfo() {
        if (this.uploadedFile) {
            return {
                type: 'upload',
                name: this.uploadedFile.name,
                size: this.uploadedFile.size
            };
        } else if (this.recordedBlob) {
            return {
                type: 'recording',
                name: 'Enregistrement vocal',
                size: this.recordedBlob.size
            };
        }
        return null;
    }
}