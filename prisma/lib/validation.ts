import { z } from 'zod';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export function parseOr400<T extends z.ZodTypeAny>(schema: T, data: unknown) {
    const result = schema.safeParse(data);
    if (!result.success) {
        logger.warn('Validation failed', { issues: result.error.issues });
        throw new Response(JSON.stringify({ error: 'Invalid Request' }), { status: 400 });
    }
    return result.data as z.infer<T>;
}
