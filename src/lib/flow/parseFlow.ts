import { createMachine } from 'xstate';
import { z } from 'zod';

// Õíüš©n¹­üÞŒgs0kš©	
const FlowSchema = z.object({
    version: z.string(),
    flow: z.object({
        initialStep: z.string(),
        steps: z.record(z.any()),
    }),
});

// Õíüš©’Ñü¹WfXStateÞ·ók	Û
export function parseFlow(flowDef: unknown) {
    // zodgÐêÇü·çó
    const parsed = FlowSchema.parse(flowDef);
    
    // !Xj¹ÆüÈÞ·ó’ÔYŒgŸÅ’á5	
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

// Õíü¹ÆÃ×n‹š©Œgá5	
export type FlowStep = {
    message: string;
    type: string;
    nextStep?: string;
};