import React, { useState } from 'react'

export const TokenInput = ({
  side,
  token,
  amount,
  price,
  onChange,
  onTokenSelect,
  tokens,
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSearchChange = e => {
    const query = e.target.value
    setSearchInput(query)

    if (query.trim(). length > 0) {
      const filtered = tokens
        .filter(
          t =>
            t.symbol.toLowerCase(). includes(query.toLowerCase()) ||
            t.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 15)
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleTokenSelect = selectedToken => {
    onTokenSelect(selectedToken)
    setSearchInput('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleAmountChange = e => {
    onChange({ amount: e.target.value })
  }

  return (
    <div className="input-box" style={{ position: 'relative' }}>
      <div className="left">
        {token && (
          <div className="token-icon">
            {token.logoURI && (
              <img src={token.logoURI} alt={token.symbol} style={{ display: 'block' }} />
            )}
          </div>
        )}

        <div className="token-info">
          <div className="token-symbol">{token?. symbol || 'Select'}</div>
          {price && (
            <div className="token-change" style={{ display: 'block' }}>
              ≈ ${price.toFixed(4)}
            </div>
          )}
        </div>

        <div className="input-field">
          <input
            type="text"
            placeholder="symbol"
            value={searchInput || token?.symbol || ''}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(!! searchInput. trim())}
            disabled={disabled}
            style={{ padding: '10px 12px', borderRadius: '8px', color: '#fff' }}
          />
        </div>

        <div className="input-amount" style={{ minWidth: '120px' }}>
          <input
            type="number"
            placeholder={side === 'from' ? 'Amount' : 'Estimate'}
            value={amount || ''}
            onChange={handleAmountChange}
            readOnly={side === 'to'}
            disabled={disabled}
            min="0"
            step="any"
          />
        </div>

        {price && (
          <div className="price-small">
            <div className="price-usd" style={{ display: 'block' }}>
              ≈ ${(Number(amount || 0) * price).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {showSuggestions && (
        <div className="suggestions">
          {suggestions.map(t => (
            <div
              key={t.address}
              className="suggestion-item"
              onClick={() => handleTokenSelect(t)}
            >
              <div className="suggestion-left">
                {t.logoURI && <img src={t.logoURI} alt={t.symbol} />}
                <div className="suggestion-main">
                  <div className="suggestion-symbol">{t.symbol}</div>
                  <div className="suggestion-name">{t.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
