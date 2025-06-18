import { ComponentType } from "react";
import { InputComponentProps } from "./index";

// 既存のコンポーネントをインポート
import ButtonSelect from "../inputs/ButtonSelect";
import TextInput from "../inputs/TextInput";
import AmountInput from "../inputs/AmountInput";
import SliderSelect from "../inputs/SliderSelect";
import MessageDisplay from "../inputs/MessageDisplay";
import ToolCalls from "../inputs/ToolCalls";

// コンポーネントレジストリの型定義
type ComponentRegistry = Record<string, ComponentType<InputComponentProps>>;

// プライベートなレジストリ
let componentRegistry: ComponentRegistry = {};

// 初期化フラグ
let isInitialized = false;

// レジストリの初期化
function initializeRegistry() {
  if (isInitialized) return;

  // 基本コンポーネントの登録
  registerComponent("button_select", ButtonSelect as any);
  registerComponent("text_input", TextInput as any);
  registerComponent("amount_input", AmountInput as any);
  registerComponent("slider_select", SliderSelect as any);
  
  // メッセージタイプ用のコンポーネントを登録
  registerComponent("message", MessageDisplay as any);
  registerComponent("tool_calls", ToolCalls as any);

  isInitialized = true;
}

// コンポーネントの登録関数
export function registerComponent(
  type: string,
  component: ComponentType<InputComponentProps>
) {
  componentRegistry[type] = component;
  
  if (process.env.NODE_ENV === "development") {
    console.log(`Registered component for type: ${type}`);
  }
}

// 複数コンポーネントの一括登録
export function registerComponents(
  components: Record<string, ComponentType<InputComponentProps>>
) {
  Object.entries(components).forEach(([type, component]) => {
    registerComponent(type, component);
  });
}

// コンポーネントの取得
export function getComponent(type: string): ComponentType<InputComponentProps> | undefined {
  initializeRegistry();
  return componentRegistry[type];
}

// レジストリ全体の取得
export function getComponentRegistry(): ComponentRegistry {
  initializeRegistry();
  return { ...componentRegistry };
}

// 登録されているタイプの一覧取得
export function getRegisteredTypes(): string[] {
  initializeRegistry();
  return Object.keys(componentRegistry);
}

// コンポーネントの登録解除（主にテスト用）
export function unregisterComponent(type: string) {
  delete componentRegistry[type];
}

// レジストリのリセット（主にテスト用）
export function resetRegistry() {
  componentRegistry = {};
  isInitialized = false;
}