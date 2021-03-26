import { NetworkConfig, ContractAddress } from './index';

/**
 *
 */
export const binanceTestnetConfig: NetworkConfig<ContractAddress> = {
	unitroller: {
		address: '0x96498309220d9E477d1ce5972Ff723aC4DF19C2C',
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
		address: '0xbb92794048D4477AD7042B5D365d785C3d71CA20',
		// abi: ERC20_ABI
	},
	cSUKU: {
		address: '0x4bDe92De1e1D12d7baC4B4a1fef02f9f24052EE7',
		// abi: CERC20_ABI
	},
	USDC: { // NOTE: BUSD Address
		address: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
		// abi: ERC20_ABI
	},
	cUSDC: { // NOTE: BUSD Address
		address: '0x34538C7E2f7f283a69beddd0897aB7f8Bae0B92D',
		// abi: CERC20_ABI
	},
};
