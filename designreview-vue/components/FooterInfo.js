// Footer 信息组件 - 包含评分标准说明和量规

window.FooterInfoComponent = {
    name: 'FooterInfoComponent',
    
    template: `
        <footer class="footer">
            <!-- 评分标准说明 -->
            <section class="evaluation-guidelines">
                <h2 class="section-title">📋 评分标准说明</h2>
                <p class="section-intro">本评估体系基于通用功能评估维度模型，通过多维度量化评分帮助您系统性地评价产品功能质量。</p>
                
                <div class="dimensions-list">
                    <!-- 核心维度 -->
                    <div v-for="dim in coreDimensions" :key="dim.id" class="dimension-card">
                        <!-- 维度头部 -->
                        <div class="dimension-header">
                            <h3 class="dimension-title">{{ dim.name }} / {{ dim.nameEn }}</h3>
                        </div>
                        
                        <!-- 维度定义 -->
                        <p class="dimension-definition">{{ dim.definition }}</p>
                        
                        <!-- 评估要点和评分量规 -->
                        <div class="dimension-content">
                            <div class="dimension-points">
                                <h4>评估要点</h4>
                                <ul>
                                    <li v-for="(point, index) in dim.points" :key="index">{{ point }}</li>
                                </ul>
                            </div>
                            
                            <div class="dimension-levels">
                                <h4>评分量规</h4>
                                <div class="levels-list">
                                    <div v-for="score in [5, 4, 3, 2, 1]" :key="score" class="level-item">
                                        <span class="level-score">{{ score }}分</span>
                                        <span class="level-description">{{ dim.levels[score] }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 扩展维度 -->
                    <div v-for="dim in optionalDimensions" :key="dim.id" class="dimension-card optional">
                        <!-- 维度头部 -->
                        <div class="dimension-header">
                            <h3 class="dimension-title">{{ dim.name }} / {{ dim.nameEn }} <span class="optional-badge">扩展</span></h3>
                        </div>
                        
                        <!-- 维度定义 -->
                        <p class="dimension-definition">{{ dim.definition }}</p>
                        
                        <!-- 评估要点和评分量规 -->
                        <div class="dimension-content">
                            <div class="dimension-points">
                                <h4>评估要点</h4>
                                <ul>
                                    <li v-for="(point, index) in dim.points" :key="index">{{ point }}</li>
                                </ul>
                            </div>
                            
                            <div class="dimension-levels">
                                <h4>评分量规</h4>
                                <div class="levels-list">
                                    <div v-for="score in [5, 4, 3, 2, 1]" :key="score" class="level-item">
                                        <span class="level-score">{{ score }}分</span>
                                        <span class="level-description">{{ dim.levels[score] }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- 使用提示 -->
            <section class="usage-tips">
                <p>💡 <strong>使用提示：</strong>评分表可用于产品功能评审、功能上线前体验自测、用户研究等场景</p>
            </section>
        </footer>
    `,
    
    data() {
        return {
            coreDimensions: DimensionsData.coreDimensions,
            optionalDimensions: DimensionsData.optionalDimensions
        };
    },
    
    mounted() {
        console.log('✓ FooterInfo组件已挂载');
    }
};

