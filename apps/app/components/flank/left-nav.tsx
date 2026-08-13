import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Target, Plug2, Settings } from 'lucide-react';

interface LeftNavProps {
  workspaceSlug: string;
}

const navItems = [
  { href: '', label: 'Workspace Home', icon: Home },
  { href: 'targets', label: 'Targets', icon: Target },
  { href: 'integrations', label: 'Integrations', icon: Plug2 },
  { href: 'settings', label: 'Settings', icon: Settings },
];

export function LeftNav({ workspaceSlug }: LeftNavProps) {
  const pathname = usePathname();
  
  return (
    <nav className="flex w-56 flex-col border-r bg-card">
      <div className="flex-1 overflow-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const href = `/${workspaceSlug}/${item.href}`;
            const isActive = pathname === href || (item.href === '' && pathname === `/${workspaceSlug}`);
            
            return (
              <li key={item.href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
