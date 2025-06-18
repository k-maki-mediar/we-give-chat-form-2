import { z } from "zod";
import { evaluateCondition, EvaluationContext } from "./evaluator";

// バリデーション結果の型定義
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

// バリデーションルールの型定義
export interface ValidationRule {
  type: "required" | "pattern" | "length" | "range" | "custom" | "expression";
  message?: string;
  // パラメータは型によって異なる
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  expression?: string; // カスタム式
  errorMessage?: string;
}

// 標準バリデーター
const validators = {
  // 必須チェック
  required: (value: any, rule: ValidationRule): ValidationResult => {
    const isValid = value !== null && value !== undefined && value !== "";
    return {
      valid: isValid,
      errors: isValid ? undefined : [{
        message: rule.message || "この項目は必須です"
      }]
    };
  },

  // パターンマッチング
  pattern: (value: any, rule: ValidationRule): ValidationResult => {
    if (!rule.pattern) {
      return { valid: true };
    }
    const regex = new RegExp(rule.pattern);
    const isValid = regex.test(String(value));
    return {
      valid: isValid,
      errors: isValid ? undefined : [{
        message: rule.message || "入力形式が正しくありません"
      }]
    };
  },

  // 文字列長チェック
  length: (value: any, rule: ValidationRule): ValidationResult => {
    const str = String(value);
    const errors: ValidationError[] = [];
    
    if (rule.minLength !== undefined && str.length < rule.minLength) {
      errors.push({
        message: rule.message || `${rule.minLength}文字以上で入力してください`
      });
    }
    
    if (rule.maxLength !== undefined && str.length > rule.maxLength) {
      errors.push({
        message: rule.message || `${rule.maxLength}文字以内で入力してください`
      });
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  // 数値範囲チェック
  range: (value: any, rule: ValidationRule): ValidationResult => {
    const num = Number(value);
    const errors: ValidationError[] = [];
    
    if (isNaN(num)) {
      errors.push({
        message: "数値を入力してください"
      });
    } else {
      if (rule.min !== undefined && num < rule.min) {
        errors.push({
          message: rule.message || `${rule.min}以上の値を入力してください`
        });
      }
      
      if (rule.max !== undefined && num > rule.max) {
        errors.push({
          message: rule.message || `${rule.max}以下の値を入力してください`
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  // カスタム式評価
  expression: (value: any, rule: ValidationRule, context?: EvaluationContext): ValidationResult => {
    if (!rule.expression) {
      return { valid: true };
    }

    // 評価コンテキストに現在の値を追加
    const evalContext: EvaluationContext = {
      ...context,
      currentValue: value,
      responses: context?.responses || {},
      toolResults: context?.toolResults || {},
      metadata: context?.metadata || {}
    };

    const result = evaluateCondition(rule.expression, evalContext);
    
    if (!result.success) {
      return {
        valid: false,
        errors: [{
          message: rule.errorMessage || `バリデーションエラー: ${result.error}`
        }]
      };
    }

    const isValid = !!result.value;
    return {
      valid: isValid,
      errors: isValid ? undefined : [{
        message: rule.errorMessage || rule.message || "入力値が条件を満たしていません"
      }]
    };
  },

  // カスタムバリデーター（将来の拡張用）
  custom: (value: any, rule: ValidationRule): ValidationResult => {
    // カスタムバリデーションロジックのプレースホルダー
    return { valid: true };
  }
};

// 値のバリデーション実行
export function validateValue(
  value: any,
  rules: ValidationRule[],
  context?: EvaluationContext
): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const rule of rules) {
    const validator = validators[rule.type];
    if (!validator) {
      console.warn(`Unknown validation type: ${rule.type}`);
      continue;
    }

    const result = validator(value, rule, context);
    if (!result.valid && result.errors) {
      allErrors.push(...result.errors);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors.length > 0 ? allErrors : undefined
  };
}

// 複数フィールドのバリデーション
export function validateFields(
  values: Record<string, any>,
  fieldRules: Record<string, ValidationRule[]>,
  context?: EvaluationContext
): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(fieldRules)) {
    const value = values[field];
    const result = validateValue(value, rules, context);
    
    if (!result.valid && result.errors) {
      // フィールド名を追加
      const fieldErrors = result.errors.map(error => ({
        ...error,
        field
      }));
      allErrors.push(...fieldErrors);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors.length > 0 ? allErrors : undefined
  };
}

// 一般的なバリデーションルールのプリセット
export const commonRules = {
  email: (): ValidationRule => ({
    type: "pattern",
    pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    message: "有効なメールアドレスを入力してください"
  }),

  phone: (): ValidationRule => ({
    type: "pattern",
    pattern: "^[0-9-]+$",
    message: "有効な電話番号を入力してください"
  }),

  url: (): ValidationRule => ({
    type: "pattern",
    pattern: "^https?://[^\\s]+$",
    message: "有効なURLを入力してください"
  }),

  number: (): ValidationRule => ({
    type: "pattern",
    pattern: "^[0-9]+$",
    message: "数値を入力してください"
  }),

  positiveNumber: (): ValidationRule => ({
    type: "expression",
    expression: "currentValue > 0",
    message: "0より大きい数値を入力してください"
  })
};

// Zodスキーマからバリデーションルールへの変換（互換性のため）
export function fromZodSchema(schema: z.ZodSchema<any>): ValidationRule[] {
  // 簡易実装 - 必要に応じて拡張
  const rules: ValidationRule[] = [];
  
  // Zodのスキーマ情報から基本的なルールを抽出
  if (schema instanceof z.ZodString) {
    rules.push({ type: "required" });
  } else if (schema instanceof z.ZodNumber) {
    rules.push({ type: "pattern", pattern: "^[0-9]+$" });
  }
  
  return rules;
}