"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addYears, subYears, setMonth, getYear, getMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MonthPickerProps {
  date: Date | undefined;
  onChange: (date: Date) => void;
}

export function MonthPicker({ date, onChange }: MonthPickerProps) {
  const [currentYear, setCurrentYear] = useState(getYear(date || new Date()));
  const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));

  const selectedMonth = date ? getMonth(date) : -1;
  const selectedYear = date ? getYear(date) : -1;

  return (
    <div className="p-4 w-64">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentYear(currentYear - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">{currentYear}</div>
        <Button variant="outline" size="icon" onClick={() => setCurrentYear(currentYear + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, i) => (
          <Button
            key={i}
            variant={selectedYear === currentYear && selectedMonth === i ? 'default' : 'ghost'}
            onClick={() => onChange(month)}
            className="text-center"
          >
            {format(month, 'MMM', { locale: fr })}
          </Button>
        ))}
      </div>
    </div>
  );
}
