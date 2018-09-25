import {
  configure,
  observable,
  action,
  runInAction,
} from 'mobx';
import Web3 from 'web3';

import Identity from '../utils/Identity';
import MyTable from '../utils/MyTable';
import { PENDING_REVIEW, PENDING_ADD, VERIFIED } from '../constants/general';
import identityRegistryJson from '../build/contracts/IdentityRegistry.json';
import identityJson from '../build/contracts/Identity.json';

configure({ enforceActions: 'always' }); // don't allow state modifications outside actions

class UserStore {
  /* JSDOC: MARK START OBSERVABLE */
  @observable userModalIsShowing = false;
  @observable userModalHasBeenViewed = false;
  @observable modalPage: Number = 0;

  @observable registerModalIsShowing = false;
  @observable registerSuccessModalIsShowing = false;
  // Modal Form
  @observable verifierList: Array = ['Pikachu', 'Eevee', 'Squirtle', 'Snorlax'];
  @observable verifierSelected: String = '_placeholder_';
  @observable formTextInputValue: String = '';
  @observable formType: String = '';
  // Wallet properties
  @observable currentNetwork: String = 'Detecting Network...';
  @observable isMetaMaskLoggedIn: Boolean = false;
  // if on fixed account, use network settings from commonstore
  @observable isOnFixedAccount: Boolean = false;

  @observable fixedUserAcctNetwork: String = 'Ropsten';

  @observable metamaskAccount: String = '';
  @observable metamaskBalance: String = '';

  @observable registryContractAddr = '0x121159a9a1731fec0690ac92a448795ac3f5d97d';
  @observable identityContractAddr = '';
  @observable userAddr = '0x5d2302a476c52be84dc1a67d0927ee3fe301e1a6';
  @observable doesIdentityExist = false;
  @observable registryContract = {};
  @observable identityContract = {};
  @observable identityAddress = '';

  @observable nameClaim = '';
  @observable addressClaim = '';
  @observable socialIdClaim = '';

  @observable db = null;
  @observable nameClaimList = [];
  @observable addressClaimList = [];
  @observable socialIdClaimList = [];

  @observable accountUsedForDetectingChange = null;
  /* JSDOC: MARK END OBSERVABLE */

  constructor(rootStore) {
    this.rootStore = rootStore;

    const myDb = new MyTable('rate3', 'identity-demo');
    if (myDb.hasTable('identity-demo')) {
      myDb.getTable('identity-demo');
    } else {
      myDb.createTable();
    }
    runInAction(() => {
      this.db = myDb;
      console.log(this.db.getTable('identity-demo'));
    });
  }
  @action
  initDb() {
    const myDb = new MyTable('rate3', 'identity-demo');
    if (myDb.hasTable('identity-demo')) {
      myDb.getTable('identity-demo');
    } else {
      myDb.createTable();
    }
    runInAction(() => {
      this.db = myDb;
      console.log(this.db.getTable('identity-demo'));
    });
  }
  @action
  resetClaimLists() {
    this.nameClaimList = [];
    this.addressClaimList = [];
    this.socialIdClaimList = [];
  }
  @action
  populateClaimLists() {
    this.db.getAllNameClaims().forEach((claim) => {
      if (claim.user === this.userAddr) this.nameClaimList.push(claim);
    });
    this.db.getAllAddressClaims().forEach((claim) => {
      if (claim.user === this.userAddr) this.addressClaimList.push(claim);
    });
    this.db.getAllSocialIdClaims().forEach((claim) => {
      if (claim.user === this.userAddr) this.socialIdClaimList.push(claim);
    });
  }

  @action
  changeToMetaMaskAccount() {
    this.isOnFixedAccount = false;
    window.localStorage.setItem('accountType', 'metamast');
  }
  @action
  changeToFixedAccount() {
    this.isOnFixedAccount = true;
    window.localStorage.setItem('accountType', 'fixed');
  }

  @action
  async getUserAddr() {
    const accounts = await window.web3.eth.getAccounts();
    try {
      if (accounts.length > 0) {
        runInAction(() => {
          [this.userAddr] = accounts;
          console.log('user addr', this.userAddr);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
  createIdentity() {
    this.registryContract.methods.createIdentity().send(
      { from: this.userAddr, gas: 6000000 },
      (err, result) => {
        console.log(result);
      },
    );
  }
  getPastEvents() {
    this.registryContract.getPastEvents('NewIdentity', { fromBlock: 0, toBlock: 'latest' }, (error, events) => { console.log(events); });
  }
  checkHasIdentity() {
    this.registryContract.methods.hasIdentity(this.userAddr).call().then(console.log);
  }

  @action
  async getIdentities() {
    console.log('this.registryContract', window.registryContract);
    const hasIdentity = await this.registryContract.methods.hasIdentity(this.userAddr).call();
    let idContractAddr = '';
    if (!hasIdentity) {
      const identityAddrCreated = await this.registryContract.methods.createIdentity().send({from: this.userAddr, gas: 6000000});
      idContractAddr = identityAddrCreated;
    }
    if (hasIdentity) {
      idContractAddr = await this.registryContract.methods.identities(this.userAddr).call();
    }

    const identityContract = new window.web3.eth.Contract(identityJson.abi, idContractAddr);
    window.identityContract = identityContract;
    runInAction(() => {
      this.identityContract = identityContract;
      this.identityContractAddr = identityContract._address;
    });

    // name claim
    let nameClaims;
    let nameClaimId;
    try {
      nameClaims = await identityContract.methods.getClaimIdsByTopic(101).call();
      [nameClaimId] = nameClaims;
      console.log('nameClaimId', nameClaimId);
    } catch (err) {
      console.log(err);
    }
    try {
      const nameClaim = await identityContract.methods.getClaim(nameClaimId).call();
      runInAction(() => {
        console.log(nameClaim);
        this.nameClaim = window.web3.utils.hexToAscii(nameClaim.data);
        const nameClaimObj = new Identity(this.nameClaim, 'name', this.userAddr, this.signature, VERIFIED);
        this.nameClaimList.push(nameClaimObj);
        console.log('name claim: ', this.nameClaim);
      });
    } catch (err) {
      console.log(err);
    }

    // address claim
    let addressClaims;
    let addressClaimId;
    try {
      addressClaims = await identityContract.methods.getClaimIdsByTopic(102).call();
      [addressClaimId] = addressClaims;
      console.log('addressClaimId', addressClaimId);
    } catch (err) {
      console.log(err);
    }
    
    try {
      const addressClaim = await identityContract.methods.getClaim(addressClaimId).call();
      runInAction(() => {
        this.addressClaim = window.web3.utils.hexToAscii(addressClaim.data);
        const addressClaimObj = new Identity(this.addressClaim, 'address', this.userAddr, this.signature, VERIFIED);
        this.addressClaimList.push(addressClaimObj);
        // }
        console.log('address claim: ', this.addressClaim);
      });
    } catch (err) {
      console.log(err);
    }

    // social id claim
    let socialIdClaims;
    let socialIdClaimId;
    try {
      socialIdClaims = await identityContract.methods.getClaimIdsByTopic(103).call();
      [socialIdClaimId] = socialIdClaims;
      console.log('socialIdClaimId', socialIdClaimId);
    } catch (err) {
      console.log(err);
    }
    
    try {
      const socialIdClaim = await identityContract.methods.getClaim(socialIdClaimId).call();
      runInAction(() => {
        this.socialIdClaim = window.web3.utils.hexToAscii(socialIdClaim.data);
        const socialIdClaimObj = new Identity(this.socialIdClaim, 'socialId', this.userAddr, this.signature, VERIFIED);
        this.socialIdClaimList.push(socialIdClaimObj);
        // }
        console.log('social id claim: ', this.socialIdClaim);
      });
    } catch (err) {
      console.log(err);
    }
  }

  @action
  getIdentityContract() {
    this.registryContract.methods.identities(this.userAddr).call()
      .then((result) => {
        console.log(result);
        runInAction(() => {
          this.identityAddress = result;

          const identityContract = new window.web3.eth.Contract(identityJson.abi, this.identityAddress);
          window.identityContract = identityContract;
          this.identityContract = identityContract;
          this.identityContractAddr = identityContract._address;
        });
        
      });
  }
  @action
  addClaim(item) {
    console.log('item', item);
    const claim = item.value;
    const data = window.web3.utils.asciiToHex(claim);
    console.log('data', data);
    const addr = this.userAddr;
    const issuerAddr = this.identityContractAddr;
    let topic;
    // if (item.sss)
    if (item.type === 'name') topic = 101;
    if (item.type === 'address') topic = 102;
    if (item.type === 'socialId') topic = 103;

    const dataToSign = window.web3.utils.soliditySha3(issuerAddr, topic, data);
    console.log('dataToSign', dataToSign);
    const location = 'some location';
    let sig;
    console.log('line 197', this.userAddr);
    window.web3.eth.personal.sign(dataToSign, this.userAddr, '').then((str) => {
      sig = str;
      console.log('signature is');
      console.log(str);
      window.identityContract.methods.addClaim(topic, 1, issuerAddr, sig, data, location)
        .send({ from: this.userAddr, gas: 6000000 },
          (err, result) => {
            console.log('from addClaim callback');
            if (err) console.log(err);
            if (result) {
              console.log(result);
              this.db.deleteClaim(addr, claim);
              window.location.reload();
            }
          }
        );
    });

    console.log(sig);
  }
  web3HasMetamaskProvider() {
    return (
      (window.web3.givenProvider !== null && typeof window.web3.givenProvider !== 'undefined' &&
        window.web3.givenProvider.isMetaMask === true) ||
      (window.web3.currentProvider !== null && typeof window.web3.currentProvider !== 'undefined' &&
        window.web3.currentProvider.isMetaMask === true));
  }
  isMetaMaskEnabled() {
    console.log('isMetaMaskEnabled from userstore ');
    return (typeof window.web3 !== 'undefined' && this.web3HasMetamaskProvider());
  }

  @action
  changeFixedUserAcctNetwork(v) {
    this.fixedUserAcctNetwork = v;
  }

  @action
  listenToMetaMaskAccountChange() {
    window.web3.eth.givenProvider.publicConfigStore.on('update', (change) => {
      if (this.accountUsedForDetectingChange === null) {
        runInAction(() => {
          this.accountUsedForDetectingChange = change.selectedAddress;
        });
      } else if (this.accountUsedForDetectingChange !== change.selectedAddress) {
        window.location.reload();
      }
    });
  }
  @action
  async initMetamaskNetwork() {
    this.rootStore.finishInitNetwork = false;
    console.log('init metamask network');
    this.rootStore.commonStore.resetSetupWalletProgress();
    if (this.isOnFixedAccount) {
      this.currentNetwork = 'user is on a fixed network';
      console.log('quit init metamask coz on fixed account');
      return;
    }
    if (!this.isMetaMaskEnabled()) {
      this.currentNetwork = 'Please enable MetaMask browser extension';
      return;
    }

    this.rootStore.commonStore.completeSetupWalletProgress(0);

    let web3;
    if (window.web3.currentProvider !== null && window.web3.currentProvider.isMetaMask === true) {
      console.log('from user store: is meta mask');
      web3 = new Web3(window.web3.currentProvider);
    } else {
      web3 = new Web3(this.rootStore.browserProvider);
    }
    window.web3 = web3;
    try {
      const accounts = await web3.eth.getAccounts();
      if (accounts.length === 0) console.log('User is not logged in to MetaMask');
      if (accounts.length > 0) {
        runInAction(() => {
          this.isMetaMaskLoggedIn = true;
          [this.metamaskAccount] = accounts;
          this.rootStore.commonStore.completeSetupWalletProgress(1);
        });
      }
    } catch (err) {
      console.error('An error occurred while detecting MetaMask login status');
    }
    try {
      const networkType = await web3.eth.net.getNetworkType();
      runInAction(() => {
        switch (networkType) {
          case 'ropsten':
            this.currentNetwork = 'Ropsten';
            this.rootStore.commonStore.completeSetupWalletProgress(2);
            break;
          case 'rinkeby':
            this.currentNetwork = 'Rinkeby';
            this.rootStore.commonStore.completeSetupWalletProgress(2);
            break;
          case 'kovan':
            this.currentNetwork = 'Kovan';
            this.rootStore.commonStore.completeSetupWalletProgress(2);
            break;
          case 'private':
            this.currentNetwork = 'Private';
            this.rootStore.commonStore.completeSetupWalletProgress(2);
            break;
          default:
            this.currentNetwork = 'Other Net or';
        }
      });
    } catch (err) {
      console.error('An error occurred while detecting MetaMask network type');
    }

    try {
      const account = this.metamaskAccount;
      const balance = await web3.eth.getBalance(account);
      runInAction(() => {
        this.metamaskBalance = balance;
        if (this.metamaskBalance > 0) {
          this.rootStore.commonStore.completeSetupWalletProgress(3);
          this.rootStore.globalSpinnerIsShowing = false;
          this.rootStore.finishInitNetwork = true;
        }
      });
    } catch (err) {
      console.error('An error occurred while checking balance');
    }
  }

  getFormTextInputValue() {
    return this.formTextInputValue;
  }
  getVerifierSelected() {
    return this.verifierSelected;
  }
  getVerifierList() {
    return this.verifierList;
  }

  getModalPage() {
    return this.modalPage;
  }

  getUserModalIsShowing() {
    return this.userModalIsShowing;
  }

  getRegisterModalIsShowing() {
    return this.registerModalIsShowing;
  }
  getRegisterSuccessModalIsShowing() {
    return this.registerSuccessModalIsShowing;
  }

  @action
  openModal() {
    this.userModalIsShowing = true;
  }

  @action
  closeModal() {
    this.userModalIsShowing = false;
    console.log(this.userModalIsShowing);
  }

  @action
  handleModalIndexChange(step) {
    this.modalPage = step;
  }

  @action
  handleModalNext() {
    this.modalPage += 1;
  }
  @action
  handleModalBack() {
    this.modalPage -= 1;
  }
  @action
  openRegisterModal(name) {
    this.registerModalIsShowing = true;
    this.formType = name;
  }
  @action
  closeRegisterModal() {
    this.registerModalIsShowing = false;
  }
  @action
  openRegisterSuccessModal() {
    this.registerSuccessModalIsShowing = true;
  }
  @action
  closeRegisterSuccessModal() {
    this.registerSuccessModalIsShowing = false;
  }
  @action
  setVerifierSelected(v) {
    this.verifierSelected = v;
  }
  @action
  setFormTextInputValue(v) {
    this.formTextInputValue = v;
  }
  @action
  setFormType(type) {
    this.formType = type;
  }
}
export default UserStore;
