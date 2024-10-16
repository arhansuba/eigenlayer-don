// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BridgeBase.sol";

contract OracleDataBridge is BridgeBase {
    address public admin;
    mapping(string => address) public chainOracles;
    
    constructor() {
        admin = msg.sender;
    }
    
    function setChainOracle(string memory chain, address oracleAddress) external {
        require(msg.sender == admin, "Only admin can set chain oracles");
        chainOracles[chain] = oracleAddress;
    }
    
    function sendMessage(string memory destinationChain, address recipient, uint256 amount) external payable override {
        // In this case, 'amount' represents the data being sent
        bytes32 messageId = keccak256(abi.encodePacked(block.timestamp, msg.sender, recipient, amount, destinationChain));
        emit MessageSent(messageId, msg.sender, amount, destinationChain);
    }
    
    function receiveMessage(bytes32 messageId, address sender, address recipient, uint256 amount, string memory sourceChain) external override {
        require(msg.sender == admin, "Only admin can receive messages");
        require(!isMessageProcessed(messageId), "Message already processed");
        
        _setMessageAsProcessed(messageId);
        address targetOracle = chainOracles[sourceChain];
        require(targetOracle != address(0), "Target oracle not set");
        
        // Call the target oracle with the received data
        (bool success, ) = targetOracle.call(abi.encodeWithSignature("updateData(uint256)", amount));
        require(success, "Failed to update oracle data");
        
        emit MessageReceived(messageId, recipient, amount, sourceChain);
    }
}
