import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { polygonMainnet } from '@reown/appkit/networks'

const projectId = process.env.REACT_APP_REOWN_PROJECT_ID

if (! projectId) {
  console.error('REACT_APP_REOWN_PROJECT_ID is not defined')
}

export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [polygonMainnet],
  metadata: {
    name: 'NOLA Exchange',
    description: 'Full DEX Swap Interface',
    url: window.location.origin,
    icons: ['https://via.placeholder.com/84x84? text=NOLA'],
  },
  projectId,
  features: {
    analytics: true,
  },
})

export const getAppKitProvider = () => {
  try {
    return appKit.getWalletProvider?. ()
  } catch (e) {
    console.error('Error getting provider:', e)
    return null
  }
}

export const getAppKitAccount = () => {
  try {
    return appKit.getAccount?.()
  } catch (e) {
    console.error('Error getting account:', e)
    return null
  }
}
