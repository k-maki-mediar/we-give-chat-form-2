"use client";
import { buildMachine } from "@/lib/flow/interpreter";
import { useActorRef } from "@xstate/react";
import InputComposer from "./InputComposer";
import { useEffect, useState, useMemo } from "react";
import { template } from "./utils";
import BotBubble from "./BotBubble";
import UserBubble from "./UserBubble";

export default function ChatWindow({ flow }: { flow: any }) {
    const machine = useMemo(() => buildMachine(flow), [flow]);
    const service = useActorRef(machine);
    const [messages, setMessages] = useState<{ sender: "bot" | "user"; text: string }[]>([]);
    
    // フローのステップ情報を保持
    const flowSteps = flow.flow.steps;
    
    // 初期ステップのメッセージを表示
    useEffect(() => {
        const initialStep = flow.flow.initialStep;
        const step = flow.flow.steps[initialStep];
        if (step?.message) {
            setMessages([{ sender: "bot", text: step.message }]);
        }
    }, [flow]);

    useEffect(() => {
        // 初期状態も含めて処理
        const sub = service.subscribe((state: any) => {
            // 状態が初期化されていない場合のガード
            if (!state.value) return;
            
            // フローステップから現在のステップを取得
            const step = flowSteps[state.value];
            
            if (step?.message && (state.changed || messages.length === 1)) {
                // 既に初期メッセージがある場合はスキップ
                if (messages.length === 1 && messages[0].text === step.message) return;
                
                setMessages((m) => [...m, { sender: "bot", text: template(step.message, state.context) }]);
                
                // メッセージタイプで nextStep がある場合、自動的に次へ進む
                if (step.type === "message" && step.nextStep) {
                    setTimeout(() => {
                        service.send({ type: "AUTO_ADVANCE" });
                    }, 1500);
                }
            }
        });
        return sub.unsubscribe;
    }, [service, messages.length, flowSteps]);

    const sendUserText = (text: string, value: any, optionIndex?: number) => {
        // 特殊なイベントの処理
        if (text === "auto_advance") {
            // メッセージタイプの自動遷移は既に上のuseEffectで処理されている
            return;
        }
        
        if (text === "tool_complete") {
            // tool_calls完了イベント
            // TOOL_COMPLETEではなくANSWERイベントとして送信（conditionsで遷移するため）
            service.send({ type: "ANSWER", value });
            return;
        }
        
        setMessages((m) => [...m, { sender: "user", text }]);
        
        // 統一されたANSWERイベントを送信
        service.send({ type: "ANSWER", value });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {messages.map((m, i) =>
                    m.sender === "bot" ? (
                        <BotBubble key={i} text={m.text} />
                    ) : (
                        <UserBubble key={i} text={m.text} />
                    ),
                )}
            </div>
            <InputComposer service={service} onSend={sendUserText} flowSteps={flowSteps} />
        </div>
    );
}
