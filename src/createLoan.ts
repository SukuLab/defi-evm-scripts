import ethers from 'ethers';
import BigNumber from 'bignumber.js';

// TODO: Integrate Twillio  
// https://www.twilio.com/blog/twilio-functions-typescript

// Import Contract ABIs
import { CERC20_ABI } from './contracts/abis';
import { ERC20_ABI } from './contracts/abis';
import { Comptroller_ABI } from './contracts/abis';
import { SimplePriceOracle_ABI } from './contracts/abis';

// Import Contract Types
import { CErc20ImmutableAbi } from './contracts/types/CErc20ImmutableAbi';
import { Erc20Abi } from './contracts/types/Erc20Abi';
import { ComptrollerAbi } from './contracts/types/ComptrollerAbi';
import { SimplePriceOracleAbi } from './contracts/types/SimplePriceOracleAbi';

// TODO: Add debug logging
// TODO: Inputs SUKU Matissa and Private Key
const log = (message: string, info?: any) => {
	console.dir(info);
	console.log(message);
};

const error = (message: string, error?: any) => {
	console.error(message);
	console.dir(error);
	throw new Error(message);
};

const getConfig = (): {
	providerUrl: string;
	comptrollerAddr: string;
	sukuAddr: string;
	usdcAddr: string;
	cSukuAddr: string;
	cUsdcAddr: string;
} => {
	const errors = [];
	// if (!process.env.PRIVATE_KEY) errors.push('PRIVATE_KEY env var not set')
	const providerUrl = process.env.PROVIDER_URL || '';
	if (!providerUrl) errors.push('PROVIDER_URL env var not set');
	const comptrollerAddr = process.env.COMPTROLLER_ADDR || '';
	if (!comptrollerAddr) errors.push('COMPTROLLER_ADDR env var not set');
	const sukuAddr = process.env.SUKU_ADDR || '';
	if (!sukuAddr) errors.push('SUKU_ADDR env var not set');
	const usdcAddr = process.env.USDC_ADDR || '';
	if (!usdcAddr) errors.push('USDC_ADDR env var not set');
	const cSukuAddr = process.env.CSUKU_ADDR || '';
	if (!cSukuAddr) errors.push('CSUKU_ADDR env var not set');
	const cUsdcAddr = process.env.CUSDC_ADDR || '';
	if (!cUsdcAddr) errors.push('CUSDC_ADDR env var not set');

	if (errors.length) {
		console.dir(errors);
		throw new Error('Error setting up configuration.');
	}

	return {
		providerUrl,
		comptrollerAddr,
		sukuAddr,
		usdcAddr,
		cSukuAddr,
		cUsdcAddr,
	};
};

export async function createLoan(
	privateKey: string,
	sukuAmount: BigNumber
): Promise<string> {
	const {
		providerUrl,
		comptrollerAddr,
		sukuAddr,
		usdcAddr,
		cSukuAddr,
		cUsdcAddr,
	} = getConfig();
	// A Signer from a private key
	const provider = new ethers.providers.JsonRpcProvider(providerUrl);
	const wallet = new ethers.Wallet(privateKey, provider);
	const walletAddress = wallet.address;

	const sukuContract = (new ethers.Contract(
		sukuAddr,
		ERC20_ABI,
		wallet
	) as any) as Erc20Abi;
	const usdcContract = (new ethers.Contract(
		usdcAddr,
		ERC20_ABI,
		wallet
	) as any) as Erc20Abi;
	const cSukuContract = (new ethers.Contract(
		cSukuAddr,
		CERC20_ABI,
		wallet
	) as any) as CErc20ImmutableAbi;
	const cUsdcContract = (new ethers.Contract(
		cUsdcAddr,
		CERC20_ABI,
		wallet
	) as any) as CErc20ImmutableAbi;

	const comptrollerContract = (new ethers.Contract(
		comptrollerAddr,
		Comptroller_ABI,
		wallet
	) as any) as ComptrollerAbi;

	/**
   * Get SUKU Balance
   */
	const sukuBalance = await sukuContract.balanceOf(walletAddress);
	console.log(
		`Obtained SUKU balance of: ${sukuBalance} for address: ${walletAddress}`
	);

	/**
 * Enter necessary markets for this account
 */
	try {
		const tx = await comptrollerContract.enterMarkets([ cSukuAddr, cUsdcAddr ]);
		const txReceipt = await tx.wait(); // wait for a confirmation
		// TODO: provide cleaner logging
		console.log('TX: ');
		console.dir(txReceipt);
		console.log('Receipt: ');
		console.log(txReceipt);
		console.log('TX Hash: ');
		console.log(tx.hash);
	} catch (e) {
		error(
			`Error entering cSUKU: ${cSukuAddr} and cUSDC: ${cUsdcAddr} markets for address: ${walletAddress}.`,
			e
		);
	}

	/**
  * Approve CSUKU to take control of funds
  */
	try {
		const approvalTx = await sukuContract.approve(cSukuAddr, sukuBalance);
		await approvalTx.wait(); // wait for confirmation
	} catch (e) {
		error(
			`Error approving CSUKU token address ${cSukuAddr} to take control of ${sukuBalance} SUKU by address ${walletAddress}.`,
			e
		);
	}

	/**
  * mint the user's FULL SUKU balance into cSUKU  
  */
	try {
		const mintTx = await cSukuContract.mint(sukuBalance);
		await mintTx.wait(); // wait for confirmation
	} catch (e) {
		error(
			`Error minting CSUKU tokens for address: ${walletAddress} with SUKU balance of: ${sukuBalance}.`,
			e
		);
	}

	/**
  * Obtain the account's liquidity in USD
  * https://compound.finance/docs/comptroller#account-liquidity
  */
	let accountLiquidity;
	try {
		const {
			0: errorCode,
			1: liquidity,
			2: shortfall,
		} = await comptrollerContract.getAccountLiquidity(walletAddress);

		// Check Error was returned
		if (!errorCode.eq(ethers.ethers.BigNumber.from('0'))) {
			error(
				`Returned a non-zero error value when obtaining account liquidity: ${errorCode.toString()}`,
				{}
			);
		}
		// Check if account has liquidity
		if (liquidity.eq(ethers.ethers.BigNumber.from('0'))) {
			error(
				`Cannot borrow funds as returned account liquidity is zero. Current shortfall is: ${shortfall.toString()}`,
				{}
			);
		}
		accountLiquidity = liquidity;
	} catch (e) {
		error(`Error obtaining account liquidity for: ${walletAddress}.`, e);
	}
	if (!accountLiquidity) {
		error(`Error obtaining account liquidity for: ${walletAddress}.`, e);
	}

	/**
  * borrow the HALF of the amount of liquidity available  
  */
	try {
		const borrowTx = await cUsdcContract.borrow(
			accountLiquidity || ethers.ethers.BigNumber.from('0')
		);
		await borrowTx.wait(); // wait for confirmation
	} catch (e) {
		error(
			`Error borrowing: ${walletAddress} with SUKU balance of: ${sukuBalance}.`,
			e
		);
  }
}
