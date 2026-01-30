import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

/**
 * Swagger API 文件配置
 *
 * 產生 OpenAPI 3.0 規格文件
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('SENTENG ERP API')
    .setDescription(
      `
## 聖騰 ERP 系統 API 文件

### 模組概覽

| 模組 | 說明 |
|------|------|
| **Auth** | 身份驗證與授權 |
| **Users** | 使用者管理 |
| **Clients** | 客戶管理 |
| **Projects** | 專案管理 |
| **Quotations** | 報價管理 |
| **Invoices** | 發票管理 |
| **Vendors** | 供應商管理 |
| **Inventory** | 進銷存管理 |
| **SmartHome** | 智慧家居 |
| **Regulations** | 法規查詢 |
| **CMM** | 營建材料計算 |

### 認證方式

所有 API 需要 JWT Bearer Token:

\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

### 錯誤處理

| 狀態碼 | 說明 |
|--------|------|
| 400 | 請求參數錯誤 |
| 401 | 未認證 |
| 403 | 無權限 |
| 404 | 資源不存在 |
| 500 | 伺服器錯誤 |

### 分頁

支援分頁的 API 使用以下參數:
- \`page\`: 頁碼 (從 1 開始)
- \`limit\`: 每頁筆數 (預設 20)
- \`sortBy\`: 排序欄位
- \`sortOrder\`: 排序方向 (ASC/DESC)
    `.trim()
    )
    .setVersion('1.0.0')
    .setContact('SENTENG', 'https://senteng.com.tw', 'support@senteng.com.tw')
    .setLicense('Proprietary', '')
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.senteng.com.tw', 'Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT'
    )
    .addTag('Auth', '身份驗證')
    .addTag('Users', '使用者管理')
    .addTag('Clients', '客戶管理')
    .addTag('Projects', '專案管理')
    .addTag('Quotations', '報價管理')
    .addTag('Invoices', '發票管理')
    .addTag('Vendors', '供應商管理')
    .addTag('Inventory', '進銷存')
    .addTag('SmartHome', '智慧家居')
    .addTag('Regulations', '法規查詢')
    .addTag('CMM', '營建材料計算')
    .addTag('Finance', '財務管理')
    .addTag('Schedule', '進度管理')
    .addTag('Settings', '系統設定')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'nord',
      },
    },
    customSiteTitle: 'SENTENG ERP API',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { font-size: 2em }
    `,
  });
}

/**
 * 常用 API 回應 DTO 範例
 */
export const ApiResponses = {
  success: {
    status: 200,
    description: '操作成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: '操作成功' },
      },
    },
  },
  created: {
    status: 201,
    description: '建立成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: '建立成功' },
      },
    },
  },
  badRequest: {
    status: 400,
    description: '請求參數錯誤',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '參數驗證失敗' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
  unauthorized: {
    status: 401,
    description: '未認證',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '請先登入' },
      },
    },
  },
  forbidden: {
    status: 403,
    description: '無權限',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '您沒有權限執行此操作' },
      },
    },
  },
  notFound: {
    status: 404,
    description: '資源不存在',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '找不到指定的資源' },
      },
    },
  },
};
