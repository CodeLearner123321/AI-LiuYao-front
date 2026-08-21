# OpenLiuYao - AI 六爻智能分析平台

> 基于深度学习的人工智能平台，对中国古代决策符号系统进行结构化解析，为公众开放互动式探索功能，以直观数据呈现古代智慧精髓，恪守学术规范，杜绝封建迷信。

## 项目简介

**OpenLiuYao** 是一个将传统易学六爻理论与现代 AI 深度学习相结合的 Web 应用。用户可以输入起卦时间，由系统自动排盘，并调用大语言模型（LLM）对六爻卦象进行智能解析，结果以 Markdown 格式流式呈现。平台同时支持用户注册、登录、历史记录查询，以及自定义 LLM 服务配置等功能。

## 关联仓库

- 前端仓库：[AI-LiuYao-front](https://github.com/CodeLearner123321/AI-LiuYao-front)
- 后端仓库：[AI-LiuYao](https://github.com/CodeLearner123321/AI-LiuYao)

本仓库为 AI-LiuYao 的前端项目，后端 API、MCP 服务、图片识卦、海报渲染、对象存储与数据持久化能力由后端仓库提供。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3（Composition API / `<script setup>`） |
| 构建工具 | Vite 6.x |
| 路由管理 | Vue Router 4.x |
| UI 组件库 | Element Plus 2.x |
| HTTP 请求 | Axios |
| Markdown 渲染 | marked |
| 农历计算 | lunar-javascript |
| 代码压缩 | terser |
| 开发调试 | vite-plugin-vue-devtools |

## 主要功能

- **六爻智能分析**：选择起卦时间，系统自动排盘并通过 AI 给出详细卦象解读
- **自定义 LLM 配置**：支持用户配置自己的大模型服务商、模型 ID 和 API Key
- **用户认证**：注册、登录、JWT Token 鉴权、修改密码
- **历史记录**：查询个人历史起卦与解析记录
- **使用说明**：平台功能介绍与操作引导
- **资料下载**：相关传统文化学习资料下载
- **资料上传**：管理员权限上传文档（权限控制）
- **响应式设计**：兼容 PC 与移动端

## 页面路由

| 路径 | 功能 |
|------|------|
| `/` | 首页 |
| `/hexagram` | 六爻智能分析（核心功能） |
| `/liuyao-detail` | 六爻详情查看 |
| `/guide` | 使用说明 |
| `/downloads` | 资料下载 |
| `/upload` | 资料上传（需登录及权限） |
| `/account/history` | 历史记录（需登录） |
| `/account/change-password` | 修改密码 |
| `/login` | 用户登录 |
| `/register` | 用户注册 |
| `/about` | 关于我们 |

## 项目启动

### 安装依赖

```sh
npm ci
```

### 启动开发服务器

```sh
npm run dev
```

### 构建生产版本

```sh
npm run build
```

### 预览生产构建

```sh
npm run preview
```

## 后端接口

本项目默认连接本地后端服务：

```
http://localhost:8080
```

如需切换至生产环境，请通过 Vite 环境变量配置：

```sh
VITE_API_BASE_URL=https://your-api.example.com
```

本地可创建 `.env` 文件覆盖默认值；不要提交 `.env` 或任何真实密钥。更多开源发布检查见 [OPEN_SOURCE.md](OPEN_SOURCE.md)。

## 安全与贡献

- 安全问题请按 [SECURITY.md](SECURITY.md) 私下报告。
- 贡献流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。
- 开源发布检查见 [OPEN_SOURCE.md](OPEN_SOURCE.md)。
- 项目采用 [Apache License 2.0](LICENSE)。贡献者必须有权按该许可证提供相关代码和素材。
