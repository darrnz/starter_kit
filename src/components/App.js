import React, { Component} from 'react';
import Web3 from 'web3'
import './App.css';
import Navbar from './Navbar'
import EthSwap from '../abis/EthSwap.json'
import Token from '../abis/Token.json'
import Main from './Main';


class App extends Component {


  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }


  async loadBlockchainData () {
    const web3 = window.web3 

    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })

    const ethBalance = await web3.eth.getBalance(this.state.account)
    this.setState({ ethBalance })

    //Load Token  
    //creando una version del SMC en JS
    //const abi= Token.abi ///como trabaja el SMC 
    const networkId = await web3.eth.net.getId() ///obtener la network a la que estmoa conectados
    const tokenData = Token.networks[networkId]
    if(tokenData) { //verifica a que networl estamos coenctados
        const token = new web3.eth.Contract(Token.abi, tokenData.address) //version JS del contrato
        this.setState({ token })

        //feth el balance --> balanc del user
        let tokenBalance = await token.methods.balanceOf(this.state.account).call() //el call (lee info) fechea informacion de la BC
        this.setState({ tokenBalance: tokenBalance.toString() })
      } else {
        window.alert('Token contract not deployed to detected network')
    }
    
    //Load EthSwp contract 
    //creando una version del SMC en JS
    const ethSwapData = EthSwap.networks[networkId]
    if(ethSwapData) { //verifica a que networl estamos coenctados
        const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapData.address) //version JS del contrato
        this.setState({ ethSwap })
      } else {
        window.alert('EthSwap contract not deployed to detected network')
    }
    this.setState({ loading: false })
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  buyTokens = (etherAmount) => {
    this.setState({ loading: true })
    this.state.ethSwap.methods.buyTokens().send(//send para que se ejecute en la BC
      { value: etherAmount, 
        from: this.state.account 
      })
      .on('transactionHash', (hash) => { //la hace asincrona
      this.setState({ loading: false })
      }) 
  }

  sellTokens = (tokenAmount) => {
    this.setState({ loading: true })
    this.state.token.methods.approve(this.state.ethSwap.address, tokenAmount)
      .send({ from: this.state.account })
      .on('transactionHash', (hash) => {
        this.state.ethSwap.methods.sellTokens(tokenAmount)
          .send({ from: this.state.account })
          .on('transactionHash', (hash)=> {
            this.setState({ loading: false })
          })
      })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      token:{},
      ethSwap:{},
      ethBalance: '0',
      tokenBalance: '0',
      loading: true
    }
  }

render() {
  let content
  if(this.state.loading) {
    content = <p id='loader' className='text-center'>Loading...</p>
  } else {
    content = <Main ethBalance={this.state.ethBalance} 
                    tokenBalance={this.state.tokenBalance}
                    buyTokens={this.buyTokens} 
                    sellTokens={this.sellTokens}
                    />
  }
  return (
      <>
        <Navbar account={this.state.account}/>

        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto " style={{maxWidth:'600px'}}>
              <div className="content mr-auto ml-auto">
                {content}         
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }
}

export default App