import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useState, useEffect } from 'react';

interface DropdownProps {
    options: any[];
    onSelect: (selectedValue: any) => void;
    value?: string;
    placeholder?: string;
};

export function Dropdown({ options, onSelect, value, placeholder }: DropdownProps) {
    const [selectedValue, setSelectedValue] = useState<string>(value || '');
    const [key, setKey] = useState<number>(+new Date());

    const handleSelect = (val: any) => {
        setSelectedValue(val);
        onSelect(val);
    };

    useEffect(() => {
      // // Reflect parent's update to dateRange
      if (value && (!selectedValue || value !== selectedValue)) {
        handleSelect(value);
        setKey(+new Date());
      }
    }, [value, selectedValue]);

    return (
      <Select
        key={key}
        // onValueChange={() => {}}
        onValueChange={(value) => handleSelect(value)}
        // defaultValue={options.slice(-1).toString()}
        // value={options.slice(-1).toString()}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={placeholder || 'Select'}/>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Options</SelectLabel>
            {options.map((option: any) => (
                <SelectItem
                    key={option}
                    value={option.toString()}
                    onSelect={() => handleSelect(option)}
                >
                    {option}
                </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }
  
