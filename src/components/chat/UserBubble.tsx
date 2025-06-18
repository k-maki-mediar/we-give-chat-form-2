export default function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-blue-600 rounded-lg p-3">
        <p className="text-white whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}