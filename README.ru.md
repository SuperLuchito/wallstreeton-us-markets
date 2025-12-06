# WallStreet.ON — Платформа для торговли акциями и сырьевыми товарами

**WallStreet.ON** — это децентрализованная платформа для торговли американскими акциями и сырьевыми товарами через перпетуальные контракты Ostium на блокчейне Arbitrum. Платформа поддерживает многоцепочечное финансирование через CoW Protocol (EVM) и Kamino Meta-Swap (Solana), а также управление активами через защищённые хранилища (Safe на EVM, PDA на Solana).

## 🌟 Основные возможности

### Торговля
- **Перпетуальные контракты на Arbitrum**: Торговля акциями и сырьём через Ostium с использованием кредитного плеча
- **Поддерживаемые инструменты**:
  - **Акции**: NVDA, AAPL, MSFT
  - **Индексы**: SPY, QQQ
  - **Сырьё**: XAUUSD (золото), XAGUSD (серебро), WTI (нефть), BRENT (нефть Брент)

### Финансирование
- **Многоцепочечная поддержка**: Ethereum Sepolia, Arbitrum Sepolia, Solana Devnet
- **CoW Protocol**: Безопасный обмен активов на EVM-сетях
- **Kamino Meta-Swap**: Агрегатор обменов для Solana
- **Безопасное хранилище**: Safe multisig на EVM, PDA на Solana (бизнес-хранилища, не пользовательские кошельки)

### Аутентификация
- **Google OAuth**: Быстрый вход через Google
- **Email Magic Links**: Вход по ссылке в письме (режим разработки логирует ссылки в консоль)

### Интерфейс
- **Perplexity-стиль**: Большие цены, изменения за 24 часа, вкладки временных периодов (1D/1W/1M/1Y)
- **Реал-тайм графики**: Обновление цен через Server-Sent Events (SSE)
- **Портфель**: Отслеживание позиций, баланса и истории транзакций

## 🏗️ Архитектура

### Стек технологий
- **Frontend**: Next.js 14 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, tRPC (опционально)
- **База данных**: SQLite (разработка), PostgreSQL (production)
- **ORM**: Prisma
- **UI**: shadcn/ui, Recharts, Lucide Icons
- **Блокчейн**: ethers.js v6, wagmi, viem, @solana/web3.js

### Модель данных

```
User (Пользователь)
├── Account (OAuth аккаунты)
├── Session (Сессии)
├── Wallet (Кошельки по цепям)
├── Balance (Балансы активов)
├── Deposit (Депозиты)
├── Withdrawal (Выводы)
├── Position (Открытые позиции)
└── Trade (История сделок)

Asset (Активы: USDC, USDT)
├── chain: ethereum | arbitrum | solana
├── contractAddress: адрес контракта
└── decimals: количество знаков

Market (Рынки: акции, сырьё)
├── symbol: NVDA, AAPL, SPY, XAUUSD и т.д.
├── type: perp (перпетуальные)
├── venue: ostium (Arbitrum)
└── leverageMax: максимальное плечо
```

### Поток данных

```
┌─────────────────────────────────────────────────────────────┐
│                    WallStreet.ON                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Frontend (Next.js 14 + React 19)                    │  │
│  │  ├─ Страница входа (Google OAuth / Email)           │  │
│  │  ├─ Дашборд (портфель, балансы)                     │  │
│  │  ├─ Страницы инструментов (графики, торговля)       │  │
│  │  ├─ Мастер пополнения (QR коды, адреса)             │  │
│  │  └─ История транзакций                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API (Next.js Routes / tRPC)                         │  │
│  │  ├─ /api/auth/* (NextAuth)                           │  │
│  │  ├─ /api/wallets/* (управление кошельками)          │  │
│  │  ├─ /api/balances/* (балансы)                        │  │
│  │  ├─ /api/deposits/* (депозиты)                       │  │
│  │  ├─ /api/trades/* (торговля)                         │  │
│  │  └─ /api/prices/* (цены в реал-тайме)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  База данных (SQLite / PostgreSQL)                   │  │
│  │  ├─ Пользователи и сессии                            │  │
│  │  ├─ Кошельки и балансы                               │  │
│  │  ├─ Депозиты и выводы                                │  │
│  │  ├─ Позиции и сделки                                 │  │
│  │  └─ Рынки и активы                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │ Ethereum    │  │ Arbitrum    │  │ Solana      │
   │ Sepolia     │  │ Sepolia     │  │ Devnet      │
   ├─────────────┤  ├─────────────┤  ├─────────────┤
   │ Safe Vault  │  │ Safe Vault  │  │ PDA Vault   │
   │ (multisig)  │  │ (multisig)  │  │ (program)   │
   │             │  │             │  │             │
   │ CoW Proto.  │  │ Ostium      │  │ Kamino      │
   │ (swap)      │  │ (perps)     │  │ (swap)      │
   └─────────────┘  └─────────────┘  └─────────────┘
```

### Поток аутентификации

```
1. Пользователь → Нажимает "Sign in with Google" или вводит email
                  ↓
2. NextAuth       → Перенаправляет на Google OAuth / отправляет email
                  ↓
3. Google / Email → Возвращает код подтверждения
                  ↓
4. NextAuth       → Создаёт сессию в БД (Prisma Adapter)
                  ↓
5. Frontend       → Получает session cookie, показывает дашборд
                  ↓
6. API Calls      → Все запросы включают session cookie
```

### Поток депозита

```
1. Пользователь → Нажимает "Top Up" на дашборде
                  ↓
2. Мастер        → Выбирает цепь (Ethereum / Arbitrum / Solana)
                  ↓
3. Мастер        → Выбирает актив (USDC / USDT)
                  ↓
4. Мастер        → Показывает адрес хранилища + QR код
                  ↓
5. Пользователь  → Отправляет средства со своего кошелька
                  ↓
6. Watcher       → Слушает события на цепи (3 цепи параллельно)
                  ↓
7. Watcher       → Подтверждает депозит после N блоков
                  ↓
8. Backend       → Обновляет Balance в БД
                  ↓
9. Frontend      → Показывает новый баланс пользователю
```

### Поток торговли

```
1. Пользователь → Выбирает инструмент (NVDA, SPY, XAUUSD и т.д.)
                  ↓
2. Инструмент    → Показывает график, текущую цену, 24h изменение
                  ↓
3. Пользователь → Выбирает "Margin" (перпетуальные контракты)
                  ↓
4. Форма торговли → Вводит размер позиции, плечо, тип ордера
                  ↓
5. Backend       → Вызывает Ostium (Arbitrum) для открытия позиции
                  ↓
6. Ostium        → Создаёт перпетуальный контракт
                  ↓
7. Backend       → Сохраняет Position в БД
                  ↓
8. Frontend      → Показывает открытую позицию, P&L в реал-тайме
```

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm / yarn / pnpm / bun
- Git

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/SuperLuchito/wallstreeton-us-markets.git
cd wallstreeton-us-markets

# Установить зависимости
pnpm install

# Создать .env.local из .env.example
cp .env.example .env.local

# Заполнить переменные окружения (см. раздел ниже)
```

### Переменные окружения

Создайте файл `.env.local` с следующими переменными:

```bash
# Database (SQLite для разработки, PostgreSQL для production)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (получить на https://console.cloud.google.com/)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (для magic links в режиме разработки)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@wallstreeton.on"

# RPC Endpoints (тестовые сети)
ETHEREUM_SEPOLIA_RPC="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
ARBITRUM_SEPOLIA_RPC="https://sepolia-rollup.arbitrum.io/rpc"
SOLANA_DEVNET_RPC="https://api.devnet.solana.com"

# Safe Deployment (адреса развёрнутых Safe контрактов)
SAFE_ETHEREUM_SEPOLIA="0x..."
SAFE_ARBITRUM_SEPOLIA="0x..."

# Solana PDA Vault (адрес программы)
SOLANA_VAULT_PROGRAM_ID="..."

# Ostium (Arbitrum Perpetuals)
OSTIUM_ARBITRUM_SEPOLIA="0x..."

# Kamino (Solana Swaps)
KAMINO_PROGRAM_ID="..."

# CoW Protocol (EVM Swaps)
COW_SETTLEMENT_CONTRACT="0x..."
```

### Запуск в разработке

```bash
# Инициализировать базу данных
pnpm prisma:dev:sqlite

# Заполнить базу тестовыми данными
pnpm prisma:seed:sqlite

# Запустить dev сервер
pnpm dev

# Открыть http://localhost:3000
```

### Запуск в production

```bash
# Собрать проект
pnpm build

# Запустить
pnpm start
```

## 📚 API Документация

### Аутентификация

#### `POST /api/auth/signin`
Вход в систему через Google OAuth или Email magic link.

**Параметры:**
- `provider`: "google" | "email"
- `email` (для email): адрес электронной почты
- `callbackUrl`: URL для перенаправления после входа

**Ответ:**
```json
{
  "url": "https://accounts.google.com/...",
  "ok": true
}
```

#### `GET /api/auth/session`
Получить текущую сессию пользователя.

**Ответ:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://..."
  },
  "expires": "2025-12-31T23:59:59Z"
}
```

#### `POST /api/auth/signout`
Выход из системы.

### Кошельки

#### `GET /api/wallets`
Получить все кошельки пользователя.

**Ответ:**
```json
[
  {
    "id": "uuid",
    "chain": "ethereum",
    "address": "0x...",
    "isPrimary": true
  },
  {
    "id": "uuid",
    "chain": "arbitrum",
    "address": "0x...",
    "isPrimary": false
  }
]
```

#### `POST /api/wallets`
Добавить новый кошелёк.

**Параметры:**
```json
{
  "chain": "ethereum" | "arbitrum" | "solana",
  "address": "0x... или адрес Solana",
  "signature": "подпись для верификации"
}
```

### Балансы

#### `GET /api/balances`
Получить все балансы пользователя.

**Ответ:**
```json
[
  {
    "assetId": "uuid",
    "asset": {
      "symbol": "USDC",
      "chain": "ethereum",
      "decimals": 6
    },
    "available": "1000.000000",
    "locked": "100.000000"
  }
]
```

### Депозиты

#### `GET /api/deposits`
Получить историю депозитов.

**Ответ:**
```json
[
  {
    "id": "uuid",
    "asset": {
      "symbol": "USDC",
      "chain": "ethereum"
    },
    "amount": "1000.000000",
    "status": "confirmed",
    "txHash": "0x...",
    "createdAt": "2025-01-01T12:00:00Z"
  }
]
```

#### `POST /api/deposits`
Создать новый депозит (инициировать отслеживание).

**Параметры:**
```json
{
  "assetId": "uuid",
  "chain": "ethereum" | "arbitrum" | "solana",
  "amount": "1000.000000",
  "txHash": "0x...",
  "fromAddress": "0x..."
}
```

### Позиции и торговля

#### `GET /api/positions`
Получить все открытые позиции.

**Ответ:**
```json
[
  {
    "id": "uuid",
    "market": {
      "symbol": "NVDA",
      "name": "NVIDIA Corporation"
    },
    "side": "long",
    "leverage": 5,
    "size": "10",
    "entryPrice": "150.50",
    "currentPrice": "155.00",
    "margin": "300.00",
    "unrealizedPnl": "45.00",
    "status": "open"
  }
]
```

#### `POST /api/trades`
Открыть новую позицию.

**Параметры:**
```json
{
  "marketId": "uuid",
  "side": "long" | "short",
  "leverage": 5,
  "size": "10",
  "type": "market" | "limit",
  "price": "150.50"
}
```

**Ответ:**
```json
{
  "positionId": "uuid",
  "txHash": "0x...",
  "status": "pending"
}
```

#### `POST /api/trades/close`
Закрыть позицию.

**Параметры:**
```json
{
  "positionId": "uuid"
}
```

### Цены (реал-тайм)

#### `GET /api/prices`
Получить текущие цены всех инструментов.

**Ответ:**
```json
[
  {
    "symbol": "NVDA",
    "price": "155.00",
    "change24h": "2.5",
    "changePercent24h": "1.64",
    "timestamp": "2025-01-01T12:00:00Z"
  }
]
```

#### `GET /api/prices/stream` (SSE)
Получить поток цен в реал-тайме.

```bash
curl -N http://localhost:3000/api/prices/stream
```

**Формат ответа:**
```
data: {"symbol":"NVDA","price":"155.00","timestamp":"2025-01-01T12:00:00Z"}
data: {"symbol":"AAPL","price":"220.50","timestamp":"2025-01-01T12:00:01Z"}
```

## 🔗 Интеграции с блокчейном

### Ostium (Arbitrum Perpetuals)

Ostium позволяет торговать перпетуальными контрактами на американские акции и сырьевые товары на Arbitrum.

**Поддерживаемые инструменты:**
- NVDA, AAPL, MSFT (акции)
- SPY, QQQ (индексы)
- XAUUSD, XAGUSD (драгоценные металлы)
- WTI, BRENT (нефть)

**Документация:** [Ostium Docs](https://ostium.fi)

### CoW Protocol (EVM Swaps)

CoW Protocol обеспечивает безопасный обмен активов на Ethereum и Arbitrum для пополнения торговых счётов.

**Документация:** [CoW Protocol Docs](https://docs.cow.fi)

### Kamino Meta-Swap (Solana Swaps)

Kamino — это агрегатор обменов на Solana для конвертации активов.

**Документация:** [Kamino Docs](https://kamino.finance)

### Safe (Multisig Vaults)

Safe используется для управления хранилищами активов на Ethereum и Arbitrum с требованием нескольких подписей.

**Документация:** [Safe Docs](https://safe.global)

### Solana PDA (Program Derived Accounts)

На Solana используется PDA (Program Derived Account) для безопасного хранения активов.

**Документация:** [Solana Anchor Docs](https://www.anchor-lang.com)

## 🌉 Руководство по мостам (Bridges)

Для перевода активов между цепями используйте следующие мосты:

### EVM ↔ EVM (Ethereum ↔ Arbitrum)

**Stargate:**
- Сайт: https://stargate.finance
- Поддерживаемые активы: USDC, USDT
- Время: 10-30 минут

**Across:**
- Сайт: https://across.to
- Поддерживаемые активы: USDC, USDT, DAI
- Время: 2-10 минут

### EVM ↔ Solana

**Wormhole:**
- Сайт: https://wormhole.com
- Поддерживаемые активы: USDC, USDT, ETH
- Время: 5-15 минут

**Инструкции:**
1. Перейти на сайт моста
2. Выбрать исходную цепь и целевую цепь
3. Выбрать актив и количество
4. Подключить кошелёк
5. Подтвердить транзакцию
6. Дождаться подтверждения (время зависит от моста)

## 🧪 Тестирование

### Получение тестовых токенов

**Ethereum Sepolia:**
- Faucet: https://sepoliafaucet.com
- Получить: ETH для газа

**Arbitrum Sepolia:**
- Faucet: https://faucet.arbitrum.io
- Получить: ETH для газа

**Solana Devnet:**
```bash
solana airdrop 10 <your-wallet-address> --url devnet
```

### Запуск тестов

```bash
# Unit тесты (если добавлены)
pnpm test

# E2E тесты (если добавлены)
pnpm test:e2e
```

## 📦 Развёртывание

### Развёртывание Safe на Ethereum Sepolia

```bash
# Установить Safe CLI
npm install -g @safe-global/safe-cli

# Развернуть Safe
safe-cli deploy \
  --chain sepolia \
  --owners 0x... 0x... \
  --threshold 2
```

### Развёртывание Safe на Arbitrum Sepolia

```bash
safe-cli deploy \
  --chain arbitrum-sepolia \
  --owners 0x... 0x... \
  --threshold 2
```

### Развёртывание Solana PDA Vault

```bash
# Установить Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Развернуть программу
anchor deploy --provider.cluster devnet
```

## 📊 Мониторинг и отладка

### Просмотр логов базы данных

```bash
# Открыть Prisma Studio
pnpm prisma:studio
```

### Просмотр логов сервера

```bash
# Логи dev сервера выводятся в консоль
pnpm dev
```

### Отладка транзакций

**Ethereum Sepolia:**
- Блокчейн-обозреватель: https://sepolia.etherscan.io

**Arbitrum Sepolia:**
- Блокчейн-обозреватель: https://sepolia.arbiscan.io

**Solana Devnet:**
- Блокчейн-обозреватель: https://explorer.solana.com/?cluster=devnet

## 🤝 Вклад

Мы приветствуем вклады! Пожалуйста:

1. Форкните репозиторий
2. Создайте ветку для вашей функции (`git checkout -b feature/amazing-feature`)
3. Коммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Пушьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License — см. файл [LICENSE](LICENSE) для деталей.

## 📞 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте [Issues](https://github.com/SuperLuchito/wallstreeton-us-markets/issues)
2. Создайте новый Issue с описанием проблемы
3. Свяжитесь с командой разработки

## 🗺️ Дорожная карта

### MVP (текущая версия)
- ✅ Аутентификация (Google OAuth + Email)
- ✅ Управление кошельками
- ✅ Депозиты и выводы
- ✅ Торговля перпетуальными контрактами
- ✅ Портфель и история
- 🚧 Интеграции с блокчейном (в процессе)

### Q2 2025
- [ ] Mainnet развёртывание
- [ ] Мобильное приложение
- [ ] Расширенная аналитика
- [ ] Социальная торговля

### Q3 2025
- [ ] Дополнительные инструменты (крипто, форекс)
- [ ] API для трейдеров
- [ ] Автоматизированные стратегии

---

**WallStreet.ON** — децентрализованная торговля, доступная каждому.
