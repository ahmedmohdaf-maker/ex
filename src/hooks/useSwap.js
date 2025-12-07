import { useState, useCallback } from 'react'
import { ethers } from 'ethers'

const ONEINCH_BASE = 'https://api.1inch.io/v5. 0/137'
const ZEROX_BASE = 'https://polygon. api.0x.org'
const USDC_ADDR = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'

const fetchWithTimeout = (url, opts = {}, ms = 5000) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...opts, signal: controller.signal }). finally(() => clearTimeout(id))
}

export const useSwap = (signer, userAddress) => {
  const [quoteCache, setQuoteCache] = useState(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch1InchQuote = useCallback(
    async (fromToken, toToken, amount) => {
      try {
        const cacheKey = `${fromToken}-${toToken}-${amount}`
        const cached = quoteCache.get(cacheKey)
        if (cached && Date.now() - cached.ts < 10000) return cached.quote

        const url = `${ONEINCH_BASE}/quote? fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}`
        const res = await fetchWithTimeout(url, {}, 3000)
        const j = await res.json()
        if (j.statusCode) throw new Error(j.description || 'Quote failed')

        const quote = { toTokenAmount: j.toTokenAmount, ... j }
        setQuoteCache(prev => new Map(prev). set(cacheKey, { quote, ts: Date.now() }))
        return quote
      } catch (err) {
        setError(err. message)
        console.error('1Inch quote error:', err)
        return null
      }
    },
    [quoteCache]
  )

  const fetch0xQuote = useCallback(
    async (fromToken, toToken, amount, slippage = 1) => {
      try {
        const cacheKey = `0x-${fromToken}-${toToken}-${amount}`
        const cached = quoteCache.get(cacheKey)
        if (cached && Date.now() - cached.ts < 10000) return cached.quote

        const url = `${ZEROX_BASE}/swap/v1/quote?sellToken=${fromToken}&buyToken=${toToken}&sellAmount=${amount}&slippagePercentage=${slippage / 100}`
        const res = await fetchWithTimeout(
          url,
          { headers: { '0x-api-key': process.env.REACT_APP_ZEROX_API_KEY } },
          3000
        )
        const j = await res.json()
        if (j.validationErrors?. length) throw new Error(j.validationErrors[0].reason)

        const quote = { buyAmount: j.buyAmount, ...j }
        setQuoteCache(prev => new Map(prev).set(cacheKey, { quote, ts: Date.now() }))
        return quote
      } catch (err) {
        setError(err.message)
        console.error('0x quote error:', err)
        return null
      }
    },
    [quoteCache]
  )

  const getQuote = useCallback(
    async (fromToken, toToken, amount, slippage = 1) => {
      setLoading(true)
      setError(null)
      try {
        const quote1inch = await fetch1InchQuote(fromToken, toToken, amount)
        const quote0x = await fetch0xQuote(fromToken, toToken, amount, slippage)
        return quote1inch || quote0x
      } finally {
        setLoading(false)
      }
    },
    [fetch1InchQuote, fetch0xQuote]
  )

  const approveToken = useCallback(
    async (tokenAddress, spender, amount) => {
      if (!signer) throw new Error('No signer')
      try {
        setLoading(true)
        const ERC20_ABI = [
          'function approve(address spender, uint256 amount) public returns (bool)',
          'function allowance(address owner, address spender) public view returns (uint256)',
        ]
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
        const tx = await contract.approve(spender, amount)
        const receipt = await tx.wait()
        return receipt
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [signer]
  )

  const executeSwap = useCallback(
    async (quote, slippage = 1) => {
      if (!signer) throw new Error('No signer')
      try {
        setLoading(true)

        const gasEstimate = quote.estimatedGas || '300000'
        const gasLimit = (BigInt(gasEstimate) * BigInt(120)) / BigInt(100) // +20%

        const swapTx = {
          to: quote.to,
          from: userAddress,
          data: quote.data,
          value: quote.value || '0',
          gasLimit: gasLimit.toString(),
        }

        const tx = await signer.sendTransaction(swapTx)
        const receipt = await tx.wait()
        return receipt
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [signer, userAddress]
  )

  return {
    getQuote,
    approveToken,
    executeSwap,
    loading,
    error,
  }
}
