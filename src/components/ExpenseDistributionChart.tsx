
"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Expense } from "@/lib/types"

interface ExpenseDistributionChartProps {
  expenses: Expense[];
  category: keyof Expense;
  label: string;
}

const COLORS = [
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ExpenseDistributionChart({ expenses, category, label }: ExpenseDistributionChartProps) {
    const data = React.useMemo(() => {
        const counts = expenses.reduce((acc, expense) => {
            const key = expense[category] as string | undefined;
            if (key) {
                acc[key] = (acc[key] || 0) + 1
            }
            return acc
        }, {} as Record<string, number>)

        return Object.keys(counts).map((name) => ({
            name: name,
            value: counts[name],
            fill: COLORS[Object.keys(counts).indexOf(name) % COLORS.length]
        }))
    }, [expenses, category])
    
    const chartConfig = data.reduce((acc, item) => {
        acc[item.name] = {
            label: item.name,
            color: item.fill
        }
        return acc;
    }, {} as ChartConfig);

  if (data.length === 0) {
    return <div className="flex justify-center items-center h-[250px] text-muted-foreground">Aucune donnée à afficher</div>
  }

  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-[250px]"
      >
        <PieChart>
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={80}
            outerRadius={110}
            strokeWidth={5}
            labelLine={false}
            paddingAngle={5}
            cornerRadius={5}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
           <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-3xl font-bold"
              dy={-10}
            >
              {totalExpenses}
            </text>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm text-muted-foreground"
              dy={20}
            >
              Dépenses
            </text>
        </PieChart>
      </ChartContainer>
  )
}
