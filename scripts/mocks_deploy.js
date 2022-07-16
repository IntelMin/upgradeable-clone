const { ethers } = require("hardhat");

async function main() {
  const TestImplV1 = await ethers.getContractFactory("TestImplV1");
  const testImplV1 = await (await TestImplV1.deploy()).deployed();

  console.log("TestImplV1 deployed to:", testImplV1.address);

  const CloneFactory = await ethers.getContractFactory("CloneFactory");
  const cloneFactory = await (await CloneFactory.deploy(testImplV1.address)).deployed();

  console.log("CloneFactory deployed to:", cloneFactory.address);

  const { events } = await (await cloneFactory.clone()).wait();

  const proxyAddr = events[0].args.proxy;
  const proxy = await ethers.getContractAt("TestImplV1", proxyAddr);

  await (await proxy.setUp("Test NFT", "TEST")).wait();

  console.log("Proxy deployed to:", proxy.address);

  const TestImplV2 = await ethers.getContractFactory("TestImplV2");
  const testImplV2 = await (await TestImplV2.deploy()).deployed();

  console.log("TestImplV2 deployed to:", testImplV2.address);

  await (await cloneFactory.upgradeImplementation(testImplV2.address)).wait();

  console.log("Implementation upgraded to:", testImplV2.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
