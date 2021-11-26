import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

import { Connection, SystemProgram, Transaction, clusterApiUrl } from '@solana/web3.js';
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {programs, Account} from "@metaplex/js";

const { metadata: { Metadata } } = programs;
declare global {
	interface Window {
		solana: any;
	}
}

const isPhantomInstalled = window.solana && window.solana.isPhantom

const getProvider = () => {
  if ("solana" in window) {
    const provider = window.solana;
    if (provider.isPhantom) {
      return provider;
    }
  }
  window.open("https://phantom.app/", "_blank");
};

const connection = new Connection(clusterApiUrl('mainnet-beta'));

const connectWallet = async () => {
	try {
	    const resp = await window.solana.connect();
	    return resp;
	} catch (err) {
	    // { code: 4001, message: 'User rejected the request.' }
	}
}

// create the canvas html element and attach it to the webpage[
const canvas = document.createElement("canvas");
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.id = "renderCanvas";
document.body.appendChild(canvas);

// initialize babylon scene and engine
const engine = new BABYLON.Engine(canvas, true);
console.log("GUI", GUI);

const createScene =  () => {
    const scene = new BABYLON.Scene(engine);

    /**** Set camera and light *****/
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 0, 0), null);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), null);

    // const box = BABYLON.MeshBuilder.CreateBox("box", {});
    // const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:10, height:10});

    return scene;
}

const createGuiManager = () => {
	const anchor = new BABYLON.TransformNode("");
	const manager = new GUI.GUI3DManager(scene);
  return manager;
};

const createNFTPanel = (manager, nfts) => {
  const panel = new GUI.ScatterPanel();
	const anchor = new BABYLON.TransformNode("");

  panel.margin = 0.2;
  manager.addControl(panel);
  panel.linkToTransformNode(anchor);
  panel.position.z = -1.5;

  const addButton = async function(n) {
		const button = new GUI.HolographicButton("orientation");
		panel.addControl(button);
		button.text = n.data.data.name;
		const nftData = await fetch(n.data.data.uri).then(r=>r.json());
		// console.log(nftData);
		button.imageUrl =  nftData.image;  
  	// const iconImage = new GUI.Image(n.data.data.name.replace(" ", "_") + "_icon", n.data.data.uri);
  	// iconImage.width = "20%";
  	// iconImage.stretch = GUI.Image.STRETCH_UNIFORM;
  	// iconImage.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  	// button.addControl(iconImage);
  }

  panel.blockLayout = true;
  nfts.forEach(n => {
  	console.log(n);
    addButton(n);
  });
  panel.blockLayout = false;
};


const createConnectButton = () => {
  const button1 = GUI.Button.CreateSimpleButton("wallet-button", "Connect Wallet");
  button1.width = "150px"
  button1.height = "40px";
  button1.color = "white";
  button1.cornerRadius = 20;
  button1.background = "#2222ee";
  button1.onPointerUpObservable.add(async () => {
      const wallet = await connectWallet();
      const tokens = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {programId: TOKEN_PROGRAM_ID});
      const nfts = tokens.value.filter(pt => {
      	return pt.account.data.parsed.info.tokenAmount.uiAmount == 1;
      }).map(async t => {
      	let pda;
      	try {
      		pda = await Metadata.getPDA(t.account.data.parsed.info.mint);
      	}
      	catch(err) {
      		pda = null;
      	}
      	return pda;
      }).filter(p => p);
      
      const nftResult = await Promise.all(nfts);
      const metas = await connection.getMultipleAccountsInfo(nftResult);
      const metadatas = metas.map((m,i) => {
      	return new Metadata(nftResult[i], m);
      });

     	advancedTexture.removeControl(button1); 
      createNFTPanel(manager, metadatas);
  });
  advancedTexture.addControl(button1); 
};

// call the createScene function
const scene = createScene();
const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
const manager = createGuiManager();
const walletPanel = createConnectButton();

// run the render loop
engine.runRenderLoop(function(){
    scene.render();
});
// the canvas/window resize event handler
window.addEventListener('resize', function(){
    engine.resize();
});