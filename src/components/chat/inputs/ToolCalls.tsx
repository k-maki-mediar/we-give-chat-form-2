"use client";
import { useEffect, useState } from "react";
import { InputComponentProps } from "../factory";

const ToolCalls = ({ step, onSubmit, context }: InputComponentProps) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const executeTools = async () => {
      if (isExecuting) return;
      
      setIsExecuting(true);
      setError(null);

      try {
        // tool_calls の実行をシミュレート
        if (step.tool_calls && Array.isArray(step.tool_calls)) {
          for (const toolCall of step.tool_calls) {
            // 実際のツール実行ロジックはここに実装
            console.log("Executing tool:", toolCall);
            
            // 仮の実行時間
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // ツール実行完了後、結果を返す
        // donation_welcomeの場合は、conditionsに基づいて遷移するので、適切な値を返す
        const toolResult = { completed: true };
        onSubmit(toolResult, "tool_complete");
      } catch (err) {
        setError(err instanceof Error ? err.message : "ツールの実行に失敗しました");
      } finally {
        setIsExecuting(false);
      }
    };

    executeTools();
  }, [step.tool_calls, onSubmit, isExecuting]);

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (isExecuting) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>処理中...</p>
      </div>
    );
  }

  return null;
};

export default ToolCalls;