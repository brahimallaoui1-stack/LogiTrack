
"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Task } from "@/lib/types"

interface TaskDistributionChartProps {
  tasks: (Task & { subMissionIndex?: number })[]; // Accept flattened tasks
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
            let key: string | undefined;

            if (category === 'city') {
                // For city category, use the subMission city if available
                key = task.city;
            } else {
                key = task[category] as string | undefined;
            }
            
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
    return <div className="flex justify-center items-center h-[250px] text-muted-foreground">Aucune donnée à afficher</div>
  }

  const totalMissions = data.reduce((sum, item) => sum + item.value, 0);

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
           <foreignObject x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" width="160" height="40" dy="-20" dx="-80">
                <div className="text-center">
                    <p className="text-3xl font-bold">{totalMissions}</p>
                    <p className="text-sm text-muted-foreground">Missions</p>
                </div>
            </foreignObject>
        </PieChart>
      </ChartContainer>
  )
}
