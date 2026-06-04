'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabBarProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
  className?: string;
}

export default function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  const currentTab = tabs[activeTab] ?? tabs[0];

  return (
    <Tabs value={currentTab} onValueChange={(value) => onTabChange(tabs.findIndex((tab) => tab === value))} className={className}>
      <TabsList className="h-auto w-full gap-1.5 rounded-2xl border border-input bg-card p-1.5">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="flex-1 rounded-xl border border-transparent px-3 py-2.5 text-[13px] font-bold text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary"
          >
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
