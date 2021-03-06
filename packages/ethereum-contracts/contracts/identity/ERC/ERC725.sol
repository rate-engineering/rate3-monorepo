pragma solidity 0.4.24;

import "./ERC165.sol";


/**
 * @title ERC725
 * @author Wu Di
 * @notice Abstract contract for ERC725
 */
contract ERC725 is ERC165 {
    /**
     * bytes4(keccak256('getKey(bytes32)')) ^
     * bytes4(keccak256('keyHasPurpose(bytes32,uint256)')) ^
     * bytes4(keccak256('getKeysByPurpose(uint256)')) ^
     * bytes4(keccak256('addKey(bytes32,uint256,uint256)')) ^
     * bytes4(keccak256('removeKey(bytes32,uint256)')) ^
     * bytes4(keccak256('execute(address,uint256,bytes)')) ^
     * bytes4(keccak256('approve(uint256,bool)'))
     */
    bytes4 public constant ERC725ID = 0xdc3d2a7b;

    /**
     * @dev Constructor that adds ERC725 as a supported interface
     */
    constructor() internal {
        supportedInterfaces[ERC725ID] = true;
    }

    // Events
    event KeyAdded(
        bytes32 indexed key,
        uint256 indexed purpose,
        uint256 indexed keyType
    );

    event KeyRemoved(
        bytes32 indexed key,
        uint256 indexed purpose,
        uint256 indexed keyType
    );

    event ExecutionRequested(
        uint256 indexed executionId,
        address indexed to,
        uint256 indexed value,
        bytes data
    );

    event Executed(
        uint256 indexed executionId,
        address indexed to,
        uint256 indexed value,
        bytes data
    );

    event Approved(uint256 indexed executionId, bool approved);

    // Functions
    function getKey(bytes32 _key)
        public
        view
        returns(uint256[] purposes, uint256 keyType, bytes32 key);

    function keyHasPurpose(bytes32 _key, uint256 purpose)
        public
        view
        returns(bool exists);

    function getKeysByPurpose(uint256 _purpose)
        public
        view
        returns(bytes32[] keys);

    function addKey(bytes32 _key, uint256 _purpose, uint256 _keyType)
        public
        returns (bool success);

    function removeKey(bytes32 _key, uint256 _purpose)
        public
        returns (bool success);

    function execute(address _to, uint256 _value, bytes _data)
        public
        returns (uint256 executionId);

    function approve(uint256 _id, bool _approve)
        public
        returns (bool success);
}
