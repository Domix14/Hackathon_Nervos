import Web3 from 'web3';
import * as SimpleTokenJSON from '../../../build/contracts/SimpleToken.json';
import { SimpleToken } from '../../types/SimpleToken';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class SimpleTokenWrapper {
    web3: Web3;

    contract: SimpleToken;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(SimpleTokenJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getBalance(fromAddress: string, address: string) {
        const balance = await this.contract.methods.balanceOf(address).call();

        return balance;
    }

    async transfer(fromAddress: string, address: string, amount: number) {
        const balance = await this.contract.methods.transfer(address, amount).send({
            ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000',
        });

        return balance;
    }

    async deploy(fromAddress: string, tokenName: string, tokenSymbol: string, supply: BigInt) {
        const deployTx = await (this.contract
            .deploy({
                data: SimpleTokenJSON.bytecode,
                arguments: [tokenName, tokenSymbol, supply]
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
