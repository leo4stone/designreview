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
                     class="score-circle"
                     :style="{ '--score-color': getResultColor(index) }">
                    <div class="total-score-value">{{ result.totalScore }}</div>
                    <div class="score-name">{{ result.name }}</div>
                    <div class="score-level">{{ result.scoreLevel }}</div>
                </div>
            </div>
            
            <!-- 雷达图 -->
            <div class="chart-container">
                <canvas ref="radarChart" id="radarChart"></canvas>
            </div>
            
            <!-- 结果管理控制面板 -->
            <div class="result-controls">
                <h3>结果管理</h3>
                <div class="result-list">
                    <div v-for="result in allResults" :key="result.id" class="result-item">
                        <label class="result-checkbox">
                            <input 
                                type="checkbox" 
                                :checked="result.visible"
                                @change="toggleResultVisibility(result.id)">
                            <span class="result-label">
                                <span class="result-indicator" :style="{ backgroundColor: getResultColor(getResultIndex(result.id)) }"></span>
                                <strong>{{ result.name }}</strong>
                                <span class="result-meta">
                                    (总分: {{ result.totalScore }}, 
                                    {{ result.isCurrent ? '当前评分' : '导入文件' }})
                                </span>
                            </span>
                        </label>
                        <div class="result-actions">
                            <button 
                                @click="exportResult(result.id)" 
                                class="btn-icon" 
                                title="导出此结果">
                                💾
                            </button>
                            <button 
                                @click="removeResult(result.id)" 
                                class="btn-icon btn-danger" 
                                title="删除此结果">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
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
                                    <span class="dimension-color-dot" :style="{ backgroundColor: dim.color }"></span>
                                    {{ dim.name }}
                                </td>
                                <td v-for="(result, index) in visibleResults" :key="result.id" class="dimension-content">
                                    <div v-if="result.dimensions[dim.id]" class="content-wrapper">
                                        <div class="score-badge" :style="{ 
                                            backgroundColor: dim.color,
                                            color: 'white'
                                        }">
                                            {{ result.dimensions[dim.id] }} 分
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
        
        // 获取结果索引
        getResultIndex(resultId) {
            return this.allResults.findIndex(r => r.id === resultId);
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
                                color: (context) => {
                                    // 根据维度索引返回对应颜色
                                    const index = context.index;
                                    return DimensionsData.coreDimensions[index].color;
                                }
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
        },
        
        // 导出结果
        exportResult(resultId) {
            const result = this.allResults.find(r => r.id === resultId);
            if (!result) {
                alert('未找到该结果');
                return;
            }
            
            // 构建CSV内容 - 纵向格式
            const rows = [];
            
            // 表头
            rows.push(['维度', '分数', '说明'].map(h => `"${h}"`).join(','));
            
            // 添加所有维度数据
            this.allDimensions.forEach(dim => {
                const score = result.dimensions[dim.id] || '';
                const comment = (result.comments && result.comments[dim.id]) ? result.comments[dim.id] : '';
                rows.push([dim.name, score, comment].map(v => `"${v}"`).join(','));
            });
            
            // 添加总分和评级
            rows.push(['总分', result.totalScore, ''].map(v => `"${v}"`).join(','));
            rows.push(['评级', result.scoreLevel, ''].map(v => `"${v}"`).join(','));
            
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
            
            console.log('✓ 导出成功:', filename);
        }
    },
    
    mounted() {
        console.log('✓ ResultDisplay组件已挂载');
        this.$nextTick(() => {
            this.updateRadarChart();
        });
    }
};
