// components/CustomTimePicker.tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import { useState } from "react"

type Props = {
  value?: string
  onChange: (value: string) => void
}

export function CustomTimePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const times = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4)
    const minute = (i % 4) * 15
    const date = new Date()
    date.setHours(hour)
    date.setMinutes(minute)
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", !value && "text-muted-foreground")}
        >
          {value ? value : "Pick a time"}
          <Clock className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <ScrollArea className="h-60 overflow-y-auto focus:outline-none">
            <CommandGroup>
              {times.map((time) => (
                <CommandItem
                  key={time}
                  value={time}
                  onSelect={() => {
                    onChange(time)
                    setOpen(false)
                  }}
                >
                  {time}
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  )
}