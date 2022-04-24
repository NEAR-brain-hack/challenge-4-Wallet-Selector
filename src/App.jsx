import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Big from 'big.js';
import Form from './components/Form';
import SignIn from './components/SignIn';
import Messages from './components/Messages';
import { useWalletSelector } from './context/WalletSelector';
import { providers, utils } from "near-api-js";

const SUGGESTED_DONATION = '0';
const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();

const App = () => {
  const [account, setAccount] = useState(null);
  const [messages, setMessages] = useState([]);
  const { selector, accounts, accountId, setAccountId } = useWalletSelector();


  const getAccount = useCallback(async () => {
    if (!accountId) {
      return null;
    }

    const { nodeUrl } = selector.network;
    const provider = new providers.JsonRpcProvider({ url: nodeUrl });

    return provider
      .query({
        request_type: "view_account",
        finality: "final",
        account_id: accountId,
      })
      .then((data) => ({
        ...data,
        account_id: accountId,
      }));
  }, [accountId, selector.network]);

  const getMessages = useCallback(() => {
    const provider = new providers.JsonRpcProvider({
      url: selector.network.nodeUrl,
    });

    return provider
      .query({
        request_type: "call_function",
        account_id: selector.getContractId(),
        method_name: "getMessages",
        args_base64: "",
        finality: "optimistic",
      })
      .then((res) => JSON.parse(Buffer.from(res.result).toString()));
  }, [selector]);

  useEffect(() => {
    getMessages().then((result) => setMessages(result));
  }, []);

  useEffect(() => {
    if (!accountId) {
      return setAccount(null);
    }

    getAccount().then((nextAccount) => {
      setAccount(nextAccount);
    });
  }, [accountId, getAccount]);

  const signIn = () => {
    selector.show();
  };

  const signOut = () => {
    selector.signOut().catch((err) => {
      console.log("Failed to sign out");
      console.error(err);
    });
  };

  const handleSwitchProvider = () => {
    selector.show();
  };

  const handleSwitchAccount = () => {
    const currentIndex = accounts.findIndex((x) => x.accountId === accountId);
    const nextIndex = currentIndex < accounts.length - 1 ? currentIndex + 1 : 0;

    const nextAccountId = accounts[nextIndex].accountId;

    setAccountId(nextAccountId);
    alert("Switched account to " + nextAccountId);
  };

  const addMessage = (e) => {
    e.preventDefault();

    const { fieldset, message, donation } = e.target.elements;

    fieldset.disabled = true;

    selector.signAndSendTransactions({
      transactions: [
        {
          receiverId: selector.getContractId(),
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "addMessage",
                args: { text: message.value},
                gas: BOATLOAD_OF_GAS,
                deposit: utils.format.parseNearAmount(donation.value || "0"),
              },
            },
          ],
        },
      ]
    }).then(() => {
      getMessages()
        .then((nextMessages) => {
          setMessages(nextMessages);
          message.value = "";
          donation.value = SUGGESTED_DONATION;
          fieldset.disabled = false;
          message.focus();
        })
        .catch((err) => {
          console.log("Failed to refresh messages");
        });
    }).catch((err) => {
      console.error(err);
      fieldset.disabled = false;
    });
  }

  return (
      <main>
        <header>
          <h1>NEAR Guest Book</h1>
          { account
            ? <button onClick={signOut}>Log out</button>
            : <button onClick={signIn}>Log in</button>
          }
        </header>
        { account
          ? (
            <>
              <div>
                <button onClick={handleSwitchProvider}>Switch Provider</button>
                {accounts.length > 1 && (
                  <button onClick={handleSwitchAccount}>Switch Account</button>
                )}
              </div>
              <Form onSubmit={addMessage} currentUser={account} />
            </>
          )
          : <SignIn/>
        }
        { !!account && !!messages.length && <Messages messages={messages}/> }
      </main>
    
  );
};

export default App;
