import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Contracts to generate ABI for
const CONTRACTS = ["FHECounter", "SecretVoting", "GovernanceParams"];

// Path to hardhat deployment directory
const HARDHAT_PATH = path.resolve("../fhevm-hardhat-template");
const DEPLOYMENTS_PATH = path.join(HARDHAT_PATH, "deployments");

// Output directory
const OUTPUT_DIR = path.resolve("./abi");

const line = "\n===================================================================\n";

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Check if hardhat directory exists
if (!fs.existsSync(HARDHAT_PATH)) {
  console.warn(
    `${line}Unable to locate ${HARDHAT_PATH}${line}`
  );
  console.log("Checking if ABI files already exist...");
  
  // Check if all required ABI files exist
  const allAbiFilesExist = CONTRACTS.every((contractName) => {
    const abiFile = path.join(OUTPUT_DIR, `${contractName}ABI.ts`);
    const addressesFile = path.join(OUTPUT_DIR, `${contractName}Addresses.ts`);
    return fs.existsSync(abiFile) && fs.existsSync(addressesFile);
  });
  
  if (allAbiFilesExist) {
    console.log("✅ All ABI files already exist. Skipping generation.");
    process.exit(0);
  } else {
    console.error(
      `${line}ABI files are missing and hardhat directory is not available.${line}`
    );
    process.exit(1);
  }
}

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    console.log("Deploying contracts to Hardhat node...");
    execSync(`npx hardhat deploy --network localhost`, {
      cwd: HARDHAT_PATH,
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Deployment failed: ${e}${line}`);
    process.exit(1);
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(DEPLOYMENTS_PATH, chainName);

  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy on hardhat node
    deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate deployment for ${contractName} on ${chainName}.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const deploymentFile = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(deploymentFile)) {
    if (!optional) {
      console.error(
        `${line}Contract ${contractName} not found in ${chainName} deployments.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(deploymentFile, "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;
  obj.chainName = chainName;

  return obj;
}

// Generate ABI and addresses for each contract
CONTRACTS.forEach((contractName) => {
  console.log(`\nGenerating ABI for ${contractName}...`);

  // Read localhost deployment (required)
  const deployLocalhost = readDeployment("localhost", 31337, contractName, false);

  // Read Sepolia deployment (optional)
  let deploySepolia = readDeployment("sepolia", 11155111, contractName, true);
  if (!deploySepolia) {
    deploySepolia = {
      abi: deployLocalhost.abi,
      address: "0x0000000000000000000000000000000000000000",
      chainId: 11155111,
      chainName: "sepolia",
    };
  }

  // Check ABI consistency
  if (deployLocalhost && deploySepolia) {
    if (JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)) {
      console.warn(
        `⚠️  Warning: ABI mismatch for ${contractName} between localhost and Sepolia`
      );
    }
  }

  // Generate ABI file
  const abiCode = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${contractName}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
`;

  // Generate addresses file
  const addressesCode = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${contractName}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
} as const;
`;

  // Write files
  fs.writeFileSync(path.join(OUTPUT_DIR, `${contractName}ABI.ts`), abiCode, "utf-8");
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${contractName}Addresses.ts`),
    addressesCode,
    "utf-8"
  );

  console.log(`✅ Generated ${contractName}ABI.ts`);
  console.log(`✅ Generated ${contractName}Addresses.ts`);
});

console.log("\n✅ All ABIs generated successfully!\n");


