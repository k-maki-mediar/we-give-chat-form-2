"use client";

import { useState } from "react";

interface Props {
    config: {
        id: string;
        title: string;
        organizationId: number;
        organization: {
            name: string;
            isBeneficiaryFundingOpen: boolean;
        };
    };
    flowDef?: any;  // 後でzodで型付け
    beneficiaries?: { id: number; name: string }[];
}

export default function ChatEntry({ config, flowDef, beneficiaries }: Props) {
    const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
        { role: "bot", text: "こんにちは！寄付についてご案内します。" },
    ]);

    return (
        <div className="mx-auto max-w-lg p-4">
            <h1 className="text-xl font-semibold mb-4">{config.title}</h1>
            
            {/* デバッグ情報（開発時のみ表示） */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-2 bg-gray-100 text-xs">
                    <p>組織名: {config.organization.name}</p>
                    <p>受益者への寄付: {config.organization.isBeneficiaryFundingOpen ? '受付中' : '停止中'}</p>
                    <p>フロー: {flowDef ? `v${flowDef.version}` : '未設定'}</p>
                    <p>受益者数: {beneficiaries?.length || 0}</p>
                </div>
            )}
            
            <div className="space-y-2 mb-4">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`rounded p-2 ${m.role === "bot" ? "bg-gray-200" : "bg-blue-100 text-right"
                            }`}
                    >
                        {m.text}
                    </div>
                ))}
            </div>
            <InputBox onSend={(txt) => setMessages([...messages, { role: "user", text: txt }])} />
        </div>
    );
}

function InputBox({ onSend }: { onSend: (t: string) => void }) {
    const [v, setV] = useState("");
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (v.trim()) {
                    onSend(v.trim());
                    setV("");
                }
            }}
            className="flex gap-2"
        >
            <input
                value={v}
                onChange={(e) => setV(e.target.value)}
                className="flex-1 border rounded px-2 py-1"
                placeholder="メッセージを入力"
            />
            <button className="px-3 py-1 bg-blue-600 text-white rounded">
                送信
            </button>
        </form>
    );
}
