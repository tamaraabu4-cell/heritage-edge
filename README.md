# Heritage Edge

**My personal vault for trading, markets and the technology behind them. It's a portfolio and a knowledge hub in one site.**

🌐 **Live site:** [theheritageedge.com](https://theheritageedge.com)

*est. 2026 · London — Lagos*

---

## What this is

I'm Tamara, a London-based graduate in Business, Computing & IT (Aston University, 2026). I research trade ideas across FX, rates and commodities, and I write the code to test them.

Heritage Edge is where all of that lives. It does two jobs:

- **A portfolio**: finished, documented projects that show how I think about markets and how I use code to test an idea. Every project follows the same four steps: **Thesis → Method → Tech → Result**.
- **A knowledge hub**: an organised vault of everything I learn about the industry, written in my own words with interactive charts. It ties each idea back to how trading and finance actually work, not just the theory.

The name has a story. *Heritage* comes from Heritage Oil, the first company I worked for. *Edge* is what every trade is looking for.

The site is built around a long-term plan: **trade → use trading capital to move into real estate → bring fintech to Nigeria.** That's why the projects and the hub cover all three.

---

## What's on the site

| Section | What it holds |
|---|---|
| **Home** | A rotating set of highlights drawn from my projects, blog posts and selected lessons. Each visit shows a different mix. Also introduces the four-step project method and the areas the hub covers. |
| **Projects** | Backtests, pricing models, trade memos and job simulations, grouped by topic. Each project has its own page with interactive charts, the maths in LaTeX, and the code. |
| **Knowledge Hub** 🔒 | My private study vault (passcode-protected). Selected snippets are shared publicly through the homepage highlights. |
| **Blog** | A *Reading list* series reviewing trading and finance books, plus write-ups on my own projects and on markets. |
| **About** | My background, skills and markets, what I'm working on now, and how to get in touch. |

---

## Projects

| Project | Thesis | Method & Tech | Result |
|---|---|---|---|
| **Mean Reversion in FX and Commodities** | Does betting against yesterday's move, a rule that works on some crypto, survive in FX, gold and oil? | A four-stage study: the simple rule on EURUSD, USDJPY, gold and WTI (2012–2026) with real spread costs; a big-move z-score filter with volatility-targeted sizing; pairs trading with Engle–Granger cointegration tests; and Brent/WTI rebuilt on spot prices to remove futures roll effects. Python, pandas, Jupyter. | The simple rule fails after costs. Only the Brent/WTI pair holds up: out-of-sample Sharpe 1.57 on spot prices (t = 2.99), falling to 0.92 when entering a day late. |
| **J.P. Morgan Quantitative Research** *(job simulation)* | A retail bank needs to know how likely each borrower is to default, and how to turn credit scores into rating buckets. | Probability-of-default model on a loan book with expected-loss estimates; dynamic programming to bucket FICO scores. Python. | J.P. Morgan Quantitative Research virtual job simulation (Forage), rebuilt as one project page. |
| **Pricing Coffee Derivatives** *(job simulation)* | A six-month coffee call needs a fair price, and the desk needs to know its risk after selling it. | Cost of carry → Black-76 → Monte Carlo (500k paths); a coffee-linked structured note; a desk risk review. Python, NumPy, SciPy. | Black-76 and Monte Carlo agree to within 0.02%. Note solved at 40.9% participation. Citi Markets Quant virtual job simulation (Forage). |
| **December FOMC Trade Memo** | The market prices about a 10% chance the Fed holds on 9 December; I put it nearer 30%. | Bull call spread on SR3Z6 SOFR futures options, with scenario pricing and expected value. | Paper trade: max loss $750, max gain $2,375, positive EV at my odds. Post-mortem to follow the decision. |
| **Liquidity-Sweep Reversal Backtest** | Do false breakouts of recent highs and lows reverse often enough to trade? | 96-combination grid search on EURUSD daily data, in-sample/out-of-sample split, Sharpe decay test. Python. | Poor performance on daily data. The write-up explains why (wrong timeframe, too few signals, no session or trend filter) and sets out a better test. |

### Coming next
1. **Oil tanker tracker**: tracking oil tankers and estimating which are carrying oil and which are empty *(in progress)*
2. **Naira FX exposure tool**: currency exposure from bank statements for an importer's finance team
3. **UK yield curve explorer**
4. **Limit order book in Rust**
5. A real estate project after that

---

## The Knowledge Hub

The hub is the biggest part of the site. It stays private, but this is how it's organised:

**Vault → Topic → Chapter → Subtopic → Note**

**Topics:** Maths · Probability & Statistics · Valuation · Markets · Macro · Trading · Hedge Funds · Quant · Code & Infrastructure · Real Estate · Fintech & Nigeria

Each topic has its own colour and icon, and a home page laid out as a path through its chapters, with progress tracking. Every note includes:

- numbered sections with a contents rail and reading progress
- interactive charts and calculators
- all maths typeset in LaTeX
- **glossary hover definitions**: hover a dotted word to see a plain-English meaning (360+ terms so far, with their own searchable glossary page)
- a *How does this link to…* section connecting the idea to trading, real estate, quant or fintech
- a **Check yourself** quiz that has to be passed before the note can be marked done
- a personal journal for extra notes and working out
- *builds on* and *connected notes* links, so ideas that span topics stay connected

---

## How it's built

| Layer | Tools |
|---|---|
| **Site generator** | [Eleventy 3](https://www.11ty.dev/) with Nunjucks templates and JSON data files |
| **Front end** | Hand-written HTML, CSS and vanilla JavaScript. No front-end framework |
| **Charts & maths** | Chart.js and hand-drawn SVG charts; MathJax for LaTeX |
| **Hosting** | Cloudflare Pages, built automatically on every push to `main` |
| **Hub security** | Cloudflare Pages Functions: a server-side passcode lock with a custom keypad, plus Face ID / Touch ID sign-in using passkeys (WebAuthn) |
| **Analysis** | Python: NumPy, pandas, SciPy, Matplotlib, Jupyter |
| **Data** | yfinance, FRED, HistData |
| **Design** | DM Sans + DM Mono; warm ivory/charcoal palette with a green accent; light and dark modes |

### Run it locally

```bash
npm install
npm start          # preview at http://localhost:8080
npx @11ty/eleventy # build the site into _site/
```

*(The hub lock only runs on Cloudflare, so the hub is unlocked when previewing locally.)*

### Repository structure

```
heritage-edge/
├── eleventy.config.js        # Eleventy setup: filters, shortcodes, collections
├── functions/
│   └── _middleware.js        # Knowledge Hub lock (runs on Cloudflare)
└── src/
    ├── _data/                # Site content as data: projects, hub topics, glossary, about page
    ├── _includes/
    │   ├── layouts/          # Base, project, note and blog post layouts
    │   ├── partials/         # Nav, sidebar, footer, icons
    │   └── home/             # Homepage sections
    ├── assets/
    │   ├── css/              # site.css, hub.css, note.css, per-project styles
    │   ├── js/               # Theme, sidebar, highlights, hub progress, charts
    │   └── data/             # Data behind project charts
    ├── projects/             # Project pages, notebooks and code
    ├── hub/                  # Vault home, topic homes and notes
    ├── blog/                 # Blog page and posts (Markdown)
    ├── about.njk
    └── index.njk
```

---

## What I'm looking for

I'm looking for **off-cycle internships** and **graduate roles starting September 2027** in markets: sales & trading (FX and commodities), quant, hedge funds and investment management.

## Contact

Built and maintained by **Tamara**

- Website: [theheritageedge.com](https://theheritageedge.com)
- LinkedIn: [tamara-abu](https://www.linkedin.com/in/tamara-abu-767577255/)
- GitHub: [@tamaraabu4-cell](https://github.com/tamaraabu4-cell)
- Email: tamaraabu4@gmail.com

*Started March 2026 · Rebuilt as Heritage Edge in October 2026 · Updated continuously.*
