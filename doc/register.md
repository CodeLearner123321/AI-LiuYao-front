# 用户注册接口文档

## 接口信息

- **接口名称**: 用户注册
- **接口路径**: `/api/auth/register`
- **请求方式**: POST
- **接口描述**: 使用邮箱作为主要联系方式注册新用户账号

## 请求参数

请求体为JSON格式，包含以下字段：

| 参数名称 | 类型 | 是否必须 | 描述 |
|---------|------|---------|------|
| email | String | 是 | 用户邮箱地址 |
| userName | String | 是 | 用户账号名称，只能包含大小写英文、数字和点(.) |
| passWord | String | 是 | 用户密码 |
| authCode | String | 是 | 邮箱验证码，通过邮箱验证码接口获取 |


### 验证规则

- **email**: 必须符合邮箱格式
- **userName**: 
  - 只能包含大小写英文、数字和点(.)
  - 长度必须在4-20个字符之间
- **passWord**:
  - 长度必须在6-20个字符之间
- **authCode**:
  - 必须为6位数字

### 请求示例

```json
{
  "email": "user@example.com",
  "userName": "username123",
  "passWord": "password123",
  "authCode": "123456",
}
```

## 响应结果

### 成功响应

```json
{
  "code": 0,
  "message": "注册成功",
  "data": "注册成功"
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
  "message": "该邮箱已注册",
  "data": null
}
```

或

```json
{
  "code": 400,
  "message": "该账号已被使用",
  "data": null
}
```

## 业务流程

1. 用户首先通过邮箱验证码接口请求验证码
2. 用户收到验证码后，提交注册信息
3. 系统验证邮箱验证码是否正确且未过期
4. 系统检查邮箱和用户名是否已存在
5. 创建新用户并存储信息
6. 返回注册结果

## 最近变更

1. **注册方式更改**:
   - 将注册方式从手机号注册改为邮箱注册，邮箱字段为必填，手机号为选填
   - 变更位置: `RegisterRequest.java`和`AuthService.java`中的`register`方法

2. **验证方式更新**:
   - 使用邮箱验证码代替短信验证码
   - 邮箱验证码有效期为5分钟（比原来的短信验证码1分钟更长）

## 调用示例

### cURL

```bash
curl -X POST \
  http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "userName": "username123",
    "passWord": "password123",
    "authCode": "123456",
    "phoneNumber": "13812345678"
}'
```

### JavaScript

```javascript
fetch('http://localhost:8080/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    userName: 'username123',
    passWord: 'password123',
    authCode: '123456',
    phoneNumber: '13812345678'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 注意事项

1. 在调用注册接口前，需要先调用邮箱验证码接口获取验证码
2. 注册成功后，验证码将被删除，不能重复使用
3. 邮箱和用户名一旦注册成功，将无法被其他用户使用
4. 密码会进行加密存储，请用户妥善保管密码
