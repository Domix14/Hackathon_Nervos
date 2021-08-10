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

import { SimpleTokenWrapper } from '../lib/contracts/SimpleTokenWrapper';
import { CONFIG } from '../config';
import { ERC20JSON } from '../../build/contracts/ERC20.json'

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
    const [contract, setContract] = useState<SimpleTokenWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [sudtBalance, setsudtBalance] = useState<string>();
    const [balance, setBalance] = useState<string>();
    const [balanceAccountAddress, setBalanceAccountAddress] = useState<string>();
    const [tokenName, setTokenName] = useState<string>();
    const [tokenSymbol, setTokenSymbol] = useState<string>();
    const [tokenSupply, setTokenSupply] = useState<BigInt>();
    const [transferAddress, setTransferAddress] = useState<string>();
    const [depositAddress, setDepositAddress] = useState<string>();
    const [transferAmount, setTransferAmount] = useState<number>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newStoredNumberInputValue, setNewStoredNumberInputValue] = useState<
        number | undefined
    >();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();

            (async () => {
                const _depositAddress = await addressTranslator.getLayer2DepositAddress(web3, account);
                setDepositAddress(_depositAddress.addressString);
            })
            
            
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
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
        const _contract = new SimpleTokenWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account, tokenName, tokenSymbol, tokenSupply);

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
        const _contract = new SimpleTokenWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
    }

    async function getBalance() {
        const _balance = await contract.getBalance(account, balanceAccountAddress);
        setBalance(_balance);
    }

    async function transfer() {
        const _balance = await contract.transfer(account, transferAddress, transferAmount);
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

                const addressTranslator = new AddressTranslator();
                const erc20Contract = new web3.eth.Contract(ERC20JSON, '0x6C2c699B1460789C44164ee9BdC624cDcaBAc999')
                const _sudtBalance = await erc20Contract.methods.balanceOf(addressTranslator.ethAddressToGodwokenShortAddress(_accounts[0])).call({
                    from: _accounts[0]
                });
                setsudtBalance(_sudtBalance);
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
            Deposit address: <b>{depositAddress || ' - '}</b>
            <br />
            You can deposit ETH using Force Bridge and deposit adddress <a href="https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos"><b>LINK</b></a>
            <br />
            <br />
            Contract address: <b>{contract?.address || '-'}</b>
            <br />
            <br />
            Contract tx hash: <b>{deployTxHash || '-'}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Name(e.x. SafeMoon, PornRocket, Dogecoin):
            <input onChange={e => {setTokenName(e.target.value)}}></input>
            <br />
            Symbol(e.x. SAF, PR, DOGE):
            <input onChange={e => {setTokenSymbol(e.target.value)}}></input>
            <br />
            Supply:
            <input onChange={e => {setTokenSupply(BigInt(e.target.value))}}></input>
            <br />
            <button onClick={deployContract} disabled={!tokenName || !tokenSymbol || !tokenSupply}>Deploy</button>
            <br />
            <br />
            <input onChange={e => {setBalanceAccountAddress(e.target.value)}}></input>
            <button onClick={getBalance} disabled={!contract}>Check Balance</button>
            <br />
            Balance: {balance}
            <br />
            <hr />
            Address: 
            <input onChange={e => {setTransferAddress(e.target.value)}}></input>
            Amount: 
            <input onChange={e => {setTransferAmount(Number(e.target.value))}}></input>
            <button onClick={transfer} disabled={!contract}>Transfer</button>
            <br />
            <hr />
            The contract is deployed on Nervos Layer 2 - Godwoken + Polyjuice. After each
            transaction you might need to wait up to 120 seconds for the status to be reflected.
            <ToastContainer />
        </div>
    );
}
