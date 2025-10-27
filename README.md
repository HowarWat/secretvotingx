# SecretVotingX

An end-to-end privacy-preserving voting governance system built on Zama FHEVM. SecretVotingX enables fully encrypted on-chain voting where all ballot choices and intermediate counts are stored and computed as ciphertexts, ensuring complete privacy throughout the voting process while maintaining verifiable blockchain-based tallies.

## 🌟 Features

- **Fully Encrypted Voting**: All votes are encrypted using FHEVM primitives (`ebool`, `euint32`, etc.) before being submitted to the blockchain
- **Homomorphic Tallying**: Votes are counted on-chain without ever decrypting individual ballots
- **Flexible Disclosure Strategies**:
  - `PUBLIC_AFTER_END`: Results automatically decryptable by everyone after voting ends (no signature required)
  - `OWNER_ONLY`: Results only accessible to proposal owner (requires EIP-712 signature)
  - `QUALIFIED_ONLY`: Results accessible to authorized addresses (requires EIP-712 signature)
- **Dual Mode Support**: Works with both local mock development and real Sepolia testnet deployment
- **Modern UI**: Glassmorphism design with responsive layout and dark mode

## 🏗️ Project Structure

```
zama_voting_0002/
├── fhevm-hardhat-template/     # Smart contracts & deployment
│   ├── contracts/
│   │   ├── SecretVoting.sol    # Main voting contract
│   │   └── GovernanceParams.sol # Governance parameters
│   ├── deploy/                   # Deployment scripts
│   └── test/                     # Contract tests
│
└── secretvotingx-frontend/      # Next.js frontend
    ├── app/                      # Next.js App Router
    ├── components/               # React components
    ├── hooks/                    # Custom React hooks
    ├── fhevm/                    # FHEVM integration layer
    └── abi/                      # Generated contract ABIs
```

## 📋 Prerequisites

- **Node.js**: v18+ 
- **npm**: v9+
- **MetaMask**: Latest version for wallet integration
- **Sepolia ETH**: For testing on Sepolia testnet

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/HowarWat/secretvotingx.git
cd secretvotingx
```

### 2. Install Dependencies

```bash
# Install contract dependencies
cd fhevm-hardhat-template
npm install

# Install frontend dependencies
cd ../secretvotingx-frontend
npm install
```

### 3. Set Up Environment Variables

Create `.env` files (not included in repo):

**fhevm-hardhat-template/.env**:
```
MNEMONIC=your twelve word mnemonic phrase here...
INFURA_API_KEY=your_infura_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 4. Deploy Contracts

**Local Development (Mock Mode)**:
```bash
cd fhevm-hardhat-template
npx hardhat node --port 8545
# In another terminal:
npx hardhat deploy --network localhost
```

**Sepolia Testnet**:
```bash
npx hardhat deploy --network sepolia
```

### 5. Generate ABIs for Frontend

```bash
cd secretvotingx-frontend
npm run genabi
```

### 6. Run Frontend

**Mock Mode** (for local development):
```bash
npm run dev:mock
```

**Real Mode** (for Sepolia testnet):
```bash
npm run dev
```

## 📝 Usage

1. **Connect Wallet**: Connect your MetaMask wallet to the appropriate network
2. **Create Proposal**: Click "Create Proposal" and fill in the details
3. **Vote**: Select your choice and submit an encrypted vote
4. **Finalize**: After voting ends, finalize the proposal
5. **Decrypt**: Click "Decrypt Results" to view the tally (signature may be required)

## 🔐 Security & Privacy

- **On-Chain Encryption**: All votes remain encrypted on-chain using FHEVM
- **Homomorphic Operations**: Tallying happens without decrypting individual votes
- **EIP-712 Signatures**: Required for accessing restricted results
- **No Vote Tracing**: Individual voter choices cannot be traced back

## 🧪 Testing

```bash
# Run contract tests
cd fhevm-hardhat-template
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test
```

## 📚 Documentation

For detailed documentation, see:
- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Zama**: For providing FHEVM technology
- **Hardhat**: For the excellent development framework
- **Ethers.js**: For blockchain interaction

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**⚠️ Important**: This is a proof-of-concept demonstration. Do not use in production without comprehensive security auditing.

