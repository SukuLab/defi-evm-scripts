require('dotenv').config();
import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';

import { createLoan } from './scripts/createLoan';

clear();

console.log(
	chalk.blue(
		figlet.textSync('DeFi EVM Scripts', {
			font: '3-D',
			horizontalLayout: 'full',
		})
	)
);

const run = async () => {
	// Prefixed with `0x`
	const privateKey = process.env.PRIVATE_KEY || `0x`;
	const provider = process.env.PROVIDER_URL || `https://kovan.infura.io/v3/`
	//
	const loanResponse = await createLoan(
		privateKey,
		provider,
		42
	);

	console.log("Loan Response:")
	console.dir(loanResponse)
};

(async () => {
	await run();
})();
