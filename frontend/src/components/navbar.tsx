import Link from 'next/link';
import { cn } from '@/lib/utils';

import { Search } from '@/components/search';
import { UserNav } from '@/components/user-nav';
import { TeamSwitcher } from '@/components/team-switcher';
import { MainNav } from '@/components/main-nav';

interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
    items: string[],
    onSelect: (selectedValue: any) => void,
};

export function Navbar({
    className,
    items,
    onSelect,
    ...props
}: NavbarProps) {
    return (
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-6 w-6"
                >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <TeamSwitcher items={items} onSelect={onSelect}/>
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <Search />
              <UserNav />
            </div>
          </div>
        </div>
    );
}