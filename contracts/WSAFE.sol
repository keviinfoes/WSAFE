// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity =0.7.6;

import "./interface/IERC20.sol";
import "./interface/IGnosisSafe.sol";

contract WSAFE {
    string public name     = "Wrapped Safe";
    string public symbol   = "WSAFE";
    uint8  public decimals = 18;
    address public SAFE = 0x5aFE3855358E112B5647B952709E6165e1c1eEEe;

    event  Approval(address indexed from, address indexed to, uint amount);
    event  Transfer(address indexed from, address indexed to, uint amount);
    event  Deposit(address indexed from, address indexed to, uint amount);
    event  Withdrawal(address indexed to, uint amount);

    uint256 public totalSupply;
    mapping (address => uint) public  balanceOf;
    mapping (address => mapping (address => uint)) public  allowance;
    mapping (address => address) public withdrawer;
    mapping (address => uint256) public minted;
    address[] public vaults;

    modifier onlyOwner() {        
        address[] memory owners = IGnosisSafe(msg.sender).getOwners();
        address prevOwner = address(0x1);          
        for (uint256 i; i < owners.length; i++) {  
            if (owners[i] != address(this)){
                bytes memory data = abi.encodeWithSignature("removeOwner(address,address,uint256)", prevOwner, owners[i], 1);
                execute(msg.sender, msg.sender, data);
            } else {
                prevOwner = owners[i];  
            }
        }
        _;
    }

    modifier noModules() {
        (address[] memory modules, ) = IGnosisSafe(msg.sender).getModulesPaginated(address(0x1), 1);
        require(modules.length == 0, "Active modules");
        _;
    }

    modifier noGuard() {
        bytes memory data = abi.encodeWithSignature("setGuard(address)", address(0));
        execute(msg.sender, msg.sender, data);
        _;
    }

    modifier noFallback() {
        bytes memory data = abi.encodeWithSignature("setFallbackHandler(address)", address(0));
        execute(msg.sender, msg.sender, data);
        _;
    }

    // Deposit requires a safe wallet threshold of one before calling
    function deposit(address receiver) public onlyOwner noModules noGuard noFallback {
        require(paused(), "Deposit: SAFE token is transferable");
        require(receiver != address(0), "Deposit: no receiver set");
        require(withdrawer[msg.sender] == address(0), "Deposit: already deposited");
        uint256 balance = IERC20(SAFE).balanceOf(msg.sender);
        require(balance > 0, "Deposit: no SAFE tokens");
        withdrawer[msg.sender] = receiver;
        minted[msg.sender] += balance;
        balanceOf[receiver] += balance;
        totalSupply += balance;
        vaults.push(msg.sender);
        emit Deposit(msg.sender, receiver, balance);
    }

    function withdraw(uint256 amount) public {
        require(!paused(), "Withdraw: SAFE token is not transferable");
        require(IERC20(SAFE).balanceOf(address(this)) >= amount, "Withdraw: no SAFE tokens available");
        require(balanceOf[msg.sender] >= amount, "Withdraw: insufficient WSAFE balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        IERC20(SAFE).transfer(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
    }

    function returnSafe(address safe) public {
        address receiver = withdrawer[safe];
        uint256 balance = minted[safe];
        if(paused()){
            require(msg.sender == receiver, "return Safe: not the receiver");
            uint256 amount = balanceOf[msg.sender];
            require(amount >= balance, "return Safe: insufficient WSAFE balance");
            withdrawer[safe] = address(0);
            minted[safe] -= balance;
            balanceOf[msg.sender] -= balance;
            totalSupply -= balance;
            emit Withdrawal(msg.sender, balance);
        } else {
            withdrawer[safe] = address(0);
            bytes memory data = abi.encodeWithSignature("transfer(address,uint256)", address(this), balance);
            execute(safe, SAFE, data);
        }
        bytes memory swap = abi.encodeWithSignature("swapOwner(address,address,address)", address(0x1), address(this), receiver);
        execute(safe, safe, swap);  
    }

    function execute(address safe, address to, bytes memory data) internal {
        IGnosisSafe(safe).execTransaction(
            to,
            0,
            data,
            Enum.Operation.Call,
            0, 
            0,
            0, 
            address(0), 
            payable(0), 
            signatureCreate(1, bytes32(uint256(uint160(address(this)))), bytes32(0))
        );
    }

    function signatureCreate(uint8 v, bytes32 r, bytes32 s) internal pure returns (bytes memory signatures) {
       signatures = abi.encodePacked(abi.encode(r, s), v);
    }

    function paused() internal returns (bool locked) {
        locked = IERC20(SAFE).paused();
    }

    function approve(address sender, uint amount) public returns (bool) {
        allowance[msg.sender][sender] = amount;
        emit Approval(msg.sender, sender, amount);
        return true;
    }

    function transfer(address receiver, uint amount) public returns (bool) {
        return transferFrom(msg.sender, receiver, amount);
    }

    function transferFrom(address sender, address receiver, uint amount) public returns (bool) {
        require(balanceOf[sender] >= amount);
        if (sender != msg.sender && allowance[sender][msg.sender] != uint(-1)) {
            require(allowance[sender][msg.sender] >= amount);
            allowance[sender][msg.sender] -= amount;
        }
        balanceOf[sender] -= amount;
        balanceOf[receiver] += amount;
        emit Transfer(sender, receiver, amount);
        return true;
    }
}
