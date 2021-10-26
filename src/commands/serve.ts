import http from 'http'
import path from 'path'
import net from 'net'
import pump from 'pump'
import ansi from 'ansi-escapes'
import serve from 'serve-handler'
import * as AtekNet from '@atek-cloud/network'
import { usage } from '../lib/cli.js'
import { randomPortPromise, readKeyFile } from '../lib/util.js'

export default [
  {
    name: 'serve',
    summary: `spork serve {path} - Serve a folder as a static HTTP site over p2p sockets.`,
    help: `spork serve {path} - Serve a folder as a static HTTP site over p2p sockets.
    
  Creates an HTTP server that hosts the given folder over p2p sockets.

Examples:

  # Host the current folder
  $ spork serve .

Options:`,
    usage,
    options: [
      {name: 'port', abbr: 'p', help: 'The port to listen on. Defaults to a random port.'},
      {name: 'keyfile', abbr: 'k', help: 'The keypair file to identify this node. If the file doesn\'t exist, will write the generated keypair to that file. If not specified, will default to a temporary keypair.'}
    ],
    command: async (args: any) => {
      let servePath = args._[0]
      if (!servePath) {
        console.error('Defaulting to current path')
        servePath = '.'
      }
      servePath = path.resolve(servePath)
      const port = args.port ? Number(args.port) : await randomPortPromise()
      const keyPair = await readKeyFile(args.keyfile)

      await AtekNet.setup()

      const node = new AtekNet.Node(keyPair)
      await node.listen()
      node.on('connection', sock => {
        console.log('CONNECT pubkey:', sock.remotePublicKeyB32)
        sock.on('close', () => {
          console.log('CLOSE pubkey:', sock.remotePublicKeyB32)
        })
      })
      node.setProtocolHandler((stream) => {
        const conn = net.connect({host: '127.0.0.1', port})
        pump(stream, conn, stream)
      })

      const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
        serve(req, res, {
          public: servePath,
          unlisted: ['.git'],
          redirects: [
            {source: '.git/**', destination: '/', type: 302}
          ]
        })
      })
      server.listen(port)

      const link1 = `http://localhost:${port}/`
      const link2 = `https://${node.publicKeyB32}.atek.app/`
      console.log('')
      console.log('======================')
      console.log('Spork powers ACTIVATED')
      console.log('')
      console.log(' - Mode: Serve folder via HTTP')
      console.log(` - Listening on localhost:${port} and ${node.publicKeyB32}`)
      console.log(' - Serving', servePath)
      console.log('======================')
      console.log('')
      console.log('Links:')
      console.log('')
      console.log(`  ${ansi.link(link1, link1)}`)
      console.log(`  ${ansi.link(link2, link2)}`)
      console.log('')
    }
  }
]
