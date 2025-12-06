# API Connectors - WallStreet.ON

## Обзор

Этот документ описывает типизированные интерфейсы для подключения к внешним сервисам блокчейна. Каждый коннектор предоставляет абстракцию для работы с конкретным протоколом или сетью.

## 📁 Структура файлов

```
lib/connectors/
├── ostium.ts          # Perpetual futures на Arbitrum
├── cow.ts             # Spot swaps на EVM (Ethereum, Arbitrum)
├── kamino.ts          # Swaps на Solana
├── safe.ts            # Multisig vaults на EVM
└── solana-pda.ts      # PDA vaults на Solana
```

## 🔗 Ostium Connector (Arbitrum Perpetuals)

### Интерфейс

```typescript
// lib/connectors/ostium.ts

export interface OstiumConnector {
  /**
   * Получить текущую цену инструмента (mark price)
   * @param symbol - Символ инструмента (NVDA, AAPL, SPY и т.д.)
   * @returns Цена в виде строки (для точности)
   */
  getMarkPrice(symbol: string): Promise<string>;

  /**
   * Получить funding rate (ставка финансирования)
   * @param symbol - Символ инструмента
   * @returns Funding rate в виде процента (строка)
   */
  getFundingRate(symbol: string): Promise<string>;

  /**
   * Открыть перпетуальную позицию
   * @param params - Параметры позиции
   * @returns Хеш транзакции и ID позиции
   */
  openPosition(params: {
    symbol: string;           // NVDA, AAPL, SPY и т.д.
    side: 'long' | 'short';   // Направление
    size: string;             // Размер позиции (в контрактах)
    leverage: number;         // Плечо (1-10x)
    collateral: string;       // Залог (в USDC)
  }): Promise<{
    txHash: string;           // Хеш транзакции
    positionId: string;       // ID позиции в Ostium
  }>;

  /**
   * Закрыть перпетуальную позицию
   * @param positionId - ID позиции
   * @returns Хеш транзакции и реализованный P&L
   */
  closePosition(positionId: string): Promise<{
    txHash: string;
    realizedPnl: string;      // Реализованный P&L
  }>;

  /**
   * Получить детали позиции
   * @param positionId - ID позиции
   * @returns Детали позиции
   */
  getPosition(positionId: string): Promise<{
    size: string;             // Текущий размер
    entryPrice: string;       // Цена входа
    currentPrice: string;     // Текущая цена
    unrealizedPnl: string;    // Нереализованный P&L
    liquidationPrice: string; // Цена ликвидации
    fundingPaid: string;      // Выплаченный funding
  }>;

  /**
   * Получить список всех инструментов
   * @returns Массив доступных инструментов
   */
  getInstruments(): Promise<Array<{
    symbol: string;
    name: string;
    leverageMax: number;
    isActive: boolean;
  }>>;

  /**
   * Получить историю цен для графика
   * @param symbol - Символ инструмента
   * @param timeframe - Временной интервал (1h, 4h, 1d и т.д.)
   * @param limit - Количество свечей
   * @returns Массив OHLCV данных
   */
  getCandles(
    symbol: string,
    timeframe: string,
    limit: number
  ): Promise<Array<{
    timestamp: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>>;
}
```

### Использование в API

```typescript
// app/api/trades/route.ts

import { OstiumConnector } from '@/lib/connectors/ostium';

const ostium = new OstiumConnector(
  process.env.ARBITRUM_SEPOLIA_RPC!,
  process.env.OSTIUM_CONTRACT_ADDRESS!
);

export async function POST(req: Request) {
  const { symbol, side, size, leverage, collateral } = await req.json();

  try {
    // Открыть позицию
    const result = await ostium.openPosition({
      symbol,
      side,
      size,
      leverage,
      collateral,
    });

    // Сохранить в БД
    const position = await db.position.create({
      data: {
        userId,
        marketId,
        side,
        leverage,
        size,
        margin: collateral,
        entryPrice: await ostium.getMarkPrice(symbol),
        currentPrice: await ostium.getMarkPrice(symbol),
        ostiumPositionId: result.positionId,
        openTxHash: result.txHash,
        status: 'pending',
      },
    });

    return Response.json({
      positionId: position.id,
      txHash: result.txHash,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

### Примеры вызовов

```typescript
// Получить текущую цену
const price = await ostium.getMarkPrice('NVDA');
console.log(`NVDA: $${price}`);

// Получить funding rate
const fundingRate = await ostium.getFundingRate('AAPL');
console.log(`AAPL funding rate: ${fundingRate}%`);

// Открыть long позицию
const result = await ostium.openPosition({
  symbol: 'SPY',
  side: 'long',
  size: '10',
  leverage: 5,
  collateral: '500', // $500 USDC
});

// Получить детали позиции
const position = await ostium.getPosition(result.positionId);
console.log(`P&L: $${position.unrealizedPnl}`);
console.log(`Liquidation: $${position.liquidationPrice}`);

// Получить исторические данные
const candles = await ostium.getCandles('NVDA', '1h', 24);
```

## 🔄 CoW Protocol Connector (EVM Swaps)

### Интерфейс

```typescript
// lib/connectors/cow.ts

export interface CowConnector {
  /**
   * Получить котировку для обмена
   * @param params - Параметры обмена
   * @returns Сумма для получения и комиссия
   */
  getQuote(params: {
    sellToken: string;        // Адрес токена для продажи
    buyToken: string;         // Адрес токена для покупки
    sellAmount: string;       // Количество для продажи
    kind: 'sell' | 'buy';     // Тип ордера
  }): Promise<{
    buyAmount: string;        // Количество для получения
    fee: string;              // Комиссия
    executionPrice: string;   // Цена исполнения
  }>;

  /**
   * Создать и подписать ордер
   * @param params - Параметры ордера
   * @returns ID ордера и хеш транзакции
   */
  createOrder(params: {
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    buyAmount: string;
    userAddress: string;      // Адрес пользователя
    receiver?: string;        // Адрес получателя (опционально)
    validTo?: number;         // Время истечения (Unix timestamp)
  }): Promise<{
    orderId: string;          // ID ордера в CoW
    txHash: string;           // Хеш транзакции
  }>;

  /**
   * Получить статус ордера
   * @param orderId - ID ордера
   * @returns Статус и детали исполнения
   */
  getOrderStatus(orderId: string): Promise<{
    status: 'pending' | 'fulfilled' | 'expired' | 'cancelled' | 'failed';
    executedAmount?: string;
    executionTime?: number;
    txHash?: string;
  }>;

  /**
   * Получить доступные пары для обмена
   * @returns Массив поддерживаемых пар
   */
  getSupportedPairs(): Promise<Array<{
    sellToken: string;
    buyToken: string;
    sellDecimals: number;
    buyDecimals: number;
  }>>;
}
```

### Использование в API

```typescript
// app/api/deposits/convert/route.ts

import { CowConnector } from '@/lib/connectors/cow';

const cow = new CowConnector(
  process.env.ETHEREUM_SEPOLIA_RPC!,
  'ethereum-sepolia' // или 'arbitrum-sepolia'
);

export async function POST(req: Request) {
  const { fromToken, toToken, amount, userAddress } = await req.json();

  try {
    // Получить котировку
    const quote = await cow.getQuote({
      sellToken: fromToken,
      buyToken: toToken,
      sellAmount: amount,
      kind: 'sell',
    });

    // Создать ордер
    const order = await cow.createOrder({
      sellToken: fromToken,
      buyToken: toToken,
      sellAmount: amount,
      buyAmount: quote.buyAmount,
      userAddress,
      validTo: Math.floor(Date.now() / 1000) + 3600, // 1 час
    });

    return Response.json({
      orderId: order.orderId,
      txHash: order.txHash,
      expectedAmount: quote.buyAmount,
      fee: quote.fee,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

### Примеры вызовов

```typescript
// Получить котировку для обмена ETH на USDC
const quote = await cow.getQuote({
  sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
  buyToken: '0x1c7D4B196Cb0C6f48415490d5B921IFD3FCAB756', // USDC
  sellAmount: '1000000000000000000', // 1 ETH
  kind: 'sell',
});

// Создать ордер
const order = await cow.createOrder({
  sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  buyToken: '0x1c7D4B196Cb0C6f48415490d5B921IFD3FCAB756',
  sellAmount: '1000000000000000000',
  buyAmount: quote.buyAmount,
  userAddress: '0x...',
});

// Проверить статус
const status = await cow.getOrderStatus(order.orderId);
console.log(`Order status: ${status.status}`);
```

## 🌊 Kamino Connector (Solana Swaps)

### Интерфейс

```typescript
// lib/connectors/kamino.ts

export interface KaminoConnector {
  /**
   * Получить маршрут для обмена
   * @param params - Параметры обмена
   * @returns Маршрут и выходное количество
   */
  getRoute(params: {
    inputMint: string;        // Mint адрес входного токена
    outputMint: string;       // Mint адрес выходного токена
    inputAmount: string;      // Количество входного токена
    slippage?: number;        // Максимальный slippage (%)
  }): Promise<{
    outputAmount: string;     // Выходное количество
    minOutputAmount: string;  // Минимум с учетом slippage
    priceImpact: string;      // Влияние на цену (%)
    route: string[];          // Маршрут через пулы
    fee: string;              // Комиссия
  }>;

  /**
   * Выполнить обмен
   * @param params - Параметры обмена
   * @returns Хеш транзакции и выходное количество
   */
  executeSwap(params: {
    inputMint: string;
    outputMint: string;
    inputAmount: string;
    minOutputAmount: string;
    userAddress: string;      // Адрес пользователя
    userTokenAccount?: string; // Адрес токен-аккаунта (опционально)
  }): Promise<{
    txHash: string;
    outputAmount: string;
    fee: string;
  }>;

  /**
   * Получить цену токена в USDC
   * @param mint - Mint адрес токена
   * @returns Цена в USDC
   */
  getTokenPrice(mint: string): Promise<string>;

  /**
   * Получить список поддерживаемых токенов
   * @returns Массив токенов
   */
  getSupportedTokens(): Promise<Array<{
    mint: string;
    symbol: string;
    decimals: number;
    name: string;
  }>>;
}
```

### Использование в API

```typescript
// app/api/deposits/solana/convert/route.ts

import { KaminoConnector } from '@/lib/connectors/kamino';

const kamino = new KaminoConnector(
  process.env.SOLANA_DEVNET_RPC!
);

export async function POST(req: Request) {
  const { inputMint, outputMint, amount, userAddress } = await req.json();

  try {
    // Получить маршрут
    const route = await kamino.getRoute({
      inputMint,
      outputMint,
      inputAmount: amount,
      slippage: 1, // 1% максимум
    });

    // Выполнить обмен
    const swap = await kamino.executeSwap({
      inputMint,
      outputMint,
      inputAmount: amount,
      minOutputAmount: route.minOutputAmount,
      userAddress,
    });

    return Response.json({
      txHash: swap.txHash,
      outputAmount: swap.outputAmount,
      fee: swap.fee,
      priceImpact: route.priceImpact,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

### Примеры вызовов

```typescript
// Получить маршрут для обмена SOL на USDC
const route = await kamino.getRoute({
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5Au17Plus5XqbCye5wWYvEKStFSRJrZkQg9w', // USDC
  inputAmount: '1000000000', // 1 SOL
  slippage: 0.5,
});

// Выполнить обмен
const swap = await kamino.executeSwap({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5Au17Plus5XqbCye5wWYvEKStFSRJrZkQg9w',
  inputAmount: '1000000000',
  minOutputAmount: route.minOutputAmount,
  userAddress: userPublicKey.toString(),
});

// Получить цену
const price = await kamino.getTokenPrice('EPjFWdd5Au17Plus5XqbCye5wWYvEKStFSRJrZkQg9w');
console.log(`USDC price: $${price}`);
```

## 🔐 Safe Connector (EVM Multisig Vaults)

### Интерфейс

```typescript
// lib/connectors/safe.ts

export interface SafeConnector {
  /**
   * Получить баланс Safe
   * @param tokenAddress - Адрес токена (0x0 для нативного)
   * @returns Баланс в виде строки
   */
  getBalance(tokenAddress: string): Promise<string>;

  /**
   * Получить адрес Safe
   * @returns Адрес Safe контракта
   */
  getAddress(): Promise<string>;

  /**
   * Получить список владельцев
   * @returns Массив адресов владельцев
   */
  getOwners(): Promise<string[]>;

  /**
   * Получить пороговое значение (threshold)
   * @returns Количество подписей, необходимых для исполнения
   */
  getThreshold(): Promise<number>;

  /**
   * Создать транзакцию передачи токенов
   * @param params - Параметры транзакции
   * @returns Хеш безопасной транзакции
   */
  createTransfer(params: {
    to: string;               // Адрес получателя
    value: string;            // Количество (для нативного токена)
    tokenAddress?: string;    // Адрес токена (опционально)
    amount?: string;          // Количество токена
  }): Promise<{
    safeTxHash: string;       // Хеш транзакции для подписания
    nonce: number;            // Nonce транзакции
  }>;

  /**
   * Подписать транзакцию
   * @param safeTxHash - Хеш транзакции
   * @param signature - Подпись владельца
   * @returns Успешность подписания
   */
  signTransaction(safeTxHash: string, signature: string): Promise<boolean>;

  /**
   * Исполнить транзакцию
   * @param safeTxHash - Хеш транзакции
   * @returns Хеш исполненной транзакции
   */
  executeTransaction(safeTxHash: string): Promise<string>;

  /**
   * Получить статус транзакции
   * @param safeTxHash - Хеш транзакции
   * @returns Статус и детали
   */
  getTransactionStatus(safeTxHash: string): Promise<{
    status: 'pending' | 'signed' | 'executed' | 'failed';
    signatures: number;       // Количество подписей
    threshold: number;        // Требуемое количество подписей
    txHash?: string;          // Хеш исполненной транзакции
  }>;
}
```

### Использование в API

```typescript
// app/api/deposits/confirm/route.ts

import { SafeConnector } from '@/lib/connectors/safe';

const safe = new SafeConnector(
  process.env.ETHEREUM_SEPOLIA_RPC!,
  process.env.SAFE_ETHEREUM_SEPOLIA!
);

export async function POST(req: Request) {
  const { depositId, amount, tokenAddress } = await req.json();

  try {
    // Проверить баланс Safe
    const balance = await safe.getBalance(tokenAddress);
    if (BigInt(balance) < BigInt(amount)) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Создать транзакцию
    const transfer = await safe.createTransfer({
      to: userAddress,
      tokenAddress,
      amount,
    });

    // Сохранить в БД для подписания
    await db.safeTransaction.create({
      data: {
        depositId,
        safeTxHash: transfer.safeTxHash,
        nonce: transfer.nonce,
        status: 'pending',
      },
    });

    return Response.json({
      safeTxHash: transfer.safeTxHash,
      nonce: transfer.nonce,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

## 🏦 Solana PDA Connector (Solana Vaults)

### Интерфейс

```typescript
// lib/connectors/solana-pda.ts

export interface SolanaPdaConnector {
  /**
   * Инициализировать PDA vault
   * @param authority - Адрес authority
   * @returns Адрес PDA и bump seed
   */
  initializeVault(authority: PublicKey): Promise<{
    pdaAddress: string;
    bump: number;
  }>;

  /**
   * Получить баланс PDA
   * @param mint - Mint адрес токена
   * @returns Баланс в виде строки
   */
  getBalance(mint: string): Promise<string>;

  /**
   * Создать ордер на депозит
   * @param params - Параметры депозита
   * @returns Инструкция для подписания
   */
  createDepositInstruction(params: {
    userAddress: string;      // Адрес пользователя
    mint: string;             // Mint адрес токена
    amount: string;           // Количество
  }): Promise<{
    instruction: string;      // Закодированная инструкция
    signers: string[];        // Адреса подписантов
  }>;

  /**
   * Создать ордер на вывод
   * @param params - Параметры вывода
   * @returns Инструкция для подписания
   */
  createWithdrawInstruction(params: {
    userAddress: string;
    mint: string;
    amount: string;
  }): Promise<{
    instruction: string;
    signers: string[];
  }>;

  /**
   * Получить адрес PDA
   * @param authority - Адрес authority
   * @returns Адрес PDA
   */
  getPdaAddress(authority: PublicKey): Promise<string>;

  /**
   * Получить историю транзакций
   * @param mint - Mint адрес токена
   * @param limit - Количество записей
   * @returns Массив транзакций
   */
  getTransactionHistory(mint: string, limit: number): Promise<Array<{
    txHash: string;
    type: 'deposit' | 'withdraw';
    amount: string;
    timestamp: number;
    status: 'confirmed' | 'failed';
  }>>;
}
```

### Использование в API

```typescript
// app/api/deposits/solana/route.ts

import { SolanaPdaConnector } from '@/lib/connectors/solana-pda';
import { PublicKey } from '@solana/web3.js';

const pda = new SolanaPdaConnector(
  process.env.SOLANA_DEVNET_RPC!,
  process.env.SOLANA_VAULT_PROGRAM_ID!
);

export async function POST(req: Request) {
  const { userAddress, mint, amount } = await req.json();

  try {
    // Создать инструкцию депозита
    const depositIx = await pda.createDepositInstruction({
      userAddress,
      mint,
      amount,
    });

    // Отправить инструкцию пользователю для подписания
    return Response.json({
      instruction: depositIx.instruction,
      signers: depositIx.signers,
      pdaAddress: await pda.getPdaAddress(new PublicKey(userAddress)),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

## 🔄 Интеграция в приложение

### Пример: Полный поток депозита

```typescript
// app/api/deposits/initiate/route.ts

import { CowConnector } from '@/lib/connectors/cow';
import { SafeConnector } from '@/lib/connectors/safe';
import { KaminoConnector } from '@/lib/connectors/kamino';

export async function POST(req: Request) {
  const { chain, asset, amount, userAddress } = await req.json();

  try {
    let depositAddress: string;
    let conversionNeeded = false;

    if (chain === 'ethereum') {
      const safe = new SafeConnector(
        process.env.ETHEREUM_SEPOLIA_RPC!,
        process.env.SAFE_ETHEREUM_SEPOLIA!
      );
      depositAddress = await safe.getAddress();
    } else if (chain === 'arbitrum') {
      const safe = new SafeConnector(
        process.env.ARBITRUM_SEPOLIA_RPC!,
        process.env.SAFE_ARBITRUM_SEPOLIA!
      );
      depositAddress = await safe.getAddress();
    } else if (chain === 'solana') {
      const pda = new SolanaPdaConnector(
        process.env.SOLANA_DEVNET_RPC!,
        process.env.SOLANA_VAULT_PROGRAM_ID!
      );
      depositAddress = await pda.getPdaAddress(new PublicKey(userAddress));
    }

    // Сохранить в БД
    const deposit = await db.deposit.create({
      data: {
        userId,
        assetId,
        chain,
        amount,
        toAddress: depositAddress,
        status: 'pending',
      },
    });

    return Response.json({
      depositId: deposit.id,
      depositAddress,
      amount,
      asset,
      chain,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

## 📝 Примечания

- Все коннекторы используют строки для представления больших чисел (для точности)
- RPC endpoints должны быть установлены в переменных окружения
- Все адреса должны быть в правильном формате для соответствующей сети
- Обработка ошибок должна быть реализована на уровне приложения
- Кэширование результатов рекомендуется для часто используемых данных (цены, баланс)

---

**Дата создания**: 2025-01-01
**Версия**: 1.0.0
