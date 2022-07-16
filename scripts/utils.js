const { ethers } = require("hardhat");
const moment = require("moment");

function makeERC721CallData(name, symbol) {
  let ABI = [
    "function setUp(string memory _name, string memory _symbol)"
  ];
  
  let interface = new ethers.utils.Interface(ABI);

  return interface.encodeFunctionData("setUp", [name, symbol]);
}

function signMintRequestBySigner(
  signer,
  address,
  salt,
  ethValue,
  erc20Values,
  tokenIds,
  tokenStatus,
  quantity,
  expireAt
) {

  if (expireAt == undefined) {
    expireAt = getDefaultExpireTime();
  }

  let abiEncoded = ethers.utils.defaultAbiCoder.encode(
    [
      "address",
      "bytes32",
      "uint256",
      "uint256[]",
      "uint256[][]",
      "uint256",
      "uint256",
      "uint256"
    ],
    [address, salt, ethValue, erc20Values, tokenIds, tokenStatus, quantity, expireAt]
  );
  let hash = ethers.utils.keccak256(abiEncoded);

  return signer.signMessage(ethers.utils.arrayify(hash));
}

function getDefaultExpireTime() {
  return moment().unix() + 3600;    // 1 hr
}

module.exports = {
  makeERC721CallData,
  signMintRequestBySigner,
  getDefaultExpireTime
}