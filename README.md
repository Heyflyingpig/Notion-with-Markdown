# MD to Notion Web

一个，用于将 Markdown 内容转换并上传到 Notion。

## 功能特性

- **安全存储** - API 密钥使用 AES-256-CBC 加密存储
- **多页面管理** - 支持配置多个 Notion 页面
- **灵活上传** - 支持文本输入、文件拖拽、剪贴板粘贴
- **历史记录** - 完整的上传历史和搜索功能


## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量(默认)

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000
HOST=localhost

# 加密密钥（用于加密存储的 API 密钥）
SECRET_KEY=your_32_character_secret_key_here
```

**重要：** 请更新 `SECRET_KEY` ,生成一个随机的 32 字符密钥用于生产环境。

### 3. 启动服务器

```bash
# 生产模式
npm start

# 开发模式（自动重载）
npm run dev
```

### 4. 访问应用

打开浏览器访问：`http://localhost:3000`

## 首次配置

1. 访问应用后，点击"开始配置向导"
2. 输入您的 Notion API 密钥（[在此创建](https://www.notion.so/my-integrations)）
3. 输入目标 Notion 页面的 URL
4. 完成配置，开始上传！

## 使用说明

### 上传 Markdown

1. 点击导航栏的"上传"
2. 选择目标页面
3. 输入或粘贴 Markdown 内容
4. 点击"上传到 Notion"

### 管理页面配置

1. 点击导航栏的"配置"
2. 添加、编辑或删除页面配置
3. 设置默认页面

### 查看历史记录

1. 点击导航栏的"历史"
2. 查看所有上传记录
3. 使用搜索框按标题搜索

## 技术栈

- **后端**: Fastify + lowdb
- **前端**: Alpine.js + Tailwind CSS
- **Notion SDK**: @notionhq/client + @tryfabric/martian
- **加密**: Node.js crypto (AES-256-CBC)

## 项目结构

```
MDtoNOTION/
├── src/
│   ├── server/           # 后端代码
│   │   ├── index.js      # 服务器入口
│   │   ├── routes/       # API 路由
│   │   ├── services/     # 业务服务
│   │   └── utils/        # 工具函数
│   └── public/           # 前端静态资源
│       ├── index.html    # 主页面
│       ├── css/          # 样式文件
│       └── js/           # JavaScript 文件
├── data/
│   └── db.json           # 数据存储
├── package.json
└── .env                  # 环境变量
```

## 常见问题

### 如何获取 Notion API 密钥？

1. 访问 [Notion Integrations](https://www.notion.so/my-integrations)
2. 点击"+ New integration"
3. 填写名称并选择工作区
4. 复制生成的 API 密钥

### 如何获取 Notion 页面 URL？

1. 在 Notion 中打开目标页面
2. 点击右上角的"Share"
3. 复制页面链接
4. **重要：** 确保将页面共享给您的集成

### 上传失败怎么办？

1. 检查 API 密钥是否正确
2. 确认页面已共享给集成
3. 查看浏览器控制台的错误信息
4. 检查服务器日志

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！

