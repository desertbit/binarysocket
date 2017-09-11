# BinarySocket - Binary Web Sockets

[![GoDoc](https://godoc.org/github.com/desertbit/binarysocket?status.svg)](https://godoc.org/github.com/desertbit/binarysocket)
[![Go Report Card](https://goreportcard.com/badge/github.com/desertbit/binarysocket)](https://goreportcard.com/report/github.com/desertbit/binarysocket)

BinarySocket is a **real-time bidirectional binary socket library** for the web. It offers a clean, robust and efficient solution to connect webbrowsers with a go-backend in a simple way. It automatically detects supported socket layers and chooses the most suitable one. This library offers a **net.Conn interface** on the go-backend site and a similar net.Conn interface on the client javascript site. That's awesome, right?

You already have a Go application using a TCP connection? Just drop in the BinarySocket package, fire up a HTTP server and that's it. No further adaptions are required in the backend. Instead of writing one backend which is responsible to communicate with web-application and another backend which communicates with other go programs, BinarySocket eliminates this duplication.

In a normal scenario a high-level communication protocol is stacked on top of BinarySocket.
Example: **[PAKT Project](https://github.com/desertbit/binarysocket)**


## Socket layers

Two socket layers are supported:

- **WebSockets** - This is the primary option. They are used if the webbrowser supports WebSockets defined by [RFC 6455](https://tools.ietf.org/html/rfc6455).
- **AjaxSockets** - This socket layer is used as a fallback mode.

## Introduction

### Golang Backend

```go
// Create a new binarysocket server.
server := binarysocket.NewServer()

// Set the binarysocket server handler.
http.Handle("/binsocket", server)

// Setup your http server.
// ...

// Start accepting net.Conn connections.
conn, err := server.Accept()
// ...
```

### Javascript Frontend

```js
var socket = BinarySocket.open("/binsocket");

socket.onOpen = function() {
  console.log("opened");
  socket.write(BinarySocket.stringToBytes("Hello World!"));
};

socket.onClose = function() {
  console.log("closed");
};

socket.onError = function(msg) {
  console.log("error:", msg);
};

socket.onRead = function(data) {
  console.log("read:", BinarySocket.bytesToString(data));
};
```

## Sample

Check the **[sample](sample)** directory for a simple server and client example.


## Installation

### Javascript

The client javascript library is located in **[client/dist/binarysocket.min.js](client/dist/binarysocket.min.js)**.

You can use bower to install the client library:

`bower install --save binarysocket`

### Golang

Get the source and start hacking.

`go get -u github.com/desertbit/binarysocket`

Import it with:

```go
import "github.com/desertbit/binarysocket"
```


## Byte Encoding

BinarySocket takes care about the byte order (endianness).
The default byte encoding is in network order (**big endian**).
BinarySocket includes a simple javascript byte handling library.
For more information check the **[ByteBuffer](https://github.com/desertbit/byte-buffer)** project.

```js
var bb = BinarySocket.newByteBuffer(data)
var st = BinarySocket.bytesToString(bytes)
var bs = BinarySocket.stringToBytes(str)
```


## API

### Golang

For more information please check the [Go Documentation](https://godoc.org/github.com/desertbit/binarysocket).

### Javascript

#### BinarySocket

```js
// Open and return a new BinarySocket.
// The first argument is required. It defines a host which has to start with
// http:// or https:// or / for an absolute path using the current host.
// The second argument defines optional options.
BinarySocket.open(host, options)

// Create a new ByteBuffer.
// Optionally set the implicitGrowth boolean.
// Wrapper for JavaScript's ArrayBuffer/DataView maintaining index and default endianness.
// More information: https://github.com/desertbit/byte-buffer
BinarySocket.newByteBuffer(data, implicitGrowth)

// Convert an ArrayBuffer to a string.
BinarySocket.bytesToString(b)

// Convert a string to an ArrayBuffer.
BinarySocket.stringToBytes(s)
```

#### Open Options

```js
var options = {
  // Force a socket type.
  // Values: false, "WebSocket", "AjaxSocket"
  forceSocketType: false,

  // Kill the connect attempt after the timeout.
  connectTimeout:  10000
};
```

#### Socket

```js
// Return the current socket type.
// Values: "WebSocket", "AjaxSocket"
socket.socketType()

// Close the socket connection.
socket.close()

// Returns a boolean whenever the socket is closed.
socket.isClosed()

// Write the ArrayBuffer to the socket.
socket.write(data)

// Function which is triggered as soon as the connection is established.
socket.onOpen = function() {}

// Function which is triggered as soon as the connection closes.
socket.onClose = function() {}

// Function which is triggered as soon as the connection closes with an error.
// An optional error message is passed.
// onClose is also triggered afterwards.
socket.onError = function(msg) {}

// Function which is triggered as soon as new bytes are received.
// The passed data is an ArrayBuffer.
socket.onRead = function(data) {}
```


## Author

**Roland Singer**
