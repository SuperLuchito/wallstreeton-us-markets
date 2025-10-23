import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const markets = await prisma.market.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">WallStreet.ON</h1>
          <p className="text-sm text-gray-600">Trade US Markets On-Chain</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-4">Available Markets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.map((market) => (
            <Link
              key={market.id}
              href={`/markets/${market.symbol}`}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold">{market.name}</h3>
              <p className="text-sm text-gray-600">{market.symbol}</p>
              <p className="text-xs text-gray-500 mt-2">
                Max Leverage: {market.leverageMax}x
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
