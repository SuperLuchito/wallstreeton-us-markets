import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database for WallStreet.ON...');

  // Seed Assets (USDC and USDT on each chain)
  const assets = [
    // Ethereum
    {
      symbol: 'USDC-ETH',
      name: 'USD Coin (Ethereum)',
      type: 'stable',
      decimals: 6,
      chain: 'ethereum',
      contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    {
      symbol: 'USDT-ETH',
      name: 'Tether USD (Ethereum)',
      type: 'stable',
      decimals: 6,
      chain: 'ethereum',
      contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
    // Arbitrum
    {
      symbol: 'USDC-ARB',
      name: 'USD Coin (Arbitrum)',
      type: 'stable',
      decimals: 6,
      chain: 'arbitrum',
      contractAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },
    {
      symbol: 'USDT-ARB',
      name: 'Tether USD (Arbitrum)',
      type: 'stable',
      decimals: 6,
      chain: 'arbitrum',
      contractAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
    // Solana
    {
      symbol: 'USDC-SOL',
      name: 'USD Coin (Solana)',
      type: 'stable',
      decimals: 6,
      chain: 'solana',
      contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
    {
      symbol: 'USDT-SOL',
      name: 'Tether USD (Solana)',
      type: 'stable',
      decimals: 6,
      chain: 'solana',
      contractAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    },
  ];

  console.log('📦 Creating assets...');
  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { symbol: asset.symbol },
      update: asset,
      create: asset,
    });
  }
  console.log(`✅ Created ${assets.length} assets`);

  // Seed Markets (Ostium perps on Arbitrum)
  const markets = [
    // Stocks
    {
      type: 'perp',
      venue: 'ostium',
      chain: 'arbitrum',
      symbol: 'NVDA-PERP',
      baseSymbol: 'NVDA',
      quoteSymbol: 'USD',
      name: 'NVIDIA Corporation',
      leverageMax: 20,
      venueSymbol: 'NVDA', // Validate against Ostium docs
      isActive: true,
    },
    {
      type: 'perp',
      venue: 'ostium',
      chain: 'arbitrum',
      symbol: 'AAPL-PERP',
      baseSymbol: 'AAPL',
      quoteSymbol: 'USD',
      name: 'Apple Inc.',
      leverageMax: 20,
      venueSymbol: 'AAPL',
      isActive: true,
    },
    {
      type: 'perp',
      venue: 'ostium',
      chain: 'arbitrum',
      symbol: 'MSFT-PERP',
      baseSymbol: 'MSFT',
      quoteSymbol: 'USD',
      name: 'Microsoft Corporation',
      leverageMax: 20,
      venueSymbol: 'MSFT',
      isActive: true,
    },
    // Indices
    {
      type: 'perp',
      venue: 'ostium',
      chain: 'arbitrum',
      symbol: 'SPY-PERP',
      baseSymbol: 'SPY',
      quoteSymbol: 'USD',
      name: 'S&P 500 ETF',
      leverageMax: 50,
      venueSymbol: 'SPY',
      isActive: true,
    },
    {
      type: 'perp',
      venue: 'ostium',
      chain: 'arbitrum',
      symbol: 'QQQ-PERP',
      baseSymbol: 'QQQ',
      quoteSymbol: 'USD',
      name: 'Nasdaq 100 ETF',
      leverageMax: 50,
      venueSymbol: 'QQQ',
      isActive: true,
    },
    // Commodities
    {
      type: 'perp',
      venue: 'ostium',
      chain: 'arbitrum',
      symbol: 'XAUUSD-PERP',
      baseSymbol: 'XAUUSD',
      quoteSymbol: 'USD',
      name: 'Gold',
      leverageMax: 100,
      venueSymbol: 'XAUUSD',
      isActive: true,
    },
    {
      type: 'perp',
      venue: 'ostium',
      chain: 'arbitrum',
      symbol: 'XAGUSD-PERP',
      baseSymbol: 'XAGUSD',
      quoteSymbol: 'USD',
      name: 'Silver',
      leverageMax: 100,
      venueSymbol: 'XAGUSD',
      isActive: true,
    },
    {
      type: 'perp',
      venue: 'ostium',
      chain: 'arbitrum',
      symbol: 'WTI-PERP',
      baseSymbol: 'WTI',
      quoteSymbol: 'USD',
      name: 'WTI Crude Oil',
      leverageMax: 50,
      venueSymbol: 'WTI',
      isActive: true,
    },
    {
      type: 'perp',
      venue: 'ostium',
      chain: 'arbitrum',
      symbol: 'BRENT-PERP',
      baseSymbol: 'BRENT',
      quoteSymbol: 'USD',
      name: 'Brent Crude Oil',
      leverageMax: 50,
      venueSymbol: 'BRENT',
      isActive: true,
    },
  ];

  console.log('📈 Creating markets...');
  for (const market of markets) {
    await prisma.market.upsert({
      where: { symbol: market.symbol },
      update: market,
      create: market,
    });
  }
  console.log(`✅ Created ${markets.length} markets`);

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

