export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  currency: string;
  marketState: string;
}
