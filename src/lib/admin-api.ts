export async function createDonation(input: any) {
    const res = await fetch(`${process.env.ADMIN_API_URL}/donations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ADMIN_API_KEY!,
        },
        body: JSON.stringify(input),
        next: { revalidate: 0 },          // SSR キャッシュしない
    });
    if (!res.ok) throw await res.json();
    return res.json();
}
