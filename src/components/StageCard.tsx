interface StageCardProps {
  stage: string;
  label: string;
  count: number;
  color: string;
  icon: string;
}

export default function StageCard({ label, count, color, icon }: StageCardProps) {
  return (
    <div className={`rounded-2xl p-3 flex flex-col items-center gap-1 ${color} shadow-sm`}>
      <span className="text-2xl">{icon}</span>
      <p className="text-xl font-extrabold leading-none">{count}</p>
      <p className="text-xs font-semibold">{label}</p>
    </div>
  );
}
