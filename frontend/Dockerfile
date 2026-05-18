# 构建阶段
FROM node:20-alpine as builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production=false

# 复制源代码
COPY . .

# 构建
ENV VITE_API_BASE_URL=/api
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建静态资源目录
RUN mkdir -p /usr/share/nginx/html/storage

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]