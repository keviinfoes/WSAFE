# WSAFE
Wrapped SAFE tokens to enable transferability. This is an unaudited fun weekend project. Use at your own risk!

## Background
The [SAFE token](https://etherscan.io/token/0x5afe3855358e112b5647b952709e6165e1c1eeee) on deployment disabled transferability. The owner of the SAFE token contract can call the unpause function to enable transferability. On deployment of this repository the SAFE token is non transferable, see governance proposal [SEP#2](https://snapshot.org/#/safe.eth/proposal/0x1b48a83c44e323275a605b244a05bde89918fb9ec86be7bb83792eb26e544441) for more info.

WSAFE allows "wrapping" of the SAFE token enabling transferability without the need for a governance proposal. In no way does it mean I want the token to be transferable or not. I have no opinion on this. However when I got the idea it seemed interesting enough to code. 

## Design
The SAFE token itself is not transferable, however the tokens are all in safe multisig wallets. Since a multisig wallet can transfer ownership it is possible to deposit the entire safe wallet into a wrapper contract that returns WSAFE tokens fore every SAFE token owned by the safe wallet.

Before depositing make sure that no other tokens are in the safe wallet, since a deposit results in locking the safe wallet in the wrapper contract. If the wallet did have other tokens then the safe wallet can be unlocked. Before transferability is enabled the safe wallet can be returned by burning the amount of WSAFE tokens in the safe wallet. After transferability is enabled the SAFE tokens can be returned by anyone, the wrapper contract will withdraw the SAFE tokens before returning the safe wallet. 

Note 1: the wrapper contract reads the balanceOf the safe wallet. This only returns the claimed tokens, so vested and unclaimed tokens can't be wrapped.  
Note 2: this POC requires that the safe wallet has a threshold of one for the deposit.

## Test
Test uses the ganache mainnet fork option. Use two terminals:

```
//Terminal 1
ganache-cli --gasPrice=90000000000 --fork {url} --unlock {safe wallet} {owner of safe wallet}

//Terminal 2
cd {path to repository}
truffle test
```

For the test cases I used a random SAFE token holder with a single owner and threshold of one: 
- safe wallet: 0x07b91cb28B4fCB4b1109459D1c76bF436a58De70 
- owner safe wallet: 0xf5453Ac1b5A978024F0469ea36Be25887EA812b4
