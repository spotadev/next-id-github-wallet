# README

**NOTE:**  Update 30/01/2024 This code is not complete. We are still working on it. Elgar & JD.

## What is this project about?

Next.id has API which allow you to associate social medial handles with a Decentralised ID (DID).

This is example code showing how to associate a github social media handle with a next.id DID.

Note next.id calls your DID an avatar.

This example uses Meta Mask wallet to do the required signing so that the user does not need to
manage their own private key.

The public key is recovered from meta mask using the viem library.


So the user steps are:

(i) Paste github handle into the box

(ii) Press Next

(iv) Meta Mask will pop up a couple of times asking to sign stuff

(v) There are cut down repositories in github called gists.  The GUI generates a suitably named
    json file the user can save to their drive and upload to the gist repository.

(vi) Once the file is uploaded a number corresponding to the gist is pasted in a form by the user
     to validate that the wallet address user also is the one controlling the gist.  This verifies
     that the DID includes the github handle.

  If all is well the user is shown a message that the github handle was added to their DID.

  Else you will be shown an error message.

## Screen shots

@todo

## Instructions

### Copy env.local.sample

Copy env.local.sample to env.local

Go to:

  https://cloud.walletconnect.com/sign-in

Get your project id and set it in the REACT_APP_WALLET_CONNECT_PROJECT_ID

So YOUR env.local will look something like:

    REACT_APP_ENVIRONMENT=local.env
    REACT_APP_WALLET_CONNECT_PROJECT_ID=ed0555b91e26b121d6a6145437c7b857
    REACT_APP_PROOF_SERVICE_BASE_URL=https://proof-service.nextnext.id

### Install Meta Mask

Install Meta Mask in your browser:

  https://metamask.io/download/

### Add polygonMumbai to Meta Mask

If you do not already have polygonMumbai configured in your MetaMask

In meta mask:

  click 3 dots
  Go to Settings
  Go to Networks
  Click Add Network

Configure as follows:

    Network Name:        Polygon Mumbai Testnet
    New RPC Url:         https://rpc.ankr.com/polygon_mumbai
    Chain ID:            80001
    Currency Symbol:     MATIC
    Block explorer URL:  https://mumbai.polygonscan.com/

### Build and Run

npm install

npm run start

Open in browser:

  http://localhost:3000/

### Build and run docker image

```sh
docker build -t next-id-github-wallet:latest .
docker run --rm -p8080:80 next-id-github-wallet:latest

# Visit http://127.0.0.1:8080
```

### Browser instructions

@todo

## Example Payloads

### Getting Payload

@todo

## How to contact the owner of this repository

### By email

You can contact JD by email:

  zzzzjohn.charles.dickerson@gmail.com

(Remove zzzz from email)

### Via Github discussion

  https://github.com/spotadev/next-id-wallet/discussions


### Via Issue on Github

JD's github handle is:

javaspeak


## Do you want to get involved?

JD is busy integrating next.id DID technology with UTU Trust.

JD is building a next.id DID management standalone react app which allows end users to manage their next.id DIDs.

That project is here:

https://github.com/spotadev/utu-endorse-nextid

---

JD is also building DID and Utu Trust into a social media platform which explores:

* filtering comments by next.id and trust
* user based self censorship

The social media platform has 2 variants:

* chrome extension
* one page app

---

You can also get involved with UTU Trust.  UTU Trust has bounty programmes for involving the
community.

---

If you are interested in any of the above please contact me.

Thank you

JD
