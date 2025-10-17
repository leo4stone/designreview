// 表单提交组件 - 负责评分表单的展示和提交

window.FormSubmitComponent = {
    name: 'FormSubmitComponent',
    
    template: `
        <div v-if="isVisible" class="modal-overlay">
            <div class="modal-container modal-large">
                <div class="modal-header-bar">
                    <h2>📊 评分表单</h2>
                    <button type="button" class="modal-close-btn" @click="closeModal">&times;</button>
                </div>
                
                <div class="modal-body-scroll">
                    <div class="form-info">
                        <p>请对每个维度进行评分（1=极差，5=优秀），点击 <span style="color: #6366f1; font-weight: 600;">?</span> 查看详细说明</p>
                    </div>
            
            <form @submit.prevent="handleSubmit">
                <!-- 核心维度表单 -->
                <div class="dimensions-group">
                    <h3>核心维度（必填）</h3>
                    <div class="dimensions-container">
                        <div v-for="dim in coreDimensions" :key="dim.id" class="dimension-item">
                            <div class="dimension-header">
                                <div class="dimension-info">
                                    <h4>{{ dim.name }}（{{ dim.nameEn }}）</h4>
                                    <p>{{ dim.description }}</p>
                                </div>
                                <button type="button" class="help-icon" @click="showHelp(dim)">?</button>
                            </div>
                            
                            <div class="dimension-scoring">
                                <div class="score-buttons-wrapper">
                                    <div v-for="score in 5" :key="score" class="score-btn-wrapper">
                                        <button 
                                            type="button"
                                            class="score-btn"
                                            :class="{ active: formData.core[dim.id] === score }"
                                            @click="setScore('core', dim.id, score)"
                                            @mouseenter="showTooltip(dim, score)"
                                            @mouseleave="hideTooltip()">
                                            {{ score }}
                                        </button>
                                        <div v-if="activeTooltip.dimId === dim.id && activeTooltip.score === score" 
                                             class="score-tooltip">
                                            {{ dim.levels[score] }}
                                        </div>
                                    </div>
                                </div>
                                <div class="score-display">
                                    {{ formData.core[dim.id] || '—' }}
                                </div>
                            </div>
                            
                            <div class="dimension-comment">
                                <label>观察说明（可选）</label>
                                <textarea 
                                    v-model="formData.comments[dim.id]"
                                    :placeholder="'请输入对' + dim.name + '的观察说明...'"
                                    rows="2"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 扩展维度表单 -->
                <div class="dimensions-group optional-group">
                    <h3>扩展维度（可选）</h3>
                    <div class="dimensions-container">
                        <div v-for="dim in optionalDimensions" :key="dim.id" class="dimension-item">
                            <div class="dimension-header">
                                <div class="dimension-info">
                                    <h4>{{ dim.name }}（{{ dim.nameEn }}）</h4>
                                    <p>{{ dim.description }}</p>
                                </div>
                                <button type="button" class="help-icon" @click="showHelp(dim)">?</button>
                            </div>
                            
                            <div class="dimension-scoring">
                                <div class="score-buttons-wrapper">
                                    <div v-for="score in 5" :key="score" class="score-btn-wrapper">
                                        <button 
                                            type="button"
                                            class="score-btn"
                                            :class="{ active: formData.optional[dim.id] === score }"
                                            @click="setScore('optional', dim.id, score)"
                                            @mouseenter="showTooltip(dim, score)"
                                            @mouseleave="hideTooltip()">
                                            {{ score }}
                                        </button>
                                        <div v-if="activeTooltip.dimId === dim.id && activeTooltip.score === score" 
                                             class="score-tooltip">
                                            {{ dim.levels[score] }}
                                        </div>
                                    </div>
                                </div>
                                <div class="score-display">
                                    {{ formData.optional[dim.id] || '—' }}
                                </div>
                            </div>
                            
                            <div class="dimension-comment">
                                <label>观察说明（可选）</label>
                                <textarea 
                                    v-model="formData.comments[dim.id]"
                                    :placeholder="'请输入对' + dim.name + '的观察说明...'"
                                    rows="2"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                
                    <!-- 操作按钮 -->
                    <div class="form-actions">
                        <button type="button" @click="handleReset" class="btn btn-secondary">
                            重置
                        </button>
                        <button type="submit" class="btn btn-primary">
                            计算总分
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </div>
            
        <!-- 帮助模态框 -->
            <div v-if="helpModal.show" class="modal" @click.self="closeHelp">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>{{ helpModal.dimension.name }}（{{ helpModal.dimension.nameEn }}）</h3>
                        <button type="button" class="modal-close" @click="closeHelp">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="modal-section">
                            <h4>📋 定义</h4>
                            <p>{{ helpModal.dimension.definition }}</p>
                        </div>
                        <div class="modal-section">
                            <h4>✓ 评估关注点</h4>
                            <ul>
                                <li v-for="(point, index) in helpModal.dimension.points" :key="index">
                                    {{ point }}
                                </li>
                            </ul>
                        </div>
                        <div class="modal-section">
                            <h4>💡 参考示例</h4>
                            <p class="example-text">{{ helpModal.dimension.example }}</p>
                        </div>
                    </div>
                </div>
            </div>
    `,
    
    inject: ['addResult', 'closeScoreModal', 'getScoreModalState'],
    
    data() {
        return {
            // 维度数据
            coreDimensions: DimensionsData.coreDimensions,
            optionalDimensions: DimensionsData.optionalDimensions,
            
            // 表单数据
            formData: {
                core: {},
                optional: {},
                comments: {}
            },
            
            // tooltip状态
            activeTooltip: {
                dimId: null,
                score: null
            },
            
            // 帮助模态框
            helpModal: {
                show: false,
                dimension: null
            }
        };
    },
    
    computed: {
        isVisible() {
            return this.getScoreModalState();
        }
    },
    
    methods: {
        // 关闭模态框
        closeModal() {
            this.closeScoreModal();
        },
        // 设置分数
        setScore(type, dimId, score) {
            this.formData[type][dimId] = score;
        },
        
        // 显示tooltip
        showTooltip(dim, score) {
            this.activeTooltip = {
                dimId: dim.id,
                score: score
            };
        },
        
        // 隐藏tooltip
        hideTooltip() {
            this.activeTooltip = {
                dimId: null,
                score: null
            };
        },
        
        // 显示帮助
        showHelp(dimension) {
            this.helpModal = {
                show: true,
                dimension: dimension
            };
        },
        
        // 关闭帮助
        closeHelp() {
            this.helpModal = {
                show: false,
                dimension: null
            };
        },
        
        // 提交表单
        handleSubmit() {
            // 验证核心维度是否全部填写
            const coreScores = this.coreDimensions.map(dim => this.formData.core[dim.id]);
            if (coreScores.some(score => !score)) {
                alert('请为所有核心维度打分');
                return;
            }
            
            // 计算平均分
            const coreAverage = coreScores.reduce((a, b) => a + b, 0) / coreScores.length;
            const totalScore = Math.round(coreAverage * 20);
            
            // 获取评分等级
            const scoreLevel = DimensionsData.getScoreLevel(totalScore);
            
            // 创建维度得分对象
            const dimensions = {};
            this.coreDimensions.forEach(dim => {
                dimensions[dim.id] = this.formData.core[dim.id];
            });
            this.optionalDimensions.forEach(dim => {
                if (this.formData.optional[dim.id]) {
                    dimensions[dim.id] = this.formData.optional[dim.id];
                }
            });
            
            // 创建结果对象
            const result = {
                isCurrent: true,
                name: '当前评分',
                filename: null,
                dimensions: dimensions,
                comments: { ...this.formData.comments },
                totalScore: totalScore,
                scoreLevel: scoreLevel.label,
                scoreLevelData: scoreLevel,
                visible: true,
                timestamp: new Date()
            };
            
            // 添加到全局结果
            this.addResult(result);
            
            // 关闭模态框
            this.closeModal();
            
            // 滚动到结果区域
            this.$nextTick(() => {
                const resultsSection = document.querySelector('.result-display-section');
                if (resultsSection) {
                    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            
            console.log('✓ 表单提交成功', result);
        },
        
        // 重置表单
        handleReset() {
            if (confirm('确定要重置表单吗？这将清除所有已填写的评分。')) {
                this.formData = {
                    core: {},
                    optional: {},
                    comments: {}
                };
                console.log('✓ 表单已重置');
            }
        }
    },
    
    mounted() {
        console.log('✓ FormSubmit组件已挂载');
        console.log('  - 核心维度:', this.coreDimensions.length);
        console.log('  - 扩展维度:', this.optionalDimensions.length);
    }
};
