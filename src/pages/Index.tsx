import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  tag: string;
};

// Новости — Blockchair (публичный, без ключа)
const NEWS_URL = 'https://api.blockchair.com/news';
// Fear & Greed Index — alternative.me
const FEAR_URL = 'https://api.alternative.me/fng/?limit=1';
// Глобальные данные рынка — Coinpaprika (без ключа, CORS открыт)
const GLOBAL_URL = 'https://api.coinpaprika.com/v1/global';
// Котировки — Coinpaprika
const PAPRIKA_URL = 'https://api.coinpaprika.com/v1/tickers?limit=20';

type MarketData = {
  fear: number;
  fearLabel: string;
  btcDominance: number;
  totalVolume: number;
  marketCap: number;
  marketCapChange: number;
};

const NEWS_ICONS = ['TrendingUp', 'Zap', 'Scale', 'Globe', 'BarChart2', 'Newspaper'];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} д назад`;
}

function fmtBig(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString('ru-RU')}`;
}

function fearColor(val: number): string {
  if (val <= 25) return 'text-destructive';
  if (val <= 45) return 'text-orange-400';
  if (val <= 55) return 'text-yellow-400';
  if (val <= 75) return 'text-success';
  return 'text-emerald-400';
}

function extractTag(title: string): string {
  const tags: Record<string, string> = {
    bitcoin: 'Bitcoin', btc: 'Bitcoin',
    ethereum: 'Ethereum', eth: 'Ethereum',
    solana: 'Solana', sol: 'Solana',
    ripple: 'Ripple', xrp: 'Ripple',
    sec: 'Регуляция', regulation: 'Регуляция', law: 'Регуляция',
    market: 'Рынок', price: 'Рынок', trading: 'Рынок',
    defi: 'DeFi', nft: 'NFT',
  };
  const lower = title.toLowerCase();
  for (const [key, val] of Object.entries(tags)) {
    if (lower.includes(key)) return val;
  }
  return 'Крипто';
}

const HERO_IMG =
  'https://cdn.poehali.dev/projects/81417db6-5267-41a3-b95e-3a8e8cec9192/files/81c6b419-b9bb-46d5-badf-3e5ca05fe089.jpg';

const NAV = [
  { id: 'home', label: 'Главная' },
  { id: 'quotes', label: 'Котировки' },
  { id: 'news', label: 'Новости' },
  { id: 'analysis', label: 'Анализ' },
  { id: 'compare', label: 'Сравнение' },
  { id: 'calc', label: 'Калькулятор' },
  { id: 'about', label: 'О проекте' },
];

type Coin = {
  id: string;
  sym: string;
  name: string;
  price: number;
  change: number;
  icon: string;
  color: string;
};

type Alert = {
  id: string;
  sym: string;
  name: string;
  target: number;
  direction: 'above' | 'below';
  triggered: boolean;
};

type Toast = {
  id: string;
  sym: string;
  name: string;
  price: number;
  target: number;
  direction: 'above' | 'below';
};

const COINS: Coin[] = [
  { id: 'btc-bitcoin', sym: 'BTC', name: 'Bitcoin', price: 67234.12, change: 2.41, icon: 'Bitcoin', color: '#f7931a' },
  { id: 'eth-ethereum', sym: 'ETH', name: 'Ethereum', price: 3521.88, change: 4.12, icon: 'Gem', color: '#627eea' },
  { id: 'sol-solana', sym: 'SOL', name: 'Solana', price: 178.34, change: -1.85, icon: 'Sun', color: '#14f195' },
  { id: 'bnb-binance-coin', sym: 'BNB', name: 'BNB', price: 612.5, change: 0.94, icon: 'Hexagon', color: '#f3ba2f' },
  { id: 'xrp-xrp', sym: 'XRP', name: 'Ripple', price: 0.624, change: -3.21, icon: 'Droplet', color: '#00aae4' },
  { id: 'ada-cardano', sym: 'ADA', name: 'Cardano', price: 0.452, change: 1.07, icon: 'Circle', color: '#0033ad' },
];

const Sparkline = ({ up }: { up: boolean }) => {
  const points = up ? '0,28 12,20 24,24 36,12 48,16 60,4' : '0,6 12,14 24,10 36,20 48,16 60,28';
  return (
    <svg width="64" height="32" viewBox="0 0 64 32" fill="none" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={up ? 'hsl(150 80% 50%)' : 'hsl(350 90% 60%)'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const ToastNotification = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [onClose]);

  const up = toast.direction === 'above';
  return (
    <div className="animate-fade-up flex items-start gap-3 glass rounded-2xl p-4 w-80 shadow-2xl border border-border">
      <span className={`grid place-items-center w-10 h-10 rounded-xl flex-shrink-0 ${up ? 'bg-success/15' : 'bg-destructive/15'}`}>
        <Icon name={up ? 'TrendingUp' : 'TrendingDown'} size={20} className={up ? 'text-success' : 'text-destructive'} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-sm mb-0.5">
          {toast.sym} {up ? 'достиг цели ▲' : 'упал до цели ▼'}
        </div>
        <div className="text-xs text-muted-foreground">
          Цена <span className="text-foreground font-medium">${toast.price.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</span>{' '}
          {up ? 'выше' : 'ниже'} цели{' '}
          <span className="text-foreground font-medium">${toast.target.toLocaleString('ru-RU')}</span>
        </div>
      </div>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
        <Icon name="X" size={16} />
      </button>
    </div>
  );
};

const Index = () => {
  const [prices, setPrices] = useState(COINS);
  const [active, setActive] = useState('home');
  const [calcAmount, setCalcAmount] = useState('1');
  const [calcCoin, setCalcCoin] = useState('BTC');
  const [target, setTarget] = useState('');
  const [live, setLive] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pricesRef = useRef(prices);
  pricesRef.current = prices;

  useEffect(() => {
    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const res = await fetch(PAPRIKA_URL);
        if (!res.ok) return;
        const data: Array<{ id: string; quotes: { USD: { price: number; percent_change_24h: number } } }> = await res.json();
        if (cancelled) return;
        const byId = Object.fromEntries(data.map((d) => [d.id, d]));
        setPrices((prev) =>
          prev.map((c) => {
            const d = byId[c.id];
            if (!d) return c;
            return {
              ...c,
              price: d.quotes.USD.price,
              change: +d.quotes.USD.percent_change_24h.toFixed(2),
            };
          }),
        );
        setLive(true);
      } catch {
        /* оставляем последние известные цены */
      }
    };

    fetchPrices();
    const poll = setInterval(fetchPrices, 30000);

    const tick = setInterval(() => {
      setPrices((prev) =>
        prev.map((c) => {
          const delta = (Math.random() - 0.5) * (c.price * 0.0004);
          return { ...c, price: Math.max(0.0001, c.price + delta) };
        }),
      );
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  // Проверяем алерты при каждом обновлении цен
  useEffect(() => {
    setAlerts((prev) => {
      const fired: Alert[] = [];
      const updated = prev.map((a) => {
        if (a.triggered) return a;
        const coin = prices.find((c) => c.sym === a.sym);
        if (!coin) return a;
        const hit =
          (a.direction === 'above' && coin.price >= a.target) ||
          (a.direction === 'below' && coin.price <= a.target);
        if (hit) fired.push(a);
        return hit ? { ...a, triggered: true } : a;
      });
      if (fired.length > 0) {
        setToasts((t) => [
          ...t,
          ...fired.map((a) => {
            const coin = prices.find((c) => c.sym === a.sym)!;
            return {
              id: Math.random().toString(36).slice(2),
              sym: a.sym,
              name: a.name,
              price: coin.price,
              target: a.target,
              direction: a.direction,
            };
          }),
        ]);
      }
      return updated;
    });
  }, [prices]);

  useEffect(() => {
    const fetchMarket = async () => {
      setMarketLoading(true);
      try {
        const [fearRes, globalRes] = await Promise.all([
          fetch(FEAR_URL),
          fetch(GLOBAL_URL),
        ]);
        const fearData = await fearRes.json();
        const globalData = await globalRes.json();

        const fearVal = parseInt(fearData?.data?.[0]?.value ?? '50', 10);
        const fearLabel = fearData?.data?.[0]?.value_classification ?? 'Нейтрально';

        // Coinpaprika /v1/global
        const g = globalData ?? {};
        const btcDom = parseFloat(g?.bitcoin_dominance_percentage ?? 0);
        const totalVol = parseFloat(g?.volume_24h_usd ?? 0);
        const marketCap = parseFloat(g?.market_cap_usd ?? 0);
        const marketCapChange = parseFloat(g?.market_cap_change_24h ?? 0);

        setMarket({
          fear: fearVal,
          fearLabel,
          btcDominance: btcDom,
          totalVolume: totalVol,
          marketCap,
          marketCapChange,
        });
      } catch {
        /* оставляем null */
      } finally {
        setMarketLoading(false);
      }
    };
    fetchMarket();
    const t = setInterval(fetchMarket, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const res = await fetch(NEWS_URL);
        const data = await res.json();
        // Blockchair возвращает { data: [...] }
        const items: Array<{ title: string; link: string; time: string; language?: string; tags?: string }> =
          Array.isArray(data?.data) ? data.data : [];
        // берём английские или любые если мало
        const en = items.filter((i) => !i.language || i.language === 'en');
        const pool = en.length >= 6 ? en : items;
        setNews(
          pool.slice(0, 6).map((item) => ({
            title: item.title,
            link: item.link,
            pubDate: item.time,
            tag: item.tags ? item.tags.split(',')[0].trim() : extractTag(item.title),
          })),
        );
      } catch {
        /* оставляем пустой список */
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
    const t = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fmt = (n: number) =>
    n >= 1
      ? n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : n.toFixed(3);

  const addAlert = () => {
    const val = parseFloat(target);
    if (!val || isNaN(val)) return;
    const coin = prices.find((c) => c.sym === calcCoin)!;
    const direction: 'above' | 'below' = val >= coin.price ? 'above' : 'below';
    setAlerts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        sym: coin.sym,
        name: coin.name,
        target: val,
        direction,
        triggered: false,
      },
    ]);
    setTarget('');
  };

  const removeAlert = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const selectedCoin = prices.find((c) => c.sym === calcCoin)!;
  const calcResult = (parseFloat(calcAmount || '0') * selectedCoin.price).toLocaleString('ru-RU', {
    maximumFractionDigits: 2,
  });
  const activeAlerts = alerts.filter((a) => !a.triggered);

  return (
    <div className="min-h-screen text-foreground">
      {/* TOAST CONTAINER */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastNotification toast={t} onClose={() => removeToast(t.id)} />
          </div>
        ))}
      </div>

      {/* ALERTS PANEL */}
      {showAlerts && (
        <div className="fixed inset-0 z-[90] flex items-start justify-end pt-20 pr-4" onClick={() => setShowAlerts(false)}>
          <div className="glass rounded-2xl p-5 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Активные алерты</h3>
              <button onClick={() => setShowAlerts(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>
            {activeAlerts.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                <Icon name="BellOff" size={28} className="mx-auto mb-2 opacity-40" />
                Нет активных алертов
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeAlerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
                    <div>
                      <div className="font-medium text-sm">{a.sym}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.direction === 'above' ? '▲ выше' : '▼ ниже'} ${a.target.toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <button onClick={() => removeAlert(a.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Icon name="Trash2" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-0 left-0 bottom-0 w-72 glass flex flex-col pt-20 pb-8 px-5 shadow-2xl border-r border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 font-display font-extrabold text-lg mb-8">
              <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent glow">
                <Icon name="Activity" size={17} className="text-background" />
              </span>
              Crypto<span className="text-gradient">Pulse</span>
            </div>
            <nav className="flex flex-col gap-1 flex-1">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { scrollTo(n.id); setMobileOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors ${
                    active === n.id
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </nav>
            <button
              onClick={() => { setShowAlerts(true); setMobileOpen(false); }}
              className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-background font-semibold text-sm"
            >
              <Icon name="Bell" size={17} />
              Уведомления
              {activeAlerts.length > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-destructive/90 text-white text-[10px] font-bold grid place-items-center">
                  {activeAlerts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 glass">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 font-display font-extrabold text-lg">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent glow">
              <Icon name="Activity" size={20} className="text-background" />
            </span>
            Crypto<span className="text-gradient">Pulse</span>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  active === n.id ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAlerts((v) => !v)}
              className="relative hidden sm:flex rounded-xl bg-gradient-to-r from-primary to-accent text-background font-semibold hover:opacity-90"
            >
              <Icon name="Bell" size={16} />
              Уведомления
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold grid place-items-center">
                  {activeAlerts.length}
                </span>
              )}
            </Button>
            {/* Bell icon only on mobile */}
            <button
              onClick={() => setShowAlerts((v) => !v)}
              className="relative sm:hidden grid place-items-center w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors"
            >
              <Icon name="Bell" size={19} className="text-foreground" />
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold grid place-items-center">
                  {activeAlerts.length}
                </span>
              )}
            </button>
            {/* Burger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden grid place-items-center w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors"
            >
              <Icon name={mobileOpen ? 'X' : 'Menu'} size={20} className="text-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="relative pt-32 pb-20 overflow-hidden">
        <img
          src={HERO_IMG}
          alt=""
          className="absolute top-10 right-0 w-[55%] max-w-2xl opacity-60 animate-float pointer-events-none select-none"
        />
        <div className="container relative">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 text-sm text-accent border border-accent/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-ring" />
              {live ? 'Реальные курсы с биржи CoinGecko' : 'Подключаемся к бирже…'}
            </span>
            <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-[1.05] mb-6">
              Курсы крипты <br />
              <span className="text-gradient">без задержек</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Отслеживайте котировки, читайте новости, сравнивайте монеты и получайте мгновенные
              уведомления о скачках цен и достижении целевых значений.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => scrollTo('quotes')}
                className="rounded-xl bg-gradient-to-r from-primary to-accent text-background font-semibold text-base h-12 px-7 hover:opacity-90"
              >
                Смотреть котировки
                <Icon name="ArrowRight" size={18} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollTo('calc')}
                className="rounded-xl border-border bg-secondary/50 h-12 px-7 text-base hover:bg-secondary"
              >
                <Icon name="Calculator" size={18} />
                Калькулятор
              </Button>
            </div>
          </div>
        </div>

        {/* TICKER */}
        <div className="relative mt-16 overflow-hidden border-y border-border py-4 glass">
          <div className="ticker-track flex gap-10 whitespace-nowrap w-max">
            {[...prices, ...prices].map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2 font-medium">
                <span className="text-muted-foreground">{c.sym}</span>
                <span>${fmt(c.price)}</span>
                <span className={c.change >= 0 ? 'text-success' : 'text-destructive'}>
                  {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTES */}
      <Section id="quotes" eyebrow="Котировки" title="Топ криптовалют">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {prices.map((c, i) => {
            const up = c.change >= 0;
            return (
              <div
                key={c.sym}
                style={{ animationDelay: `${i * 60}ms` }}
                className="animate-fade-up glass rounded-2xl p-6 hover:-translate-y-1 transition-transform"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid place-items-center w-11 h-11 rounded-xl"
                      style={{ background: `${c.color}22` }}
                    >
                      <Icon name={c.icon} size={22} style={{ color: c.color }} />
                    </span>
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.sym}</div>
                    </div>
                  </div>
                  <Sparkline up={up} />
                </div>
                <div className="flex items-end justify-between">
                  <div className="font-display text-2xl font-bold">${fmt(c.price)}</div>
                  <span
                    className={`text-sm font-semibold px-2.5 py-1 rounded-lg ${
                      up ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
                    }`}
                  >
                    {up ? '+' : ''}
                    {c.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* NEWS */}
      <Section id="news" eyebrow="Новости" title="Что происходит на рынке">
        {newsLoading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-secondary mb-4" />
                <div className="h-3 w-16 rounded bg-secondary mb-3" />
                <div className="h-4 w-full rounded bg-secondary mb-2" />
                <div className="h-4 w-3/4 rounded bg-secondary mb-4" />
                <div className="h-3 w-24 rounded bg-secondary" />
              </div>
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-5">
            {news.map((n, i) => (
              <a
                key={i}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ animationDelay: `${i * 80}ms` }}
                className="animate-fade-up glass rounded-2xl p-6 hover:-translate-y-1 transition-transform cursor-pointer block"
              >
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/15 mb-4">
                  <Icon name={NEWS_ICONS[i % NEWS_ICONS.length]} size={20} className="text-primary" fallback="Newspaper" />
                </span>
                <div className="text-xs text-accent mb-2">{n.tag}</div>
                <h3 className="font-display font-semibold leading-snug mb-4 line-clamp-3">{n.title}</h3>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="Clock" size={13} />
                  {timeAgo(n.pubDate)}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
            <Icon name="Newspaper" size={32} className="mx-auto mb-3 opacity-40" />
            Не удалось загрузить новости. Попробуйте позже.
          </div>
        )}
      </Section>

      {/* ANALYSIS */}
      <Section id="analysis" eyebrow="Анализ" title="Настроение рынка">
        {marketLoading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass rounded-2xl p-7 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-secondary mb-4" />
                <div className="h-3 w-32 rounded bg-secondary mb-3" />
                <div className="h-10 w-24 rounded bg-secondary mb-2" />
                <div className="h-3 w-20 rounded bg-secondary" />
              </div>
            ))}
          </div>
        ) : market ? (
          <div className="grid md:grid-cols-3 gap-5">
            {/* Fear & Greed */}
            <div className="animate-fade-up glass rounded-2xl p-7">
              <Icon name="Gauge" size={24} className={`${fearColor(market.fear)} mb-4`} />
              <div className="text-sm text-muted-foreground mb-1">Индекс страха и жадности</div>
              <div className={`font-display text-4xl font-extrabold mb-1 ${fearColor(market.fear)}`}>
                {market.fear}
              </div>
              <div className={`text-sm font-medium ${fearColor(market.fear)}`}>
                {market.fearLabel}
              </div>
              {/* шкала */}
              <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-destructive via-yellow-400 to-success transition-all duration-700"
                  style={{ width: `${market.fear}%` }}
                />
              </div>
            </div>
            {/* BTC Dominance */}
            <div className="animate-fade-up glass rounded-2xl p-7" style={{ animationDelay: '80ms' }}>
              <Icon name="PieChart" size={24} className="text-accent mb-4" />
              <div className="text-sm text-muted-foreground mb-1">Доминирование BTC</div>
              <div className="font-display text-4xl font-extrabold mb-1">
                {market.btcDominance.toFixed(1)}%
              </div>
              <div className="text-sm text-accent">
                Остальные {(100 - market.btcDominance).toFixed(1)}% — альткоины
              </div>
              <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${market.btcDominance}%` }}
                />
              </div>
            </div>
            {/* Volume & Market Cap */}
            <div className="animate-fade-up glass rounded-2xl p-7" style={{ animationDelay: '160ms' }}>
              <Icon name="BarChart3" size={24} className="text-primary mb-4" />
              <div className="text-sm text-muted-foreground mb-1">Объём торгов 24ч</div>
              <div className="font-display text-4xl font-extrabold mb-1">
                {fmtBig(market.totalVolume)}
              </div>
              <div className="text-sm text-muted-foreground mt-3 mb-0.5">Капитализация рынка</div>
              <div className="font-semibold text-lg">
                {fmtBig(market.marketCap)}{' '}
                <span className={market.marketCapChange >= 0 ? 'text-success text-sm' : 'text-destructive text-sm'}>
                  {market.marketCapChange >= 0 ? '+' : ''}{market.marketCapChange.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
            <Icon name="AlertCircle" size={32} className="mx-auto mb-3 opacity-40" />
            Не удалось загрузить данные. Попробуйте позже.
          </div>
        )}
      </Section>

      {/* COMPARE */}
      <Section id="compare" eyebrow="Сравнение" title="Сравнить монеты">
        <div className="glass rounded-2xl overflow-hidden animate-fade-up">
          <div className="grid grid-cols-4 gap-4 px-6 py-4 text-xs text-muted-foreground border-b border-border font-medium">
            <span>Монета</span>
            <span className="text-right">Цена</span>
            <span className="text-right">24ч</span>
            <span className="text-right hidden sm:block">График</span>
          </div>
          {prices.map((c) => (
            <div
              key={c.sym}
              className="grid grid-cols-4 gap-4 px-6 py-4 items-center border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Icon name={c.icon} size={18} style={{ color: c.color }} />
                <span className="font-medium">{c.sym}</span>
              </div>
              <span className="text-right font-medium">${fmt(c.price)}</span>
              <span className={`text-right font-semibold ${c.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                {c.change >= 0 ? '+' : ''}
                {c.change.toFixed(2)}%
              </span>
              <span className="hidden sm:flex justify-end">
                <Sparkline up={c.change >= 0} />
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* CALCULATOR */}
      <Section id="calc" eyebrow="Калькулятор" title="Конвертер в доллары">
        <div className="glass rounded-2xl p-7 max-w-2xl animate-fade-up">
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Количество</label>
              <Input
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="h-12 rounded-xl bg-secondary/50 border-border text-lg"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Монета</label>
              <div className="flex flex-wrap gap-2">
                {prices.map((c) => (
                  <button
                    key={c.sym}
                    onClick={() => setCalcCoin(c.sym)}
                    className={`px-3 h-12 rounded-xl text-sm font-medium transition-colors ${
                      calcCoin === c.sym
                        ? 'bg-gradient-to-r from-primary to-accent text-background'
                        : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c.sym}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-secondary/40 p-5 flex items-center justify-between">
            <span className="text-muted-foreground">Стоимость</span>
            <span className="font-display text-3xl font-extrabold text-gradient">${calcResult}</span>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Icon name="BellRing" size={15} className="text-accent" />
              Уведомить при достижении цены ({calcCoin} = ${fmt(selectedCoin.price)})
            </label>
            <div className="flex gap-3 mb-3">
              <Input
                value={target}
                placeholder="Например, 70000"
                onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && addAlert()}
                className="h-12 rounded-xl bg-secondary/50 border-border"
              />
              <Button
                onClick={addAlert}
                disabled={!target}
                className="h-12 rounded-xl bg-gradient-to-r from-primary to-accent text-background font-semibold px-6 hover:opacity-90 disabled:opacity-40"
              >
                Установить
              </Button>
            </div>
            {target && !isNaN(parseFloat(target)) && (
              <p className="text-xs text-muted-foreground">
                Сработает, когда цена{' '}
                {parseFloat(target) >= selectedCoin.price ? (
                  <span className="text-success">вырастет до ${parseFloat(target).toLocaleString('ru-RU')}</span>
                ) : (
                  <span className="text-destructive">упадёт до ${parseFloat(target).toLocaleString('ru-RU')}</span>
                )}
              </p>
            )}
            {activeAlerts.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="text-xs text-muted-foreground font-medium">Ваши алерты:</div>
                {activeAlerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-2.5 text-sm">
                    <span className="font-medium">{a.sym}</span>
                    <span className={`text-xs ${a.direction === 'above' ? 'text-success' : 'text-destructive'}`}>
                      {a.direction === 'above' ? '▲ выше' : '▼ ниже'} ${a.target.toLocaleString('ru-RU')}
                    </span>
                    <button onClick={() => removeAlert(a.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ABOUT */}
      <Section id="about" eyebrow="О проекте" title="Зачем нужен CryptoPulse">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: 'Zap', title: 'Реальное время', text: 'Цены обновляются каждые пару секунд без перезагрузки страницы.' },
            { icon: 'BellRing', title: 'Умные уведомления', text: 'Сигнал о скачке цены или достижении заданной цели.' },
            { icon: 'ShieldCheck', title: 'Просто и понятно', text: 'Чистый интерфейс без лишнего шума — всё под рукой.' },
          ].map((f, i) => (
            <div
              key={i}
              style={{ animationDelay: `${i * 80}ms` }}
              className="animate-fade-up glass rounded-2xl p-7"
            >
              <span className="grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mb-5 glow">
                <Icon name={f.icon} size={24} className="text-background" />
              </span>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10 mt-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-display font-bold text-foreground">
            <Icon name="Activity" size={18} className="text-accent" />
            CryptoPulse
          </div>
          <span>© 2026 CryptoPulse. Данные с CoinGecko.</span>
        </div>
      </footer>
    </div>
  );
};

const Section = ({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="py-20 scroll-mt-20">
    <div className="container">
      <div className="mb-10">
        <div className="text-sm text-accent font-medium mb-2">{eyebrow}</div>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl">{title}</h2>
      </div>
      {children}
    </div>
  </section>
);

export default Index;