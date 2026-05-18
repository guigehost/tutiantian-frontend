# WordTemplateFiller API

Excel数据填充Word模板 SaaS平台后端API

## 快速开始

### 开发环境
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker部署
```bash
docker-compose up -d
```

### 生产环境
1. 复制 `.env.example` 为 `.env` 并配置
2. 运行 `docker-compose up -d`
3. 初始化套餐数据 `python -m app.db.init_data`

## API文档
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 核心API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/register | 用户注册 |
| POST | /api/v1/auth/login | 用户登录 |
| GET | /api/v1/users/me | 获取用户信息 |
| POST | /api/v1/templates/upload | 上传模板 |
| GET | /api/v1/templates | 模板列表 |
| POST | /api/v1/datasources/upload | 上传数据源 |
| POST | /api/v1/projects | 创建项目 |
| POST | /api/v1/projects/{id}/auto-map | 自动映射 |
| POST | /api/v1/tasks/{id}/generate | 生成文档 |
| GET | /api/v1/packages | 套餐列表 |
| POST | /api/v1/orders/create | 创建订单 |

## 技术栈
- FastAPI
- SQLAlchemy
- python-docx
- pandas
- Redis
- Docker
