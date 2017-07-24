import instascan from 'instascan'
import * as blockies from './vendor/blockies/blockies'
import * as qrcode from 'qrcode/lib/browser'

(function () {
  const WEIINETHER = 1000000000000000000
  const WEIINGWEI = 1000000000

  const numberToEthereumHex = function (payload) {
    try {
      var number
      if (isNaN(payload)) {
        number = parseInt(payload)
      } else {
        number = payload
      }
      return '0x' + number.toString(16)
    } catch (e) {
      return '0x'
    }
  }

  const validateAddress = new RegExp('^(0x)?[0-9a-fA-F]{40}$')

  var scanner

  window.clearSecrets = function () {
    document.getElementById('mnemonic_unlock_mnemonic').value = ''
    document.getElementById('mnemonic_unlock_passphrase').value = ''
    document.getElementById('private_key_unlock_key').value = ''
    document.getElementById('keystore_unlock_passphrase').value = ''
  }

  // -- Important part for Review ---
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
          const hdWallet = hdkey.fromMasterSeed(seed)
          const hdNode = hdWallet.derivePath(document.getElementById('mnemonic_unlock_derivation_path').value)
          successCallback(hdNode.getWallet())
          break
      }
    } catch (error) {
      errorCallback(error.message)
    }
  }

  // -- Important part for Review ---
  window.generateAndSignTransaction = function (successCallback, errorCallback) {
    try {
      window.unlockWallet(function (wallet) {
        const ethereumTx = require('ethereumjs-tx')
        const txParams = {
          nonce: numberToEthereumHex(document.getElementById('tx_nonce').value),
          gasPrice: numberToEthereumHex(document.getElementById('tx_gas_price').value * WEIINGWEI),
          gasLimit: numberToEthereumHex(document.getElementById('tx_gas_limit').value),
          to: document.getElementById('tx_to_address').value,
          value: numberToEthereumHex(document.getElementById('tx_amount').value * WEIINETHER),
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

  window.startScan = function () {
    document.getElementById('startScan').style.display = 'none'
    document.getElementById('stopScan').style.display = 'table'
    document.getElementById('preview').style.display = 'inherit'
    scanner = new instascan.Scanner({video: document.getElementById('preview')})
    scanner.addListener('scan', function (content) {
      document.getElementById('tx_to_address').value = content
    })
    instascan.Camera.getCameras().then(function (cameras) {
      if (cameras.length > 0) {
        scanner.start(cameras[0])
      } else {
        console.error('No cameras found.')
      }
    }).catch(function (e) {
      console.error(e)
    })
  }

  window.stopScan = function () {
    document.getElementById('startScan').style.display = 'table'
    document.getElementById('stopScan').style.display = 'none'
    document.getElementById('preview').style.display = 'none'
    if (scanner) {
      scanner.stop()
      scanner = null
    }
  }

  document.getElementById('tx_to_address').onchange = function () {
    const value = document.getElementById('tx_to_address').value.toLowerCase()
    if (validateAddress.test(value)) {
      document.getElementById('to_identicon').src = blockies.toDataUrl(value)
      document.getElementById('to_identicon').style.paddingBottom = '0'
      document.getElementById('tx_to_address').className = document.getElementById('tx_to_address').className.replace(/\is-danger\b/, '')
      document.getElementById('tx_to_address_error').style.display = 'none'
    } else {
      document.getElementById('to_identicon').src = ''
      document.getElementById('to_identicon').style.paddingBottom = '64%'
      document.getElementById('tx_to_address').className += ' is-danger'
      document.getElementById('tx_to_address_error').style.display = 'inherit'
    }
  }

  // interaction used for secret providing by user
  document.getElementById('unlock_selector').onchange = function () {

    const unlock_methods = document.getElementsByClassName('unlock_method')
    for (var i = 0; i < unlock_methods.length; i++) {
      unlock_methods[i].style.display = 'none'
    }

    const requiredUnlockFields = this.getElementsByClassName('required_unlock_field')
    for (var i = 0; i < requiredUnlockFields.length; i++) {
      requiredUnlockFields[i].required = false
    }

    const thisRequiredUnlockFields = document.getElementById(this.value).getElementsByClassName('required_unlock_field')
    for (var i = 0; i < thisRequiredUnlockFields.length; i++) {
      thisRequiredUnlockFields[i].required = true
    }

    document.getElementById(this.value).style.display = 'block'
    document.getElementById('generate_and_sign_button').style.display = 'block'
  }

  document.getElementById('transaction_form').onsubmit = function (event) {
    event.preventDefault()
    window.generateAndSignTransaction(function (tx) {
      document.getElementById('from_identicon_confirm').src = blockies.toDataUrl('0x' + tx.from.toString('hex'))
      document.getElementById('from_identicon_confirm').style.paddingBottom = '0'
      document.getElementById('to_identicon_confirm').src = blockies.toDataUrl('0x' + tx.to.toString('hex'))
      document.getElementById('to_identicon_confirm').style.paddingBottom = '0'
      document.getElementById('amount_confirm').textContent = parseInt(tx.value.toString('hex'), 16) / WEIINETHER
      document.getElementById('fee_confirm').textContent = (parseInt(tx.gas.toString('hex'), 16) * parseInt(tx.gasPrice.toString('hex'), 16)) / WEIINETHER
      document.getElementById('confirm_modal').classList.add('is-active')
      qrcode.toDataURL(tx.serialize().toString('hex'), function (err, url) {
        document.getElementById('qr_holder').src = url
      })
    }, function (errorMessage) {
      document.getElementById('error_message').textContent = errorMessage
      document.getElementById('error_modal').classList.add('is-active')
    })
  }

  window.showModal = function (modalId) {
    document.getElementById(modalId).classList.add('is-active')
  }

  window.dismissModal = function (modalId) {
    document.getElementById(modalId).classList.remove('is-active')
  }

  document.getElementById('disclaimer_modal').classList.add('is-active')
})()