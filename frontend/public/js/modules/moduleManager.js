/**
 * 模块管理器
 * 统一管理所有模块的加载、显示和隐藏
 */
class ModuleManager {
    static modules = new Map();
    
    /**
     * 注册模块
     */
    static registerModule(moduleClass) {
        if (moduleClass.MODULE_ID) {
            this.modules.set(moduleClass.MODULE_ID, moduleClass);
            console.log(`模块已注册: ${moduleClass.MODULE_ID}`);
        }
    }
    
    /**
     * 初始化所有模块
     */
    static initAllModules() {
        this.modules.forEach((moduleClass, moduleId) => {
            try {
                moduleClass.init();
                console.log(`模块初始化成功: ${moduleId}`);
            } catch (error) {
                console.error(`模块初始化失败: ${moduleId}`, error);
            }
        });
    }
    
    /**
     * 显示指定模块
     */
    static showModule(moduleId) {
        const moduleClass = this.modules.get(moduleId);
        if (moduleClass && typeof moduleClass.show === 'function') {
            moduleClass.show();
            return true;
        }
        return false;
    }
    
    /**
     * 隐藏指定模块
     */
    static hideModule(moduleId) {
        const moduleClass = this.modules.get(moduleId);
        if (moduleClass && typeof moduleClass.hide === 'function') {
            moduleClass.hide();
            return true;
        }
        return false;
    }
    
    /**
     * 隐藏所有模块
     */
    static hideAllModules() {
        this.modules.forEach((moduleClass, moduleId) => {
            if (typeof moduleClass.hide === 'function') {
                moduleClass.hide();
            }
        });
    }
    
    /**
     * 刷新指定模块
     */
    static refreshModule(moduleId) {
        const moduleClass = this.modules.get(moduleId);
        if (moduleClass && typeof moduleClass.refresh === 'function') {
            moduleClass.refresh();
            return true;
        }
        return false;
    }
    
    /**
     * 刷新所有模块
     */
    static refreshAllModules() {
        this.modules.forEach((moduleClass, moduleId) => {
            if (typeof moduleClass.refresh === 'function') {
                moduleClass.refresh();
            }
        });
    }
    
    /**
     * 获取模块实例
     */
    static getModule(moduleId) {
        return this.modules.get(moduleId);
    }
    
    /**
     * 获取所有已注册的模块ID
     */
    static getRegisteredModuleIds() {
        return Array.from(this.modules.keys());
    }
    
    /**
     * 检查模块是否存在
     */
    static hasModule(moduleId) {
        return this.modules.has(moduleId);
    }
    
    /**
     * 显示模块组合
     */
    static showModuleCombination(moduleIds) {
        // 先隐藏所有模块
        this.hideAllModules();
        
        // 显示指定的模块
        moduleIds.forEach(moduleId => {
            this.showModule(moduleId);
        });
    }
    
    /**
     * 显示查看模式（文件信息 + 章节列表）
     */
    static showDocumentViewMode() {
        this.showModuleCombination(['fileInfoModule', 'chaptersModule']);
    }
    
    /**
     * 显示生成模式（语音设置 + 音频生成）
     */
    static showAudioGenerationMode() {
        this.showModuleCombination(['voiceSettingsModule', 'audioGenerationModule']);
    }
    
    /**
     * 显示完整模式（所有模块）
     */
    static showFullMode() {
        this.showModuleCombination(this.getRegisteredModuleIds());
    }
    
    /**
     * 显示音频管理模式（除音频文件列表外的所有模块）
     */
    static showAudioManagementMode() {
        const allModules = this.getRegisteredModuleIds();
        const audioManagementModules = allModules.filter(id => id !== 'audioFilesModule');
        this.showModuleCombination(audioManagementModules);
    }
}

// 自动注册所有模块
document.addEventListener('DOMContentLoaded', () => {
    // 注册所有模块
    ModuleManager.registerModule(FileInfoModule);
    ModuleManager.registerModule(ChaptersModule);
    ModuleManager.registerModule(VoiceSettingsModule);
    ModuleManager.registerModule(AudioGenerationModule);
    ModuleManager.registerModule(MergedAudioModule);
    ModuleManager.registerModule(ChaptersAudioModule);
    
    // 初始化所有模块
    ModuleManager.initAllModules();
    
    console.log('所有模块已注册并初始化完成');
});
