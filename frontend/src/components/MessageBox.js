export default function MessageBox({ type, message }) {
  if (!message) return null;

  const baseStyle = "p-4 rounded-lg mt-4 text-sm font-medium";

  const styles =
    type === "success"
      ? "bg-green-900/40 border border-green-500 text-green-400"
      : "bg-red-900/40 border border-red-500 text-red-400";

  return <div className={`${baseStyle} ${styles}`}>{message}</div>;
}
