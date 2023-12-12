import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useState } from 'react';

interface DropdownProps {
    options: any[];
    onSelect: (selectedValue: any) => void;
};

export function Dropdown({ options, onSelect }: DropdownProps) {
    const [value, setValue] = useState(options.slice(-1).toString());

    const handleSelect = (selectedValue: any) => {
        setValue(selectedValue);
        onSelect(selectedValue);
    };

    return (
      <Select
        // onValueChange={() => {}}
        onValueChange={(value) => handleSelect(value)}
        // defaultValue={options.slice(-1).toString()}
        // value={options.slice(-1).toString()}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={options.slice(-1)}/>
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
  
