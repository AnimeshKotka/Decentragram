import React, { Component } from "react";
import Web3 from "web3";
import Identicon from "identicon.js";
import "./App.css";
import Decentragram from "../abis/Decentragram.json";
import Navbar from "./Navbar";
import Main from "./Main";
const ipfsClient = require("ipfs-http-client");
const { Buffer } = require("buffer");
const Moralis = require("moralis").default;
require("dotenv").config();

//Declare IPFS

// const auth =
//   "Basic  " + Buffer.from(projectId + ":" + projectSecret).toString("base64");
// const ipfs = ipfsClient({
//   host: "ipfs.infura.io",
//   port: 5001,
//   protocol: "https",
//   headers: {
//     authorization: auth,
//   },
// }); // leaving out the arguments will default to these values

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  constructor(props) {
    super(props);
    this.state = {
      account: "",
      decentragram: null,
      images: [],
      loading: true,
    };
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    // console.log(accounts);
    this.setState({ account: accounts[0] });
    // Network ID
    const networkId = await web3.eth.net.getId();
    const networkData = Decentragram.networks[networkId];
    if (networkData) {
      const decentragram = new web3.eth.Contract(
        Decentragram.abi,
        networkData.address
      );
      this.setState({ decentragram });
      const imagesCount = await decentragram.methods.imageCount().call();
      this.setState({ imagesCount });
      // Load images
      for (var i = 1; i <= imagesCount; i++) {
        const image = await decentragram.methods.images(i).call();
        this.setState({
          images: [...this.state.images, image],
        });
      }
      // Sort images. Show highest tipped images first
      this.setState({
        images: this.state.images.sort((a, b) => b.tipAmount - a.tipAmount),
      });
      this.setState({ loading: false });
    } else {
      window.alert("Decentragram contract not deployed to detected network.");
    }
  }

  captureFile = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);

    reader.onloadend = () => {
      this.setState({ buffer: Buffer.from(reader.result).toString("base64") });
      // console.log("buffer", this.state.buffer);
    };
  };

  uploadImage = async (description) => {
    console.log("Submitting file to ipfs...");
    const abi = [
      {
        path: `moralis/picture${this.state.images.length}.jpg`,
        content: this.state.account,
      },
    ];

    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
    const response = await Moralis.EvmApi.ipfs.uploadFolder({
      abi,
    });
    console.log(this.state.decentragram.methods.imageCount, response.result);
    if (response.result[0]) {
      this.setState({ loading: true });
      this.state.decentragram.methods
        .uploadImage(response.result[0].path, description)
        .send({ from: this.state.account })
        .on("transactionHash", (hash) => {
          this.setState({ loading: false });
        });
    }

    // ipfs.add(this.state.buffer, (error, result) => {
    //   console.log("Ipfs result", result);
    //   if (error) {
    //     console.error(error);
    //     return;
    //   }

    //   this.setState({ loading: true });
    //   this.state.decentragram.methods
    //     .uploadImage(result[0].hash, description)
    //     .send({ from: this.state.account })
    //     .on("transactionHash", (hash) => {
    //       this.setState({ loading: false });
    //     });
    // });
  };

  async tipImageOwner(id, tipAmount) {
    // this.setState({ loading: true });
    await this.state.decentragram.methods
      .tipImageOwner(id)
      .send({ from: this.state.account, value: tipAmount })
      .on("transactionHash", (hash) => {
        this.setState({ loading: false });
      });
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        {this.state.loading ? (
          <div id="loader" className="text-center mt-5">
            <p>Loading...</p>
          </div>
        ) : (
          <Main
            images={this.state.images}
            captureFile={this.captureFile}
            uploadImage={this.uploadImage}
            tipImageOwner={this.tipImageOwner}
          />
        )}
      </div>
    );
  }
}

export default App;
