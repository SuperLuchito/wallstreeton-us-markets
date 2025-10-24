"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

// Mock data
const mockMarketData: Record<string, any> = {
  "NVDA-PERP": {
    name: "NVIDIA Corporation",
    symbol: "NVDA-PERP",
    type: "stock",
    price: 875.32,
    change24h: 2.45,
    high24h: 892.15,
    low24h: 858.20,
    volume24h: "2.4B",
    leverageMax: 20,
  },
  "AAPL-PERP": {
    name: "Apple Inc.",
    symbol: "AAPL-PERP",
    type: "stock",
    price: 178.65,
    change24h: -0.82,
    high24h: 182.30,
    low24h: 177.90,
    volume24h: "1.8B",
    leverageMax: 20,
  },
  // Add more as needed
};

// Generate mock chart data
function generateChartData(timeframe: string) {
  const points = timeframe === "1D" ? 24 : timeframe === "1W" ? 7 : timeframe === "1M" ? 30 : 365;
  const basePrice = 875;
  const data = [];
  
  for (let i = 0; i < points; i++) {
    const variance = (Math.random() - 0.5) * 20;
    data.push({
      time: i,
      price: basePrice + variance + (i * 0.5),
    });
  }
  
  return data;
}

export default function MarketPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [timeframe, setTimeframe] = useState("1D");
  
  const market = mockMarketData[symbol] || mockMarketData["NVDA-PERP"];
  const isPositive = market.change24h >= 0;
  const chartData = generateChartData(timeframe);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">WallStreet.ON</h1>
            </div>
            <Badge variant="outline">Live</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Market Header - Perplexity Style */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold mb-2">{market.name}</h2>
              <div className="flex items-center gap-3">
                <span className="text-lg text-muted-foreground font-mono">{market.symbol}</span>
                <Badge variant={market.type === "stock" ? "default" : "secondary"}>
                  {market.type}
                </Badge>
              </div>
            </div>
          </div>

          {/* Big Price Display - Perplexity Style */}
          <div className="mb-6">
            <div className="text-6xl font-bold mb-2">
              ${market.price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className={`flex items-center gap-2 text-xl font-semibold ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}>
              {isPositive ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )}
              {isPositive ? "+" : ""}
              {market.change24h.toFixed(2)}% (24h)
            </div>
          </div>

          {/* Timeframe Tabs - Perplexity Style */}
          <div className="flex gap-2 mb-6">
            {["1D", "1W", "1M", "1Y"].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9ca3af"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    tick={{ fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [`$${value.toFixed(2)}`, "Price"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isPositive ? "#16a34a" : "#dc2626"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                24h High
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${market.high24h.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                24h Low
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${market.low24h.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                24h Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${market.volume24h}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Max Leverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{market.leverageMax}x</div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Section */}
        <Card>
          <CardHeader>
            <CardTitle>Open Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Trading functionality requires wallet connection and Ostium integration.
              </p>
              <div className="flex gap-3">
                <Button className="flex-1" size="lg">
                  Long (Buy)
                </Button>
                <Button className="flex-1" variant="destructive" size="lg">
                  Short (Sell)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Price Changes - Perplexity Style */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Recent Price Changes</h3>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">1 hour ago</span>
                  <span className="text-sm font-medium text-green-600">+0.45%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">4 hours ago</span>
                  <span className="text-sm font-medium text-green-600">+1.23%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">12 hours ago</span>
                  <span className="text-sm font-medium text-red-600">-0.34%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

