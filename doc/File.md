# 文件接口文档

## 1. 下载文件

### 接口说明
- 接口名称：下载文件
- 接口路径：`/api/file/download/{fileName}`
- 请求方式：GET
- 接口描述：根据文件名下载指定文件

### 请求参数
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| fileName | String | path | 是 | 文件名，支持带扩展名 |

### 响应结果
- 成功：直接返回文件流
- 失败：
  - 404：文件不存在
  - 400：文件路径错误

### 示例
```http
GET /api/file/download/example.pdf
```

## 2. 获取系统书籍列表

### 接口说明
- 接口名称：获取系统书籍列表
- 接口路径：`/api/file/system/books`
- 请求方式：GET
- 接口描述：获取系统书籍目录下的所有文件信息

### 请求参数
无

### 响应结果
```json
{
  "code": 200,
  "msg": "SUCCESS",
  "data": [
    {
      "id": 1,
      "title": "六爻基础知识手册.pdf",
      "description": "常用六爻术语解释与对照",
      "size": "2.5MB",
      "format": "PDF"
    }
  ]
}
```

### 响应字段说明
| 字段名 | 类型 | 说明 |
|--------|------|------|
| code | Integer | 响应码，200表示成功 |
| msg | String | 响应消息 |
| data | Array | 书籍信息列表 |
| data[].id | Integer | 书籍ID |
| data[].title | String | 书籍标题（文件名） |
| data[].description | String | 书籍描述 |
| data[].size | String | 文件大小，如：2.5MB |
| data[].format | String | 文件格式，如：PDF |

### 错误码说明
| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 示例
```http
GET /api/file/system/books
```

### 响应示例
```json
{
  "code": 200,
  "msg": "SUCCESS",
  "data": [
    {
      "id": 1,
      "title": "六爻基础知识手册.pdf",
      "description": "常用六爻术语解释与对照",
      "size": "2.5MB",
      "format": "PDF"
    },
    {
      "id": 2,
      "title": "六爻实战案例集.pdf",
      "description": "常用六爻术语解释与对照",
      "size": "3.8MB",
      "format": "PDF"
    },
    {
      "id": 3,
      "title": "六爻术语对照表.pdf",
      "description": "常用六爻术语解释与对照",
      "size": "1.2MB",
      "format": "PDF"
    }
  ]
}
```

## 注意事项
1. 文件下载接口支持的文件类型不限，但建议只用于下载文档类文件
2. 系统书籍列表接口默认只返回`books/system`目录下的文件
3. 文件大小显示支持B、KB、MB三种单位
4. 文件格式会自动从文件名中提取并转换为大写
