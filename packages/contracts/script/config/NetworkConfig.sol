// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library NetworkConfig {
    struct DeploymentConfig {
        address identityRegistry;
        address gdaForwarder;
        address supToken;
        address treasury;
        uint256 joinFee;
    }

    function getNetworkConfig(uint256 chainId)
        internal
        pure
        returns (DeploymentConfig memory config)
    {
        if (chainId == 8453) {
            config = getBaseMainnetConfig();
        } else if (chainId == 84532) {
            config = getBaseSepoliaConfig();
        } else {
            revert("Unsupported chainId");
        }
    }

    /**
     * @dev Get Base Mainnet configuration
     */
    function getBaseMainnetConfig() internal pure returns (DeploymentConfig memory) {
        return DeploymentConfig({
            identityRegistry: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432,
            gdaForwarder: 0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08,
            supToken: 0xa69f80524381275A7fFdb3AE01c54150644c8792,
            treasury: 0xac808840f02c47C05507f48165d2222FF28EF4e1,
            joinFee: 0.0001 ether
        });
    }

    /**
     * @dev Get Base Sepolia configuration
     */
    function getBaseSepoliaConfig() internal pure returns (DeploymentConfig memory) {
        return DeploymentConfig({
            identityRegistry: 0x8004A818BFB912233c491871b3d84c89A494BD9e,
            gdaForwarder: 0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08,
            supToken: 0xFd62b398DD8a233ad37156690631fb9515059d6A,
            treasury: 0x48CA32c738DC2Af6cE8bB33934fF1b59cF8B1831,
            joinFee: 0.0001 ether
        });
    }

    function getLocalConfig() internal pure returns (DeploymentConfig memory) {
        return getBaseMainnetConfig();
    }
}
