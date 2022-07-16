const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Testing with mocks", () => {

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const NFT_NAME = "Test NFT";
  const NFT_SYMBOL = "TEST";
  const PROXY_COUNT = 4;

  let signers; 
  let testImplV1;
  let cloneFactory;
  let proxies = Array(4);

  describe("Implementation v1 + Proxy 1", () => {
    
    before(async () => {

      [ _, ...signers ] = await ethers.getSigners();

      const TestImplV1 = await ethers.getContractFactory("TestImplV1");
      testImplV1 = await (await TestImplV1.deploy()).deployed();

      const CloneFactory = await ethers.getContractFactory("CloneFactory");
      cloneFactory = await (await CloneFactory.deploy(testImplV1.address)).deployed();

      const { events } = await (await cloneFactory.clone()).wait();

      const proxyAddr = events[0].args.proxy;
      proxies[0] = await ethers.getContractAt("TestImplV1", proxyAddr);

      await (await proxies[0].setUp(NFT_NAME, NFT_SYMBOL)).wait();
    });

    it("deploys", async () => {
      expect(testImplV1.address).to.not.equal(ZERO_ADDRESS);
      expect(cloneFactory.address).to.not.equal(ZERO_ADDRESS);
      expect(proxies[0].address).to.not.equal(ZERO_ADDRESS);
    });

    it("has correct name and symbol", async () => {
      expect(await proxies[0].name()).to.equal(NFT_NAME);
      expect(await proxies[0].symbol()).to.equal(NFT_SYMBOL);
    });

    it("mints one token for three different addresses", async () => {
      for (let j = 0; j < 3; j++) {
        const tx1 = await (await proxies[0].connect(signers[j]).mint()).wait();

        expect(await tx1.status).to.equal(1);
        expect(await proxies[0].balanceOf(signers[j].address)).to.equal(1);
      }
    });
  });
  
  describe("Implementation v2 + Proxy 1", () => {
    
    before(async () => {
      const TestImplV2 = await ethers.getContractFactory("TestImplV2");
      testImplV2 = await (await TestImplV2.deploy()).deployed();
      
      await (await cloneFactory.upgradeImplementation(testImplV2.address)).wait();
    });

    it("deploys", async () => {
      expect(testImplV2.address).to.not.equal(ZERO_ADDRESS);
    });

    it("has correct name and symbol", async () => {
      expect(await proxies[0].name()).to.equal(NFT_NAME);
      expect(await proxies[0].symbol()).to.equal(NFT_SYMBOL);
    });

    it("three tokens are still owned by original holders", async () => {
      for (let j = 0; j < 3; j++) {
        expect(await proxies[0].balanceOf(signers[j].address)).to.equal(1);
      }
    });

    it("batch mint 5 tokens", async () => {
      const tx1 = await (await proxies[0].connect(signers[3]).mint()).wait();

      expect(await tx1.status).to.equal(1);
      expect(await proxies[0].balanceOf(signers[3].address)).to.equal(5);
    });
  });

  describe("Four Proxies", () => {
    
    before(async () => {
      for (let i = 1; i < PROXY_COUNT; i++) {
        const { events } = await (await cloneFactory.clone()).wait();
        const proxyAddr = events[0].args.proxy;
        proxies[i] = await ethers.getContractAt("TestImplV2", proxyAddr);
        await (await proxies[i].setUp(NFT_NAME, NFT_SYMBOL)).wait();
      }
    });

    it("deploys", async () => {
      for (let i = 1; i < PROXY_COUNT; i++) {
        expect(proxies[i].address).to.not.equal(ZERO_ADDRESS);
      }
    });

    it("has correct name and symbol", async () => {
      for (let i = 1; i < PROXY_COUNT; i++) {
        expect(await proxies[i].name()).to.equal(NFT_NAME);
        expect(await proxies[i].symbol()).to.equal(NFT_SYMBOL);
      }
    });

    it("batch mint 5 tokens", async () => {
      for (let i = 1; i < PROXY_COUNT; i++) {
        const tx1 = await (await proxies[i].connect(signers[i * 4 + 3]).mint()).wait();
  
        expect(await tx1.status).to.equal(1);
        expect(await proxies[i].balanceOf(signers[i * 4 + 3].address)).to.equal(5);
      }
    });

    it("mint one token for three new proxies", async () => {
      await (await cloneFactory.upgradeImplementation(testImplV1.address)).wait();

      for (let i = 1; i < PROXY_COUNT; i++) {
        for (let j = 0; j < 3; j++) {
          const tx1 = await (await proxies[i].connect(signers[i * 4 + j]).mint()).wait();
  
          expect(await tx1.status).to.equal(1);
          expect(await proxies[i].balanceOf(signers[i * 4 + j].address)).to.equal(1);
        }
      }
    });

    it("each proxy has its own storage", async () => {
      for (let i = 0; i < PROXY_COUNT; i++) {
        expect(await proxies[i].totalSupply()).to.equal(8);
      }
    });
  });
});
