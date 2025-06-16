import { prisma } from "@/lib/prisma";

export default async function Debug() {
    const userCount = await prisma.user.count();
    return <pre>{`users: ${userCount}`}</pre>;
}
