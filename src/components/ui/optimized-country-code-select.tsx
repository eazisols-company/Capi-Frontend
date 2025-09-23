import * as React from "react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlagIcon } from 'react-flag-kit';
import { COUNTRY_CODES } from "@/utils/constants";

// Sort country codes once outside component for better performance
const SORTED_COUNTRY_CODES = [...COUNTRY_CODES].sort((a, b) => a.country.localeCompare(b.country));

interface OptimizedCountryCodeSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyText?: string;
  style?: React.CSSProperties;
}

export function OptimizedCountryCodeSelect({
  value,
  onValueChange,
  placeholder = "Select country code",
  disabled = false,
  className,
  emptyText = "No country code found.",
  style
}: OptimizedCountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter country codes based on search input
  const filteredCountryCodes = useMemo(() => {
    if (!searchValue.trim()) return SORTED_COUNTRY_CODES;
    
    const searchLower = searchValue.toLowerCase();
    return SORTED_COUNTRY_CODES.filter(countryCode =>
      countryCode.country.toLowerCase().includes(searchLower) ||
      countryCode.code.toLowerCase().includes(searchLower)
    );
  }, [searchValue]);

  const selectedCountryCode = value ? COUNTRY_CODES.find(cc => cc.code === value) : null;

  const handleSelect = useCallback((code: string) => {
    onValueChange?.(code);
    setOpen(false);
    setSearchValue("");
  }, [onValueChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onValueChange?.("");
  }, [onValueChange]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className={cn(
          "w-full justify-between text-left font-normal text-white placeholder:text-gray-400 hover:bg-transparent hover:text-white",
          !value && "text-muted-foreground",
          className
        )}
        style={style}
        disabled={disabled}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedCountryCode ? (
            <>
              <FlagIcon 
                code={selectedCountryCode.flagCode as any} 
                size={16} 
              />
              <span className="font-medium">{selectedCountryCode.code}</span>
            </>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {/* {selectedCountryCode && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )} */}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </Button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={searchInputRef}
              placeholder="Search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredCountryCodes.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredCountryCodes.map((countryCode) => (
                 <div
                   key={countryCode.code}
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     handleSelect(countryCode.code);
                   }}
                   className={cn(
                     "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                     value === countryCode.code && "bg-accent text-accent-foreground"
                   )}
                 >
                  <FlagIcon 
                    code={countryCode.flagCode as any} 
                    size={16} 
                  />
                  <span className="font-medium">{countryCode.code}</span>
                  <span className="text-xs text-muted-foreground">{countryCode.country}</span>
                  {value === countryCode.code && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
