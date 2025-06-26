# 修改密码接口文档

## 接口信息

- **接口名称**: 修改密码
- **接口路径**: `/api/auth/update/password`
- **请求方式**: POST
- **接口描述**: 通过邮箱验证码验证用户身份后修改密码

## 请求参数

请求体为JSON格式，包含以下字段：

| 参数名称 | 类型 | 是否必须 | 描述 |
|---------|------|---------|------|
| email | String | 是 | 用户注册的邮箱地址 |
| newPassword | String | 是 | 新密码 |
| authCode | String | 是 | 邮箱验证码，通过邮箱验证码接口获取 |

### 验证规则

- **email**: 必须符合邮箱格式
- **newPassword**:
  - 长度必须在6-20个字符之间
- **authCode**:
  - 必须为6位数字

### 请求示例

```json
{
  "email": "user@example.com",
  "newPassword": "newpassword123",
  "authCode": "123456"
}
```

## 响应结果

### 成功响应

```json
{
  "code": 0,
  "message": "成功",
  "data": "username"  // 返回用户名
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "验证码错误或已过期（验证码有效期为5分钟）",
  "data": null
}
```

或

```json
{
  "code": 400,
  "message": "该邮箱未注册",
  "data": null
}
```

## 业务流程

1. 用户首先通过邮箱验证码接口请求验证码（requestType = "UPDATE"）
2. 用户收到验证码后，提交邮箱、验证码和新密码
3. 系统验证邮箱验证码是否正确且未过期
4. 系统检查邮箱是否存在
5. 为用户生成新的盐值并计算密码哈希
6. 更新用户密码信息
7. 删除已使用的验证码
8. 返回用户账号名称

## 最近变更

1. **验证方式变更**:
   - 从手机号验证码修改为邮箱验证码验证
   - 变更位置: `UpdatePasswordRequest.java`和`AuthService.java`中的`updatePassword`方法

2. **字段变更**:
   - 请求体中的`phoneNumber`字段替换为`email`字段
   - 验证码有效期从1分钟延长到5分钟

3. **错误提示变更**:
   - 错误信息从"该手机号未注册"变更为"该邮箱未注册"
   - 验证码失效提示更新为"验证码错误或已过期（验证码有效期为5分钟）"

## 调用示例

### cURL

```bash
curl -X POST \
  http://localhost:8080/api/auth/update/password \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "newPassword": "newpassword123",
    "authCode": "123456"
}'
```

### JavaScript

```javascript
fetch('http://localhost:8080/api/auth/update/password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    newPassword: 'newpassword123',
    authCode: '123456'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 安全注意事项

1. 密码修改前需要验证用户身份，通过邮箱验证码进行验证
2. 新密码在传输和存储过程中均经过加密处理
3. 验证码使用后立即销毁，不可重复使用
4. 修改密码成功后，用户需要使用新密码重新登录
5. 为了安全考虑，建议用户定期修改密码
