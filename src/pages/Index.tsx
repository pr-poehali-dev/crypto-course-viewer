import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  sym: string;
  name: string;
  price: number;
  change: number;
  icon: string;
  color: string;
};

const COINS: Coin[] = [
  { sym: 'BTC', name: 'Bitcoin', price: 67234.12, change: 2.41, icon: 'Bitcoin', color: '#f7931a' },
  { sym: 'ETH', name: 'Ethereum', price: 3521.88, change: 4.12, icon: 'Gem', color: '#627eea' },
  { sym: 'SOL', name: 'Solana', price: 178.34, change: -1.85, icon: 'Sun', color: '#14f195' },
  { sym: 'BNB', name: 'BNB', price: 612.5, change: 0.94, icon: 'Hexagon', color: '#f3ba2f' },
  { sym: 'XRP', name: 'Ripple', price: 0.624, change: -3.21, icon: 'Droplet', color: '#23292f' },
  { sym: 'ADA', name: 'Cardano', price: 0.452, change: 1.07, icon: 'Circle', color: '#0033ad' },
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

const Index = () => {
  const [prices, setPrices] = useState(COINS);
  const [active, setActive] = useState('home');
  const [calcAmount, setCalcAmount] = useState('1');
  const [calcCoin, setCalcCoin] = useState('BTC');
  const [target, setTarget] = useState('');

  useEffect(() => {
    const t = setInterval(() => {
      setPrices((prev) =>
        prev.map((c) => {
          const delta = (Math.random() - 0.5) * (c.price * 0.002);
          return {
            ...c,
            price: Math.max(0.001, c.price + delta),
            change: +(c.change + (Math.random() - 0.5) * 0.3).toFixed(2),
          };
        }),
      );
    }, 2000);
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

  const selectedCoin = prices.find((c) => c.sym === calcCoin)!;
  const calcResult = (parseFloat(calcAmount || '0') * selectedCoin.price).toLocaleString('ru-RU', {
    maximumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen text-foreground">
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
          <Button className="rounded-xl bg-gradient-to-r from-primary to-accent text-background font-semibold hover:opacity-90">
            <Icon name="Bell" size={16} />
            Уведомления
          </Button>
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
              Данные обновляются в реальном времени
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
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { tag: 'Bitcoin', title: 'BTC обновил локальный максимум на фоне притока капитала', time: '12 мин назад', icon: 'TrendingUp' },
            { tag: 'Ethereum', title: 'Обновление сети снизило комиссии на 30%', time: '1 час назад', icon: 'Zap' },
            { tag: 'Регуляция', title: 'Новые правила для бирж вступят в силу осенью', time: '3 часа назад', icon: 'Scale' },
          ].map((n, i) => (
            <article
              key={i}
              style={{ animationDelay: `${i * 80}ms` }}
              className="animate-fade-up glass rounded-2xl p-6 hover:-translate-y-1 transition-transform cursor-pointer"
            >
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/15 mb-4">
                <Icon name={n.icon} size={20} className="text-primary" />
              </span>
              <div className="text-xs text-accent mb-2">{n.tag}</div>
              <h3 className="font-display font-semibold leading-snug mb-4">{n.title}</h3>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="Clock" size={13} />
                {n.time}
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ANALYSIS */}
      <Section id="analysis" eyebrow="Анализ" title="Настроение рынка">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { label: 'Индекс страха и жадности', value: '72', sub: 'Жадность', icon: 'Gauge', tone: 'text-success' },
            { label: 'Доминирование BTC', value: '54.2%', sub: '+0.8% за неделю', icon: 'PieChart', tone: 'text-accent' },
            { label: 'Объём торгов 24ч', value: '$98.4B', sub: '+12.3%', icon: 'BarChart3', tone: 'text-primary' },
          ].map((s, i) => (
            <div
              key={i}
              style={{ animationDelay: `${i * 80}ms` }}
              className="animate-fade-up glass rounded-2xl p-7"
            >
              <Icon name={s.icon} size={24} className={`${s.tone} mb-4`} />
              <div className="text-sm text-muted-foreground mb-1">{s.label}</div>
              <div className="font-display text-4xl font-extrabold mb-1">{s.value}</div>
              <div className={`text-sm ${s.tone}`}>{s.sub}</div>
            </div>
          ))}
        </div>
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
            <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
              <Icon name="BellRing" size={15} className="text-accent" />
              Уведомить при достижении цены ({calcCoin})
            </label>
            <div className="flex gap-3">
              <Input
                value={target}
                placeholder="Например, 70000"
                onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ''))}
                className="h-12 rounded-xl bg-secondary/50 border-border"
              />
              <Button className="h-12 rounded-xl bg-gradient-to-r from-primary to-accent text-background font-semibold px-6 hover:opacity-90">
                Установить
              </Button>
            </div>
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
          <span>© 2026 CryptoPulse. Данные демонстрационные.</span>
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
