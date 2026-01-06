"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"

const data = [
    { name: 'May 16', dau: 5843, sessionDuration: 12 },
    { name: 'May 17', dau: 6123, sessionDuration: 10 },
    { name: 'May 18', dau: 5543, sessionDuration: 14 },
    { name: 'May 19', dau: 6893, sessionDuration: 8 },
    { name: 'May 20', dau: 6342, sessionDuration: 11 },
    { name: 'May 21', dau: 7012, sessionDuration: 13 },
    { name: 'May 22', dau: 6543, sessionDuration: 9 },
];

export function UserEngagementChart() {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value / 1000}k`}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}m`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                    }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Legend wrapperStyle={{fontSize: "0.8rem"}}/>
                <Line yAxisId="left" type="monotone" dataKey="dau" name="Daily Active Users" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="sessionDuration" name="Avg. Session (min)" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    )
}
