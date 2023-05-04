// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

import "../Enum.sol";
interface IGnosisSafe {
    function getOwners() external returns (address[] memory);
    function getThreshold() external returns (uint256);
    function getModulesPaginated(address, uint256) external view returns (address[] memory, address);
    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures
    ) external returns (bool);

    function addOwnerWithThreshold(address, uint256) external;
    function setFallbackHandler(address) external;   
}