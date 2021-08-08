import Web3 from 'web3';
import * as FaucetJSON from '../../../build/contracts/Faucet.json';
import { Faucet } from '../../types/Faucet';

export class FaucetWrapper {
    web3: Web3;

    contract: Faucet;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(FaucetJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async receiveCKB(receiverAddress: string, fromAddress: string) {
        await this.contract.methods.receive(receiverAddress).call({ from: fromAddress });
    }

    async deploy(fromAddress: string) {
        const contract = await (this.contract
            .deploy({
                data: FaucetJSON.bytecode,
                arguments: []
            })
            .send({
                from: fromAddress
            } as any) as any);

        this.useDeployed(contract._address);
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
