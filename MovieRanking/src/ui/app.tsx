/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';
import * as CompiledContractArtifact from '../../build/contracts/ERC20.json';
import { MovieRankingWrapper } from '../lib/contracts/MovieRankingWrapper';
import { CONFIG } from '../config';

const CKETH_CONTRACT_ADDRESS = "0x57E5b107Acf6E78eD7e4d4b83FF76C041d3307b7";
const SUDT_CONTRACT_ADDRESS = "0x0d14B7568d98Ff62621d894b227b33177E5b3b5f";


async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<MovieRankingWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();

    
    const [contractAddress, setContractAddress] = useState<string>();
    const [displayMovieName, setDisplayMovieName] = useState<string>();
    const [displayRating, setDisplayRating] = useState<string>("0");
    const [inputMovieName, setInputMovieName] = useState<string>();
    const [inputRating, setInputRating] = useState<string>();

    const [depositAddress, setDepositAddress] = useState<string>();
    const [ckethBalance, setCkethBalance] = useState<string>();
    const [sudtBalance, setSudtBalance] = useState<string>();

    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);


    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));


            (async function () {
                const _depositAddress = await addressTranslator.getLayer2DepositAddress(web3, accounts?.[0]);
                setDepositAddress(_depositAddress.addressString);
                })();

        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new MovieRankingWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new MovieRankingWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
    }



    async function loadSudtBalance() {
        const _sudtContract = new web3.eth.Contract(
            CompiledContractArtifact.abi as any,
            SUDT_CONTRACT_ADDRESS
        );

        const _balanceSudt = await _sudtContract.methods.balanceOf(polyjuiceAddress).call({
            from: accounts?.[0]
        });
        setSudtBalance(_balanceSudt);
    }

    async function loadCkethBalance() {
        const _ckethContract = new web3.eth.Contract(
            CompiledContractArtifact.abi as any,
            CKETH_CONTRACT_ADDRESS
        );

        const _balanceCketh = await _ckethContract.methods.balanceOf(polyjuiceAddress).call({
            from: accounts?.[0]
        });
        setCkethBalance(_balanceCketh);
    }

    async function getMovieRating() {
        setDisplayRating("0");
        const _rating = await contract.getMovieRating(inputMovieName);
        setDisplayRating(_rating);
        setDisplayMovieName(inputMovieName);
    }

    async function rateMovie() {
        try {
            setTransactionInProgress(true);

            const transactionHash = await contract.rateMovie(account, inputMovieName, inputRating);

            toast(
                'Successfully rated movie!',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
                loadCkethBalance();
                loadSudtBalance();
            }

            
        })();
    });
    

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            SUDT Balance: {sudtBalance ? sudtBalance : <LoadingIndicator />}   <button onClick={loadSudtBalance}> Update </button>
            <br />
            CKEth Balance: {ckethBalance ? ckethBalance : <LoadingIndicator />}   <button onClick={loadCkethBalance}> Update </button>
            <br />
            Deposit address: {depositAddress || " - "}
            <br />
            <br />
            You can bridge your assets using <b><a href = "https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos"> Force Bridge </a></b> and <b>deposit address</b>
            <br />
            <br />
            <div style={{ display: (!contract ? 'block' : 'none') }}>
            Contract address: <input onChange={e => {setContractAddress(e.target.value)}}></input>
            <button onClick={() => {setExistingContractAddress(contractAddress)}}>Use existing contract</button> or <button onClick={deployContract}>Deploy new contract</button>
            </div>

            <div style={{ display: (contract ? 'block' : 'none') }}>
            Contract address: <b>{contract?.address || '-'}</b>
            <br /><br /><br />
            <h3>Check movie rating.</h3>
            <br />
            Movie name: <input onChange={e => {setInputMovieName(e.target.value)}} />  <button onClick={getMovieRating}> Check </button>
            <br /><br />
            <div style={{ display: (displayRating != "0" ? 'block' : 'none') }}>
            <h2>
            Name: {displayMovieName}
            <br />
            Rating: {displayRating}
            </h2>
            </div>
            
            <br /><br />
            <h3>Rate movie.</h3><br />
            Movie name: <input onChange={e => {setInputMovieName(e.target.value)}} />  Rate (1 - 100): <input onChange={e => {setInputRating(e.target.value)}} />  <button onClick={rateMovie}> Rate movie </button>
            </div>
            <br />
            <hr />
            <ToastContainer />
        </div>
    );
}
