// Vue 应用入口文件
// 注意：FormSubmitComponent, FileImportComponent, ResultDisplayComponent 
// 已在各自的文件中定义为全局变量

const { createApp } = Vue;

const app = createApp({
    components: {
        'form-submit': FormSubmitComponent,
        'file-import': FileImportComponent,
        'result-display': ResultDisplayComponent
    },
    
    data() {
        return {
            // 全局结果列表
            results: [],
            // 结果ID计数器
            nextResultId: 1,
            // 模态框状态
            showScoreModal: false,
            showImportModal: false
        };
    },
    
    provide() {
        return {
            // 提供给子组件的方法
            addResult: this.addResult,
            removeResult: this.removeResult,
            toggleResultVisibility: this.toggleResultVisibility,
            // 提供结果数据（使用getter保持响应式）
            getResults: () => this.results,
            // 提供模态框控制方法
            closeScoreModal: this.closeScoreModal,
            closeImportModal: this.closeImportModal,
            getScoreModalState: () => this.showScoreModal,
            getImportModalState: () => this.showImportModal
        };
    },
    
    methods: {
        // 添加结果
        addResult(result) {
            // 如果是当前评分，先移除旧的当前评分
            if (result.isCurrent) {
                const oldCurrentIndex = this.results.findIndex(r => r.isCurrent);
                if (oldCurrentIndex !== -1) {
                    this.results.splice(oldCurrentIndex, 1);
                    console.log('✓ 已移除旧的当前评分');
                }
            }
            
            // 添加ID
            result.id = this.nextResultId++;
            
            // 添加到结果列表
            this.results.push(result);
            
            console.log('✓ 已添加结果:', result.name, '总分:', result.totalScore);
            console.log('  当前结果数量:', this.results.length);
        },
        
        // 删除结果
        removeResult(resultId) {
            const result = this.results.find(r => r.id === resultId);
            if (!result) {
                return;
            }
            
            const confirmMessage = result.isCurrent 
                ? '确定要清除当前评分结果吗？' 
                : `确定要删除 "${result.name}" 吗？`;
            
            if (confirm(confirmMessage)) {
                const index = this.results.findIndex(r => r.id === resultId);
                if (index !== -1) {
                    this.results.splice(index, 1);
                    console.log('✓ 已删除结果:', result.name);
                    console.log('  剩余结果数量:', this.results.length);
                }
            }
        },
        
        // 切换结果可见性
        toggleResultVisibility(resultId) {
            const result = this.results.find(r => r.id === resultId);
            if (result) {
                result.visible = !result.visible;
                console.log('✓ 切换结果可见性:', result.name, '可见:', result.visible);
            }
        },
        
        // 清空所有结果
        clearAllResults() {
            if (this.results.length === 0) {
                return;
            }
            
            if (confirm('确定要清除所有结果吗？此操作不可撤销。')) {
                this.results = [];
                this.nextResultId = 1;
                console.log('✓ 已清除所有结果');
            }
        },
        
        // 打开评分模态框
        openScoreModal() {
            this.showScoreModal = true;
            document.body.classList.add('modal-open');
            // 修改URL hash
            window.history.pushState({ modal: 'score' }, '', '#score');
            console.log('✓ 打开评分模态框');
        },
        
        // 关闭评分模态框
        closeScoreModal() {
            this.showScoreModal = false;
            document.body.classList.remove('modal-open');
            // 如果当前URL是#score，返回主页
            if (window.location.hash === '#score') {
                window.history.back();
            }
            console.log('✓ 关闭评分模态框');
        },
        
        // 打开导入模态框
        openImportModal() {
            this.showImportModal = true;
            document.body.classList.add('modal-open');
            // 修改URL hash
            window.history.pushState({ modal: 'import' }, '', '#import');
            console.log('✓ 打开导入模态框');
        },
        
        // 关闭导入模态框
        closeImportModal() {
            this.showImportModal = false;
            document.body.classList.remove('modal-open');
            // 如果当前URL是#import，返回主页
            if (window.location.hash === '#import') {
                window.history.back();
            }
            console.log('✓ 关闭导入模态框');
        },
        
        // 处理URL hash变化（支持浏览器返回按钮）
        handleHashChange() {
            const hash = window.location.hash;
            
            if (hash === '#score') {
                // 如果hash是#score但模态框未打开，打开它（不修改URL）
                if (!this.showScoreModal) {
                    this.showScoreModal = true;
                    document.body.classList.add('modal-open');
                }
            } else if (hash === '#import') {
                // 如果hash是#import但模态框未打开，打开它（不修改URL）
                if (!this.showImportModal) {
                    this.showImportModal = true;
                    document.body.classList.add('modal-open');
                }
            } else {
                // hash为空或其他值，关闭所有模态框
                if (this.showScoreModal) {
                    this.showScoreModal = false;
                    document.body.classList.remove('modal-open');
                }
                if (this.showImportModal) {
                    this.showImportModal = false;
                    document.body.classList.remove('modal-open');
                }
            }
            
            console.log('✓ URL hash变化:', hash);
        }
    },
    
    mounted() {
        console.log('========================================');
        console.log('🎯 设计评估评分工具 (Vue.js版)');
        console.log('========================================');
        console.log('✓ Vue应用已挂载');
        console.log('✓ 维度数据已加载');
        console.log('  - 核心维度:', DimensionsData.coreDimensions.length);
        console.log('  - 扩展维度:', DimensionsData.optionalDimensions.length);
        console.log('========================================');
        
        // 监听URL hash变化（支持浏览器返回按钮）
        window.addEventListener('hashchange', this.handleHashChange);
        window.addEventListener('popstate', this.handleHashChange);
        
        // 初始化时检查URL hash
        this.handleHashChange();
    },
    
    beforeUnmount() {
        // 清理事件监听器
        window.removeEventListener('hashchange', this.handleHashChange);
        window.removeEventListener('popstate', this.handleHashChange);
        
        // 确保移除body的modal-open类
        document.body.classList.remove('modal-open');
    }
});

// 挂载应用
app.mount('#app');
