"use client"

import { Funnel, FunnelChart, ResponsiveContainer, Tooltip, LabelList } from "recharts"

const data = [
    { value: 100, name: 'Notices Sent', fill: 'hsl(var(--chart-1))' },
    { value: 80, name: 'Notices Viewed', fill: 'hsl(var(--chart-2))' },
    { value: 65, name: 'Payment Initiated', fill: 'hsl(var(--chart-3))' },
    { value: 50, name: 'Payment Completed', fill: 'hsl(var(--chart-4))' },
];

export function ComplianceFunnelChart() {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <FunnelChart>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                    }}
                />
                <Funnel
                    dataKey="value"
                    data={data}
                    isAnimationActive
                >
                    <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" dataKey="name" />
                </Funnel>
            </FunnelChart>
        </ResponsiveContainer>
    )
}
