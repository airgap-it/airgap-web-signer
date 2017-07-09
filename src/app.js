(function () {

  var numberToEthereumHex = function (payload) {
    number = parseInt(payload)
    return '0x' + number.toString(16)
  }

  const validateAddress = new RegExp('^(0x)?[0-9a-fA-F]{40}$');

    window.clearSecrets = function () {
    document.getElementById('mnemonic_unlock_mnemonic').value = ""
    document.getElementById('mnemonic_unlock_passphrase').value = ""
    document.getElementById('private_key_unlock_key').value = ""
    document.getElementById('keystore_unlock_passphrase').value = ""
  }
  window.unlockWallet = function (successCallback, errorCallback) {
    try {
      switch (document.getElementById('unlock_selector').value) {
        case 'keystore_unlock':
          var reader = new FileReader()
          reader.onload = function () {
            const ethereumjsWallet = require('ethereumjs-wallet')
            try {
              const wallet = ethereumjsWallet.fromV3(JSON.parse(reader.result.toLowerCase()), document.getElementById('keystore_unlock_passphrase').value)
              successCallback(wallet)
            } catch (error) {
              errorCallback(error.message)
            }
          }
          reader.readAsText(document.getElementById('keystore_unlock_file').files[0])
          break
        case 'private_key_unlock':
          const ethereumjsWallet = require('ethereumjs-wallet')
          const wallet = ethereumjsWallet.fromPrivateKey(document.getElementById('private_key_unlock_key').value)
          successCallback(wallet)
          break
        case 'mnemonic_unlock':
          const bip39 = require('bip39')
          const hdkey = require('ethereumjs-wallet/hdkey')
          const seed = bip39.mnemonicToSeed(document.getElementById('mnemonic_unlock_mnemonic').value, document.getElementById('mnemonic_unlock_passphrase').value)
          const hdWallet = hdkey.hdkeyfromMasterSeed(seed)
          const hdNode = hdWallet.derivePath(document.getElementById('mnemonic_unlock_derivation_path').value)
          successCallback(hdNode.getWallet())
          break
      }
    } catch (error) {
      errorCallback(error.message)
    }
  }

  window.generateAndSignTransaction = function (successCallback, errorCallback) {
    try {
      window.unlockWallet(function (wallet) {
        const ethereumTx = require('ethereumjs-tx')
        const txParams = {
          nonce: numberToEthereumHex(document.getElementById('tx_nonce').value),
          gasPrice: numberToEthereumHex(document.getElementById('tx_gas_price').value),
          gasLimit: numberToEthereumHex(document.getElementById('tx_gas_limit').value),
          to: document.getElementById('tx_to_address').value,
          value: numberToEthereumHex(document.getElementById('tx_amount').value),
          data: document.getElementById('tx_data').value,
          // EIP 155 chainId - mainnet: 1, ropsten: 3
          chainId: 1
        }
        const tx = new ethereumTx(txParams)
        tx.sign(wallet.getPrivateKey())
        successCallback(tx)
      }, errorCallback)
    } catch (error) {
      errorCallback(error.message)
    }
  }

  document.getElementById('tx_to_address').onchange = function(){
    var value = document.getElementById('tx_to_address').value.toLowerCase();
    if(validateAddress.test(value)){
        document.getElementById('to_identicon').src = blockies.create({ seed: value }).toDataURL();
        document.getElementById('to_identicon').style.paddingBottom = "0";
        document.getElementById("tx_to_address").className = document.getElementById("tx_to_address").className.replace(/\is-danger\b/,'');
        document.getElementById("tx_to_address_error").style.display = 'none';
    }else{
        document.getElementById('to_identicon').src = '';
        document.getElementById('to_identicon').style.paddingBottom = "64%";
        document.getElementById('tx_to_address').className += " is-danger";
        document.getElementById("tx_to_address_error").style.display = 'inherit';
    }
  }

  // interaction used for secret providing by user
  document.getElementById('unlock_selector').onchange = function () {
    var unlock_methods = document.getElementsByClassName('unlock_method')
    for (var i = 0; i < unlock_methods.length; i++) {
      unlock_methods[i].style.display = 'none'
    }
    document.getElementById(this.value).style.display = 'block'
    document.getElementById('generate_and_sign_button').style.display = 'block'
  }

  document.getElementById('generate_and_sign_button').onclick = function () {
    window.generateAndSignTransaction(function (tx) {
      //window.clearSecrets()
      alert(tx)
    }, function (errorMessage) {
      document.getElementById('error_message').textContent = errorMessage
      document.getElementById('error_modal').classList.add('is-active')
    })
  }
})()