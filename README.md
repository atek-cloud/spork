![spork.svg](spork.svg)

# Atek Spork

A command-line p2p sockets tool.

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
   spork gateway - Create an HTTP server that routes to p2p sockets by subdomain.
   spork serve {path} - Serve a folder as a static HTTP site over p2p sockets.
   spork beam [passphrase] - Create a encrypted network pipe.
```

**[Visit spork.sh](https://spork.sh/) for documentation**.

## Notable changes

### 1.0.0 - Drop libp2p modules

Breaking change.

The [Atek Networking module](https://github.com/atek-cloud/network) was updated to drop the libp2p modules. [See the section in that readme](https://github.com/atek-cloud/network#004---drop-libp2p-modules) to understand why.

This is a breaking change to the wire protocol from previous versions! Make sure you're using 1.0.0+ on both ends.

## License

MIT
