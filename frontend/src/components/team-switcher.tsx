"use client"

import * as React from "react"
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface TeamSwitcherProps extends PopoverTriggerProps {
    items: string[],
    onSelect: (selectedValue: any) => void,
};

export function TeamSwitcher({ className, items, onSelect }: TeamSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<string>('');

  React.useEffect(() => {
    if (selectedItem == '' && items.length > 0) {
        setSelectedItem(items[0]);
    }
    onSelect(selectedItem);
  }, [items, selectedItem]);

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a team"
            className={cn("w-[200px] justify-between", className)}
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={`https://avatars.jakerunzer.com/${selectedItem}Dashboard.png`}
              />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            {selectedItem}
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
                <CommandInput placeholder="Search team..." />
                <CommandEmpty>No team found.</CommandEmpty>
                <CommandGroup heading={'Dashboards'}>
                    {
                        items.map((dashboard) => (
                            <CommandItem
                                key={dashboard}
                                className="text-sm"
                                onSelect={() => {
                                    setSelectedItem(dashboard);
                                    setOpen(false);
                                }}
                            >
                                <Avatar className="mr-2 h-5 w-5">
                                <AvatarImage
                                src={`https://avatars.jakerunzer.com/${dashboard}Dashboard.png`}
                                />
                                <AvatarFallback></AvatarFallback>
                            </Avatar>
                            {dashboard}
                            <CheckIcon
                                className={cn(
                                "ml-auto h-4 w-4",
                                selectedItem === dashboard
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                            />
                            </CommandItem>
                        ))
                    }
                </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setShowNewTeamDialog(true)
                    }}
                  >
                    <PlusCircledIcon className="mr-2 h-5 w-5" />
                    Create Dashboard
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create dashboard</DialogTitle>
          <DialogDescription>
            Add a new dashboard to manage products and customers data.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Dashboard name</Label>
              <Input id="name" placeholder="Transactions" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Data Source</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <span className="font-medium">Supabase</span> -{" "}
                    <span className="text-muted-foreground">
                      Connected
                    </span>
                  </SelectItem>
                  <SelectItem value="fre">
                    <span className="font-medium">Firebase</span> -{" "}
                    <span className="text-muted-foreground">
                      Not Connected
                    </span>
                  </SelectItem>
                  <SelectItem value="pro">
                    <span className="font-medium">Other Database</span> -{" "}
                    <span className="text-muted-foreground">
                      Manual Integration
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>
            Cancel
          </Button>
          <Button type="submit">Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
