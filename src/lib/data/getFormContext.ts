import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * formId からチャットフォーム表示に必要な全情報をまとめて取得
 * - 30秒 SWR キャッシュで高速化
 */
export const getFormContext = cache(async (formId: string) => {
    const cfg = await prisma.chatFormConfig.findUnique({
        where: { formId, isDeleted: false },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    isBeneficiaryFundingOpen: true,
                },
            },
        },
    });

    if (!cfg || !cfg.isActive) return null;

    // flow definition: Org 固有があれば優先、なければ cfg.flow
    const flowDef =
        (await prisma.flowDefinition.findFirst({
            where: {
                organizationId: cfg.organizationId,
                isActive: true,
            },
            orderBy: { createdAt: "desc" },
        }))?.definition ?? cfg.flow;

    // beneficiaries (表示ON かつ Org が寄付受付可)
    const beneficiaries =
        cfg.showBeneficiaries && cfg.organization.isBeneficiaryFundingOpen
            ? await prisma.beneficiary.findMany({
                where: {
                    organizationId: cfg.organizationId,
                    status: "AVAILABLE",
                    isDeleted: false,
                },
                select: { id: true, name: true },
            })
            : [];

    return {
        cfg,
        flowDef,
        beneficiaries,
    };
});
