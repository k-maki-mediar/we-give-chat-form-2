// アクション実行システム
import { z } from "zod";

// アクション実行結果の型定義
export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  retryable?: boolean;
}

// アクション定義の型定義
export interface ActionDefinition {
  type: "api_call" | "storage" | "navigation" | "custom";
  config: Record<string, any>;
  retryConfig?: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
  };
}

// アクション実行コンテキスト
export interface ExecutionContext {
  responses: Record<string, any>;
  toolResults: Record<string, any>;
  metadata: Record<string, any>;
  currentStep?: string;
}

// APIコール設定
interface ApiCallConfig {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  transformResponse?: string; // 応答変換式
}

// ストレージ設定
interface StorageConfig {
  action: "set" | "get" | "remove" | "clear";
  key: string;
  value?: any;
  storage?: "local" | "session";
}

// アクション実行エンジン
export class ActionExecutor {
  private executors: Map<string, (config: any, context: ExecutionContext) => Promise<ActionResult>>;

  constructor() {
    this.executors = new Map();
    this.registerBuiltInExecutors();
  }

  // 組み込みアクション実行器の登録
  private registerBuiltInExecutors() {
    // API呼び出しアクション
    this.registerExecutor("api_call", async (config: ApiCallConfig, context) => {
      try {
        const controller = new AbortController();
        const timeout = config.timeout || 30000;
        
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // URLのテンプレート変数を置換
        const processedUrl = this.processTemplate(config.url, context);
        
        // ボディのテンプレート変数を置換
        const processedBody = config.body 
          ? this.processTemplateDeep(config.body, context)
          : undefined;

        const response = await fetch(processedUrl, {
          method: config.method || "GET",
          headers: {
            "Content-Type": "application/json",
            ...config.headers
          },
          body: processedBody ? JSON.stringify(processedBody) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        let data = await response.json();

        // 応答変換の適用
        if (config.transformResponse) {
          // TODO: expr-evalを使用して変換式を評価
          // data = evaluateExpression(config.transformResponse, { response: data, ...context });
        }

        return {
          success: true,
          data
        };
      } catch (error: any) {
        const isTimeout = error.name === "AbortError";
        const isNetworkError = error.message.includes("fetch");
        
        return {
          success: false,
          error: error.message,
          retryable: isTimeout || isNetworkError
        };
      }
    });

    // ローカルストレージアクション
    this.registerExecutor("storage", async (config: StorageConfig) => {
      try {
        const storage = config.storage === "session" 
          ? window.sessionStorage 
          : window.localStorage;

        switch (config.action) {
          case "set":
            storage.setItem(config.key, JSON.stringify(config.value));
            return { success: true };
            
          case "get":
            const value = storage.getItem(config.key);
            return {
              success: true,
              data: value ? JSON.parse(value) : null
            };
            
          case "remove":
            storage.removeItem(config.key);
            return { success: true };
            
          case "clear":
            storage.clear();
            return { success: true };
            
          default:
            throw new Error(`Unknown storage action: ${config.action}`);
        }
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          retryable: false
        };
      }
    });

    // ナビゲーションアクション
    this.registerExecutor("navigation", async (config: { url: string, target?: string }) => {
      try {
        if (config.target === "_blank") {
          window.open(config.url, "_blank");
        } else {
          window.location.href = config.url;
        }
        return { success: true };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          retryable: false
        };
      }
    });
  }

  // カスタムアクション実行器の登録
  public registerExecutor(
    type: string,
    executor: (config: any, context: ExecutionContext) => Promise<ActionResult>
  ) {
    this.executors.set(type, executor);
  }

  // アクションの実行（再試行機能付き）
  public async execute(
    action: ActionDefinition,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const executor = this.executors.get(action.type);
    if (!executor) {
      return {
        success: false,
        error: `Unknown action type: ${action.type}`
      };
    }

    const retryConfig = {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      ...action.retryConfig
    };

    let lastResult: ActionResult | null = null;
    let attempt = 0;

    while (attempt < retryConfig.maxAttempts) {
      try {
        lastResult = await executor(action.config, context);
        
        if (lastResult.success || !lastResult.retryable) {
          return lastResult;
        }
      } catch (error: any) {
        lastResult = {
          success: false,
          error: error.message,
          retryable: true
        };
      }

      attempt++;
      
      if (attempt < retryConfig.maxAttempts && lastResult.retryable) {
        const delay = retryConfig.delayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
        await this.delay(delay);
        
        if (process.env.NODE_ENV === "development") {
          console.log(`Retrying action ${action.type} (attempt ${attempt + 1}/${retryConfig.maxAttempts})`);
        }
      }
    }

    return lastResult || {
      success: false,
      error: "Max retry attempts reached"
    };
  }

  // テンプレート文字列の処理
  private processTemplate(template: string, context: ExecutionContext): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueByPath(context, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  // 深いオブジェクトのテンプレート処理
  private processTemplateDeep(obj: any, context: ExecutionContext): any {
    if (typeof obj === "string") {
      return this.processTemplate(obj, context);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.processTemplateDeep(item, context));
    }
    
    if (obj && typeof obj === "object") {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.processTemplateDeep(value, context);
      }
      return result;
    }
    
    return obj;
  }

  // パスによる値の取得
  private getValueByPath(obj: any, path: string): any {
    const parts = path.split(".");
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  // 遅延関数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// シングルトンインスタンス
let executorInstance: ActionExecutor | null = null;

export function getActionExecutor(): ActionExecutor {
  if (!executorInstance) {
    executorInstance = new ActionExecutor();
  }
  return executorInstance;
}

// アクション定義のバリデーション
export const ActionDefinitionSchema = z.object({
  type: z.enum(["api_call", "storage", "navigation", "custom"]),
  config: z.record(z.any()),
  retryConfig: z.object({
    maxAttempts: z.number().optional(),
    delayMs: z.number().optional(),
    backoffMultiplier: z.number().optional()
  }).optional()
});

// ヘルパー関数：アクション定義の作成
export function createAction(
  type: ActionDefinition["type"],
  config: Record<string, any>,
  retryConfig?: ActionDefinition["retryConfig"]
): ActionDefinition {
  return {
    type,
    config,
    retryConfig
  };
}