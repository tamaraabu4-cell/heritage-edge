---
title: "The Little Book That Beats the Market: when patience is the edge"
date: 2026-11-09
category: Reading list
summary: "Joel Greenblatt's two-number formula for buying good businesses cheaply, chapter by chapter, and why its most interesting idea isn't the formula at all."
book:
  title: "The Little Book That Beats the Market"
  author: "Joel Greenblatt"
  year: 2005
  list: original
  takeaway: "Patience is an edge, because most people can't stick with a strategy through its bad years."
---

Another book on the reading list I was given over coffee is Joel Greenblatt's *The Little Book That Beats the Market*, from 2005. After [A Random Walk Down Wall Street](/blog/a-random-walk-down-wall-street.html), it felt like reading the other side of the argument. Malkiel says you can't reliably beat the market. Greenblatt, who ran a hedge fund with famously strong returns, says you can, with a formula simple enough to explain to a child. He even wrote the book with his own children in mind.

## The big idea

Buy good businesses when they're cheap. Measure "good" and "cheap" with two simple numbers, buy the companies that score best on both, hold them for about a year, then repeat. The hard part isn't the maths. It's staying patient when the formula stops working for a while, which it will.

## The early chapters: what is a business worth?

Greenblatt starts small. Jason, a schoolboy, runs a business selling gum to his classmates. What would you pay for a share of it? The answer is: whatever it's worth in future profits. A business is worth the money it earns, and a share is just a slice of those earnings. It's Malkiel's "firm foundation" idea in its simplest form.

Next, he imagines buying a shop called Just Broccoli. Before you decide, compare it with the safest thing you could do with the money instead: lend it to the government by buying a government bond. If the shop is expected to earn less than the bond pays, why take the risk at all? My take: this is **opportunity cost**, and it links straight to bond yields. When interest rates rise, the bar every investment has to clear rises with them. That's part of why rate decisions, like the [Bank of England's rise last week](/blog/bank-of-england-raises-rates.html), move almost every market.

Then comes the catch: future earnings are uncertain. It isn't just how much a business might earn that matters, but how confident you can be that it will.

## The middle chapters: Mr. Market and margin of safety

This is where Greenblatt borrows from Benjamin Graham, the father of value investing.

**Mr. Market** is an imaginary business partner who turns up every day offering to buy your share of the business or sell you his. Some days he's euphoric and asks a silly high price. Other days he's miserable and will sell for far less than it's worth. You don't have to trade with him. You just take advantage of his bad moods.

My take: this is the most important chapter. The same person who gave me the reading list told me to look for "dead sea" assets: the overlooked things everyone else walks past. Mr. Market's bad days are exactly when good assets become overlooked.

**Margin of safety** means only buying well below what you think something is worth, so that being somewhat wrong doesn't hurt much. If you think a business is worth £100 a share and you buy at £60, you can be quite wrong and still be fine. It's the same question as the "floor" on my own checklist for overlooked assets: if I'm wrong, how far could this fall?

## The core: the magic formula

Greenblatt turns all of this into two numbers.

**1. Is it a good business? Return on capital.** How much profit does the business make compared with the money tied up in running it, like its buildings, machines and stock? Say a shop needs £400,000 of capital to run and makes £100,000 a year before interest and tax. That's a return on capital of 25%. A business that needs £2 million to make the same £100,000 earns just 5%. The first is a much better business.

**2. Is it cheap? Earnings yield.** How much profit does the business make compared with the price of the whole company, including its debts? This is operating profit divided by **enterprise value**. If a company costs £1 million in total and makes £100,000 a year, its earnings yield is 10%. It's the business version of a bond's yield: the higher it is, the more you get for what you pay.

**The formula:** rank every company on each number, add the two rankings together, and buy the companies with the best combined score. A company that ranks 1st for quality but 40th for price scores 41. One that ranks 10th and 12th scores 22, so it wins: decent on both beats brilliant on one. Banks, insurers and utilities are left out, because their accounts don't fit the two measures.

## The later chapters: does it actually work?

In Greenblatt's own backtest, covering 17 years to 2004, the formula returned about 30% a year, against roughly 12% for the market.

My take: be careful. My own [mean reversion project](/projects/fx-commodities-mean-reversion.html) taught me that the best-looking result deserves the most suspicion. Backtests flatter, and the real test is what happens after a book is published. Independent tests since have been more modest. One found about 11% a year for US shares from 2003 to 2015, against about 9% for the market. And the formula struggled through much of the 2010s, when value investing as a whole had a long bad run.

Greenblatt is honest that it doesn't always work. It can lag the market for two or three years at a time, and in his experience that's exactly when most people give up.

Then comes the argument I found most interesting in the whole book: **the formula keeps working precisely because it's painful to follow.** If it beat the market smoothly every year, everyone would use it, and the edge would disappear. It survives because sticking with it through those bad years is genuinely hard.

My take: some edges exist not because people can't see them, but because they can't stomach them. That's a different kind of edge from the ones Malkiel worries about. It doesn't depend on knowing something others don't. It depends on behaving differently from them.

**How to use it:** Greenblatt offers a free screener on his website. Buy 20 to 30 of the top-ranked stocks, spread across the year, hold each for about a year, then replace them with whatever ranks highly next.

## How it fits with Malkiel

At first the two books look like opposites. Malkiel says you can't reliably beat the market; Greenblatt says a simple formula can. I think they fit together better than that.

The formula is really two well-known **factors**: value (buying cheap) and quality (buying good businesses). They've worked over long periods, but they go through painful droughts. That's exactly where I disagreed with Malkiel in my review of his book: factor edges are real, but smaller and harder to live with than a backtest makes them look. Greenblatt's book is the human side of that point.

## What it would look like in FX

I want to work in FX, so I tried translating the formula:

- **Cheap** becomes **value**: is a currency weak compared with what it should be worth, measured against what money buys in each country (purchasing power parity, or the real exchange rate)?
- **Earnings yield** becomes **carry**: the interest you earn for holding a currency.
- **A good business** becomes **a credible central bank** that keeps interest rates above inflation. In my [Bank of England post](/blog/bank-of-england-raises-rates.html), that's the "real rate": about 0.5% in the UK, against about 8% in Nigeria.
- **Mr. Market's mood swings** become **overshooting**: currencies often move much further than the news justifies, then drift back.

Ranking the ten major currencies on carry and value, then testing it honestly in Python, is a project I'd like to build. It would turn this book into something I've actually tested rather than just read.

## What I'm taking from it

Greenblatt didn't convince me there's a magic formula. He convinced me that knowing the right answer is only half of it. The other half is being able to stick with it when it looks wrong.

> Some edges survive not because people can't see them, but because they can't stick with them. Patience can be an edge in itself.

More from the reading list soon.
