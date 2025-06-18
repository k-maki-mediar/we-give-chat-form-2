"use client";

import React from "react";
import { InputComponentProps } from "../factory";

// 基底コンポーネントのインターフェース
export interface BaseInputComponent<T = any> extends React.FC<InputComponentProps> {
  // 追加のメタデータを持たせることも可能
  displayName?: string;
  description?: string;
  validateStep?: (step: any) => boolean;
}

// 基底コンポーネントのヘルパー関数
export function createInputComponent<T = any>(
  component: React.FC<InputComponentProps>,
  metadata?: {
    displayName?: string;
    description?: string;
    validateStep?: (step: any) => boolean;
  }
): BaseInputComponent<T> {
  const baseComponent = component as BaseInputComponent<T>;
  
  if (metadata) {
    baseComponent.displayName = metadata.displayName;
    baseComponent.description = metadata.description;
    baseComponent.validateStep = metadata.validateStep;
  }
  
  return baseComponent;
}

// 共通のスタイルとユーティリティ
export const inputStyles = {
  container: "p-4 border-t",
  button: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
  buttonSecondary: "px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors",
  input: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
  label: "block text-sm font-medium text-gray-700 mb-1",
  error: "text-red-500 text-sm mt-1",
  helpText: "text-gray-500 text-sm mt-1"
};

// バリデーションエラーの表示コンポーネント
export function ValidationError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={inputStyles.error}>{message}</p>;
}

// ヘルプテキストの表示コンポーネント
export function HelpText({ text }: { text?: string }) {
  if (!text) return null;
  return <p className={inputStyles.helpText}>{text}</p>;
}

// 入力コンテナコンポーネント
export function InputContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${inputStyles.container} ${className}`}>
      {children}
    </div>
  );
}

// 汎用的なバリデーション関数
export const validators = {
  required: (value: any): string | undefined => {
    if (value === null || value === undefined || value === "") {
      return "この項目は必須です";
    }
    return undefined;
  },
  
  min: (min: number) => (value: any): string | undefined => {
    const num = Number(value);
    if (isNaN(num) || num < min) {
      return `${min}以上の値を入力してください`;
    }
    return undefined;
  },
  
  max: (max: number) => (value: any): string | undefined => {
    const num = Number(value);
    if (isNaN(num) || num > max) {
      return `${max}以下の値を入力してください`;
    }
    return undefined;
  },
  
  pattern: (pattern: RegExp, message: string) => (value: any): string | undefined => {
    if (!pattern.test(String(value))) {
      return message;
    }
    return undefined;
  }
};

// バリデーションを実行するヘルパー
export function runValidation(value: any, rules: Array<(value: any) => string | undefined>): string | undefined {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return undefined;
}