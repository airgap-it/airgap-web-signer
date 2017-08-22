# AirGap.it Ethereum signer

A pure javascript ethereum signer client side offline app. Easy to review. Uses on purpose CSS only framework (bulma). Gets build with browserify.

## How To Run

For a more complete step by step installation instruction and how to do a secure transaction with AirGap Read the following [tutorial.](https://airgap.it/how-to-create-a-complete-transaction-with-airgap-tutorial/)

### 1. Install
`npm install`

### 2. Build
`npm run build`

### 3. Run
Go to the signer directory and open `index.html`

If you want to use the QR Scanner, please read the "QR Scanner" section in the caveats down below.

## Caveats

### Browser compatibility

QR Scanning is currently not supported by Safari and Internet Explorer. Please use another browser to use this feature.

### QR Scanner

Browsers do not allow html files opened with the file:// protocol to access the camera. This means you need to start a small server to serve the `index.html` file. We recommend one of the following ways:

#### Using python

```
$ python -m"SimpleHTTPServer"
```

#### Using npm

Installation:
```
$ npm i http-server -g
```

Usage:
```
$ http-server
```

## Develop
`npm run watch`

# Was this App of any help?

We appreciate a gesture of any size. In order to pay for our water, soda or beer as fuel to continue with the development.

## Bitcoin

1F7tRdARVhFSdj7Riw5c9AFiX7cDexfYa1

## Ethereum

0xc29F56Bf3f3978438dc714e83fdb57ea773ACa17