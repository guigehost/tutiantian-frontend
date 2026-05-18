# Word模板字段标记插件

## 功能

在Word文档中可视化管理可填充字段：
1. 选中Word中的文本，点击"添加字段"
2. 输入字段名称（如"姓名"、"日期"）
3. 自动保存到文档中
4. 一键生成Excel模板

## 安装步骤

### 方式一：共享文件夹安装（推荐用于测试）

1. 把 `manifest.xml` 文件放到一个固定的文件夹中，例如：
   ```
   C:\WordAddins\TemplateFiller\manifest.xml
   ```

2. 打开Word，点击"文件" → "选项" → "信任中心" → "信任中心设置"
3. 选择"受信任的加载项目录"
4. 添加文件夹路径：`C:\WordAddins\TemplateFiller\`
5. 勾选"在菜单中显示"
6. 重启Word

7. 重启后，点击"插入" → "我的加载项" → "共享文件夹"
8. 找到"模板字段标记工具"并点击安装

### 方式二：Centennial加载项

用于正式发布，需要：
1. 创建AppxManifest
2. 使用Windows App Packaging Tool打包
3. 签名并发布到Microsoft Store

## 使用方法

1. **选中文本**：在Word文档中选中需要填充的内容
2. **添加字段**：输入字段名称（必须是英文或拼音，如 `name`、`date`、`amount`）
3. **重复操作**：对所有需要填充的位置重复以上步骤
4. **生成模板**：点击"生成Excel模板"按钮，下载CSV文件
5. **填写数据**：用Excel打开CSV文件，填写实际数据
6. **上传使用**：在Web系统中上传标记好的Word模板和填好的Excel数据

## 字段命名规范

建议使用有意义的英文/拼音命名：
- `{{name}}` → 姓名
- `{{date}}` → 日期
- `{{amount}}` → 金额
- `{{company}}` → 公司名称

## 技术说明

- 使用Office JavaScript API
- 数据存储在Word文档的CustomXmlParts中
- 生成CSV格式的Excel模板（可用Excel直接打开）

## 文件结构

```
word-addin/
├── manifest.xml     # Office加载项配置文件
└── src/
    └── index.html   # 加载项界面
```
