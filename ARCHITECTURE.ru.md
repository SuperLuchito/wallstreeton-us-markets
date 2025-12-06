# Архитектура WallStreet.ON

## 📐 Общая архитектура системы

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WallStreet.ON Platform                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    Frontend Layer                          │   │
│  │  ┌──────────────────────────────────────────────────────┐ │   │
│  │  │ Next.js 14 (App Router) + React 19 + TypeScript      │ │   │
│  │  │                                                       │ │   │
│  │  │ Pages:                                                │ │   │
│  │  │  • /auth/signin - Страница входа                     │ │   │
│  │  │  • / - Дашборд (портфель, балансы)                   │ │   │
│  │  │  • /markets - Список инструментов                    │ │   │
│  │  │  • /markets/[symbol] - Страница инструмента          │ │   │
│  │  │  • /deposit - Мастер пополнения                      │ │   │
│  │  │  • /positions - Открытые позиции                     │ │   │
│  │  │  • /history - История транзакций                     │ │   │
│  │  │  • /settings - Настройки (кошельки, профиль)         │ │   │
│  │  │                                                       │ │   │
│  │  │ Components:                                           │ │   │
│  │  │  • PriceChart (Recharts)                              │ │   │
│  │  │  • TradeForm (открытие/закрытие позиций)             │ │   │
│  │  │  • DepositWizard (пошаговый мастер)                  │ │   │
│  │  │  • WalletSelector (выбор кошелька)                   │ │   │
│  │  │  • PositionCard (карточка позиции)                   │ │   │
│  │  │  • PriceDisplay (большая цена, 24h%)                 │ │   │
│  │  │                                                       │ │   │
│  │  │ Styling:                                              │ │   │
│  │  │  • Tailwind CSS v4                                    │ │   │
│  │  │  • shadcn/ui components                               │ │   │
│  │  │  • Custom Perplexity-style design                     │ │   │
│  │  └──────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                              ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    API Layer                               │   │
│  │  ┌──────────────────────────────────────────────────────┐ │   │
│  │  │ Next.js API Routes + NextAuth + tRPC (опционально)  │ │   │
│  │  │                                                       │ │   │
│  │  │ Authentication:                                       │ │   │
│  │  │  • /api/auth/[...nextauth] - NextAuth endpoints      │ │   │
│  │  │  • Google OAuth provider                              │ │   │
│  │  │  • Email magic link provider                          │ │   │
│  │  │  • Session management                                 │ │   │
│  │  │                                                       │ │   │
│  │  │ Wallets:                                              │ │   │
│  │  │  • GET /api/wallets - получить кошельки              │ │   │
│  │  │  • POST /api/wallets - добавить кошелёк              │ │   │
│  │  │  • DELETE /api/wallets/:id - удалить кошелёк         │ │   │
│  │  │  • Signature verification (EVM + Solana)             │ │   │
│  │  │                                                       │ │   │
│  │  │ Balances:                                             │ │   │
│  │  │  • GET /api/balances - получить балансы              │ │   │
│  │  │  • Fetch from Safe/PDA vaults                         │ │   │
│  │  │                                                       │ │   │
│  │  │ Deposits:                                             │ │   │
│  │  │  • POST /api/deposits - инициировать отслеживание    │ │   │
│  │  │  • GET /api/deposits - история депозитов             │ │   │
│  │  │  • Webhook для подтверждения (от watchers)           │ │   │
│  │  │                                                       │ │   │
│  │  │ Trades:                                               │ │   │
│  │  │  • POST /api/trades - открыть позицию                │ │   │
│  │  │  • POST /api/trades/close - закрыть позицию          │ │   │
│  │  │  • GET /api/positions - открытые позиции             │ │   │
│  │  │  • Ostium integration                                 │ │   │
│  │  │                                                       │ │   │
│  │  │ Prices:                                               │ │   │
│  │  │  • GET /api/prices - текущие цены                     │ │   │
│  │  │  • GET /api/prices/stream (SSE) - реал-тайм цены     │ │   │
│  │  │  • Fetch from Ostium oracle                           │ │   │
│  │  │                                                       │ │   │
│  │  │ Markets:                                              │ │   │
│  │  │  • GET /api/markets - список инструментов             │ │   │
│  │  │  • GET /api/markets/:id - детали инструмента          │ │   │
│  │  └──────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                              ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                  Database Layer                            │   │
│  │  ┌──────────────────────────────────────────────────────┐ │   │
│  │  │ Prisma ORM                                            │ │   │
│  │  │  • SQLite (разработка)                                │ │   │
│  │  │  • PostgreSQL (production)                            │ │   │
│  │  │                                                       │ │   │
│  │  │ Tables:                                               │ │   │
│  │  │  • User - пользователи                                │ │   │
│  │  │  • Account - OAuth аккаунты                           │ │   │
│  │  │  • Session - сессии                                   │ │   │
│  │  │  • Wallet - кошельки по цепям                         │ │   │
│  │  │  • Asset - активы (USDC, USDT)                        │ │   │
│  │  │  • Balance - балансы активов                          │ │   │
│  │  │  • Market - рынки (акции, сырьё)                      │ │   │
│  │  │  • Deposit - депозиты                                 │ │   │
│  │  │  • Withdrawal - выводы                                │ │   │
│  │  │  • Position - открытые позиции                        │ │   │
│  │  │  • Trade - история сделок                             │ │   │
│  │  │  • VerificationToken - токены для email               │ │   │
│  │  └──────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │  Ethereum    │    │  Arbitrum    │    │  Solana      │
   │  Sepolia     │    │  Sepolia     │    │  Devnet      │
   ├──────────────┤    ├──────────────┤    ├──────────────┤
   │ Safe Vault   │    │ Safe Vault   │    │ PDA Vault    │
   │ (multisig)   │    │ (multisig)   │    │ (program)    │
   │              │    │              │    │              │
   │ CoW Protocol │    │ Ostium       │    │ Kamino       │
   │ (swap)       │    │ (perps)      │    │ (swap)       │
   │              │    │              │    │              │
   │ RPC:         │    │ RPC:         │    │ RPC:         │
   │ https://...  │    │ https://...  │    │ https://...  │
   └──────────────┘    └──────────────┘    └──────────────┘
```

## 🔐 Поток аутентификации

```
┌─────────────────────────────────────────────────────────────┐
│              Authentication Flow (NextAuth)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User visits /auth/signin                               │
│     │                                                       │
│     ▼                                                       │
│  2. SignInForm component shows:                            │
│     • "Sign in with Google" button                         │
│     • Email input + "Send Magic Link" button               │
│     │                                                       │
│     ├─ Google OAuth Path:                                  │
│     │  ├─ User clicks "Sign in with Google"                │
│     │  ├─ Redirected to Google OAuth consent               │
│     │  ├─ Google redirects back with code                  │
│     │  ├─ NextAuth exchanges code for tokens               │
│     │  ├─ NextAuth creates Account record in DB            │
│     │  ├─ NextAuth creates Session in DB                   │
│     │  └─ User redirected to / (dashboard)                 │
│     │                                                       │
│     └─ Email Magic Link Path:                              │
│        ├─ User enters email                                │
│        ├─ NextAuth generates token                         │
│        ├─ Stores VerificationToken in DB                   │
│        ├─ Sends email with magic link                      │
│        │  (Dev mode: logs to console)                      │
│        ├─ User clicks link in email                        │
│        ├─ NextAuth verifies token                          │
│        ├─ Creates Account + Session in DB                  │
│        └─ User redirected to / (dashboard)                 │
│                                                             │
│  3. Session Cookie                                         │
│     ├─ NextAuth sets secure session cookie                 │
│     ├─ Cookie sent with every request                      │
│     ├─ Backend validates session via Prisma Adapter        │
│     └─ ctx.user available in API routes                    │
│                                                             │
│  4. Frontend Session State                                 │
│     ├─ useSession() hook returns current session           │
│     ├─ SessionProvider wraps app                           │
│     ├─ useAuth() custom hook for convenience               │
│     └─ Redirect to /auth/signin if not authenticated       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 💰 Поток депозита

```
┌─────────────────────────────────────────────────────────────┐
│                  Deposit Flow                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User clicks "Top Up" button on dashboard               │
│     │                                                       │
│     ▼                                                       │
│  2. DepositWizard component shows:                         │
│     • Step 1: Select chain (Ethereum / Arbitrum / Solana)  │
│     • Step 2: Select asset (USDC / USDT)                   │
│     • Step 3: Confirm vault address + QR code              │
│     │                                                       │
│     ▼                                                       │
│  3. Backend generates deposit address:                     │
│     • Ethereum: Safe vault address                         │
│     • Arbitrum: Safe vault address                         │
│     • Solana: PDA vault address                            │
│     │                                                       │
│     ▼                                                       │
│  4. User sends funds from their wallet:                    │
│     • Scans QR code or copies address                      │
│     • Sends USDC/USDT to vault address                     │
│     • Pays gas fees                                        │
│     │                                                       │
│     ▼                                                       │
│  5. Deposit Watcher (backend service):                     │
│     ├─ Ethereum Sepolia Watcher:                           │
│     │  ├─ Listens for Transfer events to Safe vault        │
│     │  ├─ Confirms after 12 blocks                         │
│     │  └─ Calls POST /api/deposits/confirm webhook         │
│     │                                                       │
│     ├─ Arbitrum Sepolia Watcher:                           │
│     │  ├─ Listens for Transfer events to Safe vault        │
│     │  ├─ Confirms after 12 blocks                         │
│     │  └─ Calls POST /api/deposits/confirm webhook         │
│     │                                                       │
│     └─ Solana Devnet Watcher:                              │
│        ├─ Listens for Transfer events to PDA vault         │
│        ├─ Confirms after 32 slots                          │
│        └─ Calls POST /api/deposits/confirm webhook         │
│     │                                                       │
│     ▼                                                       │
│  6. Backend updates database:                              │
│     ├─ Updates Deposit status: pending → confirmed         │
│     ├─ Updates Balance: available += amount                │
│     └─ Records transaction hash                            │
│     │                                                       │
│     ▼                                                       │
│  7. Frontend updates in real-time:                         │
│     ├─ Shows deposit confirmation                          │
│     ├─ Updates balance display                             │
│     └─ Enables trading                                     │
│                                                             │
│  Parallel Watchers (3 chains simultaneously):              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Ethereum    │  │  Arbitrum    │  │  Solana      │    │
│  │  Watcher     │  │  Watcher     │  │  Watcher     │    │
│  │              │  │              │  │              │    │
│  │ Polls every  │  │ Polls every  │  │ Polls every  │    │
│  │ 12 seconds   │  │ 12 seconds   │  │ 8 seconds    │    │
│  │              │  │              │  │              │    │
│  │ RPC calls:   │  │ RPC calls:   │  │ RPC calls:   │    │
│  │ • getEvents  │  │ • getEvents  │  │ • getEvents  │    │
│  │ • getBlock   │  │ • getBlock   │  │ • getSlot    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📈 Поток торговли

```
┌─────────────────────────────────────────────────────────────┐
│                  Trading Flow (Perpetuals)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User navigates to /markets/NVDA                        │
│     │                                                       │
│     ▼                                                       │
│  2. Market page displays:                                  │
│     • Large price display (e.g., $155.00)                  │
│     • 24h change (e.g., +2.5% green)                       │
│     • Price chart (Recharts, 1D/1W/1M/1Y tabs)             │
│     • Two tabs: "Spot" and "Margin"                        │
│     │                                                       │
│     ▼                                                       │
│  3. User clicks "Margin" tab (Perpetuals)                  │
│     │                                                       │
│     ▼                                                       │
│  4. TradeForm component shows:                             │
│     • Side selector: Long / Short                          │
│     • Size input (e.g., 10 contracts)                      │
│     • Leverage slider (1x to 10x)                          │
│     • Entry price (from oracle)                            │
│     • Liquidation price (calculated)                       │
│     • Margin required (calculated)                         │
│     • Estimated P&L (on hover)                             │
│     │                                                       │
│     ▼                                                       │
│  5. User confirms trade                                    │
│     │                                                       │
│     ▼                                                       │
│  6. Frontend calls POST /api/trades                        │
│     ├─ Validates user has sufficient balance               │
│     ├─ Validates leverage <= max leverage                  │
│     └─ Sends order to backend                              │
│     │                                                       │
│     ▼                                                       │
│  7. Backend processes trade:                               │
│     ├─ Verifies user session                               │
│     ├─ Locks balance (Balance.locked += margin)            │
│     ├─ Calls Ostium connector                              │
│     │  ├─ Builds transaction                               │
│     │  ├─ Sends to Arbitrum Sepolia                        │
│     │  └─ Returns tx hash                                  │
│     ├─ Creates Position record in DB                       │
│     ├─ Creates Trade record in DB                          │
│     └─ Returns position ID + tx hash                       │
│     │                                                       │
│     ▼                                                       │
│  8. Frontend shows pending state:                          │
│     ├─ "Opening position..."                               │
│     ├─ Shows tx hash with link to Arbiscan                 │
│     └─ Polls backend for confirmation                      │
│     │                                                       │
│     ▼                                                       │
│  9. Ostium confirms transaction:                           │
│     ├─ Position is opened on Arbitrum                      │
│     ├─ Collateral locked in Ostium                         │
│     └─ Position ID returned                                │
│     │                                                       │
│     ▼                                                       │
│  10. Backend updates database:                             │
│      ├─ Position status: pending → open                    │
│      ├─ Records openTxHash                                 │
│      └─ Stores Ostium position ID                          │
│     │                                                       │
│     ▼                                                       │
│  11. Frontend shows open position:                         │
│      ├─ Position card in /positions                        │
│      ├─ Real-time P&L updates (via SSE)                    │
│      ├─ Current price from oracle                          │
│      ├─ Liquidation price                                  │
│      └─ Close button                                       │
│     │                                                       │
│     ▼                                                       │
│  12. User closes position (optional):                      │
│      ├─ Clicks "Close" button                              │
│      ├─ Backend calls Ostium to close                      │
│      ├─ Position status: open → closed                     │
│      ├─ Realized P&L calculated                            │
│      └─ Balance unlocked                                   │
│                                                             │
│  Real-time Price Updates (SSE):                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ GET /api/prices/stream (Server-Sent Events)          │ │
│  │                                                       │ │
│  │ Client connects and receives updates every 2-3s:     │ │
│  │ data: {"symbol":"NVDA","price":"155.00",...}         │ │
│  │ data: {"symbol":"AAPL","price":"220.50",...}         │ │
│  │                                                       │ │
│  │ Frontend updates:                                    │ │
│  │ • currentPrice in Position                           │ │
│  │ • unrealizedPnl (calculated)                         │ │
│  │ • liquidationPrice (recalculated)                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Интеграция с блокчейном

### Ostium (Arbitrum Perpetuals)

```
┌─────────────────────────────────────────────────────────┐
│           Ostium Connector Architecture                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  lib/connectors/ostium.ts:                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ export interface OstiumConnector {                │ │
│  │   // Get current mark price for instrument        │ │
│  │   getMarkPrice(symbol: string): Promise<string>   │
│  │                                                   │ │
│  │   // Get funding rate                             │
│  │   getFundingRate(symbol: string): Promise<string> │
│  │                                                   │ │
│  │   // Open perpetual position                      │
│  │   openPosition({                                  │
│  │     symbol: string                                │
│  │     side: 'long' | 'short'                        │
│  │     size: string                                  │
│  │     leverage: number                              │
│  │   }): Promise<{                                   │
│  │     txHash: string                                │
│  │     positionId: string                            │
│  │   }>                                              │
│  │                                                   │
│  │   // Close perpetual position                     │
│  │   closePosition(positionId: string): Promise<{   │
│  │     txHash: string                                │
│  │     realizedPnl: string                           │
│  │   }>                                              │
│  │                                                   │
│  │   // Get position details                         │
│  │   getPosition(positionId: string): Promise<{      │
│  │     size: string                                  │
│  │     entryPrice: string                            │
│  │     currentPrice: string                          │
│  │     unrealizedPnl: string                         │
│  │     liquidationPrice: string                      │
│  │   }>                                              │
│  │ }                                                 │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Usage in API:                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ // app/api/trades/route.ts                        │ │
│  │ const ostium = new OstiumConnector(                │ │
│  │   process.env.ARBITRUM_SEPOLIA_RPC,               │ │
│  │   process.env.OSTIUM_ARBITRUM_SEPOLIA             │ │
│  │ );                                                │ │
│  │                                                   │ │
│  │ const result = await ostium.openPosition({        │ │
│  │   symbol: 'NVDA',                                 │ │
│  │   side: 'long',                                   │ │
│  │   size: '10',                                     │ │
│  │   leverage: 5                                     │ │
│  │ });                                               │ │
│  │                                                   │ │
│  │ // Save to database                              │ │
│  │ await db.position.create({                        │ │
│  │   userId,                                         │ │
│  │   marketId,                                       │ │
│  │   ostiumPositionId: result.positionId,            │ │
│  │   txHash: result.txHash,                          │ │
│  │   ...                                             │ │
│  │ });                                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Arbitrum Sepolia Network:                             │
│  • RPC: https://sepolia-rollup.arbitrum.io/rpc         │
│  • Chain ID: 421614                                    │
│  • Ostium Contract: 0x...                              │
│  • Gas Token: ETH (from Ethereum Sepolia bridge)       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### CoW Protocol (EVM Swaps)

```
┌─────────────────────────────────────────────────────────┐
│        CoW Protocol Connector Architecture              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  lib/connectors/cow.ts:                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ export interface CowConnector {                   │
│  │   // Get quote for swap                           │
│  │   getQuote({                                      │
│  │     sellToken: string                             │
│  │     buyToken: string                              │
│  │     sellAmount: string                            │
│  │   }): Promise<{                                   │
│  │     buyAmount: string                             │
│  │     fee: string                                   │
│  │   }>                                              │
│  │                                                   │
│  │   // Create and sign order                        │
│  │   createOrder({                                   │
│  │     sellToken: string                             │
│  │     buyToken: string                              │
│  │     sellAmount: string                            │
│  │     buyAmount: string                             │
│  │     userAddress: string                           │
│  │   }): Promise<{                                   │
│  │     orderId: string                               │
│  │     txHash: string                                │
│  │   }>                                              │
│  │                                                   │
│  │   // Get order status                             │
│  │   getOrderStatus(orderId: string): Promise<{      │
│  │     status: 'pending' | 'fulfilled' | 'failed'    │ │
│  │     executedAmount: string                        │ │
│  │   }>                                              │
│  │ }                                                 │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Supported Networks:                                   │
│  • Ethereum Sepolia (Chain ID: 11155111)               │
│  • Arbitrum Sepolia (Chain ID: 421614)                 │
│                                                         │
│  Use Cases:                                            │
│  1. User deposits ETH, needs USDC for trading          │
│     → CoW Protocol swaps ETH → USDC                    │
│                                                         │
│  2. User has USDT, needs USDC                          │
│     → CoW Protocol swaps USDT → USDC                   │
│                                                         │
│  3. User closes position with profit in USDC           │
│     → Can swap back to original asset                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Kamino Meta-Swap (Solana Swaps)

```
┌─────────────────────────────────────────────────────────┐
│      Kamino Meta-Swap Connector Architecture            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  lib/connectors/kamino.ts:                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ export interface KaminoConnector {                │
│  │   // Get swap route                               │
│  │   getRoute({                                      │
│  │     inputMint: string                             │
│  │     outputMint: string                            │
│  │     inputAmount: string                           │
│  │   }): Promise<{                                   │
│  │     outputAmount: string                          │
│  │     priceImpact: string                           │
│  │     route: string[]                               │
│  │   }>                                              │
│  │                                                   │
│  │   // Execute swap                                 │
│  │   executeSwap({                                   │
│  │     inputMint: string                             │
│  │     outputMint: string                            │
│  │     inputAmount: string                           │
│  │     minOutputAmount: string                       │
│  │     userAddress: string                           │
│  │   }): Promise<{                                   │
│  │     txHash: string                                │
│  │     outputAmount: string                          │
│  │   }>                                              │
│  │ }                                                 │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Solana Devnet:                                        │
│  • RPC: https://api.devnet.solana.com                  │
│  • Kamino Program: ...                                 │
│  • Supported Tokens:                                   │
│    - USDC (EPjFWdd5Au...)                              │
│    - USDT (Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEqw) │
│    - SOL (native)                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Safe Multisig Vaults

```
┌─────────────────────────────────────────────────────────┐
│          Safe Multisig Vault Architecture               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Ethereum Sepolia Safe:                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Safe Contract: 0x...                              │ │
│  │ Owners: [0x..., 0x..., 0x...]                     │ │
│  │ Threshold: 2 of 3                                 │ │
│  │ Tokens: USDC, USDT                                │ │
│  │                                                   │ │
│  │ Features:                                         │ │
│  │ • Multi-signature protection                      │ │
│  │ • Timelock (optional)                             │ │
│  │ • Transaction history                             │ │
│  │ • Delegation support                              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Arbitrum Sepolia Safe:                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Safe Contract: 0x...                              │ │
│  │ Owners: [0x..., 0x..., 0x...]                     │ │
│  │ Threshold: 2 of 3                                 │ │
│  │ Tokens: USDC, USDT                                │ │
│  │                                                   │ │
│  │ Features:                                         │ │
│  │ • Multi-signature protection                      │ │
│  │ • Timelock (optional)                             │ │
│  │ • Transaction history                             │ │
│  │ • Delegation support                              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Deployment Script:                                    │
│  ┌───────────────────────────────────────────────────┐ │
│  │ // scripts/deploy-safe.ts                         │ │
│  │ import { SafeFactory } from '@safe-global/...'    │ │
│  │                                                   │ │
│  │ const safeFactory = await SafeFactory.create({    │ │
│  │   ethAdapter,                                     │ │
│  │   safeVersion: '1.4.1'                            │ │
│  │ });                                               │ │
│  │                                                   │ │
│  │ const safeSdk = await safeFactory.deploySafe({    │ │
│  │   safeAccountConfig: {                            │ │
│  │     owners: [owner1, owner2, owner3],             │ │
│  │     threshold: 2                                  │ │
│  │   }                                               │ │
│  │ });                                               │ │
│  │                                                   │ │
│  │ const safeAddress = safeSdk.getAddress();         │ │
│  │ console.log('Safe deployed at:', safeAddress);    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Solana PDA Vault

```
┌─────────────────────────────────────────────────────────┐
│         Solana PDA Vault Architecture                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Anchor Program Structure:                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ programs/vault/src/lib.rs                         │ │
│  │                                                   │ │
│  │ #[program]                                        │ │
│  │ pub mod vault {                                   │ │
│  │   pub fn initialize_vault(                        │ │
│  │     ctx: Context<InitializeVault>,                │ │
│  │     bump: u8                                      │ │
│  │   ) -> Result<()> {                               │ │
│  │     // Create PDA vault account                   │ │
│  │   }                                               │ │
│  │                                                   │ │
│  │   pub fn deposit(                                 │ │
│  │     ctx: Context<Deposit>,                        │ │
│  │     amount: u64                                   │ │
│  │   ) -> Result<()> {                               │ │
│  │     // Transfer tokens to vault                   │ │
│  │   }                                               │ │
│  │                                                   │ │
│  │   pub fn withdraw(                                │ │
│  │     ctx: Context<Withdraw>,                       │ │
│  │     amount: u64                                   │ │
│  │   ) -> Result<()> {                               │ │
│  │     // Transfer tokens from vault                 │ │
│ │   }                                               │ │
│  │ }                                                 │ │
│  │                                                   │ │
│  │ #[derive(Accounts)]                               │ │
│  │ pub struct InitializeVault<'info> {               │ │
│  │   #[account(mut)]                                 │ │
│  │   pub payer: Signer<'info>,                       │ │
│  │                                                   │ │
│  │   #[account(                                      │ │
│  │     init,                                         │ │
│  │     payer = payer,                                │ │
│  │     space = 8 + 32 + 8 + 1                        │ │
│  │   )]                                              │ │
│  │   pub vault: Account<'info, VaultState>,          │ │
│  │                                                   │ │
│  │   pub system_program: Program<'info, System>,     │ │
│  │ }                                                 │ │
│  │                                                   │ │
│  │ #[account]                                        │ │
│  │ pub struct VaultState {                           │ │
│  │   pub authority: Pubkey,                          │ │
│  │   pub balance: u64,                               │ │
│  │   pub bump: u8,                                   │ │
│  │ }                                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  PDA Derivation:                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ // Vault PDA is derived from:                     │ │
│  │ // seeds = [b"vault", authority.key().as_ref()]   │ │
│  │ // program_id = vault_program_id                  │ │
│  │                                                   │ │
│  │ const [vaultPda, bump] =                          │ │
│  │   PublicKey.findProgramAddressSync(               │ │
│  │     [Buffer.from("vault"), authority.toBuffer()], │ │
│  │     vaultProgramId                                │ │
│  │   );                                              │ │
│  │                                                   │ │
│  │ // vaultPda is the deposit address                │ │
│  │ // Users send tokens to this address              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Solana Devnet:                                        │
│  • RPC: https://api.devnet.solana.com                  │
│  • Vault Program ID: ...                               │ │
│  • Vault PDA: ...                                      │ │
│  • Supported Tokens:                                   │ │
│    - USDC (EPjFWdd5Au...)                              │ │
│    - USDT (Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEqw) │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 📊 Модель данных (Entity Relationship Diagram)

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ email       │
│ name        │
│ image       │
│ createdAt   │
│ updatedAt   │
└────┬────────┘
     │
     ├─────────────────┬──────────────────┬──────────────────┬──────────────────┐
     │                 │                  │                  │                  │
     ▼                 ▼                  ▼                  ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Account   │  │    Session   │  │    Wallet    │  │   Balance    │  │   Deposit    │
├─────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│ id (PK)     │  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │
│ userId (FK) │  │ userId (FK)  │  │ userId (FK)  │  │ userId (FK)  │  │ userId (FK)  │
│ provider    │  │ sessionToken │  │ chain        │  │ assetId (FK) │  │ assetId (FK) │
│ type        │  │ expires      │  │ address      │  │ available    │  │ chain        │
│             │  │              │  │ isPrimary    │  │ locked       │  │ amount       │
└─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │ status       │
                                                                         │ txHash       │
                                                                         │ createdAt    │
                                                                         └──────────────┘
                                                                              │
                                                                              ▼
                                                                         ┌──────────────┐
                                                                         │    Asset     │
                                                                         ├──────────────┤
                                                                         │ id (PK)      │
                                                                         │ symbol       │
                                                                         │ name         │
                                                                         │ chain        │
                                                                         │ contractAddr │
                                                                         │ decimals     │
                                                                         └──────────────┘

┌──────────────┐
│   Market     │
├──────────────┤
│ id (PK)      │
│ symbol       │
│ name         │
│ type         │
│ venue        │
│ chain        │
│ leverageMax  │
│ isActive     │
└────┬─────────┘
     │
     ├─────────────────┬──────────────────┐
     │                 │                  │
     ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Position   │  │    Trade     │  │ Withdrawal   │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ id (PK)      │  │ id (PK)      │  │ id (PK)      │
│ userId (FK)  │  │ userId (FK)  │  │ userId (FK)  │
│ marketId (FK)│  │ marketId (FK)│  │ assetId (FK) │
│ side         │  │ positionId   │  │ chain        │
│ leverage     │  │ (FK)         │  │ amount       │
│ entryPrice   │  │ type         │  │ status       │
│ currentPrice │  │ side         │  │ toAddress    │
│ size         │  │ price        │  │ createdAt    │
│ margin       │  │ size         │  │ processedAt  │
│ unrealizedPnl│  │ fee          │  └──────────────┘
│ realizedPnl  │  │ txHash       │
│ status       │  │ createdAt    │
│ createdAt    │  └──────────────┘
│ closedAt     │
└──────────────┘

┌──────────────────────┐
│ VerificationToken    │
├──────────────────────┤
│ identifier           │
│ token                │
│ expires              │
└──────────────────────┘
```

## 🔄 Компоненты и их взаимодействие

```
Frontend Components:

┌─ Layout
│  ├─ Header (Logo, User Menu, Logout)
│  ├─ Sidebar (Navigation)
│  └─ Main Content
│
├─ Auth Pages
│  ├─ /auth/signin
│  │  └─ SignInForm
│  │     ├─ GoogleOAuthButton
│  │     └─ EmailMagicLinkForm
│  └─ /auth/verify-email
│     └─ VerifyEmailForm
│
├─ Dashboard
│  ├─ PortfolioSummary
│  │  ├─ TotalBalance
│  │  ├─ TotalPnL
│  │  └─ TopUpButton
│  ├─ RecentPositions
│  │  └─ PositionCard[]
│  └─ RecentTransactions
│     └─ TransactionItem[]
│
├─ Markets
│  ├─ MarketList
│  │  └─ MarketCard[]
│  │     ├─ PriceDisplay
│  │     ├─ Change24h
│  │     └─ ChartPreview
│  └─ /markets/[symbol]
│     ├─ PriceHeader
│     │  ├─ LargePrice
│     │  ├─ Change24h
│     │  └─ LastUpdate
│     ├─ PriceChart
│     │  ├─ TimeframeTabs (1D, 1W, 1M, 1Y)
│     │  └─ Recharts Component
│     ├─ Tabs
│     │  ├─ Spot Tab
│     │  │  └─ SpotTradeForm (CoW / Kamino)
│     │  └─ Margin Tab
│     │     └─ MarginTradeForm (Ostium)
│     └─ OrderBook (optional)
│
├─ Deposit
│  └─ DepositWizard
│     ├─ Step 1: ChainSelector
│     ├─ Step 2: AssetSelector
│     ├─ Step 3: AddressDisplay
│     │  ├─ VaultAddress
│     │  ├─ QRCode
│     │  └─ CopyButton
│     └─ Step 4: Confirmation
│
├─ Positions
│  ├─ PositionList
│  │  └─ PositionCard[]
│  │     ├─ MarketInfo
│  │     ├─ SideIndicator (Long/Short)
│  │     ├─ LeverageDisplay
│  │     ├─ PnLDisplay
│  │     ├─ LiquidationPrice
│  │     └─ CloseButton
│  └─ /positions/[id]
│     ├─ PositionDetails
│     ├─ PriceChart
│     ├─ PnLChart
│     └─ ClosePositionForm
│
├─ History
│  ├─ DepositHistory
│  │  └─ DepositItem[]
│  ├─ WithdrawalHistory
│  │  └─ WithdrawalItem[]
│  └─ TradeHistory
│     └─ TradeItem[]
│
└─ Settings
   ├─ ProfileSettings
   │  ├─ EmailDisplay
   │  ├─ NameInput
   │  └─ AvatarUpload
   ├─ WalletSettings
   │  ├─ LinkedWallets
   │  │  └─ WalletItem[]
   │  └─ AddWalletForm
   │     ├─ ChainSelector
   │     ├─ AddressInput
   │     └─ SignatureVerifier
   └─ SecuritySettings
      ├─ PasswordChange
      └─ SessionManagement
```

## 🚀 Развёртывание архитектура

```
Development Environment:
┌────────────────────────────────────────┐
│ Local Machine / Sandbox                │
├────────────────────────────────────────┤
│ • Next.js dev server (port 3000)       │
│ • SQLite database (dev.db)             │
│ • Testnet RPCs (Sepolia, Devnet)       │
│ • Hot reload enabled                   │
└────────────────────────────────────────┘

Production Environment:
┌────────────────────────────────────────┐
│ Manus Platform / Custom Hosting        │
├────────────────────────────────────────┤
│ • Next.js production build             │
│ • PostgreSQL database                  │
│ • Mainnet RPCs                         │
│ • SSL/TLS enabled                      │
│ • Environment variables configured     │
│ • Monitoring & logging                 │
└────────────────────────────────────────┘
```

---

**Дата создания**: 2025-01-01
**Версия**: 1.0.0
**Статус**: MVP (Multi-chain Testnet)
