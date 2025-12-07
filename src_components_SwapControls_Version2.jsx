import React, { useState } from 'react'

export const SwapControls = ({ slippage, onSlippageChange, onSwap, onQuickSwap, loading }) => {
  const [showSlippageList, setShowSlippageList] = useState(false)

  const slippageOptions = [0.5, 1, 2, 3]

  return (
    <>
      <div className="controls" style={{ marginTop: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Swap button */}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="slippage-wrap" aria-label="Slippage">
            <div
              className="slippage-display"
              role="button"
              onClick={() => setShowSlippageList(!showSlippageList)}
              aria-haspopup="listbox"
              aria-expanded={showSlippageList}
            >
              <span>{slippage}%</span>
            </div>
            {showSlippageList && (
              <div className="slippage-list" role="listbox">
                {slippageOptions. map(val => (
                  <div
                    key={val}
                    className="slippage-item"
                    onClick={() => {
                      onSlippageChange(val)
                      setShowSlippageList(false)
                    }}
                  >
                    {val}%
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="swap-row" style={{ marginTop: '8px' }}>
        <button
          className="glassy-btn"
          onClick={onSwap}
          disabled={loading}
          title="Swap"
        >
          <span className="icon">⇄</span>
          <span className="label">{loading ? 'Swapping...' : 'Swap'}</span>
          {loading && <span className="btn-spinner" style={{ display: 'inline-block' }}></span>}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button className="quick-cta" onClick={onQuickSwap} disabled={loading} title="Quick Swap">
          <span>Quick Swap</span>
          {loading && <span className="btn-spinner" style={{ display: 'inline-block' }}></span>}
        </button>
      </div>
    </>
  )
}