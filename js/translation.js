// Système de traductions multilingue
const TRANSLATIONS = {
    fr: {
        // Navigation et Header
        'app.title': 'Rapports Commerciaux',
        'nav.drafts': '📝 Brouillons',
        'nav.reports': '📊 Rapports',
        'nav.logout': '🚪 Déconnexion',
        
        // Page de connexion
        'login.title': 'Connexion',
        'login.username': '👤 Nom d\'utilisateur',
        'login.password': '🔒 Mot de passe',
        'login.button': 'Se connecter',
        'login.loading': 'Connexion en cours...',
        'login.error.empty': 'Veuillez remplir tous les champs',
        'login.error.notfound': 'Utilisateur introuvable',
        'login.error.wrongpass': 'Mot de passe incorrect',
        'login.error.inactive': 'Compte suspendu - Contactez l\'administrateur pour réactiver votre abonnement',
        'login.error.device': 'Accès refusé - Ce compte est déjà lié à un autre appareil. Contactez l\'administrateur.',
        'login.error.network': 'Erreur de connexion - Vérifiez votre connexion internet',
        'login.welcome': 'Bienvenue {name}',
        
        // Page Brouillons
        'drafts.title': '📝 Brouillons',
        'drafts.create': '🎤 Créer un nouveau rapport',
        'drafts.record': 'Enregistrer un vocal',
        'drafts.record.button': 'Appuyer pour enregistrer',
        'drafts.record.recording': '🔴 Enregistrement en cours...',
        'drafts.record.done': '✅ Enregistrement terminé',
        'drafts.record.play': '▶️ Écouter',
        'drafts.record.redo': '🔄 Refaire',
        'drafts.upload': 'Importer un fichier audio',
        'drafts.upload.button': '📁 Choisir un fichier',
        'drafts.upload.success': '✅ {filename} ({size})',
        'drafts.or': 'OU',
        'drafts.send': '📤 Envoyer pour traitement',
        'drafts.sending': '📤 Envoi en cours...',
        'drafts.list.title': '📋 Rapports en attente de validation :',
        'drafts.empty': 'Aucun brouillon pour le moment',
        'drafts.empty.subtitle': 'Enregistrez ou importez votre premier rapport vocal !',
        
        // Actions Brouillons
        'drafts.action.edit': '✏️ Éditer',
        'drafts.action.validate': '✅ Valider',
        'drafts.action.delete': '🗑️ Supprimer',
        'drafts.action.audio.unavailable': '🔄 Audio non disponible',
        'drafts.status.generating': '⏳ Génération en cours...',
        'drafts.status.error': '⚠️ Erreur lors de la génération',
        
        // Page Rapports
        'reports.title': '📊 Rapports finalisés',
        'reports.search': '🔍 Rechercher un rapport...',
        'reports.stats': '✅ Rapports validés : {count}',
        'reports.stats.pdf': '📄 PDF générés : {count}',
        'reports.empty': 'Aucun rapport finalisé',
        'reports.empty.subtitle': 'Validez vos brouillons pour les voir ici !',
        'reports.validated.on': 'Validé le',
        
        // Actions Rapports
        'reports.action.view': '👁️ Voir',
        'reports.action.pdf': '📄 PDF',
        'reports.action.share': '📤 Partager',
        'reports.action.export': '💾 Export TXT',
        
        // Modales
        'modal.edit.title': 'Éditer le rapport',
        'modal.edit.title.label': 'Titre du rapport:',
        'modal.edit.content.label': 'Contenu du rapport:',
        'modal.edit.cancel': 'Annuler',
        'modal.edit.save': '💾 Sauvegarder',
        'modal.view.modified': '⚠️ Rapport modifié après génération',
        'modal.view.pdf.available': '📄 PDF disponible',
        
        // Messages Toast
        'toast.audio.loaded': 'Fichier audio chargé avec succès',
        'toast.audio.sent': 'Audio envoyé pour traitement',
        'toast.audio.none': 'Aucun audio à envoyer',
        'toast.audio.error.format': 'Format de fichier non supporté',
        'toast.audio.error.size': 'Fichier trop volumineux (max: {size})',
        'toast.audio.error.mic': 'Erreur d\'accès au microphone',
        'toast.audio.error.mic.denied': 'Permission refusée. Autorisez l\'accès au microphone.',
        'toast.audio.error.mic.notfound': 'Aucun microphone détecté.',
        'toast.audio.error.mic.notsupported': 'Enregistrement audio non supporté par ce navigateur.',
        'toast.draft.deleted': 'Brouillon supprimé',
        'toast.draft.saved': 'Rapport modifié avec succès',
        'toast.draft.validated': 'Rapport validé et converti en PDF',
        'toast.draft.error.empty': 'Veuillez remplir le titre et le contenu',
        'toast.report.exported': 'Rapport exporté',
        'toast.report.pdf.downloaded': 'PDF téléchargé',
        'toast.report.pdf.unavailable': 'PDF non disponible',
        'toast.report.pdf.generating': 'Génération du PDF en cours...',
        'toast.report.pdf.generated': 'PDF généré avec succès',
        'toast.report.pdf.error': 'Erreur lors de la génération du PDF',
        'toast.report.shared': 'Partagé avec succès',
        'toast.report.share.email': 'Email créé avec PDF en téléchargement',
        'toast.report.share.text': 'PDF non disponible, partage du texte',
        'toast.report.share.error': 'Erreur lors du partage du PDF',
        'toast.report.share.copied': 'Rapport copié dans le presse-papier',
        'toast.users.updated': 'Liste des utilisateurs mise à jour',
        'toast.users.error': 'Erreur lors de la mise à jour',
        'toast.clipboard.copied': 'Copié dans le presse-papier',
        'toast.clipboard.error': 'Impossible de copier',
        'toast.download': 'Téléchargement de {filename}',
        'toast.error.unexpected': 'Une erreur inattendue s\'est produite',
        'toast.network.offline': 'Mode hors-ligne - Données peut-être anciennes',
        
        // Validation
        'validate.confirm': 'Valider ce rapport ? Il sera déplacé dans les rapports finalisés et converti en PDF.',
        
        // Dates et formats
        'date.created': 'Créé le',
        'date.validated': 'Validé le',
        'date.generated': 'Généré le',
        
        // Statuts
        'status.pending': 'En attente',
        'status.generating': 'Génération en cours...',
        'status.ready': 'Prêt',
        'status.error': 'Erreur',
        'status.validated': 'Validé',
        
        // Indicateurs
        'indicator.recording': '🎤 Enregistrement',
        'indicator.upload': '📁 Fichier importé',
        'indicator.pdf': '📄 PDF',
        
        // Rôles
        'role.commercial': 'Commercial',
        'role.manager': 'Manager',
        'role.admin': 'Administrateur',
        
        // Divers
        'new.report': 'Nouveau rapport',
        'report.title.default': 'Rapport généré - En attente de validation',
        'loading': 'Chargement...',
        'cache.info': 'Informations de cache affichées dans la console'
    },
    
    en: {
        // Navigation and Header
        'app.title': 'Commercial Reports',
        'nav.drafts': '📝 Drafts',
        'nav.reports': '📊 Reports',
        'nav.logout': '🚪 Logout',
        
        // Login Page
        'login.title': 'Login',
        'login.username': '👤 Username',
        'login.password': '🔒 Password',
        'login.button': 'Login',
        'login.loading': 'Logging in...',
        'login.error.empty': 'Please fill in all fields',
        'login.error.notfound': 'User not found',
        'login.error.wrongpass': 'Incorrect password',
        'login.error.inactive': 'Account suspended - Contact administrator to reactivate your subscription',
        'login.error.device': 'Access denied - This account is already linked to another device. Contact administrator.',
        'login.error.network': 'Connection error - Check your internet connection',
        'login.welcome': 'Welcome {name}',
        
        // Drafts Page
        'drafts.title': '📝 Drafts',
        'drafts.create': '🎤 Create a new report',
        'drafts.record': 'Record audio',
        'drafts.record.button': 'Press to record',
        'drafts.record.recording': '🔴 Recording in progress...',
        'drafts.record.done': '✅ Recording completed',
        'drafts.record.play': '▶️ Play',
        'drafts.record.redo': '🔄 Redo',
        'drafts.upload': 'Import audio file',
        'drafts.upload.button': '📁 Choose file',
        'drafts.upload.success': '✅ {filename} ({size})',
        'drafts.or': 'OR',
        'drafts.send': '📤 Send for processing',
        'drafts.sending': '📤 Sending...',
        'drafts.list.title': '📋 Reports pending validation:',
        'drafts.empty': 'No drafts yet',
        'drafts.empty.subtitle': 'Record or import your first voice report!',
        
        // Draft Actions
        'drafts.action.edit': '✏️ Edit',
        'drafts.action.validate': '✅ Validate',
        'drafts.action.delete': '🗑️ Delete',
        'drafts.action.audio.unavailable': '🔄 Audio unavailable',
        'drafts.status.generating': '⏳ Generating...',
        'drafts.status.error': '⚠️ Generation error',
        
        // Reports Page
        'reports.title': '📊 Finalized Reports',
        'reports.search': '🔍 Search reports...',
        'reports.stats': '✅ Validated reports: {count}',
        'reports.stats.pdf': '📄 PDFs generated: {count}',
        'reports.empty': 'No finalized reports',
        'reports.empty.subtitle': 'Validate your drafts to see them here!',
        'reports.validated.on': 'Validated on',
        
        // Report Actions
        'reports.action.view': '👁️ View',
        'reports.action.pdf': '📄 PDF',
        'reports.action.share': '📤 Share',
        'reports.action.export': '💾 Export TXT',
        
        // Modals
        'modal.edit.title': 'Edit Report',
        'modal.edit.title.label': 'Report title:',
        'modal.edit.content.label': 'Report content:',
        'modal.edit.cancel': 'Cancel',
        'modal.edit.save': '💾 Save',
        'modal.view.modified': '⚠️ Report modified after generation',
        'modal.view.pdf.available': '📄 PDF available',
        
        // Toast Messages
        'toast.audio.loaded': 'Audio file loaded successfully',
        'toast.audio.sent': 'Audio sent for processing',
        'toast.audio.none': 'No audio to send',
        'toast.audio.error.format': 'Unsupported file format',
        'toast.audio.error.size': 'File too large (max: {size})',
        'toast.audio.error.mic': 'Microphone access error',
        'toast.audio.error.mic.denied': 'Permission denied. Allow microphone access.',
        'toast.audio.error.mic.notfound': 'No microphone detected.',
        'toast.audio.error.mic.notsupported': 'Audio recording not supported by this browser.',
        'toast.draft.deleted': 'Draft deleted',
        'toast.draft.saved': 'Report modified successfully',
        'toast.draft.validated': 'Report validated and converted to PDF',
        'toast.draft.error.empty': 'Please fill in title and content',
        'toast.report.exported': 'Report exported',
        'toast.report.pdf.downloaded': 'PDF downloaded',
        'toast.report.pdf.unavailable': 'PDF unavailable',
        'toast.report.pdf.generating': 'Generating PDF...',
        'toast.report.pdf.generated': 'PDF generated successfully',
        'toast.report.pdf.error': 'Error generating PDF',
        'toast.report.shared': 'Shared successfully',
        'toast.report.share.email': 'Email created with PDF download',
        'toast.report.share.text': 'PDF unavailable, sharing text',
        'toast.report.share.error': 'Error sharing PDF',
        'toast.report.share.copied': 'Report copied to clipboard',
        'toast.users.updated': 'User list updated',
        'toast.users.error': 'Update error',
        'toast.clipboard.copied': 'Copied to clipboard',
        'toast.clipboard.error': 'Unable to copy',
        'toast.download': 'Downloading {filename}',
        'toast.error.unexpected': 'An unexpected error occurred',
        'toast.network.offline': 'Offline mode - Data may be outdated',
        
        // Validation
        'validate.confirm': 'Validate this report? It will be moved to finalized reports and converted to PDF.',
        
        // Dates and formats
        'date.created': 'Created on',
        'date.validated': 'Validated on',
        'date.generated': 'Generated on',
        
        // Status
        'status.pending': 'Pending',
        'status.generating': 'Generating...',
        'status.ready': 'Ready',
        'status.error': 'Error',
        'status.validated': 'Validated',
        
        // Indicators
        'indicator.recording': '🎤 Recording',
        'indicator.upload': '📁 Imported file',
        'indicator.pdf': '📄 PDF',
        
        // Roles
        'role.commercial': 'Sales Rep',
        'role.manager': 'Manager',
        'role.admin': 'Administrator',
        
        // Misc
        'new.report': 'New report',
        'report.title.default': 'Generated report - Pending validation',
        'loading': 'Loading...',
        'cache.info': 'Cache information displayed in console'
    },
    
    zh: {
        // 导航和头部
        'app.title': '商业报告',
        'nav.drafts': '📝 草稿',
        'nav.reports': '📊 报告',
        'nav.logout': '🚪 登出',
        
        // 登录页面
        'login.title': '登录',
        'login.username': '👤 用户名',
        'login.password': '🔒 密码',
        'login.button': '登录',
        'login.loading': '登录中...',
        'login.error.empty': '请填写所有字段',
        'login.error.notfound': '用户未找到',
        'login.error.wrongpass': '密码错误',
        'login.error.inactive': '账户已暂停 - 请联系管理员重新激活您的订阅',
        'login.error.device': '访问被拒绝 - 此账户已关联到另一设备。请联系管理员。',
        'login.error.network': '连接错误 - 请检查您的网络连接',
        'login.welcome': '欢迎 {name}',
        
        // 草稿页面
        'drafts.title': '📝 草稿',
        'drafts.create': '🎤 创建新报告',
        'drafts.record': '录音',
        'drafts.record.button': '按下录音',
        'drafts.record.recording': '🔴 录音中...',
        'drafts.record.done': '✅ 录音完成',
        'drafts.record.play': '▶️ 播放',
        'drafts.record.redo': '🔄 重新录制',
        'drafts.upload': '导入音频文件',
        'drafts.upload.button': '📁 选择文件',
        'drafts.upload.success': '✅ {filename} ({size})',
        'drafts.or': '或',
        'drafts.send': '📤 发送处理',
        'drafts.sending': '📤 发送中...',
        'drafts.list.title': '📋 待验证报告：',
        'drafts.empty': '暂无草稿',
        'drafts.empty.subtitle': '录制或导入您的第一份语音报告！',
        
        // 草稿操作
        'drafts.action.edit': '✏️ 编辑',
        'drafts.action.validate': '✅ 验证',
        'drafts.action.delete': '🗑️ 删除',
        'drafts.action.audio.unavailable': '🔄 音频不可用',
        'drafts.status.generating': '⏳ 生成中...',
        'drafts.status.error': '⚠️ 生成错误',
        
        // 报告页面
        'reports.title': '📊 最终报告',
        'reports.search': '🔍 搜索报告...',
        'reports.stats': '✅ 已验证报告：{count}',
        'reports.stats.pdf': '📄 已生成PDF：{count}',
        'reports.empty': '无最终报告',
        'reports.empty.subtitle': '验证您的草稿以在此处查看！',
        'reports.validated.on': '验证于',
        
        // 报告操作
        'reports.action.view': '👁️ 查看',
        'reports.action.pdf': '📄 PDF',
        'reports.action.share': '📤 分享',
        'reports.action.export': '💾 导出TXT',
        
        // 模态框
        'modal.edit.title': '编辑报告',
        'modal.edit.title.label': '报告标题：',
        'modal.edit.content.label': '报告内容：',
        'modal.edit.cancel': '取消',
        'modal.edit.save': '💾 保存',
        'modal.view.modified': '⚠️ 报告在生成后已修改',
        'modal.view.pdf.available': '📄 PDF可用',
        
        // 提示消息
        'toast.audio.loaded': '音频文件加载成功',
        'toast.audio.sent': '音频已发送处理',
        'toast.audio.none': '无音频可发送',
        'toast.audio.error.format': '不支持的文件格式',
        'toast.audio.error.size': '文件过大（最大：{size}）',
        'toast.audio.error.mic': '麦克风访问错误',
        'toast.audio.error.mic.denied': '权限被拒绝。请允许麦克风访问。',
        'toast.audio.error.mic.notfound': '未检测到麦克风。',
        'toast.audio.error.mic.notsupported': '此浏览器不支持音频录制。',
        'toast.draft.deleted': '草稿已删除',
        'toast.draft.saved': '报告修改成功',
        'toast.draft.validated': '报告已验证并转换为PDF',
        'toast.draft.error.empty': '请填写标题和内容',
        'toast.report.exported': '报告已导出',
        'toast.report.pdf.downloaded': 'PDF已下载',
        'toast.report.pdf.unavailable': 'PDF不可用',
        'toast.report.pdf.generating': '生成PDF中...',
        'toast.report.pdf.generated': 'PDF生成成功',
        'toast.report.pdf.error': 'PDF生成错误',
        'toast.report.shared': '分享成功',
        'toast.report.share.email': '已创建邮件并下载PDF',
        'toast.report.share.text': 'PDF不可用，分享文本',
        'toast.report.share.error': '分享PDF错误',
        'toast.report.share.copied': '报告已复制到剪贴板',
        'toast.users.updated': '用户列表已更新',
        'toast.users.error': '更新错误',
        'toast.clipboard.copied': '已复制到剪贴板',
        'toast.clipboard.error': '无法复制',
        'toast.download': '下载 {filename}',
        'toast.error.unexpected': '发生意外错误',
        'toast.network.offline': '离线模式 - 数据可能过时',
        
        // 验证
        'validate.confirm': '验证此报告？它将移至最终报告并转换为PDF。',
        
        // 日期和格式
        'date.created': '创建于',
        'date.validated': '验证于',
        'date.generated': '生成于',
        
        // 状态
        'status.pending': '待处理',
        'status.generating': '生成中...',
        'status.ready': '就绪',
        'status.error': '错误',
        'status.validated': '已验证',
        
        // 指示器
        'indicator.recording': '🎤 录音',
        'indicator.upload': '📁 已导入文件',
        'indicator.pdf': '📄 PDF',
        
        // 角色
        'role.commercial': '销售代表',
        'role.manager': '经理',
        'role.admin': '管理员',
        
        // 其他
        'new.report': '新报告',
        'report.title.default': '已生成报告 - 待验证',
        'loading': '加载中...',
        'cache.info': '缓存信息显示在控制台中'
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TRANSLATIONS;
}