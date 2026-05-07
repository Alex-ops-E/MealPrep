import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PriceHistoryPoint } from "@shared/schema";

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
  className?: string;
}

export default function PriceHistoryChart({ data, className = "" }: PriceHistoryChartProps) {
  const chartData = useMemo(() => {
    // Group by date and calculate average price
    const groupedData = data.reduce((acc, point) => {
      const date = new Date(point.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, prices: [], total: 0, count: 0 };
      }
      acc[date].prices.push(point.price);
      acc[date].total += point.price;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; prices: number[]; total: number; count: number }>);

    return Object.values(groupedData)
      .map(group => ({
        date: group.date,
        avgPrice: group.total / group.count,
        minPrice: Math.min(...group.prices),
        maxPrice: Math.max(...group.prices),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted/20 rounded-lg ${className}`}>
        <p className="text-muted-foreground">No price history available</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} data-testid="chart-price-history">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={formatPrice}
            className="text-muted-foreground"
          />
          <Tooltip
            formatter={(value: number) => [formatPrice(value), "Price"]}
            labelClassName="text-foreground"
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="avgPrice"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="minPrice"
            stroke="hsl(var(--accent))"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="maxPrice"
            stroke="hsl(var(--destructive))"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="flex justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-primary"></div>
          <span className="text-muted-foreground">Average Price</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-accent border-dashed border-t"></div>
          <span className="text-muted-foreground">Lowest Price</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-destructive border-dashed border-t"></div>
          <span className="text-muted-foreground">Highest Price</span>
        </div>
      </div>
    </div>
  );
}
