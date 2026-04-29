'use client';

interface TabBarProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex gap-1.5 bg-[var(--brand-faint)] p-1.5 rounded-xl">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => onTabChange(i)}
          className={`
            flex-1 py-2.5 px-3 rounded-lg text-[13px] font-bold transition-all duration-300
            ${i === activeTab
              ? 'bg-[var(--brand)] text-white shadow-sm'
              : 'text-[var(--brand)]/60 hover:text-[var(--brand)]'
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
