
"use client";

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';

interface WeekPickerProps {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

export function WeekPicker({ date, onChange }: WeekPickerProps) {
  return (
    <DayPicker
      mode="single"
      selected={date}
      onSelect={onChange}
      showOutsideDays
      locale={fr}
    />
  );
}
