import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import axios from 'axios';
import appStyle from '../App.module.css';
import { hashMessage, recoverPublicKey } from 'viem';
import { signMessage } from '@wagmi/core'
import { ec as EC } from 'elliptic';

export interface PostContent {
  default: string;
  en_US: string;
  zh_CN: string;
}

export interface ProofPayloadResponse {
  post_content: PostContent;
  sign_payload: string;
  uuid: string;
  created_at: string;
}

export interface Platform {
  name: string;
  url: string;
}

export interface Proof {
  platform: string;
  identity: string;
  created_at: string;
  last_checked_at: string;
  is_valid: boolean;
  invalid_reason: string;
}

export interface IdsItem {
  avatar: string;
  persona: string;
  activated_at: string;
  last_arweave_id: String;
  proofs: Proof[];
}

export interface Pagination {
  total: number;
  per: number;
  current: number;
  next: number;
}

export default interface AvatarStatusResponse {
  pagination: Pagination;
  ids: IdsItem[];
}

export function Home() {
  const [githubHandle, setGithubHandle] = useState<string | null>();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [proofPayloadResponse, setProofPayloadResponse] = useState<ProofPayloadResponse | null>();
  const [gistFileContent, setGistFileContent] = useState<string | null>();
  const [gistFileName, setGistFileName] = useState<string | null>();
  const [gistId, setGistId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>();
  const [verifiedProof, setVerifiedProof] = useState<boolean>(false);
  const [avatarStatusResponse, setAvatarStatusResponse] = useState<AvatarStatusResponse | null>(null);

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open, close } = useWeb3Modal();

  const getProofPayloadResponse =
    async (githubHandle: string, publicKey: string): Promise<ProofPayloadResponse> => {
      const baseUrl = process.env.REACT_APP_PROOF_SERVICE_BASE_URL;

      if (!baseUrl) {
        throw new Error('Could not read env properties');
      }

      const url = baseUrl + '/v1/proof/payload';

      let config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const request =
      {
        "action": "create",
        "platform": "github",
        "identity": githubHandle,
        "public_key": publicKey
      };

      let { data, status } =
        await axios.post<ProofPayloadResponse>(url, request, config);

      if (status === 200) {
        return data;
      } else if (status === 404) {
        throw new Error('Not Found: 404');
      } else {
        throw new Error('Fauled to get ProofPayloadResponse: ' + status);
      }
    }

  const getNextIdProofPayload =
    async (
      githubHandle: string
    ): Promise<ProofPayloadResponse> => {

      const message = 'next.id rocks';
      const signature = await signMessage({ message: message });
      const messageHash = hashMessage(message);
      console.log('message', message);
      console.log('signature', signature);
      console.log('messageHash', messageHash);

      const recoveredPublicKey = await recoverPublicKey({
        hash: messageHash,
        signature: signature
      })

      setPublicKey(recoveredPublicKey);

      const proofPayloadResponse: ProofPayloadResponse =
        await getProofPayloadResponse(githubHandle, recoveredPublicKey);

      console.log('recoveredPublicKey', recoveredPublicKey);
      console.log('proofPayloadResponse', proofPayloadResponse);
      return proofPayloadResponse;
    }

  const next = async () => {
    if (githubHandle) {
      const proofPayloadResponse: ProofPayloadResponse =
        await getNextIdProofPayload(githubHandle);

      console.log('proofPayloadResponse', proofPayloadResponse);
      const postContent = proofPayloadResponse.post_content;
      console.log('postContent', postContent);
      let _default: string = postContent.default;
      console.log('_default', _default);
      setProofPayloadResponse(proofPayloadResponse);

      // Steps - we need to recover the public key so we can get the file name of the json file
      const message = proofPayloadResponse.sign_payload;
      const hexSignature = await signMessage({ message: message });
      const messageHash = hashMessage(message);

      const uncompressedRecoveredPublicKey = await recoverPublicKey({
        hash: messageHash,
        signature: hexSignature
      })

      const base64Signature = Buffer.from(hexSignature.slice(2), 'hex').toString('base64');
      _default = _default.replace('%SIG_BASE64%', base64Signature);
      setGistFileContent(_default);

      console.log('message', message);
      console.log('hexSignature', hexSignature);
      console.log('messageHash', messageHash);
      console.log('uncompressedRecoveredPublicKey', uncompressedRecoveredPublicKey);
      const uncompressedRecoveredPublicKeyWithoutPrefix = uncompressedRecoveredPublicKey.slice(2);
      const ec = new EC('secp256k1');
      const pubPoint = ec.keyFromPublic(uncompressedRecoveredPublicKeyWithoutPrefix, 'hex').getPublic();

      // Get the compressed public key as a hex string.
      const compressedPublicKey = pubPoint.encodeCompressed('hex');
      console.log('compressedPublicKey', compressedPublicKey);
      const _gistFileName = '0x' + compressedPublicKey + '.json';
      setGistFileName(_gistFileName);
    }
  }

  const verifyProof = async (
    githubHandle: string,
    publicKey: string,
    numberAtEndGistUrl: string,
    uuid: string
  ): Promise<void> => {

    if (!gistFileContent || !gistFileName || !githubHandle || !publicKey || !proofPayloadResponse) {
      const errrorMessage =
        'Expecting all of these to be populated: ' +
        `gistFileContent: ${gistFileContent}, ` +
        `gistFileName: ${gistFileContent}, ` +
        `githubHandle: ${githubHandle}, publicKey: ${publicKey}` +
        `proofPayloadResponse: ${proofPayloadResponse}`;

      throw new Error(errrorMessage);
    }

    const baseUrl = process.env.REACT_APP_PROOF_SERVICE_BASE_URL;

    if (!baseUrl) {
      throw new Error('Could not read env properties');
    }

    const url = baseUrl + '/v1/proof';

    let config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const createdAt: string = proofPayloadResponse.created_at;

    const request =
    {
      "action": "create",
      "platform": "github",
      "identity": githubHandle,
      "public_key": publicKey,
      "proof_location": numberAtEndGistUrl,
      "extra": {},
      "uuid": uuid,
      "created_at": createdAt
    };

    let { status } = await axios.post<{}>(url, request, config);

    if (status === 201) {
      console.log('Verified');
    } else {
      throw new Error(`Failed to verify proof. Status: ${status}`);
    }
  }

  const getAvatarStatus = async () => {
    const baseUrl = process.env.REACT_APP_PROOF_SERVICE_BASE_URL;
    const platform = 'github';
    const exact = true;
    const url = `${baseUrl}/v1/proof?platform=${platform}&identity=${githubHandle}&exact=${exact}`;

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    let { data, status } = await axios.get<AvatarStatusResponse>(url, config);
    const avatarStatusResponse: AvatarStatusResponse = data;

    if (status !== 200) {
      throw new Error(`Failed to get AvatarStatusResponse. Status: ${status}`);
    }

    setAvatarStatusResponse(avatarStatusResponse);
  }

  const verify = async () => {
    if (gistId) {
      if (!proofPayloadResponse || !githubHandle || !publicKey) {
        const errrorMessage =
          'Expecting all of these to be populated: ' +
          `proofPayloadResponse: ${proofPayloadResponse}, ` +
          `githubHandle: ${githubHandle}, publicKey: ${publicKey}`;

        throw new Error(errrorMessage);
      }

      const uuid = proofPayloadResponse?.uuid;

      try {
        await verifyProof(githubHandle, publicKey, gistId, uuid);
        setVerifiedProof(true);
      }
      catch (error) {
        setVerifiedProof(false);
        setErrorMessage(
          'The gist did not pass validation. The github username was not added to your next.id DID');
      }
    }
  }

  const clear = () => {
    setGithubHandle(null);
    setAvatarStatusResponse(null);
    setGistFileContent(null);
    setGistFileName(null);
    setPublicKey(null);
    setGistId('');
    setErrorMessage(null);
  }

  const getConnectWalletJSX = () => {
    if (isConnected) {
      return (
        <div>
          <p style={{ fontWeight: 'bold', paddingTop: '20px' }}>
            <h3>Wallet Instructions</h3>
          </p>
          <div style={{ fontWeight: 'bold' }}>Wallet Address:</div>
          <div style={{ paddingTop: '20px' }}>
            ${address}
          </div>
          <div style={{ paddingTop: '20px' }}>
            <button className={appStyle.button}
              onClick={() => disconnect()}>Disconnect Wallet</button>
          </div >
        </div >
      );
    }
    else {
      return (
        <div>
          <p style={{ fontWeight: 'bold', paddingTop: '20px' }}>
            <h3>Wallet Instructions</h3>
          </p>
          <p>
            Click on the button below to connect your Meta Mask wallet:
          </p>
          <div>
            Connect to Wallet - PENDING
            &nbsp;&nbsp;
            <button className={appStyle.button}
              onClick={() => open()}>Connect / Disconnect Wallet</button>
            &nbsp;&nbsp;
            <button className={appStyle.button}
              onClick={() => open({ view: 'Networks' })}>Select Network</button>
          </div>
        </div>
      )
    }
  }

  const getDIDAddedJSX = () => {
    if (verifiedProof) {
      return (
        <p>
          Your github handle has been added to your next.id DID
        </p>
      );
    } else if (errorMessage) {
      return (
        <div style={{ color: 'red', paddingTop: '20px' }}>{errorMessage}</div>
      );
    }
    else {
      return '';
    }
  }

  const getShowGistInfoJSX = () => {
    if (!!gistFileName && !!gistFileContent) {
      return (
        <>
          <p style={{ fontWeight: 'bold', paddingTop: '20px' }}>
            <h3>Copy / Paste Details:</h3>
          </p>
          <div>
            Gist Filename:
          </div>
          <div style={{ marginTop: '20px', backgroundColor: 'lightgreen', wordWrap: 'break-word', padding: '10px' }}>
            <pre>
              {gistFileName}
            </pre>
          </div>
          <div style={{ paddingTop: '20px' }}>
            Gist File Content:
          </div>
          <div style={{ marginTop: '20px', backgroundColor: 'lightgreen', wordWrap: 'break-word', padding: '10px' }}>
            <pre style={{ tabSize: '2', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
              {gistFileContent}
            </pre>
          </div>
        </>
      )
    }
    else {
      return '';
    }
  }

  const getVerifyJSX = () => {
    if (!!gistFileName && !!gistFileContent) {
      return (
        <>
          <p style={{ fontWeight: 'bold', paddingTop: '20px' }}>
            <h3>Verify Instructions:</h3>
          </p>
          <div>
            Login to github.  Then got to gist.github.com and click the + to add a new gist.
            <br /><br />
            In the "gist description box" type something like: "next.id validaion"
            <br /><br />
            In the "filename including extension box" copy the gist filename from above.
            <br /><br />
            In the content box paste the gist content from above.
            <br /><br />
            Select the "Create Public Gist" option when creating the gist.
            <br /><br />
            Once you have created the gist you will see a hash in the url of the gist.
            Copy that hash into "Gist hash" box below and press the Verify button.  You will be
            told if the github handle was successfully added to the DID or not.
          </div>
          <div style={{ paddingTop: '20px' }}>
            <input
              style={{ width: '250px' }}
              className={appStyle.input}
              placeholder="Gist Hash"
              value={gistId} onChange={(event) => setGistId(event.target.value)} />
            &nbsp;&nbsp;
            <button className={appStyle.button} disabled={githubHandle?.length == 0}
              onClick={verify}>Verify</button>
          </div>
        </>
      )
    } else {
      return '';
    }
  }

  const getGithubJSX = () => {
    if (isConnected) {
      return (
        <>
          <p style={{ fontWeight: 'bold', paddingTop: '20px' }}>
            <h3>Enter Github handle Instructions:</h3>
          </p>
          <div>
            Github has a cut down version of Github repositories called Gist Repositories.
          </div>
          <div style={{ paddingTop: '20px' }}>
            See here for further information about Gist Repositories:
            <br /><br />
            <a href="https://www.youtube.com/watch?v=xl004KsPKGE" target="_new">
              Youtube: What is GitHub Gist? Let's learn!
            </a>
            <br /><br />
            <a href="https://gist.github.com/" target="_new">https://gist.github.com/</a>
          </div >
          <div style={{ paddingTop: '20px' }}>
            Enter you Github Handle into the box and then first all click the "Check if DID exists"
            to see if you have already added your github handle to a DID.  If you have not click the
            Download button to generate a json file which you can add to a gist repository.  Note
            you will be prompted by your wallet to sign content.
          </div>
          <div style={{ paddingTop: '20px' }}>
            <input
              className={appStyle.input}
              placeholder="Enter: Github Handle (mandatory)"
              value={githubHandle ? githubHandle : ''}
              onChange={(event) => setGithubHandle(event.target.value)} />
            &nbsp;
            <button disabled={githubHandle?.length == 0} className={appStyle.button}
              onClick={getAvatarStatus}>Check if DID exists</button>
            &nbsp;
            <button className={appStyle.button} onClick={next}>Next</button>
            &nbsp;
            <button disabled={githubHandle?.length == 0} className={appStyle.button}
              onClick={clear}>Clear</button>
          </div>
          {getAvatarStatusJSX()}
          {getShowGistInfoJSX()}
          {getVerifyJSX()}
          {getDIDAddedJSX()}
        </>
      )
    } else {
      return '';
    }
  }

  const getAvatarStatusJSX = () => {
    if (avatarStatusResponse && avatarStatusResponse.ids.length > 0) {
      return (
        <div>
          <div style={{ fontWeight: 'bold', paddingBottom: '10px', paddingTop: '20px' }}>DID details:</div>
          {
            avatarStatusResponse.ids.map((id, index) => (
              <div key={id.avatar} style={{ padding: '10px', backgroundColor: index % 2 === 0 ? 'lightgreen' : 'lightblue' }}>
                <div>
                  <span style={{ display: 'inline-block', width: '150px' }}>Avatar:</span>
                  <span>{id.avatar}</span>
                </div>
                <div>
                  <span style={{ display: 'inline-block', width: '150px' }}>Persona:</span>
                  <span>{id.persona}</span>
                </div>
                <div>
                  <span style={{ display: 'inline-block', width: '150px' }}>Activated at:</span>
                  <span>{id.activated_at}</span>
                </div>
                {
                  id.proofs.map(
                    (proof, index2) => (
                      <div key={proof.identity} style={{ marginTop: '10px', padding: '10px', border: '1px solid black', backgroundColor: index2 % 2 === 0 ? 'orange' : 'yellow' }}>
                        <div>
                          <span style={{ display: 'inline-block', width: '150px' }}>Proof created at:</span>
                          <span>{proof.created_at}</span>
                        </div>
                        <div>
                          <span style={{ display: 'inline-block', width: '150px' }}>Handle:</span>
                          <span>{proof.identity}</span>
                        </div>
                        <div>
                          <span style={{ display: 'inline-block', width: '150px' }}>Platform:</span>
                          <span>{proof.platform}</span>
                        </div>
                        <div>
                          <span style={{ display: 'inline-block', width: '150px' }}>Is Valid:</span>
                          <span>{String(proof.is_valid)}</span>
                        </div>
                        <div>
                          <span style={{ width: '200px' }}>Invalid Reason:</span>
                          <span>{proof.invalid_reason}</span>
                        </div>
                        <div>
                          <span style={{ display: 'inline-block', width: '150px' }}>Last Checked at:</span>
                          <span>{proof.last_checked_at}</span>
                        </div>
                      </div>
                    )
                  )
                }
              </div>
            ))
          }
        </div>
      );
    }
    else if (avatarStatusResponse) {
      return (
        <>
          <div style={{ fontWeight: 'bold', paddingBottom: '10px', paddingTop: '20px' }}>DID details:</div>
          <div style={{ backgroundColor: 'lightgreen', color: 'red', padding: '10px' }}>
            No Avatar / Decentralised (DID) found.
            <br /><br />
            You can go ahead and click the "Next" button above.
          </div>
        </>
      );
    }
    else {
      return '';
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Next.id DID management for adding Github handle to Next.id DID</h2>
      <h3>Intro</h3>
      <p>
        This code uses Meta Mask so make sure you have installed it.
      </p>
      <p>
        This code also uses the PolygonMumbai (testnet) Network so make sure you have it configured
        in your metamask.
      </p>
      <p>
        The README.md file has instructions on how to do the above. It also has instructions
        on how to configure your .env.local file and how do get an ID needed for connecting
        to your wallet.
      </p>
      {getConnectWalletJSX()}
      {getGithubJSX()}
    </div>
  );
}