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

var newAjaxSocket = function () {
  /*
   * Constants
   */

  var sendTimeout = 30000,
      pollTimeout = 45000;

  var DataDelimiter = '#';

  var RequestType = {
      Init: 0,
      Push: 1,
      Poll: 2
  };

  var PollType = {
      Data:    0,
      Timeout: 1,
      Closed:  2
  };



  /*
   * Variables
   */

   var s = {},
       uid, pollToken, pushToken,
       pollXhr = false,
       sendXhr = false,
       poll,
       pushActive = false,
       pushBuffer = [];



  /*
   * Methods
   */

  function postAjax(url, timeout, data, success, error) {
    var xhr = new XMLHttpRequest();

    xhr.onload = function() {
      success(xhr.response);
    };

    xhr.onerror = function() {
      error();
    };

    xhr.ontimeout = function() {
      error("timeout");
    };

    xhr.open('POST', url, true);
    xhr.responseType = "arraybuffer";
    xhr.timeout = timeout;
    xhr.send(new DataView(data));

    return xhr;
  }

  function stopRequests() {
    // Set the poll function to a dummy function.
    // This will prevent further poll calls.
    poll = function() {};

    // Kill the ajax requests.
    if (pollXhr) {
        pollXhr.abort();
    }
    if (sendXhr) {
        sendXhr.abort();
    }
  }

  function triggerClosed() {
    // Stop the ajax requests.
    stopRequests();

    // Trigger the event.
    s.onClose();
  }

  function triggerError(msg) {
    // Stop the ajax requests.
    stopRequests();

    // Create the error message.
    if (!msg) {
      msg = "the ajax socket closed the connection with an error.";
    }

    // Trigger the event.
    s.onError(msg);
  }

  function send(reqType, headerStr, data, callback) {
    var b = new ByteBuffer(3, ByteBuffer.BIG_ENDIAN, true);
    b.writeByte(reqType);

    var headerStrLen = 0;
    if (headerStr && headerStr.length > 0) {
      headerStrLen = headerStr.length;
    }
    b.writeByte(headerStrLen);

    if (headerStrLen > 0) {
      b.writeString(headerStr);
    }

    if (data && data.byteLength > 0) {
      b.write(data);
    }

    // Perform the actual ajax request.
    sendXhr = postAjax(host, sendTimeout, b.buffer, function (data) {
      sendXhr = false;

      if (callback) {
        callback(data);
      }
    }, function (msg) {
      sendXhr = false;
      triggerError(msg);
    });
  }

  poll = function () {
    var b = new ByteBuffer(3, ByteBuffer.BIG_ENDIAN, true);
    b.writeByte(RequestType.Poll);

    var headerStr = uid + DataDelimiter + pollToken;
    b.writeByte(headerStr.length);
    b.writeString(headerStr);

    // Perform the actual ajax request.
    pollXhr = postAjax(host, pollTimeout, b.buffer, function (data) {
      pollXhr = false;

      var b = new ByteBuffer(data, ByteBuffer.BIG_ENDIAN);

      // Extract the tyoe.
      if (b.length < 1) {
        triggerError("ajax socket: poll: invalid server response");
        return;
      }
      var type = b.readByte();

      // Check if this ajax connection was closed.
      if (type == PollType.Closed) {
        triggerClosed();
        return;
      }

      // Validate.
      if (b.length < 2) {
        triggerError("ajax socket: poll: invalid server response");
        return;
      }

      // Extract and set the new poll token.
      var pollTokenLen = b.readByte();
      pollToken = b.readString(pollTokenLen);

      // Check if this ajax request has reached the server's timeout.
      if (type == PollType.Timeout) {
        // Just start the next poll request.
        poll();
        return;
      }

      // Start the next poll request.
      poll();

      // Remove the header from the buffer.
      b.clip();

      // Call the event.
      s.onMessage(b.buffer);
    }, function (msg) {
      pollXhr = false;
      triggerError(msg);
    });
  };

  var push = utils.throttle(function() {
    // Skip if there is already an active push request.
    // Only one push request at once is allowed.
    // The next push will be triggered automatically.
    if (pushActive) {
      return;
    }

    // Obtain the total buffer size.
    var i, totalSize = 0;
    for (i=0; i < pushBuffer.length; i++) {
      totalSize += pushBuffer[i].byteLength;
    }

    // Merge all buffered bytes into one single buffer.
    var b = new ByteBuffer(totalSize, ByteBuffer.BIG_ENDIAN);
    for (i=0; i < pushBuffer.length; i++) {
      b.write(pushBuffer[i]);
    }

    // Clear the push buffer.
    pushBuffer = [];

    // Perform the actual push request.
    pushActive = true;
    send(RequestType.Push, uid + DataDelimiter + pushToken, b.buffer, function(data) {
      pushActive = false;

      if (!data || data.byteLength <= 0) {
        triggerError("ajax socket: push: invalid server response");
        return;
      }

      var b = new ByteBuffer(data, ByteBuffer.BIG_ENDIAN);

      // Set the new push token.
      pushToken = b.readString();

      // Check if the buffer is filled again.
      // If so, trigger the next push.
      if (pushBuffer.length > 0) {
        push();
      }
    });
  }, 50);


  /*
   * Socket layer implementation.
   */

  s.open = function () {
    // Initialize the ajax socket session
    send(RequestType.Init, null, null, function (data) {
      if (!data || data.byteLength <= 0) {
        triggerError("ajax socket: open: invalid server response");
        return;
      }

      // Transform to string.
      var b = new ByteBuffer(data, ByteBuffer.BIG_ENDIAN);
      data = b.readString();

      // Split the string.
      var split = data.split(DataDelimiter);
      if (split.length !== 3) {
        triggerError("ajax socket: failed to obtain uid and tokens");
        return;
      }

      // Set the uid and the tokens.
      uid = split[0];
      pollToken = split[1];
      pushToken = split[2];

      // Start the long polling process.
      poll();

      // Trigger the event.
      s.onOpen();
    });
  };

  s.send = function (data) {
    // Add the data to the push buffer queue.
    pushBuffer.push(data);

    // Push the data to the server (throttled).
    push();
  };

  s.close = function() {
    // Stop the ajax requests.
    stopRequests();
  };

  return s;
};
