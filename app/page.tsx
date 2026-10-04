"use client";



import { useState } from "react";



type UsedResult = {

  title: string;

  link: string | null;

  snippet: string;

  price: string | null;

  extractedPrice: number | null;

  source: string | null;

  thumbnail: string | null;

  condition: string | null;
  storage?: string | null;
  locationDetail?: string | null;
  posted?: string | null;
  batteryHealth?: string | null;
  listingType?: string | null;

};



type NewResult = {

  title: string;

  price: string | null;

  extractedPrice: number | null;

  oldPrice: string | null;

  extractedOldPrice: number | null;

  source: string | null;

  link: string | null;

  thumbnail: string | null;

  tag: string | null;

  extensions: string[];

  discountPercent: number | null;

};



type PriceAnalysis = {

  askingPrice: number;

  averageMarketPrice: number | null;

  fairPriceLow: number | null;

  fairPriceHigh: number | null;

  maxReasonablePrice: number | null;

  differenceFromAverage: number | null;

  differencePercent: number | null;

  suggestedOffer: number | null;

  marketStatus: string;

};



type AIAnalysis = {

  fairPriceLow: number;

  fairPriceHigh: number;

  suggestedOpeningOffer: number;

  maximumReasonablePrice: number;

  confidence: string;

  marketVerdict: string;

  reasoning: string;

  negotiationStrategy: string;

  negotiationMessage: string;

};



const electronicKeywords = [

  "phone",

  "mobile",

  "iphone",

  "samsung",

  "pixel",

  "oneplus",

  "xiaomi",

  "redmi",

  "realme",

  "vivo",

  "oppo",

  "nothing phone",

  "laptop",

  "macbook",

  "dell",

  "hp laptop",

  "lenovo",

  "asus",

  "acer",

  "msi",

  "tablet",

  "ipad",

  "monitor",

  "tv",

  "television",

  "camera",

  "dslr",

  "mirrorless",

  "headphone",

  "headphones",

  "earbuds",

  "airpods",

  "speaker",

  "smartwatch",

  "smart watch",

  "watch",

  "playstation",

  "ps5",

  "ps4",

  "xbox",

  "nintendo",

  "console",

  "keyboard",

  "mouse",

  "graphics card",

  "gpu",

  "processor",

  "cpu",

  "ram",

  "ssd",

  "hard drive",

];



function isElectronicItem(item: string) {

  const value = item.toLowerCase();



  return electronicKeywords.some((keyword) =>

    value.includes(keyword)

  );

}



function formatPrice(value: number | null | undefined) {

  if (

    value === null ||

    value === undefined ||

    Number.isNaN(value)

  ) {

    return "—";

  }



  return `₹${value.toLocaleString("en-IN")}`;

}



function AIPriceCard({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div className="pp-card pp-result-card rounded-2xl border border-white/10 bg-white/[0.035] p-5">

      <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">

        {label}

      </p>



      <p className="mt-2 text-xl font-semibold text-white">

        {value}

      </p>

    </div>

  );

}



export default function Home() {

  const [showForm, setShowForm] = useState(false);



  const [loading, setLoading] = useState(false);

  const [searched, setSearched] = useState(false);



  const [item, setItem] = useState("");

  const [price, setPrice] = useState("");

  const [location, setLocation] = useState("");

  const [details, setDetails] = useState("");



  const [condition, setCondition] =

    useState("Used");



  const [usedResults, setUsedResults] = useState<

    UsedResult[]

  >([]);



  const [newResults, setNewResults] = useState<

    NewResult[]

  >([]);

  const [usedAverage, setUsedAverage] = useState<number | null>(null);
  const [usedLowest, setUsedLowest] = useState<number | null>(null);
  const [usedHighest, setUsedHighest] = useState<number | null>(null);
  const [usedPricedCount, setUsedPricedCount] = useState(0);

  const [newAverage, setNewAverage] = useState<number | null>(null);
  const [newLowest, setNewLowest] = useState<number | null>(null);
  const [newHighest, setNewHighest] = useState<number | null>(null);
  const [newPricedCount, setNewPricedCount] = useState(0);



  const [deals, setDeals] = useState<NewResult[]>(

    []

  );



  const [priceAnalysis, setPriceAnalysis] =

    useState<PriceAnalysis | null>(null);



  const [aiAnalysis, setAiAnalysis] =

    useState<AIAnalysis | null>(null);



  const [error, setError] = useState("");



  const electronics = isElectronicItem(item);



  async function analyzeDeal() {

    setError("");



    if (!item.trim()) {

      setError("Item is required.");

      return;

    }



    if (!price || Number(price) <= 0) {

      setError("Please enter a valid asking price.");

      return;

    }



    if (!location.trim()) {

      setError("Location is required.");

      return;

    }



    try {

      setLoading(true);

      setSearched(false);

      setAiAnalysis(null);

    setUsedAverage(null);
    setUsedLowest(null);
    setUsedHighest(null);
    setUsedPricedCount(0);

    setNewAverage(null);
    setNewLowest(null);
    setNewHighest(null);
    setNewPricedCount(0);



      const response = await fetch(

        "/api/analyze",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            item,

            price: Number(price),

            location,

            details,

            condition: electronics

              ? condition

              : null,

          }),

        }

      );



      const data = await response.json();



      if (!response.ok) {

        throw new Error(

          data.error ||

            "Market research failed."

        );

      }



      setUsedResults(

        data.usedMarket?.results || []

      );



      setNewResults(

        data.newMarket?.results || []

      );

      setUsedAverage(data.usedMarket?.averagePrice ?? null);
      setUsedLowest(data.usedMarket?.lowestPrice ?? null);
      setUsedHighest(data.usedMarket?.highestPrice ?? null);
      setUsedPricedCount(data.usedMarket?.pricedListings ?? 0);

      setNewAverage(data.newMarket?.averagePrice ?? null);
      setNewLowest(data.newMarket?.lowestPrice ?? null);
      setNewHighest(data.newMarket?.highestPrice ?? null);
      setNewPricedCount(data.newMarket?.pricedListings ?? 0);



      setDeals(data.deals || []);



      setPriceAnalysis(

        data.priceAnalysis || null

      );



      setAiAnalysis(

        data.aiAnalysis || null

      );



      setSearched(true);

      setShowForm(false);

    } catch (err: any) {

      setError(

        err?.message ||

          "Something went wrong."

      );

    } finally {

      setLoading(false);

    }

  }



  async function copyNegotiationMessage() {

    if (!aiAnalysis?.negotiationMessage) {

      return;

    }



    try {

      await navigator.clipboard.writeText(

        aiAnalysis.negotiationMessage

      );



      alert(

        "Negotiation message copied!"

      );

    } catch {

      alert(

        "Could not copy the message."

      );

    }

  }



  return (

    <main className="pp-shell min-h-screen bg-black text-white">
      <style jsx global>{`
        :root { color-scheme: dark; }
        html { background:#000; scroll-behavior:smooth; }
        body { margin:0; background:#000; color:#fff; }
        .pp-shell { position:relative; overflow-x:hidden; background:
          radial-gradient(circle at 76% 7%, rgba(255,255,255,.075), transparent 23%),
          radial-gradient(circle at 10% 38%, rgba(255,255,255,.035), transparent 25%), #000; }
        .pp-shell::before { content:""; position:fixed; inset:0; pointer-events:none; opacity:.22;
          background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);
          background-size:48px 48px; mask-image:linear-gradient(to bottom,black 0%,transparent 78%); animation:ppGrid 18s linear infinite; }
        .pp-shell::after { content:""; position:fixed; inset:0; pointer-events:none; opacity:.18; background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.08),transparent 35%); mix-blend-mode:screen; }
        .pp-glow { position:absolute; width:440px; height:440px; border-radius:999px; background:radial-gradient(circle,rgba(255,255,255,.10),transparent 68%); filter:blur(16px); animation:ppFloat 9s ease-in-out infinite; pointer-events:none; }
        .pp-enter { animation:ppEnter .72s cubic-bezier(.2,.8,.2,1) both; }
        .pp-enter-delay-1{animation-delay:.08s}.pp-enter-delay-2{animation-delay:.16s}.pp-enter-delay-3{animation-delay:.24s}.pp-enter-delay-4{animation-delay:.32s}
        .pp-card { transform-style:preserve-3d; transition:transform .42s cubic-bezier(.2,.8,.2,1),border-color .3s ease,background .3s ease,box-shadow .42s ease; }
        .pp-card:hover { transform:translateY(-8px) rotateX(1.5deg) rotateY(-1.5deg); border-color:rgba(255,255,255,.25)!important; background:rgba(255,255,255,.055); box-shadow:0 28px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08); }
        .pp-button { position:relative; overflow:hidden; background:linear-gradient(135deg,#fff 0%,#d9d9d9 42%,#8b8b8b 100%); color:#050505!important; box-shadow:0 14px 45px rgba(255,255,255,.12),inset 0 1px 0 rgba(255,255,255,.9); transition:transform .25s ease,box-shadow .25s ease,filter .25s ease; }
        .pp-button:hover { transform:translateY(-3px) scale(1.015); box-shadow:0 20px 60px rgba(255,255,255,.18),inset 0 1px 0 #fff; filter:brightness(1.05); }
        .pp-button::after { content:""; position:absolute; top:-60%; left:-35%; width:24%; height:220%; transform:skewX(-18deg); background:rgba(255,255,255,.7); animation:ppShine 3.2s ease-in-out infinite; }
        .pp-button::before { content:""; position:absolute; inset:1px; border-radius:inherit; border:1px solid rgba(0,0,0,.08); pointer-events:none; }
        .pp-price { animation:ppPrice .7s cubic-bezier(.2,.8,.2,1) both; }
        .pp-3d-scene { perspective:1400px; transform-style:preserve-3d; }
        .pp-3d-stage { position:relative; transform-style:preserve-3d; animation:ppStageFloat 7s ease-in-out infinite; }
        .pp-3d-panel { transform-style:preserve-3d; transition:transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .5s ease,border-color .5s ease; box-shadow:0 40px 100px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.08); }
        .pp-3d-panel:hover { transform:rotateX(5deg) rotateY(-7deg) translateY(-10px) translateZ(24px); box-shadow:0 45px 120px rgba(0,0,0,.7),0 0 70px rgba(255,255,255,.08); border-color:rgba(255,255,255,.28)!important; }
        .pp-3d-depth { transform:translateZ(30px); }.pp-3d-depth-2{transform:translateZ(56px)}
        .pp-orb { position:absolute;border-radius:999px;filter:blur(.2px);transform-style:preserve-3d;animation:ppOrb 8s ease-in-out infinite; }
        .pp-orb-a { width:160px;height:160px;right:2%;top:7%;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.7),rgba(255,255,255,.18) 24%,rgba(255,255,255,.025) 65%,transparent 72%);box-shadow:inset -22px -28px 55px rgba(0,0,0,.6),0 0 80px rgba(255,255,255,.08); }
        .pp-orb-b { width:92px;height:92px;left:5%;bottom:8%;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.6),rgba(255,255,255,.10) 30%,transparent 70%);animation-delay:-3s; }
        .pp-particle { position:absolute;width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.75);box-shadow:0 0 16px rgba(255,255,255,.7);animation:ppParticle 5s ease-in-out infinite; }
        .pp-glass { background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.018));backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px); }
        .pp-neon-line { background:linear-gradient(90deg,transparent,#fff 25%,#777 50%,#fff 75%,transparent);background-size:200% 100%;animation:ppLine 3s linear infinite; }
        .pp-grid-floor { position:absolute;left:5%;right:5%;bottom:-18%;height:52%;opacity:.3;transform:rotateX(68deg);transform-origin:bottom;background-image:linear-gradient(rgba(255,255,255,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.22) 1px,transparent 1px);background-size:38px 38px;mask-image:linear-gradient(to top,black,transparent);animation:ppFloor 10s linear infinite; }
        .pp-result-card { transform-style:preserve-3d; }
        .pp-result-card:hover { transform:translateY(-8px) rotateX(2deg) rotateY(-2deg); }
        .pp-badge-shine { position:relative;overflow:hidden; }
        .pp-badge-shine::after { content:"";position:absolute;inset:-100% 45%;transform:rotate(20deg);background:rgba(255,255,255,.22);animation:ppBadgeShine 3.5s ease-in-out infinite; }
        .pp-number-glow { text-shadow:0 0 28px rgba(255,255,255,.16); }
        .pp-orbit { position:absolute; inset:12%; border:1px solid rgba(255,255,255,.10); border-radius:999px; transform:rotateX(67deg) rotateZ(-10deg); animation:ppOrbit 12s linear infinite; }
        .pp-orbit::after { content:""; position:absolute; width:9px;height:9px;border-radius:50%;background:#fff;top:-4px;left:50%;box-shadow:0 0 25px rgba(255,255,255,.8); }
        .pp-hud { position:absolute; inset:auto 7% 7% auto; border:1px solid rgba(255,255,255,.10); background:rgba(0,0,0,.45); backdrop-filter:blur(14px); padding:.7rem .9rem; border-radius:16px; transform:translateZ(70px); animation:ppHud 4s ease-in-out infinite; }
        @keyframes ppStageFloat{0%,100%{transform:rotateX(4deg) rotateY(-4deg) translate3d(0,0,0)}50%{transform:rotateX(-2deg) rotateY(4deg) translate3d(0,-14px,0)}}
        @keyframes ppOrb{0%,100%{transform:translate3d(0,0,20px) scale(1)}50%{transform:translate3d(26px,-30px,72px) scale(1.08)}}
        @keyframes ppParticle{0%,100%{opacity:.1;transform:translate3d(0,20px,0) scale(.7)}50%{opacity:1;transform:translate3d(0,-35px,0) scale(1.2)}}
        @keyframes ppLine{from{background-position:200% 0}to{background-position:-200% 0}}
        @keyframes ppBadgeShine{0%,55%{left:-60%;opacity:0}65%{opacity:1}100%{left:160%;opacity:0}}
        @keyframes ppOrbit{to{transform:rotateX(67deg) rotateZ(350deg)}}
        @keyframes ppFloor{to{background-position:0 38px,38px 0}}
        @keyframes ppHud{0%,100%{transform:translateZ(70px) translateY(0)}50%{transform:translateZ(82px) translateY(-8px)}}
        @keyframes ppGrid{to{background-position:0 48px,48px 0}}
        .pp-pulse{animation:ppPulse 2.4s ease-in-out infinite}
        .pp-loader{width:58px;height:58px;border-radius:50%;border:3px solid rgba(255,255,255,.10);border-top-color:#fff;border-right-color:#777;animation:ppSpin .85s linear infinite;box-shadow:0 0 35px rgba(255,255,255,.12)}
        .pp-scan{width:240px;height:2px;background:linear-gradient(90deg,transparent,#fff,#777,transparent);animation:ppScan 1.6s ease-in-out infinite}
        @keyframes ppEnter{from{opacity:0;transform:translateY(22px) scale(.985);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}
        @keyframes ppFloat{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(25px,-18px,0) scale(1.08)}}
        @keyframes ppShine{0%,55%{left:-35%}100%{left:125%}}
        @keyframes ppPrice{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
        @keyframes ppPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.05)}50%{box-shadow:0 0 0 8px rgba(255,255,255,0)}}
        @keyframes ppSpin{to{transform:rotate(360deg)}}
        @keyframes ppScan{0%{opacity:.2;transform:scaleX(.3)}50%{opacity:1;transform:scaleX(1)}100%{opacity:.2;transform:scaleX(.3)}}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
      `}</style>

      {/* NAVBAR */}



      <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-2xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <button

            onClick={() => {

              setSearched(false);

              setShowForm(false);

            }}

            className="text-xl font-bold tracking-tight transition hover:opacity-80"

          >

            PricePilot <span className="text-white/40">AI</span>

          </button>



          <button

            onClick={() => setShowForm(true)}

            className="pp-button rounded-full px-5 py-2.5 text-sm font-semibold text-white"

          >

            Analyze a Deal

          </button>

        </div>

      </nav>



      {/* HERO */}

      {!searched && (
        <section className="relative mx-auto max-w-7xl overflow-hidden px-6 pb-24 pt-16 pp-enter">
          <div className="pp-glow -right-24 top-0" />
          <div className="pp-orb pp-orb-a" />
          <div className="pp-orb pp-orb-b" />
          <span className="pp-particle left-[18%] top-[22%]" />
          <span className="pp-particle left-[42%] top-[12%]" style={{animationDelay:"-1.5s"}} />
          <span className="pp-particle right-[28%] top-[30%]" style={{animationDelay:"-2.5s"}} />
          <span className="pp-particle right-[8%] bottom-[24%]" style={{animationDelay:"-3.5s"}} />

          <div className="relative grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
            <div className="relative z-10 max-w-3xl">
              <div className="mb-6 flex flex-wrap gap-2">
                <div className="pp-pulse pp-badge-shine inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/80">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Live market intelligence
                </div>
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/50">
                  New + Used + Deals
                </div>
              </div>

              <h1 className="text-5xl font-semibold leading-[.96] tracking-[-0.045em] md:text-7xl lg:text-[5.8rem]">
                Know the price.
                <br />
                <span className="bg-gradient-to-r from-white via-white/75 to-white/35 bg-clip-text text-transparent">
                  Own the negotiation.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/55 md:text-xl">
                PricePilot researches live market evidence, separates new and used prices, detects deals, and turns the evidence into your next move.
              </p>

              <div className="mt-7 flex flex-wrap gap-3 text-xs text-white/45">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">Live evidence</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">Condition-aware</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">Variant-aware</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">Negotiation ready</span>
              </div>

              <button onClick={() => setShowForm(true)} className="pp-button mt-9 rounded-full px-8 py-4 font-semibold text-white">
                Analyze a Deal <span className="ml-2">↗</span>
              </button>

              <div className="mt-9 flex items-center gap-5 text-xs text-white/30">
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white" />Research</span>
                <span className="h-px w-10 bg-white/10" />
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white" />Compare</span>
                <span className="h-px w-10 bg-white/10" />
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white" />Negotiate</span>
              </div>
            </div>

            <div className="pp-3d-scene relative hidden min-h-[510px] lg:block">
              <div className="pp-grid-floor" />
              <div className="pp-orbit" />
              <div className="pp-hud"><p className="text-[9px] uppercase tracking-[.2em] text-white/35">Signal</p><p className="mt-1 text-xs font-semibold text-white">Live evidence synced</p></div>
              <div className="pp-3d-stage absolute inset-x-0 top-10 mx-auto h-[410px] max-w-[570px]">
                <div className="pp-3d-panel pp-glass absolute inset-0 rounded-[34px] border border-white/10 p-5 shadow-2xl shadow-black/50">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Deal Investigation</p>
                      <p className="mt-1 text-lg font-semibold">iPhone 13 · 128GB</p>
                    </div>
                    <span className="pp-badge-shine rounded-full border border-white/15 bg-white/[.05] px-3 py-1 text-[10px] text-white/80">LIVE</span>
                  </div>
                  <div className="pp-3d-depth mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 pp-3d-depth">
                      <p className="text-[9px] uppercase tracking-[.18em] text-white/30">Fair Range</p>
                      <p className="mt-2 text-lg font-semibold">₹38k–₹42k</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/[.045] p-4">
                      <p className="text-[9px] uppercase tracking-[.18em] text-white/45">Opening</p>
                      <p className="mt-2 text-lg font-semibold text-white">₹37k</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[9px] uppercase tracking-[.18em] text-white/30">Asking</p>
                      <p className="mt-2 text-lg font-semibold">₹50k</p>
                    </div>
                  </div>
                  <div className="pp-3d-depth-2 mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[.18em] text-white/30">Market Evidence</p>
                      <p className="text-[10px] text-white/75">12 relevant matches</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full w-[72%] rounded-full bg-white" /></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full w-[54%] rounded-full bg-white/70" /></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full w-[84%] rounded-full bg-white/85" /></div>
                    </div>
                  </div>
                  <div className="pp-neon-line mt-5 h-px w-full opacity-70" />
                  <div className="mt-4 flex items-center justify-between text-[10px] text-white/30">
                    <span>NEW</span><span>USED</span><span>DEALS</span><span>NEGOTIATE</span>
                  </div>
                </div>
                <div className="pp-3d-panel absolute -right-8 top-20 w-44 rounded-2xl border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-xl" style={{transform:"translateZ(90px) rotateY(-7deg)"}}>
                  <p className="text-[9px] uppercase tracking-[.18em] text-white/30">Market Signal</p>
                  <p className="mt-2 text-2xl font-semibold text-white/80">Below</p>
                  <p className="mt-1 text-xs text-white/35">asking price vs evidence</p>
                </div>
                <div className="pp-3d-panel absolute -left-8 bottom-5 w-48 rounded-2xl border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-xl" style={{transform:"translateZ(70px) rotateY(7deg)"}}>
                  <p className="text-[9px] uppercase tracking-[.18em] text-white/30">Negotiation</p>
                  <p className="mt-2 text-sm font-medium">Start with evidence.</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full w-[76%] rounded-full bg-white" /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-16 grid gap-4 md:grid-cols-3">
            <div className="pp-card pp-result-card rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="text-2xl">◈</div>
              <h3 className="mt-5 text-lg font-semibold">Live Market Research</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">Search current evidence and separate relevant listings from noise.</p>
            </div>
            <div className="pp-card pp-result-card rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="text-2xl">✦</div>
              <h3 className="mt-5 text-lg font-semibold">Price Intelligence</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">Build a fair range from real market signals instead of one listing.</p>
            </div>
            <div className="pp-card pp-result-card rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="text-2xl">↗</div>
              <h3 className="mt-5 text-lg font-semibold">Negotiation Copilot</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">Know where to start, where to stop, and what to say.</p>
            </div>
          </div>
        </section>
      )}

      {/* RESULTS */}



      {searched && (

        <section className="mx-auto max-w-7xl px-6 py-12 pp-enter">

          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">

                Deal Investigation

              </p>



              <h1 className="mt-2 text-4xl font-semibold">

                {item}

              </h1>



              <p className="mt-2 text-white/45">

                {location}

                {electronics &&

                  ` • ${condition}`}

              </p>

            </div>



            <button

              onClick={() => setShowForm(true)}

              className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium transition hover:bg-white/10"

            >

              New Analysis

            </button>

          </div>



          {/* ASKING PRICE */}



          <div className="pp-card rounded-3xl border border-white/10 bg-white/[0.03] p-7">

            <p className="text-xs uppercase tracking-[0.2em] text-white/35">

              Seller Asking Price

            </p>



            <div className="pp-price pp-number-glow mt-3 text-4xl font-semibold">

              {formatPrice(

                Number(price)

              )}

            </div>

          </div>



          {/* AI PRICE INTELLIGENCE */}



          {aiAnalysis && (

            <section className="pp-card mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-7 pp-enter pp-enter-delay-1">

              <div className="flex flex-col justify-between gap-4 md:flex-row">

                <div>

                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">

                    AI Price Intelligence

                  </p>



                  <h2 className="mt-2 text-2xl font-semibold">

                    {aiAnalysis.marketVerdict}

                  </h2>

                </div>



                <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60">

                  Confidence:{" "}

                  <span className="text-white">

                    {aiAnalysis.confidence}

                  </span>

                </div>

              </div>



              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <AIPriceCard

                  label="Fair Price"

                  value={`${formatPrice(

                    aiAnalysis.fairPriceLow

                  )} – ${formatPrice(

                    aiAnalysis.fairPriceHigh

                  )}`}

                />



                <AIPriceCard

                  label="Opening Offer"

                  value={formatPrice(

                    aiAnalysis.suggestedOpeningOffer

                  )}

                />



                <AIPriceCard

                  label="Maximum Reasonable"

                  value={formatPrice(

                    aiAnalysis.maximumReasonablePrice

                  )}

                />



                <AIPriceCard

                  label="Seller Asking"

                  value={formatPrice(

                    Number(price)

                  )}

                />

              </div>



              <div className="mt-6 grid gap-4 lg:grid-cols-2">

                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">

                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">

                    Why this price?

                  </p>



                  <p className="mt-4 leading-7 text-white/65">

                    {aiAnalysis.reasoning}

                  </p>

                </div>



                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">

                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">

                    Negotiation Strategy

                  </p>



                  <p className="mt-4 leading-7 text-white/65">

                    {aiAnalysis.negotiationStrategy}

                  </p>

                </div>

              </div>



              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-6">

                <div className="flex items-center justify-between gap-4">

                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">

                    Copy-ready negotiation message

                  </p>



                  <button

                    onClick={

                      copyNegotiationMessage

                    }

                    className="pp-button rounded-full px-4 py-2 text-xs font-semibold text-white"

                  >

                    Copy Message

                  </button>

                </div>



                <p className="mt-4 leading-7 text-white/70">

                  {aiAnalysis.negotiationMessage}

                </p>

              </div>

            </section>

          )}



          {/* MARKET DATA */}



          {priceAnalysis && (

            <section className="mt-6">

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">

                Deal Intelligence

              </p>



              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <AIPriceCard

                  label="Market Average"

                  value={formatPrice(

                    priceAnalysis.averageMarketPrice

                  )}

                />



                <AIPriceCard

                  label="Fair Range"

                  value={`${formatPrice(

                    priceAnalysis.fairPriceLow

                  )} – ${formatPrice(

                    priceAnalysis.fairPriceHigh

                  )}`}

                />



                <AIPriceCard

                  label="Suggested Offer"

                  value={formatPrice(

                    priceAnalysis.suggestedOffer

                  )}

                />



                <AIPriceCard

                  label="Market Status"

                  value={

                    priceAnalysis.marketStatus

                  }

                />

              </div>



              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/55">

                  <span>

                    Asking:{" "}

                    <b className="text-white">

                      {formatPrice(

                        priceAnalysis.askingPrice

                      )}

                    </b>

                  </span>



                  <span>

                    Difference:{" "}

                    <b className="text-white">

                      {priceAnalysis.differenceFromAverage !==

                      null

                        ? formatPrice(

                            priceAnalysis.differenceFromAverage

                          )

                        : "—"}

                    </b>

                  </span>



                  <span>

                    Gap:{" "}

                    <b className="text-white">

                      {priceAnalysis.differencePercent !==

                      null

                        ? `${priceAnalysis.differencePercent}%`

                        : "—"}

                    </b>

                  </span>

                </div>

              </div>

            </section>

          )}



          {/* OFFERS */}



          {deals.length > 0 && (

            <section className="mt-12">

              <div>

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">

                  Live Deals

                </p>



                <h2 className="mt-2 text-2xl font-semibold">

                  🔥 Offers & Discounts

                </h2>

              </div>



              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {deals.map(

                  (deal, index) => (

                    <a

                      key={`${deal.title}-${index}`}

                      href={

                        deal.link || "#"

                      }

                      target="_blank"

                      rel="noreferrer"

                      className="pp-card pp-result-card group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition"

                    >

                      {deal.thumbnail && (

                        <img

                          src={

                            deal.thumbnail

                          }

                          alt=""

                          className="mb-4 h-40 w-full rounded-xl object-contain bg-white"

                        />

                      )}



                      <p className="font-medium leading-6">

                        {deal.title}

                      </p>



                      <div className="mt-3 flex items-center justify-between">

                        <span className="text-lg font-semibold">

                          {deal.price ||

                            "View deal"}

                        </span>



                        {deal.discountPercent !==

                          null && (

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black">

                            {deal.discountPercent}% OFF

                          </span>

                        )}

                      </div>



                      {deal.source && (

                        <p className="mt-2 text-xs text-white/35">

                          {deal.source}

                        </p>

                      )}

                    </a>

                  )

                )}

              </div>

            </section>

          )}



          {/* NEW MARKET */}



          {newResults.length > 0 && (

            <section className="mt-12">

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">

                Current Market

              </p>



              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">





                <div>





                  <h2 className="mt-2 text-2xl font-semibold">





                    New Market





                  </h2>





                </div>







                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">





                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">





                    New Retail Average





                  </p>





                  <p className="mt-1 text-xl font-semibold">





                    {formatPrice(newAverage)}





                  </p>





                </div>





              </div>







              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {newResults.map(

                  (result, index) => (

                    <a

                      key={`${result.title}-${index}`}

                      href={

                        result.link || "#"

                      }

                      target="_blank"

                      rel="noreferrer"

                      className="pp-card pp-result-card rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition"

                    >

                      {result.thumbnail && (

                        <img

                          src={

                            result.thumbnail

                          }

                          alt=""

                          className="h-36 w-full rounded-xl bg-white object-contain"

                        />

                      )}



                      <p className="mt-4 text-sm font-medium leading-5">

                        {result.title}

                      </p>



                      <p className="mt-3 text-lg font-semibold">

                        {result.price ||

                          "Price unavailable"}

                      </p>



                      {result.source && (

                        <p className="mt-1 text-xs text-white/35">

                          {result.source}

                        </p>

                      )}

                    </a>

                  )

                )}

              </div>

            </section>

          )}



          {/* USED MARKET */}

          {usedResults.length > 0 && (
            <section className="mt-16">
              <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
                <div className="pp-card relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.025] p-7">
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-white/10" />
                  <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full border border-white/10" />
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/35">Second-hand evidence</p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-semibold tracking-tight">Used Market</h2>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">Validated second-hand listings only. Refurbished and new-retail results are kept out of this average.</p>
                    </div>
                    <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] sm:flex">
                      <span className="text-2xl">↗</span>
                    </div>
                  </div>

                  <div className="mt-7 rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Observed average</p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight">{formatPrice(usedAverage)}</p>
                    <p className="mt-2 text-xs text-white/35">{usedPricedCount} priced listing{usedPricedCount === 1 ? "" : "s"} used</p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">Lowest</p>
                      <p className="mt-2 text-lg font-semibold">{formatPrice(usedLowest)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">Highest</p>
                      <p className="mt-2 text-lg font-semibold">{formatPrice(usedHighest)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    Evidence-backed prices
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {usedResults.map((result, index) => (
                    <a
                      key={`${result.title}-${index}`}
                      href={result.link || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="group pp-card relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.025] transition duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.045]"
                    >
                      {result.thumbnail ? (
                        <div className="relative h-44 overflow-hidden bg-white">
                          <img src={result.thumbnail} alt="" className="h-full w-full object-contain transition duration-700 group-hover:scale-105" />
                          <div className="absolute left-4 top-4 rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black">
                            {result.condition || "Used"}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-28 items-center justify-between border-b border-white/10 px-5">
                          <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">Marketplace evidence</span>
                          <span className="text-2xl text-white/30">↗</span>
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <p className="line-clamp-2 text-sm font-medium leading-6 text-white/90">{result.title}</p>
                          <span className="shrink-0 text-lg font-semibold">{result.price || "—"}</span>
                        </div>
                        {result.source && <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-white/30">{result.source}</p>}

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {result.storage && (
                            <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
                              <p className="text-[8px] uppercase tracking-[0.16em] text-white/25">Storage</p>
                              <p className="mt-1 text-xs font-medium text-white/75">{result.storage}</p>
                            </div>
                          )}
                          {result.batteryHealth && (
                            <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
                              <p className="text-[8px] uppercase tracking-[0.16em] text-white/25">Battery</p>
                              <p className="mt-1 text-xs font-medium text-white/75">{result.batteryHealth}</p>
                            </div>
                          )}
                          {result.locationDetail && (
                            <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
                              <p className="text-[8px] uppercase tracking-[0.16em] text-white/25">Location</p>
                              <p className="mt-1 truncate text-xs font-medium text-white/75">{result.locationDetail}</p>
                            </div>
                          )}
                          {result.posted && (
                            <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
                              <p className="text-[8px] uppercase tracking-[0.16em] text-white/25">Posted</p>
                              <p className="mt-1 text-xs font-medium text-white/75">{result.posted}</p>
                            </div>
                          )}
                        </div>

                        {result.snippet && <p className="mt-4 line-clamp-4 text-xs leading-5 text-white/40">{result.snippet}</p>}

                        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.16em] text-white/25">Evidence</span>
                            {result.listingType && <span className="ml-2 text-[10px] text-white/35">• {result.listingType}</span>}
                          </div>
                          <span className="text-xs text-white/55 transition group-hover:text-white">Open listing ↗</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* MARKET AVERAGE COMPARISON */}

          {(usedAverage !== null || newAverage !== null) && (

            <section className="mt-12 pb-20">

              <div className="pp-card rounded-3xl border border-white/10 bg-white/[0.03] p-7">

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">

                  Market Comparison

                </p>

                <h2 className="mt-2 text-2xl font-semibold">

                  New vs Used Average

                </h2>



                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <AIPriceCard

                    label="Used Market Average"

                    value={formatPrice(usedAverage)}

                  />

                  <AIPriceCard

                    label="New Market Average"

                    value={formatPrice(newAverage)}

                  />

                </div>

              </div>

            </section>

          )}

        </section>
      )}

      {!searched && (
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="pp-enter pp-enter-delay-3 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-6 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/30">01 / Research</p>
              <p className="mt-2 font-medium">Search current market evidence</p>
              <p className="mt-1 text-sm leading-6 text-white/40">Compare relevant listings instead of relying on one asking price.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/30">02 / Understand</p>
              <p className="mt-2 font-medium">Separate new and used markets</p>
              <p className="mt-1 text-sm leading-6 text-white/40">Use condition and location to keep the comparison meaningful.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/30">03 / Negotiate</p>
              <p className="mt-2 font-medium">Turn evidence into your next move</p>
              <p className="mt-1 text-sm leading-6 text-white/40">Get a fair range, opening offer, and a ready-to-send message.</p>
            </div>
          </div>

          <footer className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/30 md:flex-row md:items-center md:justify-between">
            <span>PricePilot AI · Smarter prices. Better deals.</span>
            <span>Live market evidence · Built for real-world negotiation</span>
          </footer>
        </section>
      )}

      {/* FORM MODAL */}



      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-5 backdrop-blur-xl">

          <div className="pp-enter pp-3d-panel w-full max-w-xl rounded-3xl border border-white/10 bg-[#080808]/95 p-7 shadow-2xl shadow-violet-950/30">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs uppercase tracking-[0.2em] text-white/35">

                  Price Investigation

                </p>



                <h2 className="mt-2 text-2xl font-semibold">

                  Analyze your deal

                </h2>

              </div>



              <button

                onClick={() =>

                  setShowForm(false)

                }

                className="text-xl text-white/40 hover:text-white"

              >

                ×

              </button>

            </div>



            <div className="mt-7 space-y-5">

              {/* ITEM */}



              <div>

                <label className="mb-2 block text-sm text-white/55">

                  Item

                </label>



                <input

                  value={item}

                  onChange={(e) =>

                    setItem(e.target.value)

                  }

                  placeholder="e.g. iPhone 13 128GB"

                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 outline-none transition placeholder:text-white/20 focus:border-white/30"

                />

              </div>



              {/* ASKING PRICE */}



              <div>

                <label className="mb-2 block text-sm text-white/55">

                  Seller Asking Price

                </label>



                <input

                  type="number"

                  value={price}

                  onChange={(e) =>

                    setPrice(e.target.value)

                  }

                  placeholder="42000"

                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 outline-none transition placeholder:text-white/20 focus:border-white/30"

                />

              </div>



              {/* LOCATION */}



              <div>

                <label className="mb-2 block text-sm text-white/55">

                  Location

                </label>



                <input

                  value={location}

                  onChange={(e) =>

                    setLocation(

                      e.target.value

                    )

                  }

                  placeholder="Pune"

                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 outline-none transition placeholder:text-white/20 focus:border-white/30"

                />

              </div>



              {/* ELECTRONICS CONDITION */}



              {electronics && (

                <div>

                  <label className="mb-2 block text-sm text-white/55">

                    Condition

                  </label>



                  <select

                    value={condition}

                    onChange={(e) =>

                      setCondition(

                        e.target.value

                      )

                    }

                    className="w-full appearance-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white outline-none transition focus:border-white/30"

                  >

                    <option

                      value="Used"

                      className="bg-[#111]"

                    >

                      Used

                    </option>



                    <option

                      value="Refurbished"

                      className="bg-[#111]"

                    >

                      Refurbished

                    </option>



                    <option

                      value="Open Box"

                      className="bg-[#111]"

                    >

                      Open Box

                    </option>



                    <option

                      value="New"

                      className="bg-[#111]"

                    >

                      New

                    </option>



                    <option

                      value="Like New"

                      className="bg-[#111]"

                    >

                      Like New

                    </option>

                  </select>

                </div>

              )}



              {/* DETAILS */}



              <div>

                <label className="mb-2 block text-sm text-white/55">

                  Extra Details{" "}

                  <span className="text-white/25">

                    (optional)

                  </span>

                </label>



                <textarea

                  value={details}

                  onChange={(e) =>

                    setDetails(

                      e.target.value

                    )

                  }

                  rows={3}

                  placeholder={

                    electronics

                      ? "Battery health, warranty, box, accessories, defects..."

                      : "Age, condition, material, size, defects..."

                  }

                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 outline-none transition placeholder:text-white/20 focus:border-white/30"

                />

              </div>



              {error && (

                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">

                  {error}

                </div>

              )}



              <button

                onClick={analyzeDeal}

                disabled={loading}

                className="pp-button w-full rounded-2xl py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"

              >

                {loading

                  ? "Researching..."

                  : "Analyze Deal →"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* LOADING */}



      {loading && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 px-6 backdrop-blur-md">

          <div className="text-center">

            <div className="pp-loader mx-auto" />

            <div className="pp-scan mx-auto mt-6" />



            <h2 className="mt-7 text-2xl font-semibold">

              Researching the market...

            </h2>



            <p className="mt-3 text-sm text-white/45">

              Comparing live prices and analyzing

              market evidence

            </p>

          </div>

        </div>

      )}

    </main>

  );

}
