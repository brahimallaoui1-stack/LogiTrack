"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Task } from "@/lib/types"

interface TaskDistributionChartProps {
  tasks: Task[];
  category: keyof Task;
  label: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function TaskDistributionChart({ tasks, category, label }: TaskDistributionChartProps) {
    const data = React.useMemo(() => {
        const counts = tasks.reduce((acc, task) => {
            const key = task[category] as string | undefined;
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
    }, [tasks, category])
    
    const chartConfig = data.reduce((acc, item) => {
        acc[item.name] = {
            label: item.name,
            color: item.fill
        }
        return acc;
    }, {} as ChartConfig);

  if (data.length === 0) {
    return <div className="flex justify-center items-center h-full text-muted-foreground">Aucune donnée à afficher</div>
  }

  return (
    <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-[250px]"
      >
        <PieChart>
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="name" />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            strokeWidth={5}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
           <Legend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
  )
}
