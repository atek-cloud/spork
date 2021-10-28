declare module 'hyperbeam' {
  import streamx from 'streamx'
  export default class Hyperbeam extends streamx.Duplex {
    announce: boolean
    connected: boolean
    key: string
    constructor (key?: string)
  }
}