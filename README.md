# 故事收集平台

一个简单的故事收集和浏览平台，使用纯HTML、CSS和JavaScript编写。应用通过API获取故事分类、故事列表和故事详情。

## 功能特点

- 浏览不同分类的故事
- 搜索故事
- 按标题、内容长度排序
- 查看故事详情
- 分页浏览
- 响应式设计，适配不同设备

## 技术栈

- 纯HTML、CSS和JavaScript
- Fetch API用于数据获取
- Font Awesome图标库
- Google Fonts

## API端点

应用使用以下API端点：

1. 获取故事分类: `https://www.mxnzp.com/api/story/types?app_id=xxx&app_secret=xxx`
2. 获取故事列表: `https://www.mxnzp.com/api/story/list?type_id=6&page=1&app_id=xxx&app_secret=xxx`
3. 获取故事详情: `https://www.mxnzp.com/api/story/details?story_id=104823&app_id=xxx&app_secret=xxx`

## 本地运行

要在本地运行此应用，只需克隆本仓库并使用Live Server或其他Web服务器打开index.html文件。

```bash
# 克隆仓库
git clone <repository-url>

# 进入项目目录
cd story-collection-platform

# 使用Live Server或者直接在浏览器中打开index.html
```

## 项目结构

- `index.html` - 主HTML文件
- `styles.css` - CSS样式文件
- `app.js` - JavaScript应用逻辑
- `README.md` - 项目说明文件 