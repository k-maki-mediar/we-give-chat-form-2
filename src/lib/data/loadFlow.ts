// src/lib/data/loadFlow.ts
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const StepSchema = z.object({
    message: z.string().optional(),
    type: z.string(),               // 動的 union に備えて string に
    options: z.union([z.array(z.any()), z.record(z.any())]).optional(), // 配列またはオブジェクトを許可
    conditions: z.array(z.any()).optional(),
    fallback: z.any().optional(),
    action: z.string().optional(),
    nextStep: z.string().optional(),
    isEnd: z.boolean().optional(),
    validation: z.union([z.array(z.any()), z.record(z.any())]).optional(), // バリデーションルールの配列またはオブジェクト
    dynamicOptions: z.any().optional() // 動的オプション設定
});

const FlowSchema = z.object({
    version: z.string(),
    flow: z.object({
        initialStep: z.string(),
        steps: z.record(StepSchema)
    })
});

export async function loadFlow(formId: string) {
    const cfg = await prisma.chatFormConfig.findUnique({ where: { formId } });
    let def = cfg?.flow;

    if (!def) {
        def = (await prisma.flowDefinition.findFirst({
            where: {
                organizationId: cfg!.organizationId,
                isActive: true,
            },
            orderBy: { createdAt: "desc" },
        }))?.definition;
    }
    if (!def) throw new Error("flow not found");

    // デバッグ用にデータ構造を確認
    const flowData = def as any;
    if (process.env.NODE_ENV === 'development' && flowData?.flow?.steps) {
        const stepNames = Object.keys(flowData.flow.steps);
        console.log("Flow steps:", stepNames);
        console.log("Initial step:", flowData.flow.initialStep);
        
        // 各ステップの遷移先をチェック
        stepNames.forEach(stepName => {
            const step = flowData.flow.steps[stepName];
            const transitions: string[] = [];
            
            if (step.nextStep) transitions.push(step.nextStep);
            if (step.options && Array.isArray(step.options)) {
                step.options.forEach((opt: any) => {
                    if (opt.nextStep) transitions.push(opt.nextStep);
                    // オプション内のconditionsもチェック
                    if (opt.conditions && Array.isArray(opt.conditions)) {
                        opt.conditions.forEach((cond: any) => {
                            if (cond.nextStep) transitions.push(cond.nextStep);
                        });
                    }
                });
            }
            if (step.conditions && Array.isArray(step.conditions)) {
                step.conditions.forEach((cond: any) => {
                    if (cond.nextStep) transitions.push(cond.nextStep);
                });
            }
            
            // 特定のステップの詳細情報を出力
            if (stepName === "donation_balance") {
                console.log(`Step "donation_balance" full data:`, JSON.stringify(step, null, 2));
            }
            
            console.log(`Step "${stepName}" transitions:`, transitions);
        });
    }
    
    try {
        return FlowSchema.parse(def); // 型安全
    } catch (e) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Zod validation error:", e);
        }
        // エラー時はそのまま返す（一時的な対処）
        return def as any;
    }
}
