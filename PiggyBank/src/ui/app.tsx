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

import { PiggyBankWrapper } from '../lib/contracts/PiggyBankWrapper';
import { CONFIG } from '../config';

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
    const [contract, setContract] = useState<PiggyBankWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();

    const [remainingTime, setRemainingTime] = useState<string>("0");
    const [depositAmount, setDepositAmount] = useState<string>("0");
    const [unlockedBalance, setUnlockedBalance] = useState<string>("0");
    const [timelock, setTimelock] = useState<string>("0");
    const [bankCreated, setBankCreated] = useState(false);
    const [contractAddress, setContractAddress] = useState<string>();

    const [daysCounter, setDaysCounter] = useState<number>(0);
    const [hoursCounter, setHoursCounter] = useState<number>(0);
    const [minutesCounter, setMinutesCounter] = useState<number>(0);
    const [secondsCounter, setSecondsCounter] = useState<number>(0);

    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);


    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
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
        const _contract = new PiggyBankWrapper(web3);

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
        const _contract = new PiggyBankWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
    }

    async function getRemainingTime() {
        const _remainingTime = await contract.getRemainingTimelock(account);
        setRemainingTime(_remainingTime);

        var time = Number(_remainingTime);
        const days = time / (60 * 60 * 24);
        time = time % (60 * 60 * 24);
        setDaysCounter(days);

        const hours = time / (60 * 60);
        time = time % (60 * 60);
        setHoursCounter(hours);

        const minutes = time / (60);
        time = time % (60);
        setMinutesCounter(minutes);

        setSecondsCounter(time);
    }

    async function getUnlockedBalance() {
        const _unlockedBalance = await contract.getUnlockedBalance(account);
        setUnlockedBalance(_unlockedBalance);
    }

    async function createBank() {
        try {
            setTransactionInProgress(true);

            await contract.createBank(account, timelock);
            setBankCreated(true);
            toast(
                'Successfully created PiggyBank. Now you can deposit your savings',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
            setBankCreated(false);
        } finally {
            setTransactionInProgress(false);
            getRemainingTime();
        }
    }

    async function deposit() {
        try {
            setTransactionInProgress(true);

            await contract.deposit(account, web3.utils.toWei(depositAmount));
            setDepositAmount("");
            toast(
                'Successful deposit!',
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

    async function widthraw() {
        try {
            setTransactionInProgress(true);

            await contract.widthraw(account);
            toast(
                'Successful widthrawal!',
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
            }
        })();
    });

    useEffect(() => {
        if(!contract) {
            return;
        }

        getUnlockedBalance();
        getRemainingTime();

        if((unlockedBalance != "0" || remainingTime != "0")) {
            setBankCreated(true);
        }
    }, [unlockedBalance, remainingTime, bankCreated])
    

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
            <br />
            <div style={{ display: (!contract ? 'block' : 'none') }}>
            Contract address: <input onChange={e => {setContractAddress(e.target.value)}}></input>
            <button onClick={() => {setExistingContractAddress(contractAddress)}}>Use existing contract</button> or <button onClick={deployContract}>Deploy new contract</button>
            </div>

            <div style={{ display: (contract ? 'block' : 'none') }}>
            Contract address: <b>{contract?.address || '-'}</b>
            <br />
            <br />

            <div style={{ display: (!bankCreated ? 'block' : 'none') }}>
            Set timelock and create own PiggyBank! You will be able to widthraw your savings when timelock ends.
            <br />
            Timelock: <input onChange={e => {setTimelock(e.target.value)}}></input> minutes   <button onClick={createBank}>Create Bank</button>
            </div>

            <div style={{ display: ((remainingTime == "0" && unlockedBalance != "0") ? 'block' : 'none') }}>
            <h2>It's over! You can widthraw your savings.</h2><br />
            <button onClick={widthraw}>Widthraw</button>
            </div>

            <div style={{ display: ((remainingTime != "0") ? 'block' : 'none') }}>
            <h2>Timelock counter: {daysCounter} days {hoursCounter} hours {minutesCounter} minutes {secondsCounter} seconds </h2>   <button onClick={getRemainingTime}>Update</button> 
            <br />
            <br />
            Deposit amount: <input onChange={e => {setDepositAmount(e.target.value)}}></input> <button onClick={deposit}>Deposit</button>
            </div>

            </div>
            <br />
            <hr />
            <ToastContainer />
        </div>
    );
}
