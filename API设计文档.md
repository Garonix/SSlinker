# API设计文档

本API基于RESTful风格，所有接口均以`/api`为前缀，数据格式为JSON。

## 1. 证书管理
### 1.1 申请CA根证书
- URL：`POST /api/cert/ca`
- 请求参数：无（全部自动化，参数固定）
- 处理流程：
  1. 检查并创建`certs`目录
  2. 生成4096位RSA私钥，文件名`SSLinker.key`，不加密
  3. 生成自签名证书，文件名`SSLinker.crt`，有效期20年，主题仅CN
  4. 返回操作结果
- 响应示例：
```json
{
  "success": true,
  "ca_cert_path": "/certs/SSLinker.crt",
  "ca_key_path": "/certs/SSLinker.key",
  "message": "CA根证书生成成功"
}
```
- 失败示例：
```json
{
  "success": false,
  "message": "生成失败，原因：xxx"
}
```

### 1.2 申请域名证书
- URL：`POST /api/cert/domain`
- 请求参数：
```json
{
  "domain": "example.local",
  "ip": "192.168.1.10"
}
```
- 响应：
```json
{
  "success": true,
  "cert_path": "/certs/example.local.crt",
  "key_path": "/certs/example.local.key"
}
```

### 1.3 获取证书列表
- URL：`GET /api/cert/list`
- 响应：
```json
{
  "certs": [
    {"domain": "example.local", "cert_path": "/certs/example.local.crt", "key_path": "/certs/example.local.key"},
    ...
  ]
}
```

### 1.4 下载证书/密钥
- URL：`GET /api/cert/download?type=cert|key&domain=example.local`
- 响应：文件流

### 1.5 删除证书
- URL：`DELETE /api/cert?domain=example.local`
- 响应：
```json
{"success": true}
```

## 2. nginx配置管理
### 2.1 生成nginx配置
- URL：`POST /api/nginx/config`
- 请求参数：
```json
{
  "domain": "example.local",
  "proxy_pass": "http://192.168.1.100:8080"
}
```
- 响应：
```json
{"success": true, "config_path": "/nginx/conf.d/example.local.conf"}
```

### 2.2 获取nginx配置列表
- URL：`GET /api/nginx/list`
- 响应：
```json
{
  "configs": [
    {"domain": "example.local", "config_path": "/nginx/conf.d/example.local.conf"},
    ...
  ]
}
```

### 2.3 删除nginx配置
- URL：`DELETE /api/nginx/config?domain=example.local`
- 响应：
```json
{"success": true}
```

### 2.4 重载nginx
- URL：`POST /api/nginx/reload`
- 响应：
```json
{"success": true, "message": "nginx reloaded"}
```

## 3. 系统与状态
### 3.1 获取系统状态
- URL：`GET /api/status`
- 响应：
```json
{
  "nginx_status": "running",
  "cert_count": 3,
  "config_count": 2
}
```

### 3.2 获取操作日志
- URL：`GET /api/logs`
- 响应：
```json
{
  "logs": [
    {"time": "2025-04-25 14:30", "action": "create_cert", "detail": "example.local"},
    ...
  ]
}
```

---
如需补充认证、权限、分页等细节，可随时扩展。
