'use client';

import { useEffect, useState } from 'react';

import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
 
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
    className?: string;
    onChange: (selectedDateRange: DateRange) => void;
    dateRange?: DateRange;
}

export function DateRangePicker({
    className,
    onChange,
    dateRange,
  }: DateRangePickerProps) {
    const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(
      dateRange || 
    {
      from: new Date(2023, 0, 1),
      to: addDays(new Date(2023, 11, 31), 0),
    })

    const handleDateChange = (newDate: DateRange) => {
      setSelectedDateRange(newDate);
      if (onChange) {
          onChange(newDate);
      }
    }

    useEffect(() => {
      // Reflect parent's update to dateRange
      if (dateRange && (!selectedDateRange || dateRange !== selectedDateRange)) {
        handleDateChange(dateRange);
      }
    }, [dateRange, selectedDateRange]);

    if (!selectedDateRange) {
      return null; // Early return if no date range
    }
   
    return (
      <div className={cn("grid gap-2", className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !selectedDateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDateRange?.from ? (
                selectedDateRange.to ? (
                  <>
                    {format(selectedDateRange.from, "LLL dd, y")} -{" "}
                    {format(selectedDateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(selectedDateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={selectedDateRange?.from}
              selected={selectedDateRange}
              onSelect={handleDateChange as any}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  }
