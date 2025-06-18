"use client";
import { useSelector } from "@xstate/react";
import UIFactory from "./factory";

export default function InputComposer({ 
  service, 
  onSend,
  flowSteps
}: { 
  service: any;
  onSend: (text: string, value: any, optionIndex?: number) => void;
  flowSteps: any;
}) {
    const state = useSelector(service, (s: any) => s);
    
    // デバッグ情報
    if (process.env.NODE_ENV === 'development') {
        console.log("InputComposer state:", {
            hasState: !!state,
            stateValue: state?.value,
            hasFlowSteps: !!flowSteps
        });
    }
    
    // 状態が初期化されていない場合のガード
    if (!state || !state.value || !flowSteps) return null;
    
    // フローステップから現在のステップを取得
    const step = flowSteps[state.value];
    
    if (process.env.NODE_ENV === 'development') {
        console.log("InputComposer step:", {
            hasStep: !!step,
            stepType: step?.type,
            stepOptions: step?.options
        });
    }

    if (!step) return null;

    // UI Factory を使用して適切なコンポーネントをレンダリング
    return (
        <UIFactory 
            step={step} 
            onSubmit={(value, label) => {
                // labelがある場合はそれを使用、なければvalueを文字列化
                const displayText = label || String(value);
                onSend(displayText, value);
            }}
            context={state.context}
        />
    );
}
