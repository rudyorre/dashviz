'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from '@/components/search';
import { Navbar } from '@/components/navbar';
import { UserNav } from '@/components/user-nav';
import { Dashboard } from '@/components/dashboard';
import { Dropdown } from '@/components/dropdown';
import { Heading1 } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboards, setDashboards] = useState(null);
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetch('http://localhost:3001/fetch-dashboard-names');
      const json = await data.json();
      const names = json.map((obj: {name: string}) => (obj.name));
      setDashboards(names);
      setSelectedDashboard(names[0]);
    };

    if (dashboards == null) {
      fetchData(); 
    } else {
      setIsLoading(false);
    }
  }, [isLoading, dashboards, selectedDashboard]);

  return (<>
    <Navbar className='mx-6' items={dashboards ? dashboards : []} onSelect={setSelectedDashboard} />
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      
      <div className="flex items-center justify-between max-w-5xl w-full p-4 mx-auto font-mono text-sm">
        {/* <Dropdown
          options={dashboards ? dashboards : []}
          onSelect={setSelectedDashboard}
          placeholder={selectedDashboard ? selectedDashboard : ''} 
        /> */}
        
      </div>

      {selectedDashboard ?
        <Dashboard 
          name={selectedDashboard}
          containerStyle={{}}
          onClickDashboardItem={(dashboardItem) => {}}
        />
        :
        'LOADING'
      }

      <div className="mb-32 grid text-center lg:max-w-6xl lg:w-full lg:mb-0 lg:text-left">
        <div className="flex items-center justify-between max-w-5xl w-full p-4 mx-auto font-mono text-sm">
        <div>© 2023 Rudy Orre</div>
      
        <div className="flex items-center space-x-4">
            <Link href="https://linkedin.com/in/rudyorre" className="text-gray-500 hover:text-gray-700">Linkedin</Link>
            <Link href="https://github.com/rudyorre" className="text-gray-500 hover:text-gray-700">Github</Link>
            <Link href="https://rudyorre.com" className="text-gray-500 hover:text-gray-700">Personal</Link>
        </div>
       </div>
      </div>
    </main>
    </>
  )
}
