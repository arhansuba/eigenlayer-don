// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BridgeBase.sol";

contract EthereumBridge is BridgeBase {
    address public admin;
    
    constructor() {
        admin = msg.sender;
    }
    
    function sendMessage(string memory destinationChain, address recipient, uint256 amount) external payable override {
        require(msg.value == amount, "Sent ETH must match the amount");
        bytes32 messageId = keccak256(abi.encodePacked(block.timestamp, msg.sender, recipient, amount, destinationChain));
        emit MessageSent(messageId, msg.sender, amount, destinationChain);
    }
    
    function receiveMessage(bytes32 messageId, address sender, address recipient, uint256 amount, string memory sourceChain) external override {
        require(msg.sender == admin, "Only admin can receive messages");
        require(!isMessageProcessed(messageId), "Message already processed");
        
        _setMessageAsProcessed(messageId);
        payable(recipient).transfer(amount);
        
        emit MessageReceived(messageId, recipient, amount, sourceChain);
    }
}
