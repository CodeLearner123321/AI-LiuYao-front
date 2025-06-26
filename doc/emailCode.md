# 邮箱验证码接口文档

## 接口信息

- **接口名称**: 发送邮箱验证码
- **接口路径**: `/api/auth/email/code`
- **请求方式**: POST
- **接口描述**: 向指定邮箱发送验证码，用于注册或修改密码等操作

## 请求参数

请求体为JSON格式，包含以下字段：

| 参数名称 | 类型 | 是否必须 | 描述 |
|---------|------|---------|------|
| email | String | 是 | 接收验证码的邮箱地址 |
| requestType | String | 是 | 请求类型，`SIGN_IN`(注册)或`UPDATE`(修改密码) |

### 请求示例

```json
{
  "email": "user@example.com",
  "requestType": "SIGN_IN"
}
```

## 响应结果

### 成功响应

```json
{
  "code": 0,
  "message": "验证码发送成功",
  "data": null
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "验证码已发送，请勿重复操作",
  "data": null
}
```

或

```json
{
  "code": 400,
  "message": "今日验证码发送次数已达上限，请明天再试",
  "data": null
}
```

## 业务规则

1. **验证码有效期**: 
   - 邮箱验证码有效期为5分钟

2. **频率限制**:
   - 同一邮箱在同一业务类型下，每天最多可发送5次
   - 已发送且未过期的验证码不能重复发送

3. **验证码格式**:
   - 6位随机数字

## 最近变更

1. **Redis存储方式更新**:
   - 修复了计数器值存储时的类型转换错误，现在使用`String.valueOf(count + 1)`将整数转换为字符串再存入Redis
   - 变更位置: `AuthService.java`中的`sendEmailCode`方法

2. **邮件发送实现**:
   - 添加了实际的邮件发送逻辑，通过`EmailService.sendVerificationCode`方法发送验证码邮件
   - 使用HTML模板美化邮件内容

## 调用示例

### cURL

```bash
curl -X POST \
  http://localhost:8080/api/auth/email/code \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "requestType": "SIGN_IN"
}'
```

### JavaScript

```javascript
fetch('http://localhost:8080/api/auth/email/code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    requestType: 'SIGN_IN'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 注意事项

1. 发送验证码后，前端应提示用户查看邮箱
2. 用户应检查垃圾邮件文件夹，以防验证码邮件被误判为垃圾邮件
3. 如未收到验证码，用户可在频率限制内重新请求
