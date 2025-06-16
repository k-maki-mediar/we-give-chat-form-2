"use client";

export default function Error({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="p-6 text-center">
      <h2 className="text-red-600 text-lg font-semibold mb-2">エラーが発生しました</h2>
      <p>{error.message}</p>
    </div>
  );
}


// "use client";

// export default function Error({
//   error,
//   reset,
// }: {
//   error: Error & { digest?: string };
//   reset: () => void;
// }) {
//   return (
//     <div className="flex min-h-screen items-center justify-center">
//       <div className="text-center">
//         <h2 className="text-xl font-semibold mb-4">エラーが発生しました</h2>
//         <p className="text-gray-600 mb-4">{error.message}</p>
//         <button
//           onClick={reset}
//           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//         >
//           再試行
//         </button>
//       </div>
//     </div>
//   );
// }