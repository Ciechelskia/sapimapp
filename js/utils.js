// Utilitaires généraux
class Utils {
    
    // Génère un ID unique pour le téléphone
    static generateDeviceId() {
        const screen = `${window.screen.width}x${window.screen.height}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        const platform = navigator.platform;
        const userAgent = navigator.userAgent.substring(0, 50);
        
        return btoa(`${screen}-${timezone}-${language}-${platform}-${userAgent}`);
    }

    // Génère un ID unique pour les documents
    static generateId(prefix = '') {
        return prefix + Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Convertit un Blob en base64
    static blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Valide le format de fichier audio
    static isValidAudioFile(file) {
        return CONFIG.SUPPORTED_AUDIO_FORMATS.includes(file.type);
    }

    // Valide la taille du fichier
    static isValidFileSize(file) {
        return file.size <= CONFIG.MAX_FILE_SIZE;
    }

    // Formate la taille du fichier
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Formate une date
    static formatDate(date) {
        return new Date(date).toLocaleString();
    }

    // Crée une modal
    static createModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.setAttribute('data-modal', 'true');
        
        const buttonsHtml = buttons.map(btn => 
            `<button class="${btn.class || 'btn-secondary'}" onclick="${btn.onclick || ''}">${btn.text}</button>`
        ).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('[data-modal]').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${buttonsHtml}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }

    // Génère du PDF à partir de texte
    static async generatePDF(title, content) {
        // Utilisation de jsPDF (sera chargé dynamiquement)
        if (typeof window.jsPDF === 'undefined') {
            await Utils.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuration
        doc.setFont("helvetica");
        doc.setFontSize(16);
        doc.text(title, 20, 30);
        
        doc.setFontSize(10);
        doc.text(`Généré le ${new Date().toLocaleDateString()}`, 20, 40);
        
        // Contenu (avec gestion des sauts de ligne)
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(content, 170);
        doc.text(lines, 20, 60);
        
        return doc;
    }

    // Charge un script externe dynamiquement
    static loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Télécharge un fichier
    static downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Copie du texte dans le presse-papier
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
            return false;
        }
    }

    // Partage natif (si disponible)
    static async shareContent(title, text) {
        if (navigator.share) {
            try {
                await navigator.share({ title, text });
                return true;
            } catch (err) {
                console.error('Erreur lors du partage:', err);
                return false;
            }
        }
        return false;
    }

    // Affiche une notification toast
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Débounce une fonction
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Valide une adresse email
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Échappe les caractères HTML
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Tronque un texte
    static truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}