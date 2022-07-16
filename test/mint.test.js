const { expect } = require("chai");
const { ethers } = require("hardhat");
const { randomBytes } = require("crypto");
const { smock } = require("@defi-wonderland/smock");

const { signMintRequestBySigner, getDefaultExpireTime } = require("../scripts/utils");

const BigNumber = ethers.BigNumber;

describe("Testing Mint Contract", () => {

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const NFT_NAME = "Test NFT";
  const NFT_SYMBOL = "TEST";

  let owner, signer, user1;
  let mockERC721;
  let mock;

  const defaultExpireTime = getDefaultExpireTime();

  function signMintRequest(...params) {
    return signMintRequestBySigner(signer, ...params);
  }

  before(async () => {
    [owner, signer, user1, whitelisted] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const MockERC721 = await smock.mock("ERC721A");
    mockERC721 = await (await MockERC721.deploy("MockToken", "MT")).deployed();

    const ConfigMintTest = await smock.mock("ConfigMintTest");
    mock = await (await ConfigMintTest.deploy(
      0,
      [],
      [mockERC721.address],
      signer.address
    )).deployed();
  });

  it("should mint a token", async () => {
    const salt = "0x" + randomBytes(32).toString("hex");
    const ethValue = ethers.utils.parseEther("1");
    const erc20Values = [];
    const tokenIds = [];
    const tokenStatus = BigNumber.from("0");
    const quantity = BigNumber.from("1");

    const signature = signMintRequest(
      user1.address,
      salt,
      ethValue,
      erc20Values,
      tokenIds,
      tokenStatus,
      quantity,
      defaultExpireTime
    );

    await expect(
      mock
        .connect(user1)
        .mint(
          signature,
          salt,
          ethValue,
          erc20Values,
          tokenIds,
          tokenStatus,
          quantity,
          defaultExpireTime,
          { value: ethValue }
        )
    ).to.emit(mock, "Transfer");
  });

  it("should not mint a token with the same data twice", async () => {
    const salt = "0x" + randomBytes(32).toString("hex");
    const ethValue = ethers.utils.parseEther("1");
    const erc20Values = [];
    const tokenIds = [];
    const tokenStatus = BigNumber.from("0");
    const quantity = BigNumber.from("1");

    const signature = signMintRequest(
      user1.address,
      salt,
      ethValue,
      erc20Values,
      tokenIds,
      tokenStatus,
      quantity,
      defaultExpireTime
    );

    await expect(
      mock
        .connect(user1)
        .mint(
          signature,
          salt,
          ethValue,
          erc20Values,
          tokenIds,
          tokenStatus,
          quantity,
          defaultExpireTime,
          { value: ethValue }
        )
    ).to.emit(mock, "Transfer");

    await expect(
      mock
        .connect(user1)
        .mint(
          signature,
          salt,
          ethValue,
          erc20Values,
          tokenIds,
          tokenStatus,
          quantity,
          defaultExpireTime,
          { value: ethValue }
        )
    ).to.be.revertedWith("HashUsed()");
  });

  it("should not mint a token with the expired signature", async () => {
    const salt = "0x" + randomBytes(32).toString("hex");
    const ethValue = ethers.utils.parseEther("1");
    const erc20Values = [];
    const tokenIds = [];
    const tokenStatus = BigNumber.from("0");
    const quantity = BigNumber.from("1");

    const signature = signMintRequest(
      user1.address,
      salt,
      ethValue,
      erc20Values,
      tokenIds,
      tokenStatus,
      quantity,
      0
    );

    await expect(
      mock
        .connect(user1)
        .mint(
          signature,
          salt,
          ethValue,
          erc20Values,
          tokenIds,
          tokenStatus,
          quantity,
          0,
          { value: ethValue }
        )
    ).to.be.revertedWith("ExpiredSignature()");
  });

  context("holder", async () => {
    beforeEach(async () => {
      for (var tokenId of [1, 2, 3, 4, 5, 6]) {
        mockERC721.ownerOf.whenCalledWith(tokenId).returns(user1.address);
      }

      mockERC721.ownerOf.whenCalledWith(7).returns(owner.address);

      expect(await mock.connect(user1).holdingContracts(0)).to.eq(
        mockERC721.address
      );
    });

    it("should mint a token as a holder", async () => {
      const salt = "0x" + randomBytes(32).toString("hex");
      const ethValue = ethers.utils.parseEther("1");
      const erc20Values = [];
      const tokenIds = [
        [
          BigNumber.from("1"),
          BigNumber.from("2"),
          BigNumber.from("3"),
          BigNumber.from("4"),
          BigNumber.from("5"),
          BigNumber.from("6"),
        ],
      ];
      const tokenStatus = BigNumber.from("0");
      const quantity = BigNumber.from("1");

      const signature = signMintRequest(
        user1.address,
        salt,
        ethValue,
        erc20Values,
        tokenIds,
        tokenStatus,
        quantity,
        defaultExpireTime
      );

      await expect(
        mock
          .connect(user1)
          .mint(
            signature,
            salt,
            ethValue,
            erc20Values,
            tokenIds,
            tokenStatus,
            quantity,
            defaultExpireTime,
            { value: ethValue }
          )
      ).to.emit(mock, "Transfer");
    });

    it("should fail to mint a token as a non holder", async () => {
      const salt = "0x" + randomBytes(32).toString("hex");
      const ethValue = ethers.utils.parseEther("1");
      const erc20Values = [];
      const tokenIds = [[BigNumber.from("7")]];
      const tokenStatus = BigNumber.from("0");
      const quantity = BigNumber.from("1");

      const signature = signMintRequest(
        user1.address,
        salt,
        ethValue,
        erc20Values,
        tokenIds,
        tokenStatus,
        quantity,
        defaultExpireTime
      );

      await expect(
        mock
          .connect(user1)
          .mint(
            signature,
            salt,
            ethValue,
            erc20Values,
            tokenIds,
            tokenStatus,
            quantity,
            defaultExpireTime,
            { value: ethValue }
          )
      ).to.be.revertedWith("HoldingsFailed()");
    });
  });
  
});
