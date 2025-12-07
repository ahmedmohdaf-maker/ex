import { useState, useEffect } from 'react'

const USDC_ADDR = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const MATIC_ADDR = '0x0000000000000000000000000000000000001010'

export const useTokens = () => {
  const [tokenList, setTokenList] = useState([])
  const [tokenMap, setTokenMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true)
        const res = await fetch('https://tokens.coingecko.com/polygon-pos/all.json')
        const data = await res.json()

        const tokens = (data. tokens || []).map(t => ({
          address: t.address. toLowerCase(),
          symbol: t. symbol || '',
          name: t.name || '',
          decimals: t.decimals || 18,
          logoURI: t.logoURI || t.logo || '',
        }))

        const tokenMapNew = new Map()
        tokens.forEach(t => tokenMapNew.set(t.address, t))

        if (! tokenMapNew.has(MATIC_ADDR. toLowerCase())) {
          const maticToken = {
            address: MATIC_ADDR.toLowerCase(),
            symbol: 'MATIC',
            name: 'Polygon',
            decimals: 18,
            logoURI: '',
          }
          tokens.push(maticToken)
          tokenMapNew.set(MATIC_ADDR.toLowerCase(), maticToken)
        }

        const seen = new Set()
        const deduped = tokens.filter(t => {
          if (! t || ! t.address || seen.has(t.address)) return false
          seen.add(t.address)
          return true
        })

        setTokenList(deduped)
        setTokenMap(tokenMapNew)
        console.log('Loaded tokens:', deduped.length)
      } catch (err) {
        console.error('Error loading tokens:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadTokens()
  }, [])

  const getTokenByAddress = (addr) => {
    return tokenMap.get(addr?. toLowerCase())
  }

  const searchTokens = (query) => {
    const q = query.toLowerCase(). trim()
    if (!q) return tokenList. slice(0, 50)
    return tokenList
      .filter(
        t =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.address.includes(q)
      )
      .slice(0, 20)
  }

  return {
    tokenList,
    tokenMap,
    loading,
    error,
    getTokenByAddress,
    searchTokens,
  }
}