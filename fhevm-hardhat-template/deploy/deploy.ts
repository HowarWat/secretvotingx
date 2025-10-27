import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy FHECounter (original)
  const deployedFHECounter = await deploy("FHECounter", {
    from: deployer,
    log: true,
  });
  console.log(`FHECounter contract: `, deployedFHECounter.address);

  // Deploy GovernanceParams
  const deployedGovernanceParams = await deploy("GovernanceParams", {
    from: deployer,
    log: true,
  });
  console.log(`GovernanceParams contract: `, deployedGovernanceParams.address);

  // Deploy SecretVoting
  const deployedSecretVoting = await deploy("SecretVoting", {
    from: deployer,
    log: true,
  });
  console.log(`SecretVoting contract: `, deployedSecretVoting.address);
};

export default func;
func.id = "deploy_all_contracts";
func.tags = ["FHECounter", "GovernanceParams", "SecretVoting"];
