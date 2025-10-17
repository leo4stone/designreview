// 结果显示组件 - 负责结果展示、对比和可视化

window.ResultDisplayComponent = {
    name: 'ResultDisplayComponent',
    
    template: `
        <section v-if="hasResults" class="card result-display-section">
            <h2 class="card-title">📈 评估结果</h2>
            
            <!-- 总分展示区 -->
            <div class="score-summary">
                <div v-for="(result, index) in visibleResults" 
                     :key="result.id" 
                     class="score-wrapper">
                    <div class="score-circle" :style="{ '--score-color': getResultColor(index) }">
                        <div class="score-label">平均分</div>
                        <div class="total-score-value">{{ result.averageScore }}</div>
                    </div>
                    <div class="score-name">{{ result.name }}</div>
                </div>
            </div>
            
            <!-- 雷达图 -->
            <div class="chart-container">
                <canvas ref="radarChart" id="radarChart"></canvas>
            </div>
            
            <!-- 对比详情表 -->
            <div v-if="visibleResults.length > 0" class="comparison-detail">
                <h3>维度对比</h3>
                <div class="comparison-table-wrapper">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>维度</th>
                                <th v-for="(result, index) in visibleResults" :key="result.id">
                                    <span :style="{ color: getResultColor(index) }">
                                        {{ result.name }}
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="dim in allDimensions" :key="dim.id">
                                <td class="dimension-name">
                                    {{ dim.name }}
                                </td>
                                <td v-for="(result, index) in visibleResults" :key="result.id" class="dimension-content">
                                    <div v-if="result.dimensions[dim.id]" class="content-wrapper">
                                        <div class="score-badge-wrapper">
                                            <div class="score-badge">
                                                {{ result.dimensions[dim.id] }} 分
                                            </div>
                                            <div class="dimension-tooltip">
                                                <div class="tooltip-header">
                                                    <strong>{{ dim.name }}</strong>
                                                    <span class="tooltip-subtitle">评分标准</span>
                                                </div>
                                                <div class="tooltip-levels">
                                                    <div 
                                                        v-for="score in [5, 4, 3, 2, 1]" 
                                                        :key="score" 
                                                        :class="['tooltip-level', { 'active': score === result.dimensions[dim.id] }]">
                                                        <span class="level-score">{{ score }} 分</span>
                                                        <span class="level-desc">{{ dim.levels[score] }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="result.comments && result.comments[dim.id]" class="comment-text">
                                            {{ result.comments[dim.id] }}
                                        </div>
                                        <div v-else class="comment-text empty">暂无说明</div>
                                    </div>
                                    <span v-else class="no-data">—</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    `,
    
    inject: ['getResults', 'removeResult', 'toggleResultVisibility'],
    
    data() {
        return {
            chartInstance: null,
            allDimensions: [
                ...DimensionsData.coreDimensions,
                ...DimensionsData.optionalDimensions
            ]
        };
    },
    
    computed: {
        allResults() {
            return this.getResults();
        },
        
        hasResults() {
            return this.allResults.length > 0;
        },
        
        visibleResults() {
            return this.allResults.filter(r => r.visible);
        }
    },
    
    watch: {
        visibleResults: {
            handler() {
                this.$nextTick(() => {
                    this.updateRadarChart();
                });
            },
            deep: true
        }
    },
    
    methods: {
        // 获取结果颜色
        getResultColor(index) {
            const colors = DimensionsData.colors;
            return colors[index % colors.length].solid;
        },
        
        // 更新雷达图
        updateRadarChart() {
            if (!this.$refs.radarChart) {
                return;
            }
            
            const ctx = this.$refs.radarChart.getContext('2d');
            
            // 销毁旧图表
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }
            
            // 没有可见结果时，显示空图表
            if (this.visibleResults.length === 0) {
                return;
            }
            
            // 准备数据集
            const datasets = this.visibleResults.map((result, index) => {
                const color = DimensionsData.colors[index % DimensionsData.colors.length];
                
                // 获取核心维度的分数
                const data = DimensionsData.coreDimensions.map(dim => 
                    result.dimensions[dim.id] || 0
                );
                
                return {
                    label: result.name,
                    data: data,
                    backgroundColor: color.bg,
                    borderColor: color.border,
                    borderWidth: 2,
                    pointBackgroundColor: color.border,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: color.border,
                    pointRadius: 4,
                    pointHoverRadius: 6
                };
            });
            
            // 创建图表
            this.chartInstance = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: DimensionsData.coreDimensions.map(dim => dim.name),
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        r: {
                            beginAtZero: true,
                            min: 0,
                            max: 5,
                            ticks: {
                                stepSize: 1,
                                font: {
                                    size: 12
                                }
                            },
                            pointLabels: {
                                font: {
                                    size: 14,
                                    weight: '600'
                                },
                                color: '#666'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 13
                                },
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.r;
                                    const dimName = context.label;
                                    return `${label}: ${value} 分 (${dimName})`;
                                }
                            }
                        }
                    }
                }
            });
            
            console.log('✓ 雷达图已更新，数据集数量:', datasets.length);
        }
    },
    
    mounted() {
        console.log('✓ ResultDisplay组件已挂载');
        this.$nextTick(() => {
            this.updateRadarChart();
        });
    }
};
