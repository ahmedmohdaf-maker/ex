import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { TokenInput } from '../components/TokenInput'
import { SwapControls } from '../components/SwapControls'
import { WalletButton } from '../components/WalletButton'
import { ChatSidebar } from '../components/ChatSidebar'
import { Toast, showToast } from '../components/Toast'
import { useTokens } from '../hooks/useTokens'
import { usePricing } from '../hooks/usePricing'
import { useSwap } from '../hooks/useSwap'
import { appKit, getAppKitAccount, getAppKitProvider } from '../config/appkit. config'

export const Exchange = () => {
  const [userAddress, setUserAddress] = useState(null)
  const [signer, setSigner] = useState(null)
  const [fromToken, setFromToken] = useState(null)
  const [toToken, setToToken] = useState(null)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState(1)
  const [chatOpen, setChatOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { tokenList, tokenMap, loading: tokensLoading } = useTokens()
  const { getTokenPriceUSD } = usePricing()
  const { getQuote, approveToken, executeSwap, loading: swapLoading } = useSwap(signer, userAddress)

  const [fromPrice, setFromPrice] = useState(null)
  const [toPrice, setToPrice] = useState(null)

  // Handle wallet connection
  useEffect(() => {
    const handleAccountsChanged = async () => {
      const account = getAppKitAccount()
      const provider = getAppKitProvider()

      if (account?. address && provider) {
        setUserAddress(account.address)
        const ethersProvider = new ethers.providers.Web3Provider(provider)
        const ethSigner = ethersProvider.getSigner()
        setSigner(ethSigner)
      } else {
        setUserAddress(null)
        setSigner(null)
      }
    }

    handleAccountsChanged()

    // Subscribe to account changes
    window.addEventListener('focus', handleAccountsChanged)
    return () => window.removeEventListener('focus', handleAccountsChanged)
  }, [])

  // Update prices when tokens change
  useEffect(() => {
    const updatePrices = async () => {
      if (fromToken) {
        const price = await getTokenPriceUSD(fromToken. address)
        setFromPrice(price)
      }
      if (toToken) {
        const price = await getTokenPriceUSD(toToken.address)
        setToPrice(price)
      }
    }
    updatePrices()
  }, [fromToken, toToken, getTokenPriceUSD])

  // Auto-quote when amount changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (fromToken && toToken && fromAmount) {
        try {
          setLoading(true)
          const amountBN = ethers.utils.parseUnits(fromAmount, fromToken.decimals)
          const quote = await getQuote(
            fromToken.address,
            toToken.address,
            amountBN. toString(),
            slippage
          )
          if (quote?. toTokenAmount) {
            const to = Number(ethers.utils.formatUnits(quote.toTokenAmount, toToken.decimals))
            setToAmount(to.toFixed(6))
          }
        } catch (err) {
          console. error('Quote error:', err)
          showToast('Failed to get quote', { type: 'error' })
        } finally {
          setLoading(false)
        }
      }
    }

    const timer = setTimeout(fetchQuote, 500)
    return () => clearTimeout(timer)
  }, [fromToken, toToken, fromAmount, slippage, getQuote])

  const handleSwap = async () => {
    if (!userAddress) {
      showToast('Please connect wallet first', { type: 'info' })
      return
    }

    if (!fromToken || !toToken || !fromAmount) {
      showToast('Please select tokens and enter amount', { type: 'info' })
      return
    }

    try {
      setLoading(true)

      const amountBN = ethers.utils.parseUnits(fromAmount, fromToken.decimals)
      const quote = await getQuote(
        fromToken.address,
        toToken.address,
        amountBN.toString(),
        slippage
      )

      if (! quote) throw new Error('Failed to get quote')

      if (fromToken.address !== '0x0000000000000000000000000000000000001010') {
        showToast('Approving token... ', { type: 'info' })
        await approveToken(
          fromToken.address,
          quote.to || '0x1111111254fb6c44bac0bed2854e76f90643097d',
          amountBN.toString()
        )
        showToast('Approved!', { type: 'success' })
      }

      showToast('Executing swap...', { type: 'info' })
      const receipt = await executeSwap(quote, slippage)

      showToast('Swap successful!', {
        type: 'success',
        txHash: receipt.transactionHash,
      })
      setFromAmount('')
      setToAmount('')
    } catch (err) {
      console.error('Swap error:', err)
      showToast(`Swap failed: ${err.message}`, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSwap = async () => {
    handleSwap()
  }

  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <img
        className="logo"
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3. org/2000/svg' viewBox='0 0 84 84'%3E%3Ccircle cx='42' cy='42' r='40' fill='%239c00ff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' font-weight='bold' fill='white'%3ENOLA%3C/text%3E%3C/svg%3E"
        alt="NOLA Logo"
        style={{ width: '84px', height: 'auto' }}
      />

      <WalletButton userAddress={userAddress} />

      <div className="section-wrapper">
        <div className="container" role="main" aria-label="NOLA Exchange">
          <h2>NOLA Exchange</h2>

          <TokenInput
            side="from"
            token={fromToken}
            amount={fromAmount}
            price={fromPrice}
            onChange={e => setFromAmount(e.amount)}
            onTokenSelect={setFromToken}
            tokens={tokenList}
            disabled={tokensLoading}
          />

          <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
            <button
              className="swap-outside"
              onClick={handleSwapTokens}
              title="Swap From ↔ To"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '20px',
                boxShadow: '0 0 12px rgba(180,0,255,0.1)',
              }}
            >
              ⇅
            </button>
          </div>

          <TokenInput
            side="to"
            token={toToken}
            amount={toAmount}
            price={toPrice}
            onChange={() => {}}
            onTokenSelect={setToToken}
            tokens={tokenList}
            disabled={tokensLoading}
          />

          <SwapControls
            slippage={slippage}
            onSlippageChange={setSlippage}
            onSwap={handleSwap}
            onQuickSwap={handleQuickSwap}
            loading={loading || swapLoading}
          />
        </div>
      </div>

      <ChatSidebar isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />

      <Toast />

      <div className="footer">
        <div>© 2025 NOLA — All rights reserved</div>
        <div>
          <a href="https://x.com/NOLA_CHAIN" target="_blank" rel="noopener">
            X
          </a>{' '}
          •{' '}
          <a href="https://t.me/NOLA_community" target="_blank" rel="noopener">
            Telegram
          </a>
        </div>
      </div>
    </div>
  )
}