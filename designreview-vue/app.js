// Vue 应用入口文件
// 注意：FormSubmitComponent, FileImportComponent, ResultDisplayComponent 
// 已在各自的文件中定义为全局变量

const { createApp } = Vue;

const app = createApp({
    components: {
        'form-submit': FormSubmitComponent,
        'file-import': FileImportComponent,
        'result-display': ResultDisplayComponent,
        'footer-info': FooterInfoComponent
    },
    
    data() {
        return {
            // 全局结果列表
            results: [],
            // 结果ID计数器
            nextResultId: 1,
            // 模态框状态
            showScoreModal: false,
            showImportModal: false,
            // Toast 通知
            toasts: []
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
            getImportModalState: () => this.showImportModal,
            // 提供 Toast 方法
            showToast: this.showToast
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
            
            console.log('✓ 已添加结果:', result.name, '平均分:', result.averageScore);
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
        
        // 获取结果颜色
        getResultColor(index) {
            const colors = DimensionsData.colors;
            return colors[index % colors.length].solid;
        },
        
        // 导出结果
        exportResult(resultId) {
            const result = this.results.find(r => r.id === resultId);
            if (!result) {
                this.showToast('未找到该结果', 'error');
                return;
            }
            
            // 构建CSV内容 - 纵向格式
            const rows = [];
            
            // 表头
            rows.push(['维度', '分数', '说明'].map(h => `"${h}"`).join(','));
            
            // 获取所有维度
            const allDimensions = [
                ...DimensionsData.coreDimensions,
                ...DimensionsData.optionalDimensions
            ];
            
            // 添加所有维度数据
            allDimensions.forEach(dim => {
                const score = result.dimensions[dim.id] || '';
                const comment = (result.comments && result.comments[dim.id]) ? result.comments[dim.id] : '';
                rows.push([dim.name, score, comment].map(v => `"${v}"`).join(','));
            });
            
            // 添加平均分
            rows.push(['平均分', result.averageScore, ''].map(v => `"${v}"`).join(','));
            
            const csvContent = rows.join('\n');
            
            // 下载文件
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const filename = result.isCurrent 
                ? `设计评估-${new Date().toISOString().slice(0, 10)}.csv`
                : result.filename || `${result.name}.csv`;
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('✓ 导出结果:', result.name, filename);
            this.showToast(`已导出: ${filename}`, 'success');
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
        },
        
        // 显示 Toast 通知
        showToast(message, type = 'success', duration = 3000) {
            const id = Date.now();
            const toast = {
                id,
                message,
                type, // success, error, info
                visible: true
            };
            
            this.toasts.push(toast);
            
            // 自动移除
            setTimeout(() => {
                const index = this.toasts.findIndex(t => t.id === id);
                if (index !== -1) {
                    this.toasts.splice(index, 1);
                }
            }, duration);
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
