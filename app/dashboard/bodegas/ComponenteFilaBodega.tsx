'use client'
interface FilaProps {
  id: string; name: string; isMainInicial: boolean; disabled: boolean; onChange: (checked: boolean) => void
}
export default function ComponenteFilaBodega({ isMainInicial, disabled, onChange }: FilaProps) {
  return (
    <div className="flex justify-end items-center gap-3">
      <span className={`text-[10px] font-black uppercase tracking-widest ${isMainInicial ? 'text-amber-500' : 'text-slate-400'}`}>
        {isMainInicial ? 'Principal' : 'Secundaria'}
      </span>
      <input 
        type="checkbox" checked={isMainInicial} disabled={disabled} onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-[#001F3F] bg-slate-100 border-slate-300 rounded focus:ring-[#001F3F] cursor-pointer disabled:opacity-40 transition-all"
      />
    </div>
  )
}