# WallStreet.ON - Implementation Status

## ✅ Completed in This Session

### 1. Project Foundation
- ✅ Next.js 14 with App Router + TypeScript + Tailwind CSS
- ✅ Prisma ORM with SQLite (sandbox) and PostgreSQL schema (production-ready)
- ✅ Database schema with all required models (User, Account, Session, Wallet, Asset, Market, Balance, Deposit, Withdrawal, Position, Trade)
- ✅ Seeded with 9 markets (NVDA, AAPL, MSFT, SPY, QQQ, XAUUSD, XAGUSD, WTI, BRENT)
- ✅ Seeded with 6 assets (USDC/USDT on Ethereum, Arbitrum, Solana)

### 2. UI/UX (Perplexity-Style)
- ✅ shadcn/ui components (Card, Button, Badge)
- ✅ Recharts integration for price charts
- ✅ Responsive design with Tailwind v4
- ✅ Color-coded market cards (stocks/indices/commodities)
- ✅ Market detail pages with big price display
- ✅ Timeframe tabs (1D, 1W, 1M, 1Y)
- ✅ Gradient backgrounds and modern styling

### 3. Authentication Setup
- ✅ NextAuth configuration with Google + Email providers
- ✅ Prisma Adapter integrated
- ✅ Dev email mode (logs magic links to console)
- ✅ Auth configuration files created

### 4. Dependencies Installed
- ✅ next-auth@beta with @auth/prisma-adapter
- ✅ wagmi + viem + @web3modal/wagmi (EVM wallet connect)
- ✅ @solana/wallet-adapter-* (Solana wallet connect)
- ✅ @safe-global/protocol-kit + api-kit (Safe deployment)
- ✅ ethers v6, zod, qrcode, bs58, tweetnacl
- ✅ recharts, lucide-react, tailwindcss-animate

## 📋 Implementation Guide for Remaining Features

### Phase 1: Complete Authentication (30-45 min)

**Files to create:**

1. **app/auth/signin/page.tsx** - Sign-in page
```typescript
import { getProviders } from "next-auth/react";
import SignInForm from "@/components/auth/SignInForm";

export default async function SignInPage() {
  const providers = await getProviders();
  return <SignInForm providers={providers} />;
}
```

2. **components/auth/SignInForm.tsx** - Client component for auth
```typescript
"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignInForm({ providers }) {
  const [email, setEmail] = useState("");
  
  return (
    <div className="max-w-md mx-auto p-6">
      {/* Google OAuth */}
      <Button onClick={() => signIn("google", { callbackUrl: "/" })}>
        Sign in with Google
      </Button>
      
      {/* Email Magic Link */}
      <Input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <Button onClick={() => signIn("email", { email, callbackUrl: "/" })}>
        Send Magic Link
      </Button>
    </div>
  );
}
```

3. **Update app/layout.tsx** - Add SessionProvider
```typescript
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

4. **components/Header.tsx** - Show user + Top Up button
```typescript
"use client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { data: session } = useSession();
  
  return (
    <header>
      {session?.user && (
        <>
          <span>{session.user.email}</span>
          <Button onClick={() => setShowTopUp(true)}>Top Up</Button>
        </>
      )}
    </header>
  );
}
```

**Environment Setup:**
- Set `NEXTAUTH_URL=http://localhost:3000`
- Set `NEXTAUTH_SECRET=` (generate with `openssl rand -base64 32`)
- Set `EMAIL_DEV_MODE=true` for console logging
- Google OAuth: Get credentials from https://console.cloud.google.com/
  - Add redirect URI: `http://localhost:3000/api/auth/callback/google`

---

### Phase 2: Wallet Linking (45-60 min)

**1. EVM Wallet Linking (web3modal + wagmi)**

Create `lib/wagmi-config.ts`:
```typescript
import { createConfig, http } from "wagmi";
import { sepolia, arbitrumSepolia } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [sepolia, arbitrumSepolia],
  transports: {
    [sepolia.id]: http(process.env.ETH_RPC),
    [arbitrumSepolia.id]: http(process.env.ARBITRUM_RPC),
  },
});
```

Create `app/api/wallet/link-evm/route.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import { verifyMessage } from "ethers";

export async function POST(req: Request) {
  const { userId, chain, address, signature, nonce } = await req.json();
  
  // Verify signature
  const message = `Link wallet to WallStreet.ON\\nNonce: ${nonce}`;
  const recovered = verifyMessage(message, signature);
  
  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  
  // Store wallet
  await prisma.wallet.upsert({
    where: { userId_chain_address: { userId, chain, address } },
    create: { userId, chain, address, signature, nonce },
    update: { signature, nonce },
  });
  
  return Response.json({ success: true });
}
```

**2. Solana Wallet Linking**

Create `app/api/wallet/link-solana/route.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import nacl from "tweetnacl";
import bs58 from "bs58";

export async function POST(req: Request) {
  const { userId, address, signature, nonce } = await req.json();
  
  // Verify signature
  const message = new TextEncoder().encode(`Link wallet to WallStreet.ON\\nNonce: ${nonce}`);
  const signatureBytes = bs58.decode(signature);
  const publicKeyBytes = bs58.decode(address);
  
  const verified = nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);
  
  if (!verified) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  
  // Store wallet
  await prisma.wallet.upsert({
    where: { userId_chain_address: { userId, chain: "solana", address } },
    create: { userId, chain: "solana", address, signature, nonce },
    update: { signature, nonce },
  });
  
  return Response.json({ success: true });
}
```

---

### Phase 3: Top Up Wizard (60 min)

**Create `components/TopUpModal.tsx`:**
```typescript
"use client";
import { useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

export default function TopUpModal() {
  const [step, setStep] = useState(1);
  const [chain, setChain] = useState("");
  const [asset, setAsset] = useState("");
  const [qrCode, setQRCode] = useState("");
  
  const vaultAddresses = {
    ethereum: process.env.NEXT_PUBLIC_SAFE_ADDRESS_ETH,
    arbitrum: process.env.NEXT_PUBLIC_SAFE_ADDRESS_ARB,
    solana: process.env.NEXT_PUBLIC_SOLANA_VAULT_PDA,
  };
  
  const handleGenerateQR = async () => {
    const address = vaultAddresses[chain];
    const qr = await QRCode.toDataURL(address);
    setQRCode(qr);
  };
  
  return (
    <div>
      {step === 1 && (
        <div>
          <h3>Choose Network</h3>
          <Button onClick={() => { setChain("ethereum"); setStep(2); }}>Ethereum Sepolia</Button>
          <Button onClick={() => { setChain("arbitrum"); setStep(2); }}>Arbitrum Sepolia</Button>
          <Button onClick={() => { setChain("solana"); setStep(2); }}>Solana Devnet</Button>
        </div>
      )}
      
      {step === 2 && (
        <div>
          <h3>Choose Asset</h3>
          <Button onClick={() => { setAsset("USDC"); setStep(3); handleGenerateQR(); }}>USDC</Button>
          <Button onClick={() => { setAsset("USDT"); setStep(3); handleGenerateQR(); }}>USDT</Button>
        </div>
      )}
      
      {step === 3 && (
        <div>
          <h3>Deposit {asset} on {chain}</h3>
          <p>Send {asset} to:</p>
          <code>{vaultAddresses[chain]}</code>
          {qrCode && <img src={qrCode} alt="QR Code" />}
          <Button onClick={() => navigator.clipboard.writeText(vaultAddresses[chain])}>
            Copy Address
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

### Phase 4: Live Price Streaming (SSE) (60 min)

**Create `app/api/price-stream/route.ts`:**
```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const interval = setInterval(async () => {
        try {
          // Fetch from Ostium (placeholder - needs actual API)
          const price = await fetchOstiumMarkPrice(symbol);
          const data = `data: ${JSON.stringify({ symbol, price, timestamp: Date.now() })}\\n\\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          clearInterval(interval);
          controller.close();
        }
      }, 2000); // 2 seconds
      
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

async function fetchOstiumMarkPrice(symbol: string) {
  // TODO: Implement actual Ostium API call
  // For now, return mock data
  return (Math.random() * 1000).toFixed(2);
}
```

**Update market detail page to use SSE:**
```typescript
"use client";
import { useEffect, useState } from "react";

export default function MarketPage({ params }) {
  const [price, setPrice] = useState(null);
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/price-stream?symbol=${params.symbol}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrice(data.price);
    };
    
    return () => eventSource.close();
  }, [params.symbol]);
  
  return <div>Current Price: ${price}</div>;
}
```

---

### Phase 5: CoW Protocol Integration (90 min)

**Create `lib/connectors/cow.ts`:**
```typescript
import { OrderBookApi, OrderQuoteRequest, OrderQuoteSideKindSell } from "@cowprotocol/cow-sdk";

const cowApi = new OrderBookApi({ chainId: 11155111 }); // Sepolia

export async function getCoWQuote(params: {
  sellToken: string;
  buyToken: string;
  amount: string;
  kind: "sell" | "buy";
}) {
  const quoteRequest: OrderQuoteRequest = {
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    from: "0x...", // User address
    receiver: "0x...",
    sellAmountBeforeFee: params.kind === "sell" ? params.amount : undefined,
    buyAmountAfterFee: params.kind === "buy" ? params.amount : undefined,
    kind: params.kind === "sell" ? OrderQuoteSideKindSell.SELL : OrderQuoteSideKindSell.BUY,
    partiallyFillable: false,
  };
  
  const quote = await cowApi.getQuote(quoteRequest);
  return quote;
}

export async function submitCoWOrder(signedOrder: any) {
  const orderId = await cowApi.sendOrder(signedOrder);
  return orderId;
}
```

---

### Phase 6: Kamino Integration (Solana) (60 min)

**Create `lib/connectors/kamino.ts`:**
```typescript
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection(process.env.SOLANA_RPC!);

export async function getKaminoQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
}) {
  // TODO: Use Kamino SDK when available
  // For now, placeholder
  const response = await fetch(`${process.env.KAMINO_API_BASE}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  
  return await response.json();
}
```

---

### Phase 7: Safe Deployment Scripts (Testnets) (120 min)

**Create `scripts/deploy-safe.ts`:**
```typescript
import Safe, { SafeFactory } from "@safe-global/protocol-kit";
import { ethers } from "ethers";

async function deploySafe(rpcUrl: string, privateKey: string) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  
  const safeFactory = await SafeFactory.create({ 
    ethAdapter: signer as any,
  });
  
  const safe = await safeFactory.deploySafe({
    safeAccountConfig: {
      owners: [await signer.getAddress()],
      threshold: 1,
    },
  });
  
  const safeAddress = await safe.getAddress();
  console.log(`Safe deployed at: ${safeAddress}`);
  return safeAddress;
}

// Deploy on Ethereum Sepolia
const ethSafe = await deploySafe(process.env.ETH_RPC!, process.env.DEPLOYER_PRIVATE_KEY!);

// Deploy on Arbitrum Sepolia
const arbSafe = await deploySafe(process.env.ARBITRUM_RPC!, process.env.DEPLOYER_PRIVATE_KEY!);

console.log(`\\nAdd to .env:\\nSAFE_ADDRESS_ETH=${ethSafe}\\nSAFE_ADDRESS_ARB=${arbSafe}`);
```

**Run with:**
```bash
DEPLOYER_PRIVATE_KEY=0x... npx tsx scripts/deploy-safe.ts
```

---

### Phase 8: Solana PDA Vault (Anchor Program) (180 min)

**Create `programs/vault/src/lib.rs`:**
```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("...");

#[program]
pub mod vault {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        Ok(())
    }
    
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.vault_token.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Vault {
    pub authority: Pubkey,
}
```

**Deploy:**
```bash
anchor build
anchor deploy --provider.cluster devnet
```

---

### Phase 9: Deposit Watchers (180 min)

**Create `lib/watchers/evm-watcher.ts`:**
```typescript
import { ethers } from "ethers";
import { prisma } from "@/lib/prisma";

const ERC20_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];

export async function startEVMWatcher(chain: "ethereum" | "arbitrum") {
  const rpcUrl = chain === "ethereum" ? process.env.ETH_RPC : process.env.ARBITRUM_RPC;
  const safeAddress = chain === "ethereum" ? process.env.SAFE_ADDRESS_ETH : process.env.SAFE_ADDRESS_ARB;
  const requiredConfs = chain === "ethereum" ? 4 : 2;
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Watch USDC
  const usdcContract = new ethers.Contract(USDC_ADDRESS[chain], ERC20_ABI, provider);
  
  usdcContract.on("Transfer", async (from, to, value, event) => {
    if (to.toLowerCase() === safeAddress?.toLowerCase()) {
      await prisma.deposit.create({
        data: {
          userId: "...", // Lookup by from address
          assetId: "...", // USDC asset ID
          chain,
          amount: value.toString(),
          txHash: event.log.transactionHash,
          fromAddress: from,
          toAddress: to,
          confirmations: 0,
          requiredConfirmations: requiredConfs,
          status: "pending",
        },
      });
    }
  });
}
```

---

## 🚀 Quick Start (Current State)

```bash
# Install dependencies
pnpm install

# Setup database
npx prisma generate --schema=prisma/schema.sqlite.prisma
npx prisma db push --schema=prisma/schema.sqlite.prisma
npx prisma db seed

# Run development server
pnpm dev
```

## 📝 Environment Variables Needed

See `.env.example` for all required variables.

**Critical for next steps:**
- `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`
- `DEPLOYER_PRIVATE_KEY` (for Safe deployment)
- RPC URLs (already configured for testnets)

## 🔗 Useful Links

- [NextAuth.js Docs](https://next-auth.js.org/)
- [CoW Protocol SDK](https://docs.cow.fi/cow-sdk)
- [Safe Protocol Kit](https://docs.safe.global/sdk/protocol-kit)
- [Solana Anchor](https://www.anchor-lang.com/)
- [Kamino Finance](https://docs.kamino.finance/)
- [Ostium Docs](https://ostium-labs.gitbook.io/)

