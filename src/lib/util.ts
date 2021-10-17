import { resolve } from 'path'
import { promises as fsp } from 'fs'
// @ts-ignore no d.ts, screw it
import randomPort from 'random-port'
import * as AtekNet from '@atek-cloud/network'
import { fromBase32, toBase32 } from '@atek-cloud/network/dist/util.js'

export function isBuffer (v: any): v is Buffer {
  return Buffer.isBuffer(v)
}

export function randomPortPromise (): Promise<number> {
  return new Promise(resolve => {
    randomPort(resolve)
  })
}

export async function readKeyFile (keyfile: string) {
  let keyPair
  if (keyfile) {
    const keyfilePath = resolve(keyfile)
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
  return keyPair
}