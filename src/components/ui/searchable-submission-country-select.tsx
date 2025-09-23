import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FlagIcon } from 'react-flag-kit';
import { getCountryFlagCode } from "@/utils/constants";

interface SearchableSubmissionCountrySelectProps {
  countries: string[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showSearchIcon?: boolean;
  emptyText?: string;
  style?: React.CSSProperties;
}

export function SearchableSubmissionCountrySelect({
  countries,
  value,
  onValueChange,
  placeholder = "Filter by country",
  disabled = false,
  className,
  showSearchIcon = false,
  emptyText = "No countries found",
  style
}: SearchableSubmissionCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Sort countries alphabetically
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => a.localeCompare(b));
  }, [countries]);

  // Filter countries based on search input
  const filteredCountries = useMemo(() => {
    if (!searchValue) return sortedCountries;
    
    return sortedCountries.filter(country =>
      country.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue, sortedCountries]);

  const selectedCountry = value ? countries.find(country => country === value) : null;

  const handleSelect = useCallback((country: string) => {
    onValueChange?.(country);
    setOpen(false);
    setSearchValue("");
  }, [onValueChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.("");
  }, [onValueChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal text-white placeholder:text-gray-400 hover:bg-transparent hover:text-white",
            !value && "text-muted-foreground",
            className
          )}
          style={style}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedCountry ? (
              <>
                <FlagIcon 
                  code={getCountryFlagCode(selectedCountry) as any} 
                  size={16} 
                />
                <span className="truncate">{selectedCountry}</span>
              </>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {/* {selectedCountry && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )} */}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            {showSearchIcon && <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />}
            <CommandInput
              placeholder="Search country..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredCountries.map((country) => (
                <CommandItem
                  key={country}
                  value={country}
                  onSelect={() => handleSelect(country)}
                  className="flex items-center gap-2"
                >
                  <FlagIcon 
                    code={getCountryFlagCode(country) as any} 
                    size={16} 
                  />
                  <span>{country}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === country ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
