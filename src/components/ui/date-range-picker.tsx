import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DateRangePickerProps {
  value?: string; // Current filter value like 'today', '7d', 'custom', etc.
  onChange?: (filterValue: string, dateRange?: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  presets?: DateRangePreset[];
  showPresets?: boolean;
  maxDate?: Date;
  minDate?: Date;
  inline?: boolean;
}

export interface DateRangePreset {
  label: string;
  value: string;
  getValue: () => DateRange;
}

const defaultPresets: DateRangePreset[] = [
  {
    label: "All Time",
    value: "all",
    getValue: () => {
      const today = new Date();
      const allTime = new Date("2020-01-01");
      return { from: allTime, to: today };
    },
  },
    {
      label: "Today",
      value: "today",
      getValue: () => {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        return { from: startOfToday, to: endOfToday };
      },
    },
    {
      label: "Yesterday",
      value: "yesterday",
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
        const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        return { from: startOfYesterday, to: endOfYesterday };
      },
    },
    {
      label: "7 Days",
      value: "7d",
      getValue: () => {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 6); // Include today, so 7 days total
        const startOfWeek = new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        return { from: startOfWeek, to: endOfToday };
      },
    },
    {
      label: "14 Days",
      value: "14d",
      getValue: () => {
        const today = new Date();
        const lastTwoWeeks = new Date();
        lastTwoWeeks.setDate(today.getDate() - 13); // Include today, so 14 days total
        const startOfTwoWeeks = new Date(lastTwoWeeks.getFullYear(), lastTwoWeeks.getMonth(), lastTwoWeeks.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        return { from: startOfTwoWeeks, to: endOfToday };
      },
    },
    {
      label: "28 Days",
      value: "28d",
      getValue: () => {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setDate(today.getDate() - 27); // Include today, so 28 days total
        const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        return { from: startOfMonth, to: endOfToday };
      },
    },
];

export function DateRangePicker({
  value = "7d", // Default to 7 days
  onChange,
  placeholder = "Select date range",
  className,
  disabled = false,
  presets = defaultPresets,
  showPresets = true,
  maxDate = new Date(),
  minDate = new Date("1900-01-01"),
  inline = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPreset, setSelectedPreset] = useState<string>(value);
  const [isSingleDayMode, setIsSingleDayMode] = useState(false);

  // Update internal state when external value changes
  useEffect(() => {
    setSelectedPreset(value);
    if (value === 'custom' && selectedRange.from && selectedRange.to) {
      // Keep custom range if it exists
    } else if (value !== 'custom') {
      // Clear custom range when switching to preset
      setSelectedRange({ from: undefined, to: undefined });
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Normalize the selected date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    let newRange: DateRange;

    if (isSingleDayMode) {
      // Single day mode - select just that day
      newRange = { from: normalizedDate, to: normalizedDate };
    } else {
      // Range mode
      if (!selectedRange.from || (selectedRange.from && selectedRange.to)) {
        // Start new selection
        newRange = { from: normalizedDate, to: undefined };
      } else if (selectedRange.from && !selectedRange.to) {
        // Complete the selection
        if (normalizedDate < selectedRange.from) {
          newRange = { from: normalizedDate, to: selectedRange.from };
        } else {
          newRange = { from: selectedRange.from, to: normalizedDate };
        }
      } else {
        newRange = { from: normalizedDate, to: undefined };
      }
    }

    setSelectedRange(newRange);
    setSelectedPreset("custom");

    // If both dates are selected, call onChange with custom filter
    if (newRange.from && newRange.to) {
      onChange?.("custom", newRange);
      if (!inline) {
        setIsOpen(false);
      }
    }
  };

  const handleDateDoubleClick = (date: Date | undefined) => {
    if (!date) return;

    // Normalize the selected date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Set single day selection
    const singleDayRange = { from: normalizedDate, to: normalizedDate };
    setSelectedRange(singleDayRange);
    setSelectedPreset("custom");
    onChange?.("custom", singleDayRange);
    
    if (!inline) {
      setIsOpen(false);
    }
  };

  const handlePresetSelect = (preset: DateRangePreset) => {
    const range = preset.getValue();
    setSelectedRange(range);
    setSelectedPreset(preset.value);
    setIsSingleDayMode(false); // Reset to range mode when selecting presets
    onChange?.(preset.value, range);
    if (!inline) {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    const emptyRange = { from: undefined, to: undefined };
    setSelectedRange(emptyRange);
    setSelectedPreset("7d");
    setIsSingleDayMode(false); // Reset to range mode when clearing
    onChange?.("7d", emptyRange);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDisplayText = () => {
    if (selectedPreset === 'custom' && selectedRange.from && selectedRange.to) {
      const fromStr = selectedRange.from.toLocaleDateString();
      const toStr = selectedRange.to.toLocaleDateString();
      const fullText = `${fromStr} - ${toStr}`;
      
      // If text is too long, truncate it
      if (fullText.length > 20) {
        return `${fromStr.split('/')[0]}/${fromStr.split('/')[1]} - ${toStr.split('/')[0]}/${toStr.split('/')[1]}`;
      }
      return fullText;
    }
    
    // Find the preset label for the current value
    const preset = presets.find(p => p.value === selectedPreset);
    if (preset) {
      return preset.label;
    }
    
    return placeholder;
  };

  const isDateInRange = (date: Date) => {
    if (!selectedRange.from || !selectedRange.to) return false;
    return date >= selectedRange.from && date <= selectedRange.to;
  };

  const isDateStart = (date: Date) => {
    return selectedRange.from && date.getTime() === selectedRange.from.getTime();
  };

  const isDateEnd = (date: Date) => {
    return selectedRange.to && date.getTime() === selectedRange.to.getTime();
  };

  const getNextMonth = (date: Date) => {
    const nextMonth = new Date(date);
    nextMonth.setMonth(date.getMonth() + 1);
    return nextMonth;
  };

  // If inline mode, render the content directly without popover
  if (inline) {
    return (
      <div className="flex">
        {/* Presets Sidebar */}
        {showPresets && (
          <div className="border-r border-border bg-muted/30 p-4 min-w-[200px]">
            <div className="space-y-1">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedPreset === preset.value && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </button>
              ))}
              <button
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  selectedPreset === "custom" && "bg-primary text-primary-foreground"
                )}
                onClick={() => setSelectedPreset("custom")}
              >
                Custom Range
              </button>
            </div>
          </div>
        )}

        {/* Calendar Section */}
        <div className="p-4">
          {/* Mode Toggle and Instructions */}
          <div className="mb-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Button
                variant={!isSingleDayMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsSingleDayMode(false)}
                className="text-xs"
              >
                Range
              </Button>
              <Button
                variant={isSingleDayMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsSingleDayMode(true)}
                className="text-xs"
              >
                Single Day
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {isSingleDayMode 
                ? "Click any date to select that single day"
                : "Click a date to start selection, click another to complete range"
              }
            </div>
          </div>
          
          {/* Header with navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium min-w-[120px] text-center">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Dual Calendar View */}
          <div className="flex gap-4">
            {/* First Calendar */}
            <div>
              <div className="text-sm font-medium mb-2 text-center">
                {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </div>
              <Calendar
                mode="single"
                selected={selectedRange.from}
                onSelect={handleDateSelect}
                disabled={(date) => date > maxDate || date < minDate}
                className="rounded-md border-0"
                classNames={{
                  day: cn(
                    "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                    "hover:bg-accent hover:text-accent-foreground",
                    "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground",
                    "data-[outside-month]:text-muted-foreground data-[outside-month]:hover:text-accent-foreground",
                    "data-[disabled]:text-muted-foreground data-[disabled]:hover:text-muted-foreground"
                  ),
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                modifiers={{
                  range_start: selectedRange.from,
                  range_end: selectedRange.to,
                  in_range: (date) => isDateInRange(date),
                }}
                modifiersClassNames={{
                  range_start: "bg-primary text-primary-foreground rounded-l-md",
                  range_end: "bg-primary text-primary-foreground rounded-r-md",
                  in_range: "bg-accent text-accent-foreground",
                }}
              />
            </div>

            {/* Second Calendar */}
            <div>
              <div className="text-sm font-medium mb-2 text-center">
                {getNextMonth(currentMonth).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </div>
              <Calendar
                mode="single"
                selected={selectedRange.to}
                onSelect={handleDateSelect}
                disabled={(date) => date > maxDate || date < minDate}
                className="rounded-md border-0"
                defaultMonth={getNextMonth(currentMonth)}
                classNames={{
                  day: cn(
                    "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                    "hover:bg-accent hover:text-accent-foreground",
                    "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground",
                    "data-[outside-month]:text-muted-foreground data-[outside-month]:hover:text-accent-foreground",
                    "data-[disabled]:text-muted-foreground data-[disabled]:hover:text-muted-foreground"
                  ),
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                modifiers={{
                  range_start: selectedRange.from,
                  range_end: selectedRange.to,
                  in_range: (date) => isDateInRange(date),
                }}
                modifiersClassNames={{
                  range_start: "bg-primary text-primary-foreground rounded-l-md",
                  range_end: "bg-primary text-primary-foreground rounded-r-md",
                  in_range: "bg-accent text-accent-foreground",
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              Clear
            </Button>
             <Button
               size="sm"
               onClick={() => {
                 if (selectedRange.from && selectedRange.to) {
                   onChange?.("custom", selectedRange);
                 } else {
                   // If no custom range selected, default to 7 days
                   onChange?.("7d", undefined);
                 }
               }}
               className="flex-1"
             >
               Apply
             </Button>
          </div>
        </div>
      </div>
    );
  }

  // Regular popover mode
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedRange.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets Sidebar */}
          {showPresets && (
            <div className="border-r border-border bg-muted/30 p-4 min-w-[200px]">
              <div className="space-y-1">
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      selectedPreset === preset.value && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedPreset === "custom" && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setSelectedPreset("custom")}
                >
                  Custom Range
                </button>
              </div>
            </div>
          )}

          {/* Calendar Section */}
          <div className="p-4">
            {/* Mode Toggle and Instructions */}
            <div className="mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Button
                  variant={!isSingleDayMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsSingleDayMode(false)}
                  className="text-xs"
                >
                  Range
                </Button>
                <Button
                  variant={isSingleDayMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsSingleDayMode(true)}
                  className="text-xs"
                >
                  Single Day
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                {isSingleDayMode 
                  ? "Click any date to select that single day"
                  : "Click a date to start selection, click another to complete range"
                }
              </div>
            </div>
            
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium min-w-[120px] text-center">
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Dual Calendar View */}
            <div className="flex gap-4">
              {/* First Calendar */}
              <div>
                <div className="text-sm font-medium mb-2 text-center">
                  {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
                <Calendar
                  mode="single"
                  selected={selectedRange.from}
                  onSelect={handleDateSelect}
                  disabled={(date) => date > maxDate || date < minDate}
                  className="rounded-md border-0"
                  classNames={{
                    day: cn(
                      "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                      "hover:bg-accent hover:text-accent-foreground",
                      "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground",
                      "data-[outside-month]:text-muted-foreground data-[outside-month]:hover:text-accent-foreground",
                      "data-[disabled]:text-muted-foreground data-[disabled]:hover:text-muted-foreground"
                    ),
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                  modifiers={{
                    range_start: selectedRange.from,
                    range_end: selectedRange.to,
                    in_range: (date) => isDateInRange(date),
                  }}
                  modifiersClassNames={{
                    range_start: "bg-primary text-primary-foreground rounded-l-md",
                    range_end: "bg-primary text-primary-foreground rounded-r-md",
                    in_range: "bg-accent text-accent-foreground",
                  }}
                />
              </div>

              {/* Second Calendar */}
              <div>
                <div className="text-sm font-medium mb-2 text-center">
                  {getNextMonth(currentMonth).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
                <Calendar
                  mode="single"
                  selected={selectedRange.to}
                  onSelect={handleDateSelect}
                  disabled={(date) => date > maxDate || date < minDate}
                  className="rounded-md border-0"
                  defaultMonth={getNextMonth(currentMonth)}
                  classNames={{
                    day: cn(
                      "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                      "hover:bg-accent hover:text-accent-foreground",
                      "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground",
                      "data-[outside-month]:text-muted-foreground data-[outside-month]:hover:text-accent-foreground",
                      "data-[disabled]:text-muted-foreground data-[disabled]:hover:text-muted-foreground"
                    ),
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                  modifiers={{
                    range_start: selectedRange.from,
                    range_end: selectedRange.to,
                    in_range: (date) => isDateInRange(date),
                  }}
                  modifiersClassNames={{
                    range_start: "bg-primary text-primary-foreground rounded-l-md",
                    range_end: "bg-primary text-primary-foreground rounded-r-md",
                    in_range: "bg-accent text-accent-foreground",
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedRange.from && selectedRange.to) {
                    onChange?.("custom", selectedRange);
                  } else {
                    // If no custom range selected, default to 7 days
                    onChange?.("7d", undefined);
                  }
                  setIsOpen(false);
                }}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
