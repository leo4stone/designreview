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
        
        // 生成CSV内容（复用于导出和分享）
        generateCSVContent(result) {
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
            
            return rows.join('\n');
        },
        
        // 导出结果
        exportResult(resultId) {
            const result = this.results.find(r => r.id === resultId);
            if (!result) {
                this.showToast('未找到该结果', 'error');
                return;
            }
            
            const csvContent = this.generateCSVContent(result);
            
            // 下载文件
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const filename = result.isCurrent 
                ? `功能评估-${new Date().toISOString().slice(0, 10)}.csv`
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
        
        // 分享结果（生成带有base64参数的链接）
        shareResult(resultId) {
            const result = this.results.find(r => r.id === resultId);
            if (!result) {
                this.showToast('未找到该结果', 'error');
                return;
            }
            
            try {
                // 生成CSV内容
                const csvContent = this.generateCSVContent(result);
                
                // 压缩并转换为base64
                // 1. 将字符串转为 Uint8Array
                const encoder = new TextEncoder();
                const csvBytes = encoder.encode(csvContent);
                
                // 2. 使用 pako 进行 gzip 压缩
                const compressed = pako.gzip(csvBytes);
                
                // 3. 转换为 base64
                let binaryString = '';
                compressed.forEach(byte => {
                    binaryString += String.fromCharCode(byte);
                });
                const base64 = btoa(binaryString);
                
                // 4. URL 安全编码（替换 +/= 字符）
                const urlSafeBase64 = base64
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=/g, '');
                
                // 生成分享链接
                const shareUrl = `${window.location.origin}${window.location.pathname}?share=${urlSafeBase64}`;
                
                // 复制到剪贴板
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        this.showToast('分享链接已复制到剪贴板', 'success');
                        console.log('✓ 分享链接已生成:', result.name);
                        console.log('  压缩前大小:', csvContent.length, 'bytes');
                        console.log('  压缩后大小:', compressed.length, 'bytes');
                        console.log('  压缩率:', ((1 - compressed.length / csvContent.length) * 100).toFixed(1) + '%');
                    }).catch(err => {
                        console.error('复制到剪贴板失败:', err);
                        this.showShareUrlDialog(shareUrl);
                    });
                } else {
                    // 降级方案：显示链接让用户手动复制
                    this.showShareUrlDialog(shareUrl);
                }
            } catch (error) {
                console.error('生成分享链接失败:', error);
                this.showToast('生成分享链接失败', 'error');
            }
        },
        
        // 显示分享链接对话框（降级方案）
        showShareUrlDialog(url) {
            const message = `分享链接已生成，请复制：\n\n${url}`;
            prompt('分享链接（按 Ctrl+C 或 Cmd+C 复制）:', url);
            this.showToast('请手动复制分享链接', 'info');
        },
        
        // 从URL参数解析并导入分享的结果
        loadSharedResult() {
            const urlParams = new URLSearchParams(window.location.search);
            const shareParam = urlParams.get('share');
            
            if (!shareParam) {
                return; // 没有分享参数
            }
            
            try {
                // 1. URL 安全解码（恢复 +/= 字符）
                const base64 = shareParam
                    .replace(/-/g, '+')
                    .replace(/_/g, '/');
                
                // 补充 padding
                const padding = '='.repeat((4 - base64.length % 4) % 4);
                const base64WithPadding = base64 + padding;
                
                // 2. 解码 base64 为二进制字符串
                const binaryString = atob(base64WithPadding);
                
                // 3. 转换为 Uint8Array
                const compressedBytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    compressedBytes[i] = binaryString.charCodeAt(i);
                }
                
                // 4. 使用 pako 解压缩
                const decompressed = pako.ungzip(compressedBytes);
                
                // 5. 转换为字符串
                const decoder = new TextDecoder();
                const csvContent = decoder.decode(decompressed);
                
                console.log('✓ 分享链接解析成功');
                console.log('  压缩后大小:', compressedBytes.length, 'bytes');
                console.log('  解压后大小:', csvContent.length, 'bytes');
                
                // 使用PapaParse解析CSV
                Papa.parse(csvContent, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        if (results.errors.length > 0) {
                            console.error('CSV解析错误:', results.errors);
                            this.showToast('分享链接解析失败', 'error');
                            return;
                        }
                        
                        this.parseSharedCSVData(results.data);
                    },
                    error: (error) => {
                        console.error('CSV解析失败:', error);
                        this.showToast('分享链接解析失败', 'error');
                    }
                });
            } catch (error) {
                console.error('解析分享链接失败:', error);
                this.showToast('分享链接无效或已损坏', 'error');
            }
        },
        
        // 解析分享的CSV数据
        parseSharedCSVData(data) {
            try {
                const dimensions = {};
                const comments = {};
                let averageScore = 0;
                
                // 获取所有维度映射
                const allDimensions = [
                    ...DimensionsData.coreDimensions,
                    ...DimensionsData.optionalDimensions
                ];
                const dimensionMap = {};
                allDimensions.forEach(dim => {
                    dimensionMap[dim.name] = dim.id;
                });
                
                // 解析每一行
                data.forEach(row => {
                    const dimensionName = row['维度'];
                    const score = row['分数'];
                    const comment = row['说明'] || '';
                    
                    if (dimensionName === '平均分') {
                        averageScore = parseFloat(score) || 0;
                    } else if (dimensionMap[dimensionName]) {
                        const dimId = dimensionMap[dimensionName];
                        dimensions[dimId] = parseInt(score) || 0;
                        if (comment) {
                            comments[dimId] = comment;
                        }
                    }
                });
                
                // 如果没有平均分，计算一个
                if (averageScore === 0) {
                    const scores = Object.values(dimensions).filter(s => s > 0);
                    if (scores.length > 0) {
                        averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
                    }
                }
                
                // 创建结果对象
                const result = {
                    name: `分享结果-${new Date().toLocaleString('zh-CN', { 
                        month: '2-digit', 
                        day: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}`,
                    dimensions,
                    comments,
                    averageScore: parseFloat(averageScore),
                    visible: true,
                    isCurrent: false,
                    isShared: true
                };
                
                // 添加到结果列表
                this.addResult(result);
                
                console.log('✓ 已导入分享的结果:', result.name);
                this.showToast('已成功导入分享的评分结果', 'success', 4000);
                
                // 清除URL参数（保持URL干净）
                const url = new URL(window.location);
                url.searchParams.delete('share');
                window.history.replaceState({}, document.title, url.toString());
                
            } catch (error) {
                console.error('解析分享数据失败:', error);
                this.showToast('导入分享结果失败', 'error');
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
        console.log('🎯 功能评估评分工具 (Vue.js版)');
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
        
        // 检查并加载分享的结果
        this.loadSharedResult();
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
