import { NetworkConfig, ContractAddress } from './index';

/**
 *
 */
export const kovanNetworkConfig: NetworkConfig<ContractAddress> = {
	unitroller: {
		address: '0x899659b74B6B07A8C401657cD76d289b5E0248a4',
		// abi: Comptroller_ABI,
	},
	comptroller: {
		address: '0xEcB9686cB8Bec28B81e5369782c0534269413842',
		// abi: Comptroller_ABI,
	},
	governorAlpha: {
		address: '0x5960B28C24425f5db4abb3e43Dd15A34f3cc41a9',
		// abi: GovernorAlpha_ABI,
	},
	maximillion: {
		address: '0x5960B28C24425f5db4abb3e43Dd15A34f3cc41a9',
		// abi: Maximillion_ABI,
	},
	priceOracle: {
		address: '0x7B0568A2BE71b28E9631FBa1182806Acf10ec123',
		// abi: SimplePriceOracle_ABI,
	},
	timelock: {
		address: '0xD12Ba62471a5E66c27936477a532A601B3Fb68A0',
		// abi: Timelock_ABI,
	},
	Base500bps_Slope1200bps: {
		address: '0x7CbE5Bc02fDdA09F540f6233fC25AD89695fcD25',
		// abi: WhitePaperInteretRateModel_ABI,
	},
	SUKU: {
		address: '0xd35f5965B4B84382ca27072fF3B6b42e7053e672',
		// abi: ERC20_ABI
	},
	cSUKU: {
		address: '0x73f227a0EE9c3964061e28f1D23B2217Cd1621E1',
		// abi: CERC20_ABI
	},
	USDC: {
		address: '0x5ADf17577CF2be1288C5228735ea58EeB4C15Ee3',
		// abi: ERC20_ABI
	},
	cUSDC: {
		address: '0xf18feCe22570f7bA7c7D50dd4A9d11b4aE74bC89',
		// abi: CERC20_ABI
	},
};
