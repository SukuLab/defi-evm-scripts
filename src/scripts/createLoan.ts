import { ethers } from 'ethers';

// Import Contract ABIs
import ERC20_ABI from '../contracts/abis/ERC20.abi.json';
import CERC20_ABI from '../contracts/abis/CErc20Immutable.abi.json';
import Comptroller_ABI from '../contracts/abis/Comptroller.abi.json';
import SimplePriceOracle_ABI from '../contracts/abis/SimplePriceOracle.abi.json';

// Import Contract Types
import { CErc20ImmutableAbi } from '../contracts/types/CErc20ImmutableAbi';
import { Erc20Abi } from '../contracts/types/Erc20Abi';
import { ComptrollerAbi } from '../contracts/types/ComptrollerAbi';
import { SimplePriceOracleAbi } from '../contracts/types/SimplePriceOracleAbi';

// Contract Utility
import { getConfigByNetwork, getEtherscanLink } from '../contracts/networks';

enum Errors {
	NO_ERROR,
	TRANSACTION_ERROR,
	CONTRACT_RETURN_ERROR,
	UNSUPPORTED_CHAIN_ID,
	INSUFFICIENT_BALANCE,
	ACCOUNT_LIQUIDITY,
}

// TODO: Add debug logging
// TODO: Inputs SUKU Matissa and Private Key
const log = (level: 'debug' | 'info', message: string, info?: any) => {
	if (info) {
		console.dir(info);
	}
	console.log(message);
};

const error = (
	errorCode: number,
	message: string,
	error?: any
): { error: Errors; message: string } => {
	console.error(`Errorcode: ${errorCode}:`, message);
	console.dir(error);
	return { error: errorCode, message: message };
	// throw new Error(message);
};

// https://docs.ethers.io/v5/api/utils/display-logic/
const bnFrom = ethers.BigNumber.from;
const formatUnits = ethers.utils.formatUnits;
const parseUnits = ethers.utils.parseUnits;

/**
	* Use the SUKU token as collateral to obtain a USDC loan. 
	* 
	* Returns `error: 0` for no errors 
	*
	* @param privateKey - The private key prefixed with '0x'
	* @param providerUrl - The web3 provider url 
	* @param chainId - The chain id of the Ethereum network
	* @param sukuDecimalAmount - Decimal Amount which is converted based on the contract decimal places
	*/
export async function createLoan(
	privateKey: string,
	providerUrl: string,
	chainId: number,
	sukuDecimalAmount?: string
): Promise<{ error: Errors; message: string }> {
	const networkConfig = getConfigByNetwork(chainId);
	if (!networkConfig) {
		return error(
			Errors.UNSUPPORTED_CHAIN_ID,
			`Chain id ${chainId} is not currently supported.`
		);
	}

	const unitrollerAddr = networkConfig.unitroller.address;
	const sukuAddr = networkConfig.SUKU.address;
	const usdcAddr = networkConfig.USDC.address;
	const cSukuAddr = networkConfig.cSUKU.address;
	const cUsdcAddr = networkConfig.cUSDC.address;

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
		unitrollerAddr,
		Comptroller_ABI,
		wallet
	) as any) as ComptrollerAbi;

	/**
   * Get SUKU Balance
   */
	let sukuDepositBalance;
	try {
		log('info', `Obtaining SUKU balance for address: ${walletAddress}`);
		// TODO: Min balance checks. IF balance is zero (or possibly a bit more) return an error
		const balance = await sukuContract.balanceOf(walletAddress);
		const decimals = await sukuContract.decimals();
		if (sukuDecimalAmount) {
			const sukuBNAmount = parseUnits(sukuDecimalAmount, decimals);
			// Give an error if the requested amount is greater than the current balance
			if (sukuBNAmount.gt(balance)) {
				return error(
					Errors.INSUFFICIENT_BALANCE,
					`SUKU balance of: ${formatUnits(
						balance,
						decimals
					)} is less than desired SUKU deposit of: ${formatUnits(
						sukuBNAmount,
						decimals
					)}`
				);
			}
			sukuDepositBalance = sukuBNAmount;
		} else {
			// If the suku amount was not passed then we will use the full balance.
			sukuDepositBalance = balance;
		}
		log(
			'debug',
			`Depsoting SUKU balance of: ${sukuDepositBalance} for address: ${walletAddress}`
		);
	} catch (e) {
		return error(
			Errors.TRANSACTION_ERROR,
			`Error obtaining SUKU: ${sukuAddr} balance for account: ${walletAddress}.`,
			e
		);
	}

	/**
 * Enter necessary markets for this account
 */
	try {
		log(
			'info',
			`Entering CSUKU: ${cSukuAddr} and CUSDC: ${cUsdcAddr} markets for account: ${walletAddress}.`
		);
		const tx = await comptrollerContract.enterMarkets([ cSukuAddr, cUsdcAddr ]);
		await tx.wait(); // wait for a confirmation
		const etherscanLink = getEtherscanLink(chainId, tx.hash, 'transaction');
		log('debug', `Finished entering markets. TX: ${etherscanLink}.`);
	} catch (e) {
		return error(
			Errors.TRANSACTION_ERROR,
			`Error entering cSUKU: ${cSukuAddr} and cUSDC: ${cUsdcAddr} markets for address: ${walletAddress}.`,
			e
		);
	}

	/**
  * Approve CSUKU to take control of funds
  */
	try {
		log(
			'info',
			`Approving CSUKU: ${cSukuAddr} to control SUKU: ${cSukuAddr} funds for account: ${walletAddress}.`
		);
		const approvalTx = await sukuContract.approve(
			cSukuAddr,
			sukuDepositBalance || bnFrom('0')
		);
		await approvalTx.wait(); // wait for confirmation
		log('debug', `Finished approval.`);
	} catch (e) {
		return error(
			Errors.TRANSACTION_ERROR,
			`Error approving CSUKU token address ${cSukuAddr} to take control of ${sukuDepositBalance} SUKU by address ${walletAddress}.`,
			e
		);
	}

	/**
  * mint the user's deposit balance into cSUKU  
  */
	try {
		log(
			'info',
			`Minting CSUKU: ${cSukuAddr} for account: ${walletAddress} with SUKU balance of: ${sukuDepositBalance}.`
		);
		const mintTx = await cSukuContract.mint(sukuDepositBalance || bnFrom('0'));
		await mintTx.wait(); // wait for confirmation
		log('debug', `Finished minting.`);
	} catch (e) {
		return error(
			Errors.TRANSACTION_ERROR,
			`Error minting CSUKU tokens for address: ${walletAddress} with SUKU balance of: ${sukuDepositBalance}.`,
			e
		);
	}

	let txHash = '';
	/**
	* borrow the HALF of the amount of liquidity available  
	*/
	try {
		log('info', `Borrowing 1 USDC for every 5 SUKU..`);
		// TODO: 1 USDC is being minted for 5 SUKU. In the furture this should be based on price oracles
		const borrowTx = await cUsdcContract.borrow(
			sukuDepositBalance.div(5) || bnFrom('0')
		);
		txHash = borrowTx.hash;
		await borrowTx.wait(); // wait for confirmation
		log('debug', `Finished borrowing.`);
	} catch (e) {
		return error(
			Errors.TRANSACTION_ERROR,
			`Error borrowing: ${walletAddress} with SUKU balance of: ${sukuDepositBalance}.`,
			e
		);
	}

	/**
  * Obtain the account's liquidity in USD
  * https://compound.finance/docs/comptroller#account-liquidity
  */
	let accountLiquidity;
	try {
		log('info', `Obtaining liquidity for account: ${walletAddress}.`);
		const {
			0: errorCode,
			1: liquidity,
			2: shortfall,
		} = await comptrollerContract.getAccountLiquidity(walletAddress);

		accountLiquidity = liquidity;
		log(
			'debug',
			`Finished obtaining liquidity of: ${formatUnits(accountLiquidity, 18)}.`
		);
	} catch (e) {
		return error(
			Errors.TRANSACTION_ERROR,
			`Error obtaining account liquidity for: ${walletAddress}.`,
			e
		);
	}

	/**
   * Obtain the account balances and return to user.
   * 
   * // TODO: Return USD borrowed
   * // TODO: Return USD liquidity 
   * // TODO: Return SUKU Balance 
   */
	try {
		const usdcBalance = await usdcContract.balanceOf(walletAddress);
		const decimals = await usdcContract.decimals();
		const decimalBalance = usdcBalance.div(bnFrom('10').pow(bnFrom(decimals)));

		const etherscanLink = getEtherscanLink(chainId, txHash, 'transaction');
		log(
			'info',
			`Congrats on your USDC loan. Your current USDC balance is: ${decimalBalance} USDC. TX: ${etherscanLink}`
		);
		return {
			error: Errors.NO_ERROR,
			message: `Successfully borrowed USDC. Your current balance is: ${decimalBalance} USDC. Current account liquidity is: $${Number(
				formatUnits(accountLiquidity, 18)
			).toFixed(2)}. Tap to view TX: ${etherscanLink}`,
		};
	} catch (e) {
		return error(
			Errors.TRANSACTION_ERROR,
			`Obtaining balance USDC balance at: ${usdcContract.address} for account: ${walletAddress}.`,
			e
		);
	}
}
