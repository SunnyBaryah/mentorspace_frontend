export default function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <p className="font-semibold text-xl">{label}:</p>
      <p className="text-xl font-light text-gray-200">{value}</p>
    </div>
  );
}
