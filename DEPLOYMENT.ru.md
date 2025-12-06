# Руководство по развёртыванию - WallStreet.ON

## 📋 Предварительные требования

### Инструменты
- Node.js 18+
- pnpm (или npm/yarn)
- Git
- Foundry (для Solidity контрактов)
- Anchor (для Solana программ)

### Аккаунты и ключи
- Ethereum Sepolia testnet ETH (для газа)
- Arbitrum Sepolia testnet ETH (для газа)
- Solana Devnet SOL (для газа)
- Приватные ключи для развёртывания (минимум 2 для Safe multisig)

## 🌐 Сетевая конфигурация

### Ethereum Sepolia
```
Network: Ethereum Sepolia Testnet
Chain ID: 11155111
RPC: https://sepolia.infura.io/v3/{INFURA_KEY}
Explorer: https://sepolia.etherscan.io
Faucet: https://sepoliafaucet.com
```

### Arbitrum Sepolia
```
Network: Arbitrum Sepolia Testnet
Chain ID: 421614
RPC: https://sepolia-rollup.arbitrum.io/rpc
Explorer: https://sepolia.arbiscan.io
Faucet: https://faucet.arbitrum.io
```

### Solana Devnet
```
Network: Solana Devnet
RPC: https://api.devnet.solana.com
Explorer: https://explorer.solana.com/?cluster=devnet
Faucet: Встроенный (solana airdrop)
```

## 🔑 Управление ключами

### Создание ключей для Ethereum/Arbitrum

```bash
# Создать новый приватный ключ (используя OpenSSL)
openssl rand -hex 32

# Или использовать ethers.js
node -e "const ethers = require('ethers'); console.log(ethers.Wallet.createRandom().privateKey)"
```

### Создание ключей для Solana

```bash
# Установить Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Создать новый keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Получить публичный ключ
solana-keygen pubkey ~/.config/solana/id.json

# Получить тестовые SOL
solana airdrop 10 <your-public-key> --url devnet
```

## 🏗️ Развёртывание Safe на Ethereum Sepolia

### 1. Установить Safe CLI

```bash
npm install -g @safe-global/safe-cli
```

### 2. Создать конфигурацию

```bash
# Создать директорию для конфигурации
mkdir -p ~/.safe-cli

# Создать конфиг файл
cat > ~/.safe-cli/config.json << 'EOF'
{
  "rpc": "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  "chainId": 11155111,
  "safeAddress": "0x...",
  "ownerAddress": "0x..."
}
EOF
```

### 3. Развернуть Safe

```bash
# Используя Safe Factory
safe-cli deploy \
  --chain sepolia \
  --owners 0xOwner1 0xOwner2 0xOwner3 \
  --threshold 2 \
  --salt 1234567890

# Результат:
# Safe deployed at: 0xSafeAddress
```

### 4. Сохранить адрес в .env

```bash
SAFE_ETHEREUM_SEPOLIA="0xSafeAddress"
```

## 🏗️ Развёртывание Safe на Arbitrum Sepolia

```bash
# Аналогично Ethereum, но с другой сетью
safe-cli deploy \
  --chain arbitrum-sepolia \
  --owners 0xOwner1 0xOwner2 0xOwner3 \
  --threshold 2 \
  --salt 1234567890
```

### Сохранить адрес в .env

```bash
SAFE_ARBITRUM_SEPOLIA="0xSafeAddress"
```

## 🏦 Развёртывание Solana PDA Vault

### 1. Создать Anchor проект

```bash
# Установить Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Создать новый проект
anchor init vault --typescript
cd vault
```

### 2. Написать программу

```rust
// programs/vault/src/lib.rs

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

declare_id!("YOUR_PROGRAM_ID");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        bump: u8,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.bump = bump;
        vault.balance = 0;
        Ok(())
    }

    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {
        let transfer_instruction = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
            ),
            amount,
        )?;
        
        let vault = &mut ctx.accounts.vault;
        vault.balance = vault.balance.checked_add(amount).unwrap();
        Ok(())
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.balance >= amount, CustomError::InsufficientBalance);

        let transfer_instruction = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        
        let seeds = &[b"vault", vault.authority.as_ref(), &[vault.bump]];
        let signer_seeds = &[&seeds[..]];
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
                signer_seeds,
            ),
            amount,
        )?;
        
        vault.balance = vault.balance.checked_sub(amount).unwrap();
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 8 + 1,
        seeds = [b"vault", payer.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, VaultState>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, VaultState>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump,
        constraint = vault.authority == user.key()
    )]
    pub vault: Account<'info, VaultState>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct VaultState {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

#[error_code]
pub enum CustomError {
    #[msg("Insufficient balance")]
    InsufficientBalance,
}
```

### 3. Развернуть программу

```bash
# Установить переменные окружения
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
export ANCHOR_WALLET="~/.config/solana/id.json"

# Собрать программу
anchor build

# Развернуть на Devnet
anchor deploy --provider.cluster devnet

# Результат:
# Program ID: YOUR_PROGRAM_ID
```

### 4. Сохранить Program ID в .env

```bash
SOLANA_VAULT_PROGRAM_ID="YOUR_PROGRAM_ID"
```

## 🔗 Развёртывание Ostium контракта (Arbitrum)

### 1. Получить адрес контракта

Ostium уже развёрнут на Arbitrum Sepolia. Просто сохраните адрес:

```bash
# Arbitrum Sepolia
OSTIUM_ARBITRUM_SEPOLIA="0x..." # Получить с официального сайта Ostium
```

## 🔄 Развёртывание CoW Protocol (EVM)

CoW Protocol уже развёрнут на всех основных сетях. Просто используйте SDK:

```bash
# Не требует развёртывания, используйте SDK напрямую
COW_SETTLEMENT_CONTRACT="0x9008D19f58AAbD9eD0D60971565AA8510560ab41" # Ethereum Sepolia
```

## 🌊 Развёртывание Kamino (Solana)

Kamino уже развёрнут на Solana Devnet. Просто используйте SDK:

```bash
# Не требует развёртывания
KAMINO_PROGRAM_ID="KLend2g3cP87fffoy2pfkq91pLm1JqKiHfaAy7TWc" # Solana Devnet
```

## 📝 Конфигурация переменных окружения

### Создать .env.local

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID="your-google-client-id"
GOOGLE_OAUTH_CLIENT_SECRET="your-google-client-secret"

# Email (для magic links)
EMAIL_DEV_MODE="true"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@wallstreeton.on"

# RPC Endpoints
ETHEREUM_SEPOLIA_RPC="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
ARBITRUM_SEPOLIA_RPC="https://sepolia-rollup.arbitrum.io/rpc"
SOLANA_DEVNET_RPC="https://api.devnet.solana.com"

# Safe Deployments
SAFE_ETHEREUM_SEPOLIA="0x..."
SAFE_ARBITRUM_SEPOLIA="0x..."

# Solana PDA Vault
SOLANA_VAULT_PROGRAM_ID="..."

# Ostium (Arbitrum Perpetuals)
OSTIUM_ARBITRUM_SEPOLIA="0x..."

# Kamino (Solana Swaps)
KAMINO_PROGRAM_ID="..."

# CoW Protocol
COW_SETTLEMENT_CONTRACT="0x..."

# Private Keys (для автоматического развёртывания)
DEPLOYER_PRIVATE_KEY="0x..."
SAFE_OWNER_1_PRIVATE_KEY="0x..."
SAFE_OWNER_2_PRIVATE_KEY="0x..."
SAFE_OWNER_3_PRIVATE_KEY="0x..."
```

## 🚀 Запуск приложения

### Разработка

```bash
# Установить зависимости
pnpm install

# Инициализировать БД
pnpm prisma:dev:sqlite

# Заполнить БД тестовыми данными
pnpm prisma:seed:sqlite

# Запустить dev сервер
pnpm dev

# Открыть http://localhost:3001
```

### Production

```bash
# Собрать проект
pnpm build

# Запустить production сервер
pnpm start

# Или использовать PM2 для управления процессом
pm2 start "pnpm start" --name "wallstreeton"
pm2 save
pm2 startup
```

## 🔍 Проверка развёртывания

### 1. Проверить Safe на Ethereum Sepolia

```bash
curl "https://sepolia.infura.io/v3/YOUR_INFURA_KEY" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0xSafeAddress","latest"],
    "id":1
  }'
```

### 2. Проверить Safe на Arbitrum Sepolia

```bash
curl "https://sepolia-rollup.arbitrum.io/rpc" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0xSafeAddress","latest"],
    "id":1
  }'
```

### 3. Проверить Solana PDA

```bash
solana account <PDA_ADDRESS> --url devnet
```

## 📊 Мониторинг

### Логи приложения

```bash
# Просмотр логов dev сервера
tail -f /tmp/wallstreeton-dev.log

# Просмотр логов production
pm2 logs wallstreeton
```

### Мониторинг базы данных

```bash
# Открыть Prisma Studio
pnpm prisma:studio
```

### Мониторинг блокчейна

**Ethereum Sepolia**: https://sepolia.etherscan.io
**Arbitrum Sepolia**: https://sepolia.arbiscan.io
**Solana Devnet**: https://explorer.solana.com/?cluster=devnet

## 🔄 Обновление контрактов

### Обновить Solana программу

```bash
# Изменить код в programs/vault/src/lib.rs
# Собрать
anchor build

# Развернуть обновление
anchor deploy --provider.cluster devnet
```

### Обновить Safe конфигурацию

```bash
# Изменить владельцев или threshold
safe-cli update-owners \
  --owners 0xNewOwner1 0xNewOwner2 \
  --threshold 2
```

## 🐛 Отладка

### Проверить транзакцию на Ethereum Sepolia

```bash
# Перейти на https://sepolia.etherscan.io
# Вставить tx hash в поисковую строку
```

### Проверить транзакцию на Arbitrum Sepolia

```bash
# Перейти на https://sepolia.arbiscan.io
# Вставить tx hash в поисковую строку
```

### Проверить транзакцию на Solana Devnet

```bash
solana confirm <TX_HASH> --url devnet -v
```

## ✅ Чеклист развёртывания

- [ ] Получить тестовые ETH на Ethereum Sepolia
- [ ] Получить тестовые ETH на Arbitrum Sepolia
- [ ] Получить тестовые SOL на Solana Devnet
- [ ] Развернуть Safe на Ethereum Sepolia
- [ ] Развернуть Safe на Arbitrum Sepolia
- [ ] Развернуть Solana PDA программу
- [ ] Заполнить переменные окружения в .env.local
- [ ] Запустить dev сервер и проверить работу
- [ ] Проверить подключение к RPC endpoints
- [ ] Проверить работу депозитов на всех 3 цепях
- [ ] Проверить работу торговли на Ostium
- [ ] Проверить работу обменов через CoW и Kamino

---

**Дата создания**: 2025-01-01
**Версия**: 1.0.0
