/*
 *  BinarySocket - Binary Web Sockets
 *  Copyright (C) 2016  Roland Singer <roland.singer[at]desertbit.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 *  This code lives inside the BinarySocket function.
 */

var openSocket = function(host, options) {
  // Include the dependencies.
  @@include('./websocket.js')
  @@include('./ajaxsocket.js')



  /*
   * Constants
   */

  var SocketTypes = {
      WebSocket:  "WebSocket",
      AjaxSocket: "AjaxSocket"
  };

  var DefaultOptions = {
      // Force a socket type.
      // Values: false, "WebSocket", "AjaxSocket"
      forceSocketType: false,

      // Kill the connect attempt after the timeout.
      connectTimeout:  10000
  };



  /*
   * Variables
   */

  var bs,     // Backend socket.
      isClosed = false;



  /*
   * Public Instance
   */

  var instance = {
    // Return the current socket type.
    // Values: "WebSocket", "AjaxSocket"
    socketType: function() {
      return bs.socketType;
    },

    // Close the socket connection.
    close: function() {
      bs.close();
      triggerClose();
    },

    // Returns a boolean whenever the socket is closed.
    isClosed: function() {
      return isClosed;
    },

    // Write the ArrayBuffer to the socket.
    write: function(data) {
      if (isClosed) {
        console.log("BinarySocket: failed to write: the socket is closed");
        return;
      }
      else if (!(data instanceof ArrayBuffer)) {
        console.log("BinarySocket: failed to write data: data is not of type ArrayBuffer");
        return;
      }
      else if (data.byteLength === 0) {
        return;
      }

      bs.send(data);
    },

    // Function which is triggered as soon as new bytes are received.
    // The passed data is an ArrayBuffer.
    onRead: function(data) {} // Set to an empty function. This eliminates an extra check.

    /*
      // Hint: Further available event function.

      // Function which is triggered as soon as the connection is established.
      onOpen: function() {}

      // Function which is triggered as soon as the connection closes.
      onClose: function() {}

      // Function which is triggered as soon as the connection closes with an error.
      // An optional error message is passed.
      // onClose is also triggered afterwards.
      onError: function(msg) {}
    */
  };



  /*
   * Methods
   */

  function triggerOpen() {
    // Trigger only once.
    if (bs.openTriggered) {
      return;
    }
    bs.openTriggered = true;

    if (instance.onOpen) {
      try {
        instance.onOpen();
      } catch (e) {
        console.log("BinarySocket: onOpen: catched exception:", e);

        // Ensure to close the socket.
        bs.close();
      }
    }
  }

  function triggerClose() {
    // Trigger only once.
    if (isClosed) {
      return;
    }
    isClosed = true;

    if (instance.onClose) {
      try {
        instance.onClose();
      } catch (e) {
        console.log("BinarySocket: onClose: catched exception:", e);
      }
    }
  }

  function triggerError(msg) {
    // Trigger only once.
    if (bs.errorTriggered) {
      return;
    }
    bs.errorTriggered = true;

    if (instance.onError) {
      try {
        instance.onError(msg);
      } catch (e) {
        console.log("BinarySocket: onError: catched exception:", e);
      }
    }
  }

  function connectSocket() {
    // Choose the socket layer depending on the browser support.
    if ((!options.forceSocketType && window.WebSocket) ||
        options.forceSocketType === SocketTypes.WebSocket)
    {
        bs = newWebSocket();
        bs.socketType = SocketTypes.WebSocket;
    }
    else {
        bs = newAjaxSocket();
        bs.socketType = SocketTypes.AjaxSocket;
    }

    // Start the timeout.
    var connectTimeout = setTimeout(function() {
        connectTimeout = false;

        // Ensure the socket is closed.
        bs.close();

        triggerError("connection timeout");
        triggerClose();
    }, options.connectTimeout);

    // Helper function.
    var stopConnectTimeout = function() {
      if (connectTimeout !== false) {
          clearTimeout(connectTimeout);
          connectTimeout = false;
      }
    };



    // Set the backend socket events.
    bs.onOpen = function() {
      stopConnectTimeout();

      triggerOpen();
    };

    bs.onClose = function() {
      stopConnectTimeout();

      // Ensure the socket is closed.
      bs.close();

      triggerClose();
    };

    bs.onError = function(msg) {
      // Stop the connect timeout.
      stopConnectTimeout();

      // Ensure the socket is closed.
      bs.close();

      triggerError(msg);
      triggerClose();
    };

    bs.onMessage = function(data) {
      try {
        instance.onRead(data);
      } catch (e) {
        console.log("BinarySocket: onRead: catched exception:", e);
      }
    };

    // Connect during the next tick.
    // The user should be able to connect the event functions first.
    setTimeout(function() {
      bs.open();
    }, 0);
  }



  /*
   * Initialize section
   */

  // Check if ArrayBuffers are supported. This is a must!
  if (!window.ArrayBuffer) {
    console.log("BinarySocket: ArrayBuffers are not supported by this browser!");
    return ;
  }

  // Merge the options with the default options.
  options = utils.extend({}, DefaultOptions, options);

  // Prepare the host string.
  // Prepent the current location if the host url starts with a slash.
  if (host.match("^/")) {
    host = window.location.protocol + "//" + window.location.host + host;
  }
  // Use the current location if the host string is not set.
  else if (!host) {
    host = window.location.protocol + "//" + window.location.host;
  }
  // The host string has to start with http:// or https://
  if (!host.match("^http://") && !host.match("^https://")) {
    console.log("BinarySocket: invalid host: missing 'http://' or 'https://'!");
    return;
  }

  // Connect the socket.
  connectSocket();


  // Return the newly created socket.
  return instance;
};
