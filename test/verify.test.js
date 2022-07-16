const { expect } = require("chai");
const { ethers } = require("hardhat");
const { randomBytes } = require("crypto");
const { smock } = require("@defi-wonderland/smock");

const { signMintRequestBySigner, getDefaultExpireTime } = require("../scripts/utils");
const { verifyMint, setMintingContract } = require("../scripts/verify");


describe("Testing Verification", () => {

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const NFT_NAME = "Test NFT";
  const NFT_SYMBOL = "TEST";

  let owner, signer, user1;
  let mockERC721;
  let mockERC20;
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
});
