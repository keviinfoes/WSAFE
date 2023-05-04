const Migrations = artifacts.require("Migrations");
const WSAFE = artifacts.require("WSAFE");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(WSAFE);
};
