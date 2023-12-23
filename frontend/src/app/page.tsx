'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Dashboard } from '@/components/dashboard';
import { Chart } from '@/lib/types';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboards, setDashboards] = useState(null);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
  const { toast } = useToast();

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
    <main className="flex min-h-screen flex-col justify-between p-12">
      {selectedDashboard ?
        <Dashboard 
          name={selectedDashboard}
          // containerStyle={{ backgroundColor: 'lightskyblue'}} // FOR DEMONSTRATION
          containerStyle={{}}
          onClickDashboardItem={(dashboardItem) => {
            toast({
              title: "You've selected a new chart",
              description: `${dashboardItem.name}`,
            });
          }}
        />
        :
        ''
      }
      <Toaster />
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
