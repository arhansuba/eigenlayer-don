// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BridgeBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BinanceSmartChainBridge is BridgeBase {
    address public admin;
    IERC20 public bnbToken;
    
    constructor(address _bnbToken) {
        admin = msg.sender;
        bnbToken = IERC20(_bnbToken);
    }
    
    function sendMessage(string memory destinationChain, address recipient, uint256 amount) external payable override {
        require(bnbToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        bytes32 messageId = keccak256(abi.encodePacked(block.timestamp, msg.sender, recipient, amount, destinationChain));
        emit MessageSent(messageId, msg.sender, amount, destinationChain);
    }
    
    function receiveMessage(bytes32 messageId, address sender, address recipient, uint256 amount, string memory sourceChain) external override {
        require(msg.sender == admin, "Only admin can receive messages");
        require(!isMessageProcessed(messageId), "Message already processed");
        
        _setMessageAsProcessed(messageId);
        require(bnbToken.transfer(recipient, amount), "Transfer failed");
        
        emit MessageReceived(messageId, recipient, amount, sourceChain);
    }
}
