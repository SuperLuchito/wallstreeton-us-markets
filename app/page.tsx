import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getMarkets() {
  try {
    const markets = await prisma.market.findMany({
      orderBy: { name: "asc" },
    });
    return markets;
  } catch (error) {
    console.error("Failed to fetch markets:", error);
    return [];
  }
}

export default async function Home() {
  const markets = await getMarkets();

  // Mock price data (in production, fetch from Ostium API)
  const mockPrices: Record<string, { price: number; change24h: number }> = {
    "NVDA-PERP": { price: 875.32, change24h: 2.45 },
    "AAPL-PERP": { price: 178.65, change24h: -0.82 },
    "MSFT-PERP": { price: 412.88, change24h: 1.23 },
    "SPY-PERP": { price: 485.22, change24h: 0.56 },
    "QQQ-PERP": { price: 395.44, change24h: 1.12 },
    "XAUUSD-PERP": { price: 2042.50, change24h: 0.34 },
    "XAGUSD-PERP": { price: 24.85, change24h: -0.45 },
    "WTI-PERP": { price: 78.92, change24h: 1.87 },
    "BRENT-PERP": { price: 83.15, change24h: 1.65 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">WallStreet.ON</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Trade US Markets On-Chain
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Live Markets
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Available Markets
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access US stocks, indices, and commodities with up to 100x leverage via Ostium perpetuals on Arbitrum
          </p>
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market) => {
            const priceData = mockPrices[market.symbol] || { price: 0, change24h: 0 };
            const isPositive = priceData.change24h >= 0;

            return (
              <Link key={market.id} href={`/market/${market.symbol}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{market.name}</CardTitle>
                        <CardDescription className="font-mono text-sm">
                          {market.symbol}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={market.type === "stock" ? "default" : market.type === "index" ? "secondary" : "outline"}
                        className="ml-2"
                      >
                        {market.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Price */}
                      <div>
                        <div className="text-3xl font-bold">
                          ${priceData.price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {isPositive ? "+" : ""}
                          {priceData.change24h.toFixed(2)}% (24h)
                        </div>
                      </div>

                      {/* Leverage */}
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Max Leverage</span>
                          <span className="font-semibold">{market.leverageMax}x</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                Trade real-world assets on-chain with leverage
              </CardDescription>
            </CardHeader>
            <CardContent className="text-left space-y-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">1. Deposit Funds</h3>
                  <p className="text-sm text-muted-foreground">
                    Deposit USDC/USDT from Ethereum, Arbitrum, or Solana
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. Choose Market</h3>
                  <p className="text-sm text-muted-foreground">
                    Select from stocks, indices, or commodities
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3. Open Position</h3>
                  <p className="text-sm text-muted-foreground">
                    Trade with leverage via Ostium perpetuals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

