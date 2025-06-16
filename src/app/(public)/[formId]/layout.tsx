export default function FormLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex justify-center bg-gray-50">
            <main className="w-full max-w-lg">{children}</main>
        </div>
    );
}
