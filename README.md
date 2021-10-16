![spork.svg](spork.svg)

# Atek Spork

A command-line p2p sockets tool. WARNING: early alpha, spork power levels elevated.

```
npm i -g @atek-cloud/spork
```

## Overview

Spork lets you tunnel between any two devices using the [Hyperswarm P2P network](https://github.com/hyperswarm).
Here's the current commands:

```
spork - A p2p sockets multi-tool

Commands:
   spork bind [public-key] - Bind a p2p socket as a proxy to a local or remote server.
```

## How-tos

### Expose a server to the P2P network

Let's say you have a web app running at `localhost:12345`:

```js
require('http').createServer((req, res) => {
  res.writeHead(200).end('Hello, world!')
}).listen(12345)
```

You can put this on the p2p network by calling `spork bind`:

```bash
$ spork bind -p 12345
Created temporary keypair, public key: whattzzuu5drxwdwi6xbijjf7yt56l5adzht7j7kjvfped7amova

======================
Spork powers ACTIVATED

 - Mode: Reverse proxy
 - Listening on whattzzuu5drxwdwi6xbijjf7yt56l5adzht7j7kjvfped7amova
 - Proxying all traffic to localhost:12345
======================
```

Now, as long as that spork command is running, your web app will be available at `whattzzuu5drxwdwi6xbijjf7yt56l5adzht7j7kjvfped7amova` (it will be a different pubkey for you).

If you want to re-use a public key, specify the `-k` parameter with the path to where the keyfile can be stored.

```
$ spork bind -p 12345 -k ./key.json
```

If the keyfile doesn't exist yet, it will create the keyfile.

### Access a server on the P2P network

Let's say somebody has sporked their web app onto the p2p net at the pubkey `whattzzuu5drxwdwi6xbijjf7yt56l5adzht7j7kjvfped7amova`.
We can create a local proxy to that app using `spork bind`:

```bash
$ spork bind whattzzuu5drxwdwi6xbijjf7yt56l5adzht7j7kjvfped7amova -p 5555
Created temporary keypair, public key: nhspq2iz4lclc6gnmh5yniyaevluz4t6dkdsg7w5sg546ea6ozeq

======================
Spork powers ACTIVATED

 - Mode: forward proxy
 - Listening on localhost:5555
 - Proxying all traffic to whattzzuu5drxwdwi6xbijjf7yt56l5adzht7j7kjvfped7amova
======================
```

Now I can CURL to that web app using `localhost:5555`.

```bash
$ curl localhost:5555
Hello, world!
```

## What next?

You now have the power of the spork. Use it with wisdom...or don't. The spork powers will only grow from here (aka we'll add more features).

## License

MIT