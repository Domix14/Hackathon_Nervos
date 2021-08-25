import Web3 from 'web3';
import * as MovieRankingJSON from '../../../build/contracts/MovieRanking.json';
import { MovieRanking } from '../../types/MovieRanking';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class MovieRankingWrapper {
    web3: Web3;

    contract: MovieRanking;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(MovieRankingJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getMovieRating(movieName: string) {
        const rating = await this.contract.methods.getMovieRating(movieName).call();
        return rating;
    }

    async rateMovie(fromAddress: string, movieName: string, rate: string) {
        await this.contract.methods.rateMovie(movieName, rate).send({
            ...DEFAULT_SEND_OPTIONS,
                from: fromAddress
        })
    }

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: MovieRankingJSON.bytecode,
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
