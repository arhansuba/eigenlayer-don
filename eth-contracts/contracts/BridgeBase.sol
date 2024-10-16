// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; // Make sure this pragma is at the top

abstract contract BridgeBase {
    mapping(bytes32 => bool) public processedMessages;
    
    event MessageSent(bytes32 indexed messageId, address sender, uint256 amount, string destinationChain);
    event MessageReceived(bytes32 indexed messageId, address recipient, uint256 amount, string sourceChain);

    function sendMessage(string memory destinationChain, address recipient, uint256 amount) external payable virtual;
    function receiveMessage(bytes32 messageId, address sender, address recipient, uint256 amount, string memory sourceChain) external virtual;
    
    function _setMessageAsProcessed(bytes32 messageId) internal {
        processedMessages[messageId] = true;
    }

    function isMessageProcessed(bytes32 messageId) public view returns (bool) {
        return processedMessages[messageId];
    }
}
