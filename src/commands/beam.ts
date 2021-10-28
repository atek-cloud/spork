import Hyperbeam from 'hyperbeam'
import figures from 'figures'
import { usage } from '../lib/cli.js'

export default [
  {
    name: 'beam',
    summary: `spork beam [passphrase] - Create a encrypted network pipe.`,
    help: `spork beam [passphrase] - Create a encrypted network pipe.
    
Examples:

  # On device 1:
  $ echo "Hello, World!" | spork beam   # this will provide a passphrase to enter on device 2
  
  # On device 2:
  $ spork beam neznr3z3j44l7q7sgynbzpdrdlpausurbpcmqvwupmuoidolbopa > ./out.txt
  $ cat ./out.txt
  Hello, World!


Options:`,
    usage,
    options: [
      {name: 'reuse', abbr: 'r', help: 'Reuse a past passphrase.'}
    ],
    command: (args: any) => {
      const beam = new Hyperbeam(args._[0])
      if (beam.announce) {
        console.error(figures.play, 'Run the following command to connect:')
        console.error(figures.play)
        console.error(figures.play, '  spork beam', beam.key)
        console.error(figures.play)
        console.error(figures.play, 'To restart this side of the pipe with the same key add -r to the above')
      } else {
        console.error(figures.play, 'Connecting pipe...')
      }
      
      // @ts-ignore no way I'm going to bother extending the duplex events type signature -prf
      beam.on('remote-address', function ({ host, port }) {
        if (!host) console.error(figures.play, 'Could not detect remote address')
        else console.error(figures.play, 'Joined the DHT - remote address is ' + host + ':' + port)
      })
      
      // @ts-ignore no way I'm going to bother extending the duplex events type signature -prf
      beam.on('connected', function () {
        console.error(figures.play, 'Success! Encrypted tunnel established to remote peer')
      })
      
      beam.on('error', function (e) {
        console.error(figures.play, 'Error:', e.message)
        closeASAP()
      })
      
      beam.on('end', () => beam.end())
      
      process.stdin.pipe(beam).pipe(process.stdout)
      if (typeof process.stdin.unref === 'function') process.stdin.unref()
      
      process.once('SIGINT', () => {
        if (!beam.connected) closeASAP()
        else beam.end()
      })
      
      function closeASAP () {
        console.error(figures.play, 'Shutting down beam...')
      
        const timeout = setTimeout(() => process.exit(1), 2000)
        beam.destroy()
        beam.on('close', function () {
          clearTimeout(timeout)
        })
      }
    }
  }
]
