# Contributing to @pencil-structural/compare

感谢您对 `@pencil-structural/compare` 的贡献兴趣！

## 开发设置

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 克隆仓库

```bash
git clone https://github.com/redbyzan/pencil-structural-compare.git
cd pencil-structural-compare
npm install
```

### 构建项目

```bash
npm run build
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监视模式
npm test -- --watch
```

### 类型检查

```bash
npm run type-check
```

### 代码检查

```bash
npm run lint
```

---

## 开发工作流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 2. 进行更改

- 编写代码
- 添加测试
- 更新文档（如需要）

### 3. 测试

```bash
npm run build
npm test
npm run type-check
npm run lint
```

### 4. 提交

```bash
git add .
git commit -m "feat: add new feature"
```

**提交消息格式：**

- `feat:` 新功能
- `fix:` Bug修复
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

### 5. 推送并创建 Pull Request

```bash
git push origin feature/your-feature-name
```

然后访问 https://github.com/redbyzan/pencil-structural-compare 创建 Pull Request。

---

## 代码规范

### TypeScript

- 使用 TypeScript 严格模式
- 为所有公共 API 添加类型定义
- 为复杂函数添加 JSDoc 注释

### 测试

- 为新功能添加测试
- 保持测试覆盖率 >= 80%
- 使用描述性的测试名称

### 文档

- 更新 README.md（如需要）
- 更新 CHANGELOG.md
- 为公共 API 添加注释

---

## Pull Request 检查清单

在提交 PR 之前，请确保：

- [ ] 所有测试通过
- [ ] 类型检查通过（无错误）
- [ ] Lint 检查通过
- [ ] 新功能有对应的测试
- [ ] 文档已更新（如需要）
- [ ] 提交消息遵循约定格式
- [ ] PR 描述清晰说明更改内容

---

## 获取帮助

如有疑问：

1. 查看 [文档](https://github.com/redbyzan/pencil-structural-compare#readme)
2. 创建 [Discussion](https://github.com/redbyzan/pencil-structural-compare/discussions)
3. 创建 [Issue](https://github.com/redbyzan/pencil-structural-compare/issues)

---

## 许可证

贡献的代码将根据 [MIT License](LICENSE) 发布。
