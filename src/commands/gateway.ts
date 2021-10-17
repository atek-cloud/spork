import http from 'http'
import * as AtekNet from '@atek-cloud/network'
import { fromBase32 } from '@atek-cloud/network/dist/util.js'
import { usage } from '../lib/cli.js'
import { randomPortPromise, readKeyFile } from '../lib/util.js'

export default [
  {
    name: 'gateway',
    summary: `spork gateway - Create an HTTP server that routes to p2p sockets by subdomain.`,
    help: `spork gateway - Create an HTTP server that routes to p2p sockets by subdomain.
    
  Listens on localhost and routes http://{pubkey}.localhost to the given p2p socket.

Examples:

  # Create a gateway at localhost:8080
  $ spork gateway -p 8080

Options:`,
    usage,
    options: [
      {name: 'port', abbr: 'p', help: 'The port to listen on (forward proxy) or to send traffic to (reverse proxy). Defaults to a random port.'},
      {name: 'keyfile', abbr: 'k', help: 'The keypair file to identify this node. If the file doesn\'t exist, will write the generated keypair to that file. If not specified, will default to a temporary keypair.'}
    ],
    command: async (args: any) => {
      const port = args.port ? Number(args.port) : await randomPortPromise()
      const keyPair = await readKeyFile(args.keyfile)

      await AtekNet.setup()

      const node = new AtekNet.Node(keyPair)
      const agent = AtekNet.http.createAgent(node)

      const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
        const hostparts = (req.headers.host || '').split('.')
        if (hostparts.length !== 2) {
          return res.writeHead(200).end('SPORK GATEWAY POWERS ACTIVATED')
        }
        const remotePublicKeyB32 = hostparts[0]
        try {
          fromBase32(remotePublicKeyB32)
        } catch (e: any) {
          return res.writeHead(404).end(`Subdomain is not a public key\n\n${e.toString()}`)
        }

        const proxyReq = http.request(`http://${remotePublicKeyB32}.atek.app${req.url}`, {
          agent,
          headers: req.headers,
        }, (proxyRes: http.IncomingMessage) => {
          res.writeHead(proxyRes.statusCode || 0, proxyRes.statusMessage, proxyRes.headers)
          proxyRes.pipe(res)
        })
        req.pipe(proxyReq)
        proxyReq.on('error', (e: any) => {
          res.writeHead(500).end(`Failed to route request\n\n${e.toString()}`)
        })
      })
      server.listen(port)

      console.log('')
      console.log('======================')
      console.log('Spork powers ACTIVATED')
      console.log('')
      console.log(' - Mode: Gateway')
      console.log(` - Listening on localhost:${port}`)
      console.log(' - Proxing by subdomain to p2p sockets')
      console.log('======================')
    }
  }
]
