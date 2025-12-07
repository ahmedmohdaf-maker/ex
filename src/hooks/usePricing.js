import { useState, useCallback } from 'react'

const COINGECKO_CHAIN = 'polygon-pos'
const USDC_ADDR = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'

const fetchWithTimeout = (url, opts = {}, ms = 5000) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...opts, signal: controller. signal }).finally(() => clearTimeout(id))
}

export const usePricing = () => {
  const [priceCache, setPriceCache] = useState(new Map())
  const [loading, setLoading] = useState(false)

  const fetch1InchQuotePrice = useCallback(async (addr, decimals = 18) => {
    try {
      const amountBN = '1' + '0'.repeat(decimals)
      const url = `https://api.1inch.io/v5.0/137/quote?fromTokenAddress=${addr}&toTokenAddress=${USDC_ADDR}&amount=${amountBN}`
      const res = await fetchWithTimeout(url, {}, 3000)
      if (! res.ok) throw new Error('1inch non-ok')
      const j = await res. json()
      if (! j?. toTokenAmount) throw new Error('no toTokenAmount')
      return Number(j.toTokenAmount) / 10 ** 6
    } catch (e) {
      console.warn('1inch price failed:', e)
      return null
    }
  }, [])

  const fetchCoingeckoPrice = useCallback(async (addr) => {
    try {
      const url = `https://api. coingecko.com/api/v3/simple/token_price/${COINGECKO_CHAIN}?contract_addresses=${addr}&vs_currencies=usd`
      const res = await fetchWithTimeout(url, {}, 3000)
      if (!res.ok) throw new Error('cg non-ok')
      const j = await res.json()
      const v = j[addr. toLowerCase()]?. usd
      return v && Number. isFinite(v) && v > 0 ? v : null
    } catch (e) {
      console.warn('CoinGecko price failed:', e)
      return null
    }
  }, [])

  const fetchDexscreenerPrice = useCallback(async (addr) => {
    try {
      const url = `https://api.dexscreener. com/latest/dex/tokens/${addr}`
      const res = await fetchWithTimeout(url, {}, 3000)
      if (!res.ok) throw new Error('dexscreener non-ok')
      const j = await res.json()
      const pairs = j?. pairs || []
      for (const p of pairs) {
        const v = Number(p.priceUsd || p.price)
        if (Number.isFinite(v) && v > 0) return v
      }
      return null
    } catch (e) {
      console.warn('Dexscreener price failed:', e)
      return null
    }
  }, [])

  const getTokenPriceUSD = useCallback(
    async (addr) => {
      if (!addr) return null
      const cached = priceCache.get(addr. toLowerCase())
      if (cached && Date.now() - cached.ts < 30000) return cached.price

      setLoading(true)
      let price =
        (await fetch1InchQuotePrice(addr)) ||
        (await fetchCoingeckoPrice(addr)) ||
        (await fetchDexscreenerPrice(addr))

      if (price) {
        setPriceCache(prev => new Map(prev).set(addr.toLowerCase(), { price, ts: Date. now() }))
      }
      setLoading(false)
      return price
    },
    [priceCache, fetch1InchQuotePrice, fetchCoingeckoPrice, fetchDexscreenerPrice]
  )

  return {
    getTokenPriceUSD,
    loading,
  }
}
