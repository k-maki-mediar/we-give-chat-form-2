import { createMachine } from "xstate";
import { z } from "zod";

const StepSchema = z.object({
  id: z.string(),
  type: z.enum(["MESSAGE", "INPUT_AMOUNT", "SELECT_BENEFICIARY", "CONFIRM"]),
  next: z.string().optional(),
  // 追加フィールド...
});

export function buildMachine(def: any) {
  const parsed = z.array(StepSchema).parse(def);
  const states = Object.fromEntries(
    parsed.map((s) => [
      s.id,
      {
        on: { NEXT: s.next ?? "end" },
        meta: { step: s },      // UI レンダリングに使う
      },
    ]),
  );
  return createMachine({
    id: "donationFlow",
    initial: parsed[0].id,
    states,
  });
}
