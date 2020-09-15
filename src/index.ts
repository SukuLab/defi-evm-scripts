require('dotenv').config();
import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';

import * as inquirer from './lib/inquirer';
import {} from './lib/fileHandler';

import { createLoan } from './createLoan';

// import { eventQuery } from './services/contracts.service';

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
	// const credentials = await inquirer.askCredentials();
	// console.log(credentials);

	// Prefixed with `0x`
	const privateKey = ``;
	await createLoan(privateKey);
};

(async () => {
	await run();
})();
