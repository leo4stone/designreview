# Less样式模块说明

本目录包含模块化的Less样式文件，各模块按功能组织。

## 📁 模块列表

| 模块 | 文件 | 说明 |
|------|------|------|
| 变量定义 | `variables.less` | 颜色、尺寸、阴影等全局变量 |
| 全局样式 | `global.less` | 基础重置、body、app容器 |
| 头部页脚 | `header.less` | 页面头部和页脚样式 |
| 按钮组件 | `buttons.less` | 所有按钮相关样式 |
| 模态框组件 | `modal.less` | 全屏模态框和帮助弹窗 |
| 表单组件 | `form.less` | 评分表单、维度项、评分按钮 |
| 导入组件 | `import.less` | 文件导入区域样式 |
| 结果组件 | `results.less` | 结果展示、雷达图、对比表格 |
| 动画定义 | `animations.less` | 所有@keyframes动画 |
| 响应式 | `responsive.less` | 移动端适配 |

## 🔧 使用方式

所有模块在 `../main.less` 中按顺序导入：

```less
@import 'modules/variables.less';  // 必须最先导入
@import 'modules/global.less';
@import 'modules/header.less';
// ... 其他模块
```

## 💡 维护建议

1. **修改颜色** → 只需编辑 `variables.less`
2. **修改按钮** → 只需编辑 `buttons.less`
3. **添加动画** → 只需编辑 `animations.less`
4. **调整响应式** → 只需编辑 `responsive.less`

各模块相互独立，修改不会影响其他模块。

