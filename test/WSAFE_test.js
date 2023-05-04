//const BN = require('bn.js')
const WSAFE = artifacts.require("WSAFE")
const safeVAULT = artifacts.require("IGnosisSafe")
const IERC20 = artifacts.require("IERC20")

contract('WSAFE_test', async accounts => {
	let wsafe
	let vault
	let safe
	let owner = "0xf5453Ac1b5A978024F0469ea36Be25887EA812b4"
	before(async() => {
		wsafe = await WSAFE.deployed()
		vault = await safeVAULT.at("0x07b91cb28B4fCB4b1109459D1c76bF436a58De70")
		safe = await IERC20.at("0x5aFE3855358E112B5647B952709E6165e1c1eEEe")
		//transfer ETH to owner used
		await web3.eth.sendTransaction({from: accounts[0], to: owner, value: web3.utils.toWei('10', 'ether') });
	})
	describe('Test WSAFE', function () {
		it("SAFE token paused - Should deposit safe wallet", async () => {
			// 1a. call vault -> add WSAFE as owner
			let CALL = 0;
			let sig = "0x" + "000000000000000000000000" + owner.replace('0x', '') + "0000000000000000000000000000000000000000000000000000000000000000" + "01"
			let data_wsafe = await vault.contract.methods.addOwnerWithThreshold(wsafe.address, 1).encodeABI()
			await vault.execTransaction(vault.address, 0, data_wsafe, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: owner})

			// 1b. add third owner -> to include vault deposit with multiple owners
			let data_extra = await vault.contract.methods.addOwnerWithThreshold(accounts[1], 1).encodeABI()
			await vault.execTransaction(vault.address, 0, data_extra, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: owner})
		
			// 1c. add fallback -> to include removal of fallback
			let data_fallback = await vault.contract.methods.setFallbackHandler(accounts[2]).encodeABI()
			await vault.execTransaction(vault.address, 0, data_fallback, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: owner})

			// 2. call vault -> deposit vault to WSAFE (make only owner)
			let data_deposit = await wsafe.contract.methods.deposit(owner).encodeABI()
			//gascost check
			gas = await vault.execTransaction.estimateGas(wsafe.address, 0, data_deposit, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: owner})
			console.log("gas paused deposit safe wallet: "+gas) 
			await vault.execTransaction(wsafe.address, 0, data_deposit, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: owner})

			let owners_after_deposit = await vault.getOwners.call()
			assert(owners_after_deposit.length == 1, "Deposit: not the only owner")
			assert(owners_after_deposit[0] == wsafe.address, "Deposit: wsafe not the owner")

			let totalSupply = await wsafe.totalSupply()
			let balanceSAFE = await safe.balanceOf(vault.address)
			let balanceWSAFE = await wsafe.balanceOf(owner)
			assert(totalSupply.toString() == balanceSAFE.toString(), "Deposit: mismatch in mint amount")
			assert(balanceSAFE.toString() == balanceWSAFE.toString(), "Deposit: mismatch in mint amount")
		})
		it("SAFE token paused - Should return safe wallet", async () => {
			//gascost check
			gas = await wsafe.returnSafe.estimateGas(vault.address, {from: owner})
			console.log("gas paused return safe wallet: "+gas) 
			await wsafe.returnSafe(vault.address, {from: owner})

			let owners_after_return = await vault.getOwners.call()
			assert(owners_after_return.length == 1, "Return: not the only owner")
			assert(owners_after_return[0] == owner, "Return: not returned to the owner")

			let totalSupply = await wsafe.totalSupply()
			let balanceWSAFE = await wsafe.balanceOf(owner)
			assert(totalSupply.toString() =="0", "Return: false burn amount")
			assert(balanceWSAFE.toString() == "0",  "Return: false burn amount")
		})
		it("SAFE token paused - Should re-deposit safe wallet", async () => {			
			// 1. call vault -> add WSAFE as owner
			let CALL = 0;
			let sig = "0x" + "000000000000000000000000" + owner.replace('0x', '') + "0000000000000000000000000000000000000000000000000000000000000000" + "01"
			let data_wsafe = await vault.contract.methods.addOwnerWithThreshold(wsafe.address, 1).encodeABI()
			await vault.execTransaction(vault.address, 0, data_wsafe, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: owner})

			// 2. call vault -> deposit vault to WSAFE (make only owner)
			let data_deposit = await wsafe.contract.methods.deposit(owner).encodeABI()
			await vault.execTransaction(wsafe.address, 0, data_deposit, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: owner})

			let owners_after_deposit = await vault.getOwners.call()
			assert(owners_after_deposit.length == 1, "Re-deposit: not the only owner")
			assert(owners_after_deposit[0] == wsafe.address, "Re-deposit: wsafe not the owner")

			let totalSupply = await wsafe.totalSupply()
			let balanceSAFE = await safe.balanceOf(vault.address)
			let balanceWSAFE = await wsafe.balanceOf(owner)
			assert(totalSupply.toString() == balanceSAFE.toString(), "Re-deposit: mismatch in mint amount")
			assert(balanceSAFE.toString() == balanceWSAFE.toString(), "Re-deposit: mismatch in mint amount")
		})
		it("SAFE token paused - Should FAIL already deposited safe wallet", async () => {
			try {
				// 1. call vault -> add WSAFE as owner
				let CALL = 0;
				let sig = "0x" + "000000000000000000000000" + owner.replace('0x', '') + "0000000000000000000000000000000000000000000000000000000000000000" + "01"
				let data_wsafe = await vault.contract.methods.addOwnerWithThreshold(wsafe.address, 1).encodeABI()
				await vault.execTransaction(vault.address, 0, data_wsafe, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: owner})

				// 2. call vault -> deposit vault to WSAFE (make only owner)
				let data_deposit = await wsafe.contract.methods.deposit(owner).encodeABI()
				await vault.execTransaction(wsafe.address, 0, data_deposit, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: owner})

				// 3. check fail
				assert.fail("The transaction should have thrown an error");
			}
			catch (err) {
				assert.include(err.message, "status 0", "The error message should contain 'status 0'");
			}
		})
		it("SAFE token unpaused - Should return safe wallet", async () => {
			// unpause SAFE token
			let safeToken_owner = "0x8CF60B289f8d31F737049B590b5E4285Ff0Bd1D1"
			await web3.eth.sendTransaction({from: accounts[0], to: safeToken_owner, value: web3.utils.toWei('10', 'ether') });
			await safe.unpause({from: safeToken_owner}) 
			let paused = await safe.paused.call()
			assert(paused == false, "Return unpaused: token not unpaused")
			
			//gascost check
			gas = await wsafe.returnSafe.estimateGas(vault.address, {from: accounts[3]})
			console.log("gas unpaused return safe wallet: "+gas) 
			//check return safe wallet from any caller -> withdrawing SAFE tokens
			await wsafe.returnSafe(vault.address, {from: accounts[3]})

			let owners_after_return = await vault.getOwners.call()
			assert(owners_after_return.length == 1, "Return: not the only owner")
			assert(owners_after_return[0] == owner, "Return: not returned to the owner")

			let safe_balance_wsafe = await safe.balanceOf(wsafe.address)
			let totalSupply = await wsafe.totalSupply()	
			let balanceWSAFE = await wsafe.balanceOf(owner)
			assert(totalSupply.toString() == safe_balance_wsafe.toString(), "Return: false SAFE token amount")
			assert(balanceWSAFE.toString() == safe_balance_wsafe.toString(),  "Return: false SAFE token amount")
		})
		it("SAFE token unpaused - Should withdraw SAFE token", async () => {
			let balance_wsafe_before = await wsafe.balanceOf(owner)
			let balance_safe_before = await safe.balanceOf(owner)
			assert(balance_safe_before.toString() == "0", "Withdraw: safe balance not zero")
			
			//gascost check
			gas = await wsafe.withdraw.estimateGas(balance_wsafe_before, {from: owner})
			console.log("gas unpaused withdraw SAFE token: "+gas) 
			await wsafe.withdraw(balance_wsafe_before, {from: owner})

			let balance_wsafe_after = await wsafe.balanceOf(owner)
			let balance_safe_after = await safe.balanceOf(owner)
			assert(balance_wsafe_after.toString() == "0", "Withdraw: wsafe balance not zero")
			assert(balance_safe_after.toString() == balance_wsafe_before, "Withdraw: safe balance not zero")
		})	
	})
})




