import { createMachine } from 'xstate';
import { z } from 'zod';

// �����n�����gs0k��	
const FlowSchema = z.object({
    version: z.string(),
    flow: z.object({
        initialStep: z.string(),
        steps: z.record(z.any()),
    }),
});

// ���������WfXState޷�k	�
export function parseFlow(flowDef: unknown) {
    // zodg�������
    const parsed = FlowSchema.parse(flowDef);
    
    // !Xj����޷��Y�g�Œ�5	
    return createMachine({
        id: 'chatFlow',
        initial: parsed.flow.initialStep,
        states: {
            [parsed.flow.initialStep]: {
                on: {
                    NEXT: 'end',
                },
            },
            end: {
                type: 'final',
            },
        },
    });
}

// �������n����g�5	
export type FlowStep = {
    message: string;
    type: string;
    nextStep?: string;
};