const { ethers } = require("hardhat");

const BigNumber = ethers.BigNumber;

const erc20Abi = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)"
];

const erc721Abi = [
  "function balanceOf(address _owner) external view returns (uint256)",
  "function ownerOf(uint256 _tokenId) external view returns (address)"
];

var mintContract;

function assert(cond, error = "error") {
  if (!cond) throw error;
}

function bnToNum(val, decimal = 18) {
  const exp = BigNumber.from("10").pow(decimal);
  return BigNumber.from(val).div(exp).toNumber();
}

function numToBn(val, decimal = 18) {
  const exp = BigNumber.from("10").pow(decimal);
  return BigNumber.from(val).mul(exp);
}

async function verifyMint(config, wallet, ethValue, erc20Values, tokenIds, tokenStatus, quantity) {

  let totalHolding = 0;

  // Validate Accessibility
  if (config.access.whitelist) {
    assert(config.access.whitelist.indexOf(wallet) >= 0, "Access check: Address not whitelisted");
  }
  if (config.access.holdings) {
    assert (config.access.holdings.length === tokenIds.length, "Access check: Holding array length mismatches");
    for (let i = 0; i < config.access.holdings.length; i++) {
      const holding = config.access.holdings[i];
      assert(await validateHoldings(holding.address, wallet), "Access check: Invalid token holdings");

      const balance = tokenIds[i].length;
      assert(balance >= holding.minimumBalance, "Access check: Insufficient holding balance");

      totalHolding += balance;
    }
  }

  // Validate Limit
  if (config.limit.perTx) {
    assert(quantity <= config.limit.perTx, "Limit check: Quantity exceeds limit per tx");
  }
  if (config.limit.perWallet) {
    const balance = Number(await mintContract.balanceOf(wallet));
    assert(balance + quantity <= config.limit.perWallet, "Limit check: Quantity exceeds limit per wallet");
  }
  if (config.limit.perHolding) {
    const balance = Number(await mintContract.balanceOf(wallet));
    assert(balance + quantity <= config.limit.perHolding * totalHolding, "Limit check: Quantity exceeds limit for holding");
  }

  // Validate Payment
  if (config.payment.erc20Tokens && config.payment.methods) {
    assert(
      validatePayment(config.payment.erc20Tokens, config.payment.methods, wallet, ethValue, erc20Values),
      "Payment Check: Bad payment"
    );
  }
}

async function validatePayment(erc20Tokens, methods, wallet, ethValue, erc20Values) {
  const ethBalance = bnToNum(await ethers.provider.getBalance(wallet));
  const erc20Balances = [];

  let i, j;

  assert(erc20Tokens.length === erc20Values.length, "Payment check: ERC20 array length mismatches");
  for (j = 0; j < erc20Tokens.length; j++) {
    const erc20 = await ethers.getContractAt(erc20Abi, erc20Tokens[j].address);
  
    const erc20Balance = bnToNum(await erc20.balanceOf(wallet));
    erc20Balances.push(erc20Balance);
  }

  for (i = 0; i < methods.length; i++) {    
    if (ethValue !== methods[i].ethValue || ethBalance < ethValue)
      continue;

    for (j = 0; j < erc20Tokens.length; j++) {
      if (erc20Values[j] !== methods[i].erc20Values[j] || erc20Balances[j] < erc20Values[j])
        break;
    }

    if (j === erc20Tokens.length)
      return true;
  }

  return false;
}

async function validateHoldings(erc721Address, wallet, tokenIds) {
  const erc721 = await ethers.getContractAt(erc721Abi, erc721Address);
  for (let i = 0; i < tokenIds.length; i++) {
    const owner = await erc721.ownerOf(tokenIds[i])
    if(owner !== wallet)
      return false;
  }
  return true;
}

function setMintingContract(_mintingContract) {
  mintContract = _mintingContract;
}

module.exports = {
  verifyMint,
  setMintingContract
}