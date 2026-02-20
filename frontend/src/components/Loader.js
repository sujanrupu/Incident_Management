export default function Loader() {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-3 text-yellow-400 font-medium">Submitting...</span>
    </div>
  );
}
