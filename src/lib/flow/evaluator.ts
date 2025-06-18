import { Parser } from "expr-eval";

// 安全な評価のためのカスタムパーサー設定
const safeParser = new Parser();

// コンテキストの型定義
export interface EvaluationContext {
  responses: Record<string, any>;
  toolResults?: Record<string, any>;
  metadata?: Record<string, any>;
  // ユーザー定義の追加コンテキスト
  [key: string]: any;
}

// 条件式の評価結果
export interface EvaluationResult {
  success: boolean;
  value: any;
  error?: string;
}

// 条件式を安全に評価する関数
export function evaluateCondition(
  expression: string,
  context: EvaluationContext
): EvaluationResult {
  try {
    // 式をパース
    const expr = safeParser.parse(expression);
    
    // コンテキストで評価
    const value = expr.evaluate(context);
    
    return {
      success: true,
      value: value
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Condition evaluation error:', error);
    }
    
    return {
      success: false,
      value: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 複数の条件を評価（AND条件）
export function evaluateAllConditions(
  conditions: string[],
  context: EvaluationContext
): boolean {
  return conditions.every(condition => {
    const result = evaluateCondition(condition, context);
    return result.success && result.value;
  });
}

// 複数の条件を評価（OR条件）
export function evaluateAnyCondition(
  conditions: string[],
  context: EvaluationContext
): boolean {
  return conditions.some(condition => {
    const result = evaluateCondition(condition, context);
    return result.success && result.value;
  });
}

// 優先順位付き条件の評価
export interface PrioritizedCondition {
  expression: string;
  priority?: number;
  nextStep: string;
}

export function evaluatePrioritizedConditions(
  conditions: PrioritizedCondition[],
  context: EvaluationContext
): string | null {
  // 優先順位でソート（降順）
  const sortedConditions = [...conditions].sort((a, b) => 
    (b.priority || 0) - (a.priority || 0)
  );
  
  // 最初にマッチした条件のnextStepを返す
  for (const condition of sortedConditions) {
    const result = evaluateCondition(condition.expression, context);
    if (result.success && result.value) {
      return condition.nextStep;
    }
  }
  
  return null;
}

// ヘルパー関数：値の存在チェック
export function hasValue(context: EvaluationContext, path: string): boolean {
  const parts = path.split('.');
  let current: any = context;
  
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return false;
    }
    current = current[part];
  }
  
  return current !== undefined && current !== null;
}

// ヘルパー関数：値の取得
export function getValue(context: EvaluationContext, path: string, defaultValue?: any): any {
  const parts = path.split('.');
  let current: any = context;
  
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[part];
  }
  
  return current !== undefined ? current : defaultValue;
}

// テンプレート文字列の評価
export function evaluateTemplate(template: string, context: EvaluationContext): string {
  return template.replace(/\${([^}]+)}/g, (match, expression) => {
    const result = evaluateCondition(expression, context);
    return result.success ? String(result.value) : match;
  });
}