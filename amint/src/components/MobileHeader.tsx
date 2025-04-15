// src/components/MobileHeader.tsx
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  onToggleSidebar: () => void;
}

export function MobileHeader({ title, onToggleSidebar }: MobileHeaderProps) {
  return (
    // This header is ONLY visible on small screens (lg:hidden)
    <div className="flex items-center p-2 border-b border-border bg-background lg:hidden flex-shrink-0 h-14">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="mr-2"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold truncate"></h1>
    </div>
  );
}