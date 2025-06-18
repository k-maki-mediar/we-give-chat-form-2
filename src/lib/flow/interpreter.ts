import { createMachine, assign } from "xstate";
import { StepSchema } from "@/lib/data/loadFlow";
import { z } from "zod";
import { evaluateCondition, EvaluationContext } from "./evaluator";

// StepSchemaから型を推論
type Step = z.infer<typeof StepSchema>;

// buildInvoke関数を実装
function buildInvoke(step: Step) {
    // アクションの実行
    if (step.action) {
        return {
            src: async (context: any, event: any, { input }: any) => {
                const { getActionExecutor } = await import("./executor");
                const executor = getActionExecutor();
                
                const executionContext = {
                    responses: context.responses || {},
                    toolResults: context.toolResults || {},
                    metadata: context.metadata || {},
                    currentStep: context.currentStep
                };
                
                // アクション定義を解析（JSONとして定義されている場合）
                let actionDef;
                if (typeof input.action === "string") {
                    try {
                        actionDef = JSON.parse(input.action);
                    } catch {
                        // 文字列の場合はAPI呼び出しと仮定
                        actionDef = {
                            type: "api_call",
                            config: { url: input.action }
                        };
                    }
                } else {
                    actionDef = input.action;
                }
                
                const result = await executor.execute(actionDef, executionContext);
                
                if (!result.success) {
                    throw new Error(result.error || "Action execution failed");
                }
                
                return result.data;
            },
            input: { action: step.action, step },
            onDone: {
                target: step.nextStep || undefined,
                actions: assign({
                    toolResults: ({ context, event }: any) => ({
                        ...context.toolResults,
                        [context.currentStep || "action"]: event.output
                    })
                })
            },
            onError: {
                actions: assign({
                    errors: ({ context, event }: any) => ({
                        ...context.errors,
                        [context.currentStep || "action"]: event.error.message
                    })
                })
            }
        };
    }
    return undefined;
}

// generateTransitions関数を実装（統一されたANSWERイベント用）
function generateTransitions(id: string, step: Step) {
    const transitions: any[] = [];

    // オプションがある場合の処理
    if (step.options && Array.isArray(step.options)) {
        step.options.forEach((option: any) => {
            // オプション内のconditionsをチェック
            if (option.conditions && Array.isArray(option.conditions)) {
                option.conditions.forEach((cond: any) => {
                    if (cond.nextStep) {
                        transitions.push({
                            guard: ({ context, event }: any) => event.value === option.value,
                            target: cond.nextStep,
                            actions: assign({
                                responses: ({ context, event }: any) => ({
                                    ...context.responses,
                                    [id]: event.value
                                }),
                                currentStep: () => cond.nextStep
                            })
                        });
                    }
                });
            } else if (option.nextStep) {
                // 単純なオプション遷移
                transitions.push({
                    guard: ({ context, event }: any) => event.value === option.value,
                    target: option.nextStep,
                    actions: assign({
                        responses: ({ context, event }: any) => ({
                            ...context.responses,
                            [id]: event.value
                        }),
                        currentStep: () => option.nextStep
                    })
                });
            }
        });
    }

    // 条件による分岐（expr-evalで評価）
    if (step.conditions && Array.isArray(step.conditions)) {
        step.conditions.forEach((condition: any) => {
            if (condition.nextStep && condition.expression) {
                transitions.push({
                    target: condition.nextStep,
                    guard: ({ context }: any) => {
                        const evalContext: EvaluationContext = {
                            responses: context.responses || {},
                            toolResults: context.toolResults || {},
                            metadata: context.metadata || {}
                        };
                        const result = evaluateCondition(condition.expression, evalContext);
                        return result.success && result.value;
                    },
                    actions: assign({
                        responses: ({ context, event }: any) => ({
                            ...context.responses,
                            [id]: event.value
                        }),
                        currentStep: () => condition.nextStep
                    })
                });
            }
        });
    }

    // デフォルトの遷移
    if (step.nextStep) {
        transitions.push({
            target: step.nextStep,
            actions: assign({
                responses: ({ context, event }: any) => ({
                    ...context.responses,
                    [id]: event.value
                }),
                currentStep: () => step.nextStep
            })
        });
    }

    return transitions;
}

// transitionMap関数を修正（統一されたイベント処理）
function transitionMap(id: string, step: Step) {
    const transitions: Record<string, any> = {};

    // メッセージタイプで nextStep がある場合（自動遷移）
    if (step.type === "message" && step.nextStep) {
        transitions.AUTO_ADVANCE = {
            target: step.nextStep,
            actions: assign({
                currentStep: () => step.nextStep
            })
        };
    }

    // tool_calls タイプの場合
    if (step.type === "tool_calls") {
        if (step.nextStep) {
            transitions.TOOL_COMPLETE = { 
                target: step.nextStep,
                actions: assign({
                    currentStep: () => step.nextStep
                })
            };
        } else {
            // nextStepがない場合でも、ANSWERイベントで遷移できるようにする
            const answerTransitions = generateTransitions(id, step);
            if (answerTransitions.length > 0) {
                transitions.TOOL_COMPLETE = answerTransitions;
            }
        }
    }

    // 統一されたANSWERイベント
    const answerTransitions = generateTransitions(id, step);
    if (answerTransitions.length > 0) {
        transitions.ANSWER = answerTransitions;
    }

    return transitions;
}

export function buildMachine(def: any) {
    const steps = def.flow.steps as Record<string, Step>;
    const states: Record<string, any> = {};
    const availableSteps = new Set(Object.keys(steps));

    // ステップ定義を作成
    for (const [id, step] of Object.entries(steps)) {
        states[id] = {
            meta: { step },
            invoke: buildInvoke(step),
            on: transitionMap(id, step),
            type: step.isEnd ? "final" : "atomic",
        };
    }
    
    if (process.env.NODE_ENV === 'development') {
        console.log("Building machine with states:", Object.keys(states));
        console.log("Initial state:", def.flow.initialStep);
        console.log("Initial state transitions:", states[def.flow.initialStep]?.on);
        
        // donation_balance の遷移を詳しく確認
        if (states.donation_balance) {
            console.log("donation_balance transitions before filtering:", states.donation_balance.on);
        }
    }

    // 無効な遷移をフィルタリング（配列形式の遷移も含む）
    for (const [id, state] of Object.entries(states)) {
        if (state.on) {
            for (const [event, transition] of Object.entries(state.on)) {
                if (Array.isArray(transition)) {
                    // 配列形式の遷移（ANSWERイベントなど）
                    state.on[event] = transition.filter((trans: any) => {
                        if (trans.target && !availableSteps.has(trans.target)) {
                            if (process.env.NODE_ENV === 'development') {
                                console.warn(`Removing invalid transition from "${id}" to "${trans.target}" - target state does not exist`);
                            }
                            return false;
                        }
                        return true;
                    });
                    // 空の配列になった場合は削除
                    if (state.on[event].length === 0) {
                        delete state.on[event];
                    }
                } else if (transition && typeof transition === 'object' && 'target' in transition) {
                    // 単一の遷移
                    const targetState = (transition as any).target;
                    if (targetState && !availableSteps.has(targetState)) {
                        if (process.env.NODE_ENV === 'development') {
                            console.warn(`Removing invalid transition from "${id}" to "${targetState}" - target state does not exist`);
                        }
                        delete state.on[event];
                    }
                }
            }
        }
    }

    // フィルタリング後の状態を確認
    if (process.env.NODE_ENV === 'development' && states.donation_balance) {
        console.log("donation_balance transitions after filtering:", states.donation_balance.on);
    }
    
    // 初期ステートが存在するか確認
    const initialStep = def.flow.initialStep || Object.keys(steps)[0];
    if (!availableSteps.has(initialStep)) {
        if (process.env.NODE_ENV === 'development') {
            console.error(`Initial step "${initialStep}" does not exist. Using first available step.`);
        }
    }

    const machine = createMachine({
        id: "chatFlow",
        initial: availableSteps.has(initialStep) ? initialStep : Array.from(availableSteps)[0],
        context: {
            responses: {},
            toolResults: {},
            errors: {},
            currentStep: availableSteps.has(initialStep) ? initialStep : Array.from(availableSteps)[0]
        },
        states,
    });
    
    if (process.env.NODE_ENV === 'development') {
        console.log("Created machine:", machine);
        console.log("Machine states:", machine.states);
    }
    
    return machine;
}
