"use client";

import React, { useState, useEffect } from "react";
import { getComponentRegistry } from "./registry";
import { validateValue, ValidationRule, ValidationError } from "@/lib/flow/validator";
import { getOptionLoader, DynamicOptionsConfig } from "@/lib/flow/optionLoader";

// 汎用的なプロップス型定義
export interface InputComponentProps {
  step: any;
  onSubmit: (value: any, label?: string) => void;
  context?: Record<string, any>;
  validationErrors?: ValidationError[];
  onValidate?: (value: any) => ValidationError[] | undefined;
}

// バリデーション付きラッパーコンポーネント
function ValidatedComponent({ 
  Component, 
  step, 
  onSubmit, 
  context 
}: {
  Component: React.ComponentType<InputComponentProps>;
  step: any;
  onSubmit: (value: any, label?: string) => void;
  context?: Record<string, any>;
}) {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [dynamicOptions, setDynamicOptions] = useState<any[] | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // 動的オプションの読み込み
  useEffect(() => {
    if (step.dynamicOptions) {
      const loadOptions = async () => {
        setIsLoadingOptions(true);
        try {
          const loader = getOptionLoader();
          const options = await loader.loadOptions(
            step.dynamicOptions as DynamicOptionsConfig,
            {
              responses: context || {},
              toolResults: {},
              metadata: {}
            }
          );
          setDynamicOptions(options);
        } catch (error) {
          console.error("Failed to load dynamic options:", error);
          setDynamicOptions([]);
        } finally {
          setIsLoadingOptions(false);
        }
      };
      
      loadOptions();
    }
  }, [step.dynamicOptions, context]);

  const handleValidate = (value: any): ValidationError[] | undefined => {
    if (!step.validation || !Array.isArray(step.validation)) {
      return undefined;
    }

    const rules = step.validation as ValidationRule[];
    const result = validateValue(value, rules, {
      responses: context || {},
      toolResults: {},
      metadata: {}
    });

    return result.errors;
  };

  const handleSubmit = (value: any, label?: string) => {
    const errors = handleValidate(value);
    
    if (errors && errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    onSubmit(value, label);
  };

  // 動的オプションが設定されている場合は、それを使用
  const stepWithDynamicOptions = dynamicOptions ? {
    ...step,
    options: dynamicOptions
  } : step;

  if (isLoadingOptions) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>オプションを読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      <Component 
        step={stepWithDynamicOptions} 
        onSubmit={handleSubmit} 
        context={context}
        validationErrors={validationErrors}
        onValidate={handleValidate}
      />
      {validationErrors.length > 0 && (
        <div className="mt-2 space-y-1">
          {validationErrors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error.message}
            </p>
          ))}
        </div>
      )}
    </>
  );
}

// UI Factory のメインコンポーネント
export function UIFactory({ step, onSubmit, context }: InputComponentProps) {
  const registry = getComponentRegistry();
  const Component = registry[step.type];

  if (!Component) {
    // 未登録のタイプの場合のフォールバック
    if (process.env.NODE_ENV === "development") {
      console.warn(`No component registered for type: ${step.type}`);
    }
    return (
      <div className="p-4 text-center text-gray-500">
        <p>未対応のステップタイプ: {step.type}</p>
      </div>
    );
  }

  // バリデーションまたは動的オプションがある場合はラッパーを使用
  if ((step.validation && Array.isArray(step.validation)) || step.dynamicOptions) {
    return (
      <ValidatedComponent
        Component={Component}
        step={step}
        onSubmit={onSubmit}
        context={context}
      />
    );
  }

  // バリデーションも動的オプションもない場合は直接レンダリング
  return <Component step={step} onSubmit={onSubmit} context={context} />;
}

// エクスポート
export default UIFactory;