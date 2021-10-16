import net from 'net'
import { resolve } from 'path'
import { promises as fsp } from 'fs'
import * as AtekNet from '@atek-cloud/network'
import { fromBase32, toBase32 } from '@atek-cloud/network/dist/util.js'
import pump from 'pump'
// @ts-ignore no d.ts, screw it
import randomPort from 'random-port'
import { usage } from '../lib/cli.js'

const PROTOCOL = '/pipe/1.0.0'

export default [
  {
    name: 'bind',
    summary: `spork bind [public-key] - Bind a p2p socket as a proxy to a local or remote server.`,
    help: `spork bind [public-key] - Bind a p2p socket as a proxy to a local or remote server.
    
  If a public-key is specified, will create a "forward proxy" which listens on localhost and sends all messages to the device listening under that public key on the p2p network.

  If no public-key is specified, will create a "reverse proxy" which listens on a public key and sends all messages from the p2p network to the given host/port.

Examples:

  # Create a server at localhost:1234 that sends all messages to the device listening on bt2mq..jq
  $ spork bind bt2mqswat3s265de3geh5tgdstdkh2usf5h3peyr6qr4e6hgpvjq -p 1234

  # Listen on a new public key and send all incoming messages to localhost:4321
  $ spork bind -p 4321

Options:`,
    usage,
    options: [
      {name: 'port', abbr: 'p', help: 'The port to listen on (forward proxy) or to send traffic to (reverse proxy). Defaults to a random port.'},
      {name: 'host', abbr: 'h', help: 'The hostname to send traffic to (reverse proxy only). Defaults to localhost.'},
      {name: 'keyfile', abbr: 'k', help: 'The keypair file to identify this node. If the file doesn\'t exist, will write the generated keypair to that file. If not specified, will default to a temporary keypair.'}
    ],
    command: async (args: any) => {
      const host = args.host || 'localhost'
      const port = args.port ? Number(args.port) : await randomPortPromise()
      const remotePublicKeyB32 = args._[0]
      let keyPair = undefined

      let remotePublicKey: Buffer|undefined
      if (remotePublicKeyB32) {
        try {
          remotePublicKey = fromBase32(remotePublicKeyB32)
        } catch (e) {
          console.error('Invalid public key:', remotePublicKeyB32)
          console.error('Are you sure you entered the key correct?')
          console.error('')
          console.error(e)
          process.exit(1)
        }
      }

      if (args.keyfile) {
        const keyfilePath = resolve(args.keyfile)
        console.log('Reading keyfile at', keyfilePath)
        try {
          const str = await fsp.readFile(keyfilePath, 'utf8')
          try {
            const obj = JSON.parse(str)
            try {
              keyPair = {
                publicKey: fromBase32(obj.publicKey),
                secretKey: fromBase32(obj.secretKey)
              }
            } catch (e) {
              console.error('Failed to parse keyfile, aborting')
              console.error(e)
              process.exit(1)
            }
          } catch (e) {
            console.error('Failed to parse keyfile, aborting')
            console.error(e)
            process.exit(1)
          }
        } catch (e) {
          console.log('...File not found, creating a new keypair at that location.')
        }
        if (keyPair) {
          console.log('...Loaded keypair, public key:', toBase32(keyPair.publicKey))
        } else {
          keyPair = AtekNet.createKeypair()
          await fsp.writeFile(keyfilePath, JSON.stringify({
            publicKey: toBase32(keyPair.publicKey),
            secretKey: toBase32(keyPair.secretKey),
          }, null, 2), 'utf8')
          console.log('...Created keypair, public key:', toBase32(keyPair.publicKey))
        }
      } else {
        keyPair = AtekNet.createKeypair()
        console.log('Created temporary keypair, public key:', toBase32(keyPair.publicKey))
      }

      await AtekNet.setup()

      const node = new AtekNet.Node(keyPair)
      if (isBuffer(remotePublicKey)) {
        let conn: AtekNet.AtekSocket|undefined = undefined
        net.createServer(async (socket) => {
          if (isBuffer(remotePublicKey) && !conn) {
            try {
              conn = await node.connect(remotePublicKey)
              if (conn) {
                conn.once('close', () => {
                  conn = undefined
                })
              }
            } catch (e) {
              console.error('Failed to establish a connection over the p2p network')
              console.error(e)
              socket.destroy()
              return
            }
          }
          if (!conn) return
          try {
            const {stream} = await conn.select([PROTOCOL])
            pump(socket, stream, socket)
          } catch (e) {
            console.error('Failed to negotiate a protocol with the peer')
            console.error(e)
            socket.destroy()
            return
          }
        }).listen(port)
        console.log('')
        console.log('======================')
        console.log('Spork powers ACTIVATED')
        console.log('')
        console.log(' - Mode: forward proxy')
        console.log(` - Listening on localhost:${port}`)
        console.log(' - Proxying all traffic to', remotePublicKeyB32)
        console.log('======================')
      } else {
        await node.listen()
        node.on('connection', sock => {
          console.log('CONNECT pubkey:', sock.remotePublicKeyB32)
          sock.on('close', () => {
            console.log('CLOSE pubkey:', sock.remotePublicKeyB32)
          })
        })
        node.setProtocolHandler(PROTOCOL, (stream) => {
          const conn = net.connect({host, port})
          pump(stream, conn, stream)
        })
        console.log('')
        console.log('======================')
        console.log('Spork powers ACTIVATED')
        console.log('')
        console.log(' - Mode: Reverse proxy')
        console.log(' - Listening on', node.publicKeyB32)
        console.log(` - Proxying all traffic to ${host}:${port}`)
        console.log('======================')
      }
    }
  }
]

function isBuffer (v: any): v is Buffer {
  return Buffer.isBuffer(v)
}

function randomPortPromise (): Promise<number> {
  return new Promise(resolve => {
    randomPort(resolve)
  })
}