// 文件导入组件 - 负责CSV文件的导入功能

window.FileImportComponent = {
    name: 'FileImportComponent',
    
    template: `
        <div v-if="isVisible" class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header-bar">
                    <h2>📂 导入评分结果</h2>
                    <button type="button" class="modal-close-btn" @click="closeModal">&times;</button>
                </div>
                
                <div class="modal-body-scroll">
                    <div class="import-info">
                        <p>支持导入多个CSV格式的评分结果文件，用于对比分析</p>
                    </div>
            
            <div class="import-area">
                <input 
                    type="file" 
                    ref="fileInput" 
                    @change="handleFileChange" 
                    accept=".csv"
                    multiple
                    style="display: none;">
                
                <button @click="triggerImport" class="btn btn-primary btn-import">
                    <span>📁 选择CSV文件</span>
                </button>
                
                <div v-if="selectedFiles.length > 0" class="selected-files">
                    <p><strong>已选择 {{ selectedFiles.length }} 个文件：</strong></p>
                    <ul>
                        <li v-for="(file, index) in selectedFiles" :key="index">
                            {{ file.name }} ({{ formatFileSize(file.size) }})
                        </li>
                    </ul>
                    <div class="file-actions">
                        <button @click="confirmImport" class="btn btn-primary">
                            ✓ 确认导入
                        </button>
                        <button @click="cancelImport" class="btn btn-secondary">
                            ✗ 取消
                        </button>
                    </div>
                </div>
            </div>
            
                <!-- 导入进度提示 -->
                <div v-if="importing" class="import-progress">
                    <div class="progress-spinner"></div>
                    <p>正在导入文件...</p>
                </div>
            </div>
        </div>
        </div>
    `,
    
    inject: ['addResult', 'closeImportModal', 'getImportModalState'],
    
    data() {
        return {
            selectedFiles: [],
            importing: false
        };
    },
    
    computed: {
        isVisible() {
            return this.getImportModalState();
        }
    },
    
    methods: {
        // 关闭模态框
        closeModal() {
            this.closeImportModal();
        },
        // 触发文件选择
        triggerImport() {
            this.$refs.fileInput.click();
        },
        
        // 处理文件选择
        handleFileChange(event) {
            const files = Array.from(event.target.files);
            if (files.length > 0) {
                this.selectedFiles = files;
                console.log('✓ 已选择文件:', files.map(f => f.name));
            }
        },
        
        // 确认导入
        async confirmImport() {
            if (this.selectedFiles.length === 0) {
                return;
            }
            
            this.importing = true;
            
            try {
                for (const file of this.selectedFiles) {
                    await this.parseCSVFile(file);
                }
                
                alert(`成功导入 ${this.selectedFiles.length} 个文件！`);
                this.cancelImport();
                
                // 关闭模态框
                this.closeModal();
                
                // 滚动到结果区域
                this.$nextTick(() => {
                    const resultsSection = document.querySelector('.result-display-section');
                    if (resultsSection) {
                        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
                
            } catch (error) {
                alert('导入失败：' + error.message);
                console.error('导入错误:', error);
            } finally {
                this.importing = false;
            }
        },
        
        // 取消导入
        cancelImport() {
            this.selectedFiles = [];
            this.$refs.fileInput.value = '';
        },
        
        // 解析CSV文件 - 使用 PapaParse
        async parseCSVFile(file) {
            return new Promise((resolve, reject) => {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    encoding: 'UTF-8',
                    complete: (results) => {
                        try {
                            console.log('📊 PapaParse 解析结果:', results);
                            const result = this.parseCSVData(results.data, file.name);
                            
                            if (result) {
                                this.addResult(result);
                                console.log('✓ 文件解析成功:', file.name, result);
                                resolve(result);
                            } else {
                                reject(new Error(`文件 ${file.name} 格式不正确`));
                            }
                        } catch (error) {
                            reject(new Error(`解析 ${file.name} 时出错: ${error.message}`));
                        }
                    },
                    error: (error) => {
                        reject(new Error(`读取文件 ${file.name} 失败: ${error.message}`));
                    }
                });
            });
        },
        
        // 解析CSV数据 - 使用 PapaParse 解析后的数据
        parseCSVData(data, filename) {
            console.log('📊 开始解析CSV数据:', filename);
            console.log('数据行数:', data.length);
            
            const dimensions = {};
            const comments = {};
            let totalScore = 0;
            let scoreLevel = '';
            
            const allDimensions = [
                ...DimensionsData.coreDimensions,
                ...DimensionsData.optionalDimensions
            ];
            
            // 遍历每一行数据
            data.forEach((row, index) => {
                console.log(`行 ${index}:`, row);
                
                const dimensionName = row['维度'] || '';
                const score = row['分数'] || '';
                const comment = row['说明'] || '';
                
                console.log(`  维度名: "${dimensionName}", 分数: "${score}", 说明: "${comment}"`);
                
                // 检查是否是总分
                if (dimensionName === '总分') {
                    totalScore = parseInt(score);
                    console.log('  ✓ 总分:', totalScore);
                    return;
                }
                
                // 检查是否是评级
                if (dimensionName === '评级') {
                    scoreLevel = score;
                    console.log('  ✓ 评级:', scoreLevel);
                    return;
                }
                
                // 匹配维度
                const dim = allDimensions.find(d => d.name === dimensionName);
                if (dim) {
                    const scoreNum = parseInt(score);
                    if (!isNaN(scoreNum) && scoreNum >= 1 && scoreNum <= 5) {
                        dimensions[dim.id] = scoreNum;
                        if (comment && comment.trim() !== '') {
                            comments[dim.id] = comment.trim();
                            console.log(`  ✓ 匹配维度 ${dim.id}: 分数=${scoreNum}, 说明="${comment}"`);
                        } else {
                            console.log(`  ✓ 匹配维度 ${dim.id}: 分数=${scoreNum}, 无说明`);
                        }
                    }
                } else {
                    console.log(`  ✗ 未匹配到维度: "${dimensionName}"`);
                }
            });
            
            console.log('✓ 解析结果 - dimensions:', dimensions);
            console.log('✓ 解析结果 - comments:', comments);
            
            // 验证是否有有效的维度数据
            if (Object.keys(dimensions).length === 0) {
                throw new Error('CSV文件中没有找到有效的维度评分数据');
            }
            
            // 如果没有总分，则计算
            if (!totalScore || isNaN(totalScore)) {
                const coreScores = DimensionsData.coreDimensions
                    .map(dim => dimensions[dim.id])
                    .filter(s => s !== undefined);
                
                if (coreScores.length > 0) {
                    const average = coreScores.reduce((a, b) => a + b, 0) / coreScores.length;
                    totalScore = Math.round(average * 20);
                } else {
                    totalScore = 0;
                }
            }
            
            const scoreLevelData = DimensionsData.getScoreLevel(totalScore);
            
            return {
                isCurrent: false,
                name: filename.replace('.csv', ''),
                filename: filename,
                dimensions: dimensions,
                comments: comments,
                totalScore: totalScore,
                scoreLevel: scoreLevel || scoreLevelData.label,
                scoreLevelData: scoreLevelData,
                visible: true,
                timestamp: new Date()
            };
        },
        
        // 格式化文件大小
        formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
    },
    
    mounted() {
        console.log('✓ FileImport组件已挂载');
    }
};
