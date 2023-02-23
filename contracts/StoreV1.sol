// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.0;

contract StoreV1{
    address private coreOwner;
    mapping(address => bool) public users;

    struct Events {
        uint256 Id;
        address user;
        string assetType;
        string assetName;
        string action;
        string description;
    }

    Events [] public events;

    constructor(address _coreOwner) {
        coreOwner = _coreOwner;
        users[coreOwner] = true;
    }

    function addUser(address _user) external {
        require(msg.sender == coreOwner, "Only core owner can add user.");
        users[_user] = true;
    }

    function removeUser(address _user) external {
        require(msg.sender == coreOwner, "Only core owner can remove user.");
        users[_user] = false;
    }

    function addEvent(uint256 _Id, address _user, string memory _assetType, string memory _assetName, string memory _action, string memory _description) external {
        require(users[msg.sender] == true, "Only specific users can call this function.");
        require(_Id == events.length, "ID is wrong!");
        Events memory newEvent = Events(_Id, _user, _assetType, _assetName, _action, _description);
        events.push(newEvent);
    }

    function getEventsLength() external view returns(uint256){
        return events.length;
    }

    fallback() external payable {
        require(users[msg.sender] == true, "Only specific users can call this function.");
    }

    receive() external payable {}
}