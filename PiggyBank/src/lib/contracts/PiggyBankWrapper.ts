import Web3 from 'web3';
import * as PiggyBankJSON from '../../../build/contracts/PiggyBank.json';
import { PiggyBank } from '../../types/PiggyBank';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class PiggyBankWrapper {
    web3: Web3;

    contract: PiggyBank;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(PiggyBankJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getRemainingTimelock(fromAddress: string) {
        const remainingTime = await this.contract.methods.getRemainingTimelock(fromAddress).call();
        return remainingTime;
    }

    async getUnlockedBalance(fromAddress: string) {
        const unlockedBalance = await this.contract.methods.getUnlockedBalance(fromAddress).call();
        return unlockedBalance;
    }

    async createBank(fromAddress: string, timelock: string) {

        await this.contract.methods.createBank(timelock).send({
            ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000',
        }).then(() => {
            return true;
        });
        return false;
    }

    async deposit(fromAddress: string, amount: string) {
        await this.contract.methods.deposit().send({
            ...DEFAULT_SEND_OPTIONS,
                value: amount,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000',
        });
    }

    async widthraw(fromAddress: string) {
        await this.contract.methods.widthraw().send({
            ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000',
        });
    }

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: PiggyBankJSON.bytecode,
                arguments: []
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
