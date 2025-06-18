// 動的オプション生成システム
import { evaluateCondition, EvaluationContext } from "./evaluator";

// オプション定義の型
export interface OptionDefinition {
  value: any;
  label: string;
  nextStep?: string;
  conditions?: Array<{
    expression: string;
    nextStep: string;
  }>;
  metadata?: Record<string, any>;
}

// 動的オプション設定の型
export interface DynamicOptionsConfig {
  source: "api" | "function" | "static";
  // API設定
  apiUrl?: string;
  apiMethod?: string;
  apiHeaders?: Record<string, string>;
  // 関数名（事前登録された関数）
  functionName?: string;
  // 静的オプション
  staticOptions?: OptionDefinition[];
  // フィルタリング条件
  filter?: string; // expr-eval式
  // 変換設定
  transform?: {
    valueField?: string;
    labelField?: string;
    metadataFields?: string[];
  };
  // キャッシュ設定
  cache?: {
    enabled: boolean;
    ttl?: number; // ミリ秒
    key?: string; // キャッシュキーのテンプレート
  };
}

// オプションローダークラス
export class OptionLoader {
  private cache: Map<string, { data: OptionDefinition[], timestamp: number }> = new Map();
  private functionRegistry: Map<string, (context: EvaluationContext) => Promise<any[]>> = new Map();

  // 関数の登録
  registerFunction(name: string, fn: (context: EvaluationContext) => Promise<any[]>) {
    this.functionRegistry.set(name, fn);
  }

  // オプションの読み込み
  async loadOptions(
    config: DynamicOptionsConfig,
    context: EvaluationContext
  ): Promise<OptionDefinition[]> {
    // キャッシュチェック
    if (config.cache?.enabled) {
      const cacheKey = this.generateCacheKey(config, context);
      const cached = this.cache.get(cacheKey);
      
      if (cached && config.cache.ttl) {
        const isExpired = Date.now() - cached.timestamp > config.cache.ttl;
        if (!isExpired) {
          return cached.data;
        }
      }
    }

    let options: OptionDefinition[] = [];

    // ソースに応じてオプションを取得
    switch (config.source) {
      case "static":
        options = config.staticOptions || [];
        break;
        
      case "api":
        options = await this.loadFromApi(config, context);
        break;
        
      case "function":
        options = await this.loadFromFunction(config, context);
        break;
    }

    // フィルタリング
    if (config.filter) {
      options = this.filterOptions(options, config.filter, context);
    }

    // キャッシュ保存
    if (config.cache?.enabled) {
      const cacheKey = this.generateCacheKey(config, context);
      this.cache.set(cacheKey, {
        data: options,
        timestamp: Date.now()
      });
    }

    return options;
  }

  // APIからのオプション読み込み
  private async loadFromApi(
    config: DynamicOptionsConfig,
    context: EvaluationContext
  ): Promise<OptionDefinition[]> {
    if (!config.apiUrl) {
      throw new Error("API URL is required for api source");
    }

    try {
      // URLのテンプレート処理
      const processedUrl = this.processTemplate(config.apiUrl, context);
      
      const response = await fetch(processedUrl, {
        method: config.apiMethod || "GET",
        headers: config.apiHeaders || {}
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // データ変換
      return this.transformData(data, config.transform);
    } catch (error: any) {
      console.error("Failed to load options from API:", error);
      return [];
    }
  }

  // 関数からのオプション読み込み
  private async loadFromFunction(
    config: DynamicOptionsConfig,
    context: EvaluationContext
  ): Promise<OptionDefinition[]> {
    if (!config.functionName) {
      throw new Error("Function name is required for function source");
    }

    const fn = this.functionRegistry.get(config.functionName);
    if (!fn) {
      throw new Error(`Function not found: ${config.functionName}`);
    }

    try {
      const data = await fn(context);
      return this.transformData(data, config.transform);
    } catch (error: any) {
      console.error("Failed to load options from function:", error);
      return [];
    }
  }

  // データ変換
  private transformData(
    data: any[],
    transform?: DynamicOptionsConfig["transform"]
  ): OptionDefinition[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(item => {
      if (transform) {
        const option: OptionDefinition = {
          value: transform.valueField ? item[transform.valueField] : item.value || item,
          label: transform.labelField ? item[transform.labelField] : item.label || String(item),
          nextStep: item.nextStep,
          conditions: item.conditions,
          metadata: {}
        };

        // メタデータフィールドの抽出
        if (transform.metadataFields) {
          transform.metadataFields.forEach(field => {
            if (field in item) {
              option.metadata![field] = item[field];
            }
          });
        }

        return option;
      }

      // 変換設定がない場合はそのまま使用
      return {
        value: item.value || item,
        label: item.label || String(item),
        nextStep: item.nextStep,
        conditions: item.conditions,
        metadata: item.metadata || {}
      };
    });
  }

  // オプションのフィルタリング
  private filterOptions(
    options: OptionDefinition[],
    filterExpression: string,
    context: EvaluationContext
  ): OptionDefinition[] {
    return options.filter(option => {
      const evalContext = {
        ...context,
        option: option,
        value: option.value,
        label: option.label,
        metadata: option.metadata
      };

      const result = evaluateCondition(filterExpression, evalContext);
      return result.success && result.value;
    });
  }

  // キャッシュキーの生成
  private generateCacheKey(
    config: DynamicOptionsConfig,
    context: EvaluationContext
  ): string {
    if (config.cache?.key) {
      return this.processTemplate(config.cache.key, context);
    }

    // デフォルトキー生成
    const parts: string[] = [config.source];
    
    if (config.apiUrl) {
      parts.push(this.processTemplate(config.apiUrl, context));
    }
    
    if (config.functionName) {
      parts.push(config.functionName);
    }
    
    return parts.join(":");
  }

  // テンプレート処理
  private processTemplate(template: string, context: EvaluationContext): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueByPath(context, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  // パスによる値取得
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

  // キャッシュクリア
  clearCache(pattern?: string) {
    if (pattern) {
      // パターンマッチングでクリア
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // 全クリア
      this.cache.clear();
    }
  }
}

// シングルトンインスタンス
let loaderInstance: OptionLoader | null = null;

export function getOptionLoader(): OptionLoader {
  if (!loaderInstance) {
    loaderInstance = new OptionLoader();
    registerDefaultFunctions(loaderInstance);
  }
  return loaderInstance;
}

// デフォルト関数の登録
function registerDefaultFunctions(loader: OptionLoader) {
  // 都道府県リスト
  loader.registerFunction("prefectures", async () => {
    return [
      { value: "01", label: "北海道" },
      { value: "02", label: "青森県" },
      { value: "03", label: "岩手県" },
      { value: "04", label: "宮城県" },
      { value: "05", label: "秋田県" },
      // ... 省略
    ];
  });

  // 年齢範囲
  loader.registerFunction("ageRanges", async () => {
    return [
      { value: "10-19", label: "10代" },
      { value: "20-29", label: "20代" },
      { value: "30-39", label: "30代" },
      { value: "40-49", label: "40代" },
      { value: "50-59", label: "50代" },
      { value: "60+", label: "60歳以上" },
    ];
  });
}