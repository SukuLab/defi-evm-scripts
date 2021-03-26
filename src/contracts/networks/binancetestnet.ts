import { NetworkConfig, ContractAddress } from './index';

/**
 *
 */
export const binanceTestnetConfig: NetworkConfig<ContractAddress> = {
	unitroller: {
		address: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
		// abi: Comptroller_ABI,
	},
	comptroller: {
		address: '',
		// abi: Comptroller_ABI,
	},
	governorAlpha: {
		address: '',
		// abi: GovernorAlpha_ABI,
	},
	maximillion: {
		address: '',
		// abi: Maximillion_ABI,
	},
	priceOracle: {
		address: '',
		// abi: SimplePriceOracle_ABI,
	},
	timelock: {
		address: '',
		// abi: Timelock_ABI,
	},
	Base500bps_Slope1200bps: {
		address: '',
		// abi: WhitePaperInteretRateModel_ABI,
	},
	SUKU: {
		address: '',
		// abi: ERC20_ABI
	},
	cSUKU: {
		address: '',
		// abi: CERC20_ABI
	},
	USDC: {
		address: '',
		// abi: ERC20_ABI
	},
	cUSDC: {
		address: '',
		// abi: CERC20_ABI
	},
};
