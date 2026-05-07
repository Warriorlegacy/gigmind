'use client'

import React from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const data = [
  { day: 'Mon', revenue: 4500, applications: 12 },
  { day: 'Tue', revenue: 5200, applications: 18 },
  { day: 'Wed', revenue: 4800, applications: 15 },
  { day: 'Thu', revenue: 6100, applications: 22 },
  { day: 'Fri', revenue: 5900, applications: 20 },
  { day: 'Sat', revenue: 7200, applications: 28 },
  { day: 'Sun', revenue: 6800, applications: 25 },
]

const chartConfig = {
  revenue: {
    label: 'Revenue (₹)',
    color: 'hsl(var(--brand))',
  },
  applications: {
    label: 'Applications',
    color: 'hsl(var(--info))',
  },
}

export function DashboardAnalytics({ title = "Performance Analytics" }: { title?: string }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-surface-card border-surface-border shadow-xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-surface-border/50 bg-surface/30">
            <div className="space-y-1">
              <CardTitle className="text-white font-display text-lg tracking-tight">Revenue Trends</CardTitle>
              <CardDescription className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Weekly growth overview</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-[10px] text-brand font-bold uppercase tracking-tighter">Live</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[240px] w-full">
              <ChartContainer config={chartConfig}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#666' }}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                    tick={{ fill: '#666' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-surface-card border-surface-border shadow-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-surface-border/50 bg-surface/30">
            <div className="space-y-1">
              <CardTitle className="text-white font-display text-lg tracking-tight">Activity Log</CardTitle>
              <CardDescription className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">User engagement</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="h-[240px] w-full">
              <ChartContainer config={chartConfig}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#666' }}
                  />
                   <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#666' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="stepAfter"
                    dataKey="applications"
                    stroke="var(--color-applications)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--color-applications)", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#fff", stroke: "var(--color-applications)", strokeWidth: 2 }}
                    animationDuration={2500}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
