export default function BotBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] bg-gray-100 rounded-lg p-3">
        <p className="text-gray-800 whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}