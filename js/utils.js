// Utilitaires généraux avec améliorations UX
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
        return new Date(date).toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Crée une modal avec animations
    static createModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.setAttribute('data-modal', 'true');
        modal.style.opacity = '0';
        
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
                ${buttons.length > 0 ? `
                <div class="modal-footer">
                    ${buttonsHtml}
                </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
        });
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                Utils.closeModal(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                Utils.closeModal(modal);
            }
        });
        
        return modal;
    }

    // Ferme une modal avec animation
    static closeModal(modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        setTimeout(() => {
            if (modal && modal.parentNode) {
                modal.remove();
            }
        }, 300);
    }

    // Génère du PDF à partir de texte avec loading
    static async generatePDF(title, content) {
        const loadingToast = Utils.showToast(t('toast.report.pdf.generating'), 'info', 0);
        
        try {
            if (typeof window.jsPDF === 'undefined') {
                await Utils.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(102, 126, 234);
            doc.text(title, 20, 30);
            
            doc.setDrawColor(102, 126, 234);
            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`${t('date.generated')} ${new Date().toLocaleDateString()}`, 20, 45);
            
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            const lines = doc.splitTextToSize(content, 170);
            doc.text(lines, 20, 60);
            
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${i} / ${pageCount}`, 20, 285);
                doc.text(t('app.title') + ' - Application PWA', 105, 285, { align: 'center' });
            }
            
            if (loadingToast) loadingToast.remove();
            return doc;
            
        } catch (error) {
            if (loadingToast) loadingToast.remove();
            throw error;
        }
    }

    // Charge un script externe dynamiquement
    static loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Impossible de charger ${src}`));
            document.head.appendChild(script);
        });
    }

    // Télécharge un fichier avec feedback
    static downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        Utils.showToast(t('toast.download', { filename }), 'success');
    }

    // Copie du texte dans le presse-papier
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            Utils.showToast(t('toast.clipboard.copied'), 'success');
            return true;
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
            
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                Utils.showToast(t('toast.clipboard.copied'), 'success');
                return true;
            } catch (fallbackErr) {
                Utils.showToast(t('toast.clipboard.error'), 'error');
                return false;
            }
        }
    }

    // Partage natif
    static async shareContent(title, text) {
        if (navigator.share) {
            try {
                await navigator.share({ title, text });
                Utils.showToast(t('toast.report.shared'), 'success');
                return true;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Erreur lors du partage:', err);
                    Utils.showToast(t('toast.report.share.error'), 'error');
                }
                return false;
            }
        }
        return false;
    }

    // Affiche une notification toast
    static showToast(message, type = 'info', duration = 3000) {
        const existingToasts = document.querySelectorAll(`.toast-${type}`);
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">${Utils.getToastIcon(type)}</span>
                <span>${message}</span>
            </div>
        `;
        
        const colors = {
            error: 'linear-gradient(135deg, #f44336, #d32f2f)',
            success: 'linear-gradient(135deg, #4CAF50, #45a049)',
            info: 'linear-gradient(135deg, #2196F3, #1976D2)',
            warning: 'linear-gradient(135deg, #FF9800, #F57C00)'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${colors[type] || colors.info};
            color: white;
            border-radius: 15px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            max-width: 350px;
            word-wrap: break-word;
            transform: translateX(100%) scale(0.8);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0) scale(1)';
            toast.style.opacity = '1';
        });
        
        if (duration > 0) {
            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255,255,255,0.3);
                border-radius: 0 0 15px 15px;
                width: 100%;
                transform-origin: left;
                animation: toastProgress ${duration}ms linear;
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes toastProgress {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
            `;
            document.head.appendChild(style);
            toast.appendChild(progressBar);
        }
        
        if (duration > 0) {
            setTimeout(() => {
                toast.style.transform = 'translateX(100%) scale(0.8)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 400);
            }, duration);
        }
        
        toast.addEventListener('click', () => {
            toast.style.transform = 'translateX(100%) scale(0.8)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        });
        
        return toast;
    }

    // Icônes pour les toasts
    static getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Skeleton loading pour les listes
    static showSkeletonLoading(container, count = 3) {
        const skeletons = Array.from({ length: count }, (_, i) => `
            <div class="report-item skeleton-item" style="animation-delay: ${i * 0.1}s">
                <div class="report-header">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text" style="width: 80px;"></div>
                </div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 70%;"></div>
                <div class="report-actions" style="margin-top: 15px;">
                    <div class="skeleton skeleton-button"></div>
                    <div class="skeleton skeleton-button"></div>
                    <div class="skeleton skeleton-button"></div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = skeletons;
        
        setTimeout(() => {
            const skeletonItems = container.querySelectorAll('.skeleton-item');
            if (skeletonItems.length > 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">⚠️</div>
                        <p>${t('loading')}</p>
                        <p class="empty-subtitle">${t('toast.network.offline')}</p>
                    </div>
                `;
            }
        }, 5000);
    }

    // Débounce
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Throttle pour limiter les appels
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Détection de la connexion réseau
    static isOnline() {
        return navigator.onLine;
    }

    // Surveillance de la connexion réseau
    static onNetworkChange(callback) {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
    }

    // Animation de feedback pour les boutons
    static animateButtonClick(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    // Scroll fluide vers un élément
    static smoothScrollTo(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    // Détection du support PWA
    static isPWAInstallable() {
        return 'serviceWorker' in navigator && 'PushManager' in window;
    }

    // Prompt d'installation PWA
    static showInstallPrompt(deferredPrompt) {
        if (!deferredPrompt) return false;
        
        const modal = Utils.createModal(
            '📱 Installer l\'application',
            `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
                    <p style="margin-bottom: 20px; line-height: 1.5;">
                        Installez l'application Rapports Commerciaux sur votre appareil pour un accès rapide et une expérience optimisée.
                    </p>
                    <ul style="text-align: left; margin: 20px 0; color: #666;">
                        <li>✅ Accès hors ligne</li>
                        <li>✅ Notifications push</li>
                        <li>✅ Démarrage rapide</li>
                        <li>✅ Pas d'icône de navigateur</li>
                    </ul>
                </div>
            `,
            [
                { text: 'Plus tard', class: 'btn-secondary', onclick: 'this.closest("[data-modal]").remove()' },
                { 
                    text: '📱 Installer', 
                    class: 'btn-primary', 
                    onclick: `
                        window.deferredInstallPrompt.prompt();
                        this.closest("[data-modal]").remove();
                    `
                }
            ]
        );
        
        window.deferredInstallPrompt = deferredPrompt;
        return true;
    }

    // Valide une adresse email
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Échappe les caractères HTML
    static escapeHtml(text) {
        if (!text) return '';
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
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
    
    // Formatage intelligent du texte
    static formatText(text, options = {}) {
        if (!text) return '';
        
        const {
            maxLength = null,
            highlightTerms = [],
            preserveNewlines = false
        } = options;
        
        let formatted = text;
        
        if (preserveNewlines) {
            formatted = formatted.replace(/\n/g, '<br>');
        }
        
        highlightTerms.forEach(term => {
            if (term.length > 0) {
                const regex = new RegExp(`(${Utils.escapeRegex(term)})`, 'gi');
                formatted = formatted.replace(regex, '<mark style="background: #ffeb3b; padding: 2px 4px; border-radius: 3px;">$1</mark>');
            }
        });
        
        if (maxLength && formatted.length > maxLength) {
            formatted = Utils.truncateText(formatted, maxLength);
        }
        
        return formatted;
    }
    
    // Échapper les caractères spéciaux pour regex
    static escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Vibration tactile
    static vibrate(pattern = [100]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
    
    // Détection du type d'appareil
    static getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
            return 'mobile';
        } else if (/tablet|ipad/i.test(userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }
    
    // Mesure de performance
    static measurePerformance(name, fn) {
        return async function(...args) {
            const start = performance.now();
            const result = await fn.apply(this, args);
            const end = performance.now();
            console.log(`⏱️ ${name} took ${(end - start).toFixed(2)}ms`);
            return result;
        };
    }
    
    // Gestion des erreurs avec retry
    static async retryOperation(operation, maxRetries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                console.warn(`Tentative ${attempt} échouée:`, error);
                
                if (attempt === maxRetries) {
                    throw new Error(`Opération échouée après ${maxRetries} tentatives: ${error.message}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
            }
        }
    }
}