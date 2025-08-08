"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Task } from "@/lib/types"

interface TaskDistributionChartProps {
  tasks: Task[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];


export function TaskDistributionChart({ tasks }: TaskDistributionChartProps) {
    const data = React.useMemo(() => {
        const cityCounts = tasks.reduce((acc, task) => {
        acc[task.city] = (acc[task.city] || 0) + 1
        return acc
        }, {} as Record<string, number>)

        return Object.keys(cityCounts).map((city) => ({
            name: city,
            value: cityCounts[city],
        }))
    }, [tasks])
    
    const chartConfig = data.reduce((acc, item, index) => {
        acc[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length]
        }
        return acc;
    }, {} as ChartConfig);

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
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ChartContainer>
  )
}
