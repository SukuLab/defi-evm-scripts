# DeFi EVM Scripts
A collection of scripts to run various tasks on Ethereum based defi smart contracts written in Typescript.  

## Setup
`npm install` 

## Typescript + Solidity = <3
Type-safe contract declarations possible thanks to TypeChain. 
These types are not committed to this repo, but will be generated after installing npm modules.

They may be manually generated using:   
`npm run typchain`



## Example
Config:   
Make a copy of `.env.example` and fill in the variables.

To run:  
`npm run example`

See `src/example.ts`

## Notes
Declarations were not compiling due to a breaking TypeChain update. Needed to run:  
`npm i @ethersproject/bignumber@latest`

