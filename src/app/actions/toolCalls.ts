"use server";
import { prisma } from "@/lib/prisma";
import { createDonation } from "@/lib/admin-api";

export async function toolCalls(
    action: string,
    params: Record<string, any>
) {
    switch (action) {
        case "saveDonation":
            return await createDonation(params);
        case "getBeneficiaries":
            return await prisma.beneficiary.findMany({
                where: { organizationId: +params.organizationId, status: "AVAILABLE" },
                select: { id: true, name: true },
            });
        // …他 action
        default:
            throw new Error("unknown action");
    }
}
