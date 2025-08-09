
"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getYear, setYear } from 'date-fns';

interface YearPickerProps {
  date: Date | undefined;
  onChange: (date: Date) => void;
}

export function YearPicker({ date, onChange }: YearPickerProps) {
  const [viewYear, setViewYear] = useState(getYear(date || new Date()));

  const selectedYear = date ? getYear(date) : -1;

  const years = Array.from({ length: 12 }, (_, i) => viewYear - 6 + i);

  return (
    <div className="p-4 w-64">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={() => setViewYear(viewYear - 12)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">{viewYear - 6} - {viewYear + 5}</div>
        <Button variant="outline" size="icon" onClick={() => setViewYear(viewYear + 12)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map((year) => (
          <Button
            key={year}
            variant={selectedYear === year ? 'default' : 'ghost'}
            onClick={() => onChange(setYear(date || new Date(), year))}
            className="text-center"
          >
            {year}
          </Button>
        ))}
      </div>
    </div>
  );
}
