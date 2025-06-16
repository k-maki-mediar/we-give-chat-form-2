import { notFound } from "next/navigation";
import { getFormContext } from "@/lib/data/getFormContext";
import ChatEntry from "@/components/chat-entry";

type Props = { params: { formId: string } };

export default async function Page({ params }: Props) {
    const ctx = await getFormContext(params.formId);

    if (!ctx) notFound(); // 404 ページへ

    return (
        <ChatEntry
            config={ctx.cfg}
            flowDef={ctx.flowDef}
            beneficiaries={ctx.beneficiaries}
        />
    );
}

export const revalidate = 30; // 30 秒ごとに ISR

// import { prisma } from "@/lib/prisma";
// import ChatEntry from "@/components/chat-entry";

// export default async function Page({ params }: { params: Promise<{ formId: string }> }) {
//     const { formId } = await params;

//     const cfg = await prisma.chatFormConfig.findUnique({
//         where: { formId: formId, isActive: true },
//         include: { organization: true },
//     });

//     if (!cfg) {
//         // Next.js 14 の notFound()
//         return <h1>フォームが見つかりません</h1>;
//     }

//     // Decimal型を文字列に変換（null安全性を考慮）
//     const serializedConfig = {
//         ...cfg,
//         organization: {
//             ...cfg.organization,
//             minimumIndirectCost: cfg.organization.minimumIndirectCost?.toString() || '0',
//             indirectCostRatio: cfg.organization.indirectCostRatio?.toString() || '0',
//             currentIndirectCost: cfg.organization.currentIndirectCost?.toString() || '0',
//             highDonationThreshold: cfg.organization.highDonationThreshold?.toString() || '0',
//         }
//     };

//     return <ChatEntry config={serializedConfig} />;
// }
