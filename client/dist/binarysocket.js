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


var BinarySocket = function() {
  // Turn on strict mode.
  'use strict';

  // Include the dependencies.
  /**
 * byte-buffer v1.0.3
 * Copyright (c) 2012-2015 Tim Kurvers <tim@moonsphere.net>
 *
 * Wrapper for JavaScript's ArrayBuffer/DataView.
 *
 * Licensed under the MIT license.
 */

!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ByteBuffer=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ByteBuffer = (function () {

  // Creates a new ByteBuffer
  // - from given source (assumed to be number of bytes when numeric)
  // - with given byte order (defaults to big-endian)
  // - with given implicit growth strategy (defaults to false)

  function ByteBuffer() {
    var source = arguments[0] === undefined ? 0 : arguments[0];
    var order = arguments[1] === undefined ? this.constructor.BIG_ENDIAN : arguments[1];
    var implicitGrowth = arguments[2] === undefined ? false : arguments[2];

    _classCallCheck(this, ByteBuffer);

    // Holds buffer
    this._buffer = null;

    // Holds raw buffer
    this._raw = null;

    // Holds internal view for reading/writing
    this._view = null;

    // Holds byte order
    this._order = !!order;

    // Holds implicit growth strategy
    this._implicitGrowth = !!implicitGrowth;

    // Holds read/write index
    this._index = 0;

    // Attempt to extract a buffer from given source
    var buffer = this._extractBuffer(source, true);

    // On failure, assume source is a primitive indicating the number of bytes
    if (!buffer) {
      buffer = new ArrayBuffer(source);
    }

    // Assign new buffer
    this.buffer = buffer;
  }

  _createClass(ByteBuffer, [{
    key: '_sanitizeIndex',

    // Sanitizes read/write index
    value: function _sanitizeIndex() {
      if (this._index < 0) {
        this._index = 0;
      }
      if (this._index > this.length) {
        this._index = this.length;
      }
    }
  }, {
    key: '_extractBuffer',

    // Extracts buffer from given source and optionally clones it
    value: function _extractBuffer(source) {
      var clone = arguments[1] === undefined ? false : arguments[1];

      // Whether source is a byte-aware object
      if (source && typeof source.byteLength !== 'undefined') {

        // Determine whether source is a view or a raw buffer
        if (typeof source.buffer !== 'undefined') {
          return clone ? source.buffer.slice(0) : source.buffer;
        } else {
          return clone ? source.slice(0) : source;
        }

        // Whether source is a sequence of bytes
      } else if (source && typeof source.length !== 'undefined') {

        // Although Uint8Array's constructor succeeds when given strings,
        // it does not correctly instantiate the buffer
        if (source.constructor == String) {
          return null;
        }

        try {
          return new Uint8Array(source).buffer;
        } catch (error) {
          return null;
        }

        // No buffer found
      } else {
        return null;
      }
    }
  }, {
    key: 'front',

    // Sets index to front of the buffer
    value: function front() {
      this._index = 0;
      return this;
    }
  }, {
    key: 'end',

    // Sets index to end of the buffer
    value: function end() {
      this._index = this.length;
      return this;
    }
  }, {
    key: 'seek',

    // Seeks given number of bytes
    // Note: Backwards seeking is supported
    value: function seek() {
      var bytes = arguments[0] === undefined ? 1 : arguments[0];

      this.index += bytes;
      return this;
    }
  }, {
    key: 'read',

    // Reads sequence of given number of bytes (defaults to number of bytes available)
    value: function read() {
      var bytes = arguments[0] === undefined ? this.available : arguments[0];

      if (bytes > this.available) {
        throw new Error('Cannot read ' + bytes + ' byte(s), ' + this.available + ' available');
      }

      if (bytes <= 0) {
        throw new RangeError('Invalid number of bytes ' + bytes);
      }

      var value = new ByteBuffer(this._buffer.slice(this._index, this._index + bytes), this.order);
      this._index += bytes;
      return value;
    }
  }, {
    key: 'write',

    // Writes sequence of bytes
    value: function write(sequence) {
      var view;

      // Ensure we're dealing with a Uint8Array view
      if (!(sequence instanceof Uint8Array)) {

        // Extract the buffer from the sequence
        var buffer = this._extractBuffer(sequence);
        if (!buffer) {
          throw new TypeError('Cannot write ' + sequence + ', not a sequence');
        }

        // And create a new Uint8Array view for it
        view = new Uint8Array(buffer);
      } else {
        view = sequence;
      }

      var available = this.available;
      if (view.byteLength > available) {
        if (this._implicitGrowth) {
          this.append(view.byteLength - available);
        } else {
          throw new Error('Cannot write ' + sequence + ' using ' + view.byteLength + ' byte(s), ' + this.available + ' available');
        }
      }

      this._raw.set(view, this._index);
      this._index += view.byteLength;
      return this;
    }
  }, {
    key: 'readString',

    // Reads UTF-8 encoded string of given number of bytes (defaults to number of bytes available)
    //
    // Based on David Flanagan's BufferView (https://github.com/davidflanagan/BufferView/blob/master/BufferView.js//L195)
    value: function readString() {
      var bytes = arguments[0] === undefined ? this.available : arguments[0];

      if (bytes > this.available) {
        throw new Error('Cannot read ' + bytes + ' byte(s), ' + this.available + ' available');
      }

      if (bytes <= 0) {
        throw new RangeError('Invalid number of bytes ' + bytes);
      }

      // Local reference
      var raw = this._raw;

      // Holds decoded characters
      var codepoints = [];

      // Index into codepoints
      var c = 0;

      // Bytes
      var b1,
          b2,
          b3,
          b4 = null;

      // Target index
      var target = this._index + bytes;

      while (this._index < target) {
        b1 = raw[this._index];

        if (b1 < 128) {
          // One byte sequence
          codepoints[c++] = b1;
          this._index++;
        } else if (b1 < 194) {
          throw new Error('Unexpected continuation byte');
        } else if (b1 < 224) {
          // Two byte sequence
          b2 = raw[this._index + 1];

          if (b2 < 128 || b2 > 191) {
            throw new Error('Bad continuation byte');
          }

          codepoints[c++] = ((b1 & 31) << 6) + (b2 & 63);

          this._index += 2;
        } else if (b1 < 240) {

          // Three byte sequence
          b2 = raw[this._index + 1];

          if (b2 < 128 || b2 > 191) {
            throw new Error('Bad continuation byte');
          }

          b3 = raw[this._index + 2];

          if (b3 < 128 || b3 > 191) {
            throw new Error('Bad continuation byte');
          }

          codepoints[c++] = ((b1 & 15) << 12) + ((b2 & 63) << 6) + (b3 & 63);

          this._index += 3;
        } else if (b1 < 245) {
          // Four byte sequence
          b2 = raw[this._index + 1];

          if (b2 < 128 || b2 > 191) {
            throw new Error('Bad continuation byte');
          }

          b3 = raw[this._index + 2];

          if (b3 < 128 || b3 > 191) {
            throw new Error('Bad continuation byte');
          }

          b4 = raw[this._index + 3];

          if (b4 < 128 || b4 > 191) {
            throw new Error('Bad continuation byte');
          }

          var cp = ((b1 & 7) << 18) + ((b2 & 63) << 12) + ((b3 & 63) << 6) + (b4 & 63);
          cp -= 65536;

          // Turn code point into two surrogate pairs
          codepoints[c++] = 55296 + ((cp & 1047552) >>> 10);
          codepoints[c++] = 56320 + (cp & 1023);

          this._index += 4;
        } else {
          throw new Error('Illegal byte');
        }
      }

      // Browsers may have hardcoded or implicit limits on the array length when applying a function
      // See: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/apply//apply_and_built-in_functions
      var limit = 1 << 16;
      var length = codepoints.length;
      if (length < limit) {
        return String.fromCharCode.apply(String, codepoints);
      } else {
        var chars = [];
        var i = 0;
        while (i < length) {
          chars.push(String.fromCharCode.apply(String, codepoints.slice(i, i + limit)));
          i += limit;
        }
        return chars.join('');
      }
    }
  }, {
    key: 'writeString',

    // Writes UTF-8 encoded string
    // Note: Does not write string length or terminator
    //
    // Based on David Flanagan's BufferView (https://github.com/davidflanagan/BufferView/blob/master/BufferView.js//L264)
    value: function writeString(string) {

      // Encoded UTF-8 bytes
      var bytes = [];

      // String length, offset and byte offset
      var length = string.length;
      var i = 0;
      var b = 0;

      while (i < length) {
        var c = string.charCodeAt(i);

        if (c <= 127) {
          // One byte sequence
          bytes[b++] = c;
        } else if (c <= 2047) {
          // Two byte sequence
          bytes[b++] = 192 | (c & 1984) >>> 6;
          bytes[b++] = 128 | c & 63;
        } else if (c <= 55295 || c >= 57344 && c <= 65535) {
          // Three byte sequence
          // Source character is not a UTF-16 surrogate
          bytes[b++] = 224 | (c & 61440) >>> 12;
          bytes[b++] = 128 | (c & 4032) >>> 6;
          bytes[b++] = 128 | c & 63;
        } else {
          // Four byte sequence
          if (i == length - 1) {
            throw new Error('Unpaired surrogate ' + string[i] + ' (index ' + i + ')');
          }

          // Retrieve surrogate
          var d = string.charCodeAt(++i);
          if (c < 55296 || c > 56319 || d < 56320 || d > 57343) {
            throw new Error('Unpaired surrogate ' + string[i] + ' (index ' + i + ')');
          }

          var cp = ((c & 1023) << 10) + (d & 1023) + 65536;

          bytes[b++] = 240 | (cp & 1835008) >>> 18;
          bytes[b++] = 128 | (cp & 258048) >>> 12;
          bytes[b++] = 128 | (cp & 4032) >>> 6;
          bytes[b++] = 128 | cp & 63;
        }

        ++i;
      }

      this.write(bytes);

      return bytes.length;
    }
  }, {
    key: 'readCString',

    // Aliases for reading/writing UTF-8 encoded strings
    // readUTFChars: this.::readString
    // writeUTFChars: this.::writeString

    // Reads UTF-8 encoded C-string (excluding the actual NULL-byte)
    value: function readCString() {
      var bytes = this._raw;
      var length = bytes.length;
      var i = this._index;
      while (bytes[i] != 0 && i < length) {
        ++i;
      }

      length = i - this._index;
      if (length > 0) {
        var string = this.readString(length);
        this.readByte();
        return string;
      }

      return null;
    }
  }, {
    key: 'writeCString',

    // Writes UTF-8 encoded C-string (NULL-terminated)
    value: function writeCString(string) {
      var bytes = this.writeString(string);
      this.writeByte(0);
      return ++bytes;
    }
  }, {
    key: 'prepend',

    // Prepends given number of bytes
    value: function prepend(bytes) {
      if (bytes <= 0) {
        throw new RangeError('Invalid number of bytes ' + bytes);
      }

      var view = new Uint8Array(this.length + bytes);
      view.set(this._raw, bytes);
      this._index += bytes;
      this.buffer = view.buffer;
      return this;
    }
  }, {
    key: 'append',

    // Appends given number of bytes
    value: function append(bytes) {
      if (bytes <= 0) {
        throw new RangeError('Invalid number of bytes ' + bytes);
      }

      var view = new Uint8Array(this.length + bytes);
      view.set(this._raw, 0);
      this.buffer = view.buffer;
      return this;
    }
  }, {
    key: 'clip',

    // Clips this buffer
    value: function clip() {
      var begin = arguments[0] === undefined ? this._index : arguments[0];
      var end = arguments[1] === undefined ? this.length : arguments[1];

      if (begin < 0) {
        begin = this.length + begin;
      }
      var buffer = this._buffer.slice(begin, end);
      this._index -= begin;
      this.buffer = buffer;
      return this;
    }
  }, {
    key: 'slice',

    // Slices this buffer
    value: function slice() {
      var begin = arguments[0] === undefined ? 0 : arguments[0];
      var end = arguments[1] === undefined ? this.length : arguments[1];

      var slice = new ByteBuffer(this._buffer.slice(begin, end), this.order);
      return slice;
    }
  }, {
    key: 'clone',

    // Clones this buffer
    value: function clone() {
      var clone = new ByteBuffer(this._buffer.slice(0), this.order, this.implicitGrowth);
      clone.index = this._index;
      return clone;
    }
  }, {
    key: 'reverse',

    // Reverses this buffer
    value: function reverse() {
      Array.prototype.reverse.call(this._raw);
      this._index = 0;
      return this;
    }
  }, {
    key: 'toArray',

    // Array of bytes in this buffer
    value: function toArray() {
      return Array.prototype.slice.call(this._raw, 0);
    }
  }, {
    key: 'toString',

    // Short string representation of this buffer
    value: function toString() {
      var order = this._order == this.constructor.BIG_ENDIAN ? 'big-endian' : 'little-endian';
      return '[ByteBuffer; Order: ' + order + '; Length: ' + this.length + '; Index: ' + this._index + '; Available: ' + this.available + ']';
    }
  }, {
    key: 'toHex',

    // Hex representation of this buffer with given spacer
    value: function toHex() {
      var spacer = arguments[0] === undefined ? ' ' : arguments[0];

      return Array.prototype.map.call(this._raw, function (byte) {
        return ('00' + byte.toString(16).toUpperCase()).slice(-2);
      }).join(spacer);
    }
  }, {
    key: 'toASCII',

    // ASCII representation of this buffer with given spacer and optional byte alignment
    value: function toASCII() {
      var spacer = arguments[0] === undefined ? ' ' : arguments[0];
      var align = arguments[1] === undefined ? true : arguments[1];
      var unknown = arguments[2] === undefined ? '�' : arguments[2];

      var prefix = align ? ' ' : '';
      return Array.prototype.map.call(this._raw, function (byte) {
        return byte < 32 || byte > 126 ? prefix + unknown : prefix + String.fromCharCode(byte);
      }).join(spacer);
    }
  }, {
    key: 'buffer',

    // Retrieves buffer
    get: function () {
      return this._buffer;
    },

    // Sets new buffer and sanitizes read/write index
    set: function (buffer) {
      this._buffer = buffer;
      this._raw = new Uint8Array(this._buffer);
      this._view = new DataView(this._buffer);
      this._sanitizeIndex();
    }
  }, {
    key: 'raw',

    // Retrieves raw buffer
    get: function () {
      return this._raw;
    }
  }, {
    key: 'view',

    // Retrieves view
    get: function () {
      return this._view;
    }
  }, {
    key: 'length',

    // Retrieves number of bytes
    get: function () {
      return this._buffer.byteLength;
    }
  }, {
    key: 'byteLength',

    // Retrieves number of bytes
    // Note: This allows for ByteBuffer to be detected as a proper source by its own constructor
    get: function () {
      return this.length;
    }
  }, {
    key: 'order',

    // Retrieves byte order
    get: function () {
      return this._order;
    },

    // Sets byte order
    set: function (order) {
      this._order = !!order;
    }
  }, {
    key: 'implicitGrowth',

    // Retrieves implicit growth strategy
    get: function () {
      return this._implicitGrowth;
    },

    // Sets implicit growth strategy
    set: function (implicitGrowth) {
      this._implicitGrowth = !!implicitGrowth;
    }
  }, {
    key: 'index',

    // Retrieves read/write index
    get: function () {
      return this._index;
    },

    // Sets read/write index
    set: function (index) {
      if (index < 0 || index > this.length) {
        throw new RangeError('Invalid index ' + index + ', should be between 0 and ' + this.length);
      }

      this._index = index;
    }
  }, {
    key: 'available',

    // Retrieves number of available bytes
    get: function () {
      return this.length - this._index;
    }
  }], [{
    key: 'LITTLE_ENDIAN',

    // Byte order constants
    value: true,
    enumerable: true
  }, {
    key: 'BIG_ENDIAN',
    value: false,
    enumerable: true
  }]);

  return ByteBuffer;
})();

// Generic reader
var reader = function reader(method, bytes) {
  return function () {
    var order = arguments[0] === undefined ? this._order : arguments[0];

    if (bytes > this.available) {
      throw new Error('Cannot read ' + bytes + ' byte(s), ' + this.available + ' available');
    }

    var value = this._view[method](this._index, order);
    this._index += bytes;
    return value;
  };
};

// Generic writer
var writer = function writer(method, bytes) {
  return function (value) {
    var order = arguments[1] === undefined ? this._order : arguments[1];

    var available = this.available;
    if (bytes > available) {
      if (this._implicitGrowth) {
        this.append(bytes - available);
      } else {
        throw new Error('Cannot write ' + value + ' using ' + bytes + ' byte(s), ' + available + ' available');
      }
    }

    this._view[method](this._index, value, order);
    this._index += bytes;
    return this;
  };
};

// Readers for bytes, shorts, integers, floats and doubles
ByteBuffer.prototype.readByte = reader('getInt8', 1);
ByteBuffer.prototype.readUnsignedByte = reader('getUint8', 1);
ByteBuffer.prototype.readShort = reader('getInt16', 2);
ByteBuffer.prototype.readUnsignedShort = reader('getUint16', 2);
ByteBuffer.prototype.readInt = reader('getInt32', 4);
ByteBuffer.prototype.readUnsignedInt = reader('getUint32', 4);
ByteBuffer.prototype.readFloat = reader('getFloat32', 4);
ByteBuffer.prototype.readDouble = reader('getFloat64', 8);

// Writers for bytes, shorts, integers, floats and doubles
ByteBuffer.prototype.writeByte = writer('setInt8', 1);
ByteBuffer.prototype.writeUnsignedByte = writer('setUint8', 1);
ByteBuffer.prototype.writeShort = writer('setInt16', 2);
ByteBuffer.prototype.writeUnsignedShort = writer('setUint16', 2);
ByteBuffer.prototype.writeInt = writer('setInt32', 4);
ByteBuffer.prototype.writeUnsignedInt = writer('setUint32', 4);
ByteBuffer.prototype.writeFloat = writer('setFloat32', 4);
ByteBuffer.prototype.writeDouble = writer('setFloat64', 8);

module.exports = ByteBuffer;
},{}]},{},[1])
(1)
});

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

var utils = {
  // Mimics jQuery's extend method.
  // Source: http://stackoverflow.com/questions/11197247/javascript-equivalent-of-jquerys-extend-method
  extend: function() {
    for(var i=1; i<arguments.length; i++)
        for(var key in arguments[i])
            if(arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];
    return arguments[0];
  },

  // Return a function which is triggered only once within the limit duration.
  // If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  throttle: function(callback, limit, immediate) {
    var wait = false;
    return function () {
      var context = this, args = arguments;
        if (!wait) {
          if (immediate) { callback.apply(context, args); }
          wait = true;
          setTimeout(function () {
            wait = false;
            if (!immediate) { callback.apply(context, args); }
          }, limit);
        }
      };
  }
};

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

var newWebSocket = function () {
  /*
   * Variables
   */

  var s = {},
      ws;



  /*
   * Socket layer implementation.
   */

  s.open = function () {
    try {
        // Generate the websocket url.
        var url;
        if (host.match("^https://")) {
            url = "wss" + host.substr(5);
        } else {
            url = "ws" + host.substr(4);
        }

        // Open the websocket connection
        ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';

        // Set the callback handlers
        ws.onmessage = function(event) {
            s.onMessage(event.data);
        };

        ws.onerror = function(event) {
            var msg = "the websocket closed the connection with ";
            if (event.code) {
                msg += "the error code: " + event.code;
            }
            else {
                msg += "an error.";
            }

            s.onError(msg);
        };

        ws.onclose = function() {
            s.onClose();
        };

        ws.onopen = function() {
            s.onOpen();
        };
    } catch (e) {
        s.onError();
    }
  };

  s.send = function (data) {
    // Send the data to the server
    ws.send(data);
  };

  s.close = function() {
    // Close the websocket if defined.
    if (ws) {
      try {
        ws.close();
      } catch (e) {}
    }

    ws = undefined;
  };

  return s;
};

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


  // The public BinarySocket instance.
  return {
    // Open and return a new BinarySocket.
    // The first argument is required. It defines a host which has to start with
    // http:// or https:// or / for an absolute path using the current host.
    // The second argument defines optional options.
    open: openSocket,

    // Create a new ByteBuffer.
    // Optionally set the implicitGrowth boolean.
    // Wrapper for JavaScript's ArrayBuffer/DataView maintaining index and default endianness.
    // More information: https://github.com/desertbit/byte-buffer
    newByteBuffer: function(data, implicitGrowth) {
      return new ByteBuffer(data, ByteBuffer.BIG_ENDIAN, implicitGrowth);
    },

    // Convert an ArrayBuffer to a string.
    bytesToString: function(b) {
      var bb = this.newByteBuffer(b);
      return bb.readString();
    },

    // Convert a string to an ArrayBuffer.
    stringToBytes: function(s) {
      var b = this.newByteBuffer(1, true);
      b.writeString(s);
      return b.buffer;
    }
  };
}();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJiaW5hcnlzb2NrZXQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqICBCaW5hcnlTb2NrZXQgLSBCaW5hcnkgV2ViIFNvY2tldHNcbiAqICBDb3B5cmlnaHQgKEMpIDIwMTYgIFJvbGFuZCBTaW5nZXIgPHJvbGFuZC5zaW5nZXJbYXRdZGVzZXJ0Yml0LmNvbT5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiAgVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiAgYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiAgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiAgWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbiAqICBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG5cbnZhciBCaW5hcnlTb2NrZXQgPSBmdW5jdGlvbigpIHtcbiAgLy8gVHVybiBvbiBzdHJpY3QgbW9kZS5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEluY2x1ZGUgdGhlIGRlcGVuZGVuY2llcy5cbiAgLyoqXG4gKiBieXRlLWJ1ZmZlciB2MS4wLjNcbiAqIENvcHlyaWdodCAoYykgMjAxMi0yMDE1IFRpbSBLdXJ2ZXJzIDx0aW1AbW9vbnNwaGVyZS5uZXQ+XG4gKlxuICogV3JhcHBlciBmb3IgSmF2YVNjcmlwdCdzIEFycmF5QnVmZmVyL0RhdGFWaWV3LlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqL1xuXG4hZnVuY3Rpb24oZSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMpbW9kdWxlLmV4cG9ydHM9ZSgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShlKTtlbHNle3ZhciBmO1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/Zj13aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9mPWdsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZiYmKGY9c2VsZiksZi5CeXRlQnVmZmVyPWUoKX19KGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxudmFyIEJ5dGVCdWZmZXIgPSAoZnVuY3Rpb24gKCkge1xuXG4gIC8vIENyZWF0ZXMgYSBuZXcgQnl0ZUJ1ZmZlclxuICAvLyAtIGZyb20gZ2l2ZW4gc291cmNlIChhc3N1bWVkIHRvIGJlIG51bWJlciBvZiBieXRlcyB3aGVuIG51bWVyaWMpXG4gIC8vIC0gd2l0aCBnaXZlbiBieXRlIG9yZGVyIChkZWZhdWx0cyB0byBiaWctZW5kaWFuKVxuICAvLyAtIHdpdGggZ2l2ZW4gaW1wbGljaXQgZ3Jvd3RoIHN0cmF0ZWd5IChkZWZhdWx0cyB0byBmYWxzZSlcblxuICBmdW5jdGlvbiBCeXRlQnVmZmVyKCkge1xuICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IDAgOiBhcmd1bWVudHNbMF07XG4gICAgdmFyIG9yZGVyID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB0aGlzLmNvbnN0cnVjdG9yLkJJR19FTkRJQU4gOiBhcmd1bWVudHNbMV07XG4gICAgdmFyIGltcGxpY2l0R3Jvd3RoID0gYXJndW1lbnRzWzJdID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGFyZ3VtZW50c1syXTtcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBCeXRlQnVmZmVyKTtcblxuICAgIC8vIEhvbGRzIGJ1ZmZlclxuICAgIHRoaXMuX2J1ZmZlciA9IG51bGw7XG5cbiAgICAvLyBIb2xkcyByYXcgYnVmZmVyXG4gICAgdGhpcy5fcmF3ID0gbnVsbDtcblxuICAgIC8vIEhvbGRzIGludGVybmFsIHZpZXcgZm9yIHJlYWRpbmcvd3JpdGluZ1xuICAgIHRoaXMuX3ZpZXcgPSBudWxsO1xuXG4gICAgLy8gSG9sZHMgYnl0ZSBvcmRlclxuICAgIHRoaXMuX29yZGVyID0gISFvcmRlcjtcblxuICAgIC8vIEhvbGRzIGltcGxpY2l0IGdyb3d0aCBzdHJhdGVneVxuICAgIHRoaXMuX2ltcGxpY2l0R3Jvd3RoID0gISFpbXBsaWNpdEdyb3d0aDtcblxuICAgIC8vIEhvbGRzIHJlYWQvd3JpdGUgaW5kZXhcbiAgICB0aGlzLl9pbmRleCA9IDA7XG5cbiAgICAvLyBBdHRlbXB0IHRvIGV4dHJhY3QgYSBidWZmZXIgZnJvbSBnaXZlbiBzb3VyY2VcbiAgICB2YXIgYnVmZmVyID0gdGhpcy5fZXh0cmFjdEJ1ZmZlcihzb3VyY2UsIHRydWUpO1xuXG4gICAgLy8gT24gZmFpbHVyZSwgYXNzdW1lIHNvdXJjZSBpcyBhIHByaW1pdGl2ZSBpbmRpY2F0aW5nIHRoZSBudW1iZXIgb2YgYnl0ZXNcbiAgICBpZiAoIWJ1ZmZlcikge1xuICAgICAgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHNvdXJjZSk7XG4gICAgfVxuXG4gICAgLy8gQXNzaWduIG5ldyBidWZmZXJcbiAgICB0aGlzLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhCeXRlQnVmZmVyLCBbe1xuICAgIGtleTogJ19zYW5pdGl6ZUluZGV4JyxcblxuICAgIC8vIFNhbml0aXplcyByZWFkL3dyaXRlIGluZGV4XG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9zYW5pdGl6ZUluZGV4KCkge1xuICAgICAgaWYgKHRoaXMuX2luZGV4IDwgMCkge1xuICAgICAgICB0aGlzLl9pbmRleCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5faW5kZXggPiB0aGlzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9pbmRleCA9IHRoaXMubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ19leHRyYWN0QnVmZmVyJyxcblxuICAgIC8vIEV4dHJhY3RzIGJ1ZmZlciBmcm9tIGdpdmVuIHNvdXJjZSBhbmQgb3B0aW9uYWxseSBjbG9uZXMgaXRcbiAgICB2YWx1ZTogZnVuY3Rpb24gX2V4dHJhY3RCdWZmZXIoc291cmNlKSB7XG4gICAgICB2YXIgY2xvbmUgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogYXJndW1lbnRzWzFdO1xuXG4gICAgICAvLyBXaGV0aGVyIHNvdXJjZSBpcyBhIGJ5dGUtYXdhcmUgb2JqZWN0XG4gICAgICBpZiAoc291cmNlICYmIHR5cGVvZiBzb3VyY2UuYnl0ZUxlbmd0aCAhPT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAvLyBEZXRlcm1pbmUgd2hldGhlciBzb3VyY2UgaXMgYSB2aWV3IG9yIGEgcmF3IGJ1ZmZlclxuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZS5idWZmZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIGNsb25lID8gc291cmNlLmJ1ZmZlci5zbGljZSgwKSA6IHNvdXJjZS5idWZmZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGNsb25lID8gc291cmNlLnNsaWNlKDApIDogc291cmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2hldGhlciBzb3VyY2UgaXMgYSBzZXF1ZW5jZSBvZiBieXRlc1xuICAgICAgfSBlbHNlIGlmIChzb3VyY2UgJiYgdHlwZW9mIHNvdXJjZS5sZW5ndGggIT09ICd1bmRlZmluZWQnKSB7XG5cbiAgICAgICAgLy8gQWx0aG91Z2ggVWludDhBcnJheSdzIGNvbnN0cnVjdG9yIHN1Y2NlZWRzIHdoZW4gZ2l2ZW4gc3RyaW5ncyxcbiAgICAgICAgLy8gaXQgZG9lcyBub3QgY29ycmVjdGx5IGluc3RhbnRpYXRlIHRoZSBidWZmZXJcbiAgICAgICAgaWYgKHNvdXJjZS5jb25zdHJ1Y3RvciA9PSBTdHJpbmcpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHNvdXJjZSkuYnVmZmVyO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm8gYnVmZmVyIGZvdW5kXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdmcm9udCcsXG5cbiAgICAvLyBTZXRzIGluZGV4IHRvIGZyb250IG9mIHRoZSBidWZmZXJcbiAgICB2YWx1ZTogZnVuY3Rpb24gZnJvbnQoKSB7XG4gICAgICB0aGlzLl9pbmRleCA9IDA7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdlbmQnLFxuXG4gICAgLy8gU2V0cyBpbmRleCB0byBlbmQgb2YgdGhlIGJ1ZmZlclxuICAgIHZhbHVlOiBmdW5jdGlvbiBlbmQoKSB7XG4gICAgICB0aGlzLl9pbmRleCA9IHRoaXMubGVuZ3RoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnc2VlaycsXG5cbiAgICAvLyBTZWVrcyBnaXZlbiBudW1iZXIgb2YgYnl0ZXNcbiAgICAvLyBOb3RlOiBCYWNrd2FyZHMgc2Vla2luZyBpcyBzdXBwb3J0ZWRcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2VlaygpIHtcbiAgICAgIHZhciBieXRlcyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gMSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgdGhpcy5pbmRleCArPSBieXRlcztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3JlYWQnLFxuXG4gICAgLy8gUmVhZHMgc2VxdWVuY2Ugb2YgZ2l2ZW4gbnVtYmVyIG9mIGJ5dGVzIChkZWZhdWx0cyB0byBudW1iZXIgb2YgYnl0ZXMgYXZhaWxhYmxlKVxuICAgIHZhbHVlOiBmdW5jdGlvbiByZWFkKCkge1xuICAgICAgdmFyIGJ5dGVzID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0aGlzLmF2YWlsYWJsZSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgaWYgKGJ5dGVzID4gdGhpcy5hdmFpbGFibGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcmVhZCAnICsgYnl0ZXMgKyAnIGJ5dGUocyksICcgKyB0aGlzLmF2YWlsYWJsZSArICcgYXZhaWxhYmxlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChieXRlcyA8PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIG51bWJlciBvZiBieXRlcyAnICsgYnl0ZXMpO1xuICAgICAgfVxuXG4gICAgICB2YXIgdmFsdWUgPSBuZXcgQnl0ZUJ1ZmZlcih0aGlzLl9idWZmZXIuc2xpY2UodGhpcy5faW5kZXgsIHRoaXMuX2luZGV4ICsgYnl0ZXMpLCB0aGlzLm9yZGVyKTtcbiAgICAgIHRoaXMuX2luZGV4ICs9IGJ5dGVzO1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3dyaXRlJyxcblxuICAgIC8vIFdyaXRlcyBzZXF1ZW5jZSBvZiBieXRlc1xuICAgIHZhbHVlOiBmdW5jdGlvbiB3cml0ZShzZXF1ZW5jZSkge1xuICAgICAgdmFyIHZpZXc7XG5cbiAgICAgIC8vIEVuc3VyZSB3ZSdyZSBkZWFsaW5nIHdpdGggYSBVaW50OEFycmF5IHZpZXdcbiAgICAgIGlmICghKHNlcXVlbmNlIGluc3RhbmNlb2YgVWludDhBcnJheSkpIHtcblxuICAgICAgICAvLyBFeHRyYWN0IHRoZSBidWZmZXIgZnJvbSB0aGUgc2VxdWVuY2VcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMuX2V4dHJhY3RCdWZmZXIoc2VxdWVuY2UpO1xuICAgICAgICBpZiAoIWJ1ZmZlcikge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCB3cml0ZSAnICsgc2VxdWVuY2UgKyAnLCBub3QgYSBzZXF1ZW5jZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQW5kIGNyZWF0ZSBhIG5ldyBVaW50OEFycmF5IHZpZXcgZm9yIGl0XG4gICAgICAgIHZpZXcgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlldyA9IHNlcXVlbmNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgYXZhaWxhYmxlID0gdGhpcy5hdmFpbGFibGU7XG4gICAgICBpZiAodmlldy5ieXRlTGVuZ3RoID4gYXZhaWxhYmxlKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbXBsaWNpdEdyb3d0aCkge1xuICAgICAgICAgIHRoaXMuYXBwZW5kKHZpZXcuYnl0ZUxlbmd0aCAtIGF2YWlsYWJsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgd3JpdGUgJyArIHNlcXVlbmNlICsgJyB1c2luZyAnICsgdmlldy5ieXRlTGVuZ3RoICsgJyBieXRlKHMpLCAnICsgdGhpcy5hdmFpbGFibGUgKyAnIGF2YWlsYWJsZScpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3Jhdy5zZXQodmlldywgdGhpcy5faW5kZXgpO1xuICAgICAgdGhpcy5faW5kZXggKz0gdmlldy5ieXRlTGVuZ3RoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAncmVhZFN0cmluZycsXG5cbiAgICAvLyBSZWFkcyBVVEYtOCBlbmNvZGVkIHN0cmluZyBvZiBnaXZlbiBudW1iZXIgb2YgYnl0ZXMgKGRlZmF1bHRzIHRvIG51bWJlciBvZiBieXRlcyBhdmFpbGFibGUpXG4gICAgLy9cbiAgICAvLyBCYXNlZCBvbiBEYXZpZCBGbGFuYWdhbidzIEJ1ZmZlclZpZXcgKGh0dHBzOi8vZ2l0aHViLmNvbS9kYXZpZGZsYW5hZ2FuL0J1ZmZlclZpZXcvYmxvYi9tYXN0ZXIvQnVmZmVyVmlldy5qcy8vTDE5NSlcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVhZFN0cmluZygpIHtcbiAgICAgIHZhciBieXRlcyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdGhpcy5hdmFpbGFibGUgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgIGlmIChieXRlcyA+IHRoaXMuYXZhaWxhYmxlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJlYWQgJyArIGJ5dGVzICsgJyBieXRlKHMpLCAnICsgdGhpcy5hdmFpbGFibGUgKyAnIGF2YWlsYWJsZScpO1xuICAgICAgfVxuXG4gICAgICBpZiAoYnl0ZXMgPD0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW52YWxpZCBudW1iZXIgb2YgYnl0ZXMgJyArIGJ5dGVzKTtcbiAgICAgIH1cblxuICAgICAgLy8gTG9jYWwgcmVmZXJlbmNlXG4gICAgICB2YXIgcmF3ID0gdGhpcy5fcmF3O1xuXG4gICAgICAvLyBIb2xkcyBkZWNvZGVkIGNoYXJhY3RlcnNcbiAgICAgIHZhciBjb2RlcG9pbnRzID0gW107XG5cbiAgICAgIC8vIEluZGV4IGludG8gY29kZXBvaW50c1xuICAgICAgdmFyIGMgPSAwO1xuXG4gICAgICAvLyBCeXRlc1xuICAgICAgdmFyIGIxLFxuICAgICAgICAgIGIyLFxuICAgICAgICAgIGIzLFxuICAgICAgICAgIGI0ID0gbnVsbDtcblxuICAgICAgLy8gVGFyZ2V0IGluZGV4XG4gICAgICB2YXIgdGFyZ2V0ID0gdGhpcy5faW5kZXggKyBieXRlcztcblxuICAgICAgd2hpbGUgKHRoaXMuX2luZGV4IDwgdGFyZ2V0KSB7XG4gICAgICAgIGIxID0gcmF3W3RoaXMuX2luZGV4XTtcblxuICAgICAgICBpZiAoYjEgPCAxMjgpIHtcbiAgICAgICAgICAvLyBPbmUgYnl0ZSBzZXF1ZW5jZVxuICAgICAgICAgIGNvZGVwb2ludHNbYysrXSA9IGIxO1xuICAgICAgICAgIHRoaXMuX2luZGV4Kys7XG4gICAgICAgIH0gZWxzZSBpZiAoYjEgPCAxOTQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgY29udGludWF0aW9uIGJ5dGUnKTtcbiAgICAgICAgfSBlbHNlIGlmIChiMSA8IDIyNCkge1xuICAgICAgICAgIC8vIFR3byBieXRlIHNlcXVlbmNlXG4gICAgICAgICAgYjIgPSByYXdbdGhpcy5faW5kZXggKyAxXTtcblxuICAgICAgICAgIGlmIChiMiA8IDEyOCB8fCBiMiA+IDE5MSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCYWQgY29udGludWF0aW9uIGJ5dGUnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb2RlcG9pbnRzW2MrK10gPSAoKGIxICYgMzEpIDw8IDYpICsgKGIyICYgNjMpO1xuXG4gICAgICAgICAgdGhpcy5faW5kZXggKz0gMjtcbiAgICAgICAgfSBlbHNlIGlmIChiMSA8IDI0MCkge1xuXG4gICAgICAgICAgLy8gVGhyZWUgYnl0ZSBzZXF1ZW5jZVxuICAgICAgICAgIGIyID0gcmF3W3RoaXMuX2luZGV4ICsgMV07XG5cbiAgICAgICAgICBpZiAoYjIgPCAxMjggfHwgYjIgPiAxOTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQmFkIGNvbnRpbnVhdGlvbiBieXRlJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYjMgPSByYXdbdGhpcy5faW5kZXggKyAyXTtcblxuICAgICAgICAgIGlmIChiMyA8IDEyOCB8fCBiMyA+IDE5MSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCYWQgY29udGludWF0aW9uIGJ5dGUnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb2RlcG9pbnRzW2MrK10gPSAoKGIxICYgMTUpIDw8IDEyKSArICgoYjIgJiA2MykgPDwgNikgKyAoYjMgJiA2Myk7XG5cbiAgICAgICAgICB0aGlzLl9pbmRleCArPSAzO1xuICAgICAgICB9IGVsc2UgaWYgKGIxIDwgMjQ1KSB7XG4gICAgICAgICAgLy8gRm91ciBieXRlIHNlcXVlbmNlXG4gICAgICAgICAgYjIgPSByYXdbdGhpcy5faW5kZXggKyAxXTtcblxuICAgICAgICAgIGlmIChiMiA8IDEyOCB8fCBiMiA+IDE5MSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCYWQgY29udGludWF0aW9uIGJ5dGUnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBiMyA9IHJhd1t0aGlzLl9pbmRleCArIDJdO1xuXG4gICAgICAgICAgaWYgKGIzIDwgMTI4IHx8IGIzID4gMTkxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhZCBjb250aW51YXRpb24gYnl0ZScpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGI0ID0gcmF3W3RoaXMuX2luZGV4ICsgM107XG5cbiAgICAgICAgICBpZiAoYjQgPCAxMjggfHwgYjQgPiAxOTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQmFkIGNvbnRpbnVhdGlvbiBieXRlJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGNwID0gKChiMSAmIDcpIDw8IDE4KSArICgoYjIgJiA2MykgPDwgMTIpICsgKChiMyAmIDYzKSA8PCA2KSArIChiNCAmIDYzKTtcbiAgICAgICAgICBjcCAtPSA2NTUzNjtcblxuICAgICAgICAgIC8vIFR1cm4gY29kZSBwb2ludCBpbnRvIHR3byBzdXJyb2dhdGUgcGFpcnNcbiAgICAgICAgICBjb2RlcG9pbnRzW2MrK10gPSA1NTI5NiArICgoY3AgJiAxMDQ3NTUyKSA+Pj4gMTApO1xuICAgICAgICAgIGNvZGVwb2ludHNbYysrXSA9IDU2MzIwICsgKGNwICYgMTAyMyk7XG5cbiAgICAgICAgICB0aGlzLl9pbmRleCArPSA0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBieXRlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQnJvd3NlcnMgbWF5IGhhdmUgaGFyZGNvZGVkIG9yIGltcGxpY2l0IGxpbWl0cyBvbiB0aGUgYXJyYXkgbGVuZ3RoIHdoZW4gYXBwbHlpbmcgYSBmdW5jdGlvblxuICAgICAgLy8gU2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9GdW5jdGlvbi9hcHBseS8vYXBwbHlfYW5kX2J1aWx0LWluX2Z1bmN0aW9uc1xuICAgICAgdmFyIGxpbWl0ID0gMSA8PCAxNjtcbiAgICAgIHZhciBsZW5ndGggPSBjb2RlcG9pbnRzLmxlbmd0aDtcbiAgICAgIGlmIChsZW5ndGggPCBsaW1pdCkge1xuICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVwb2ludHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGNoYXJzID0gW107XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBsZW5ndGgpIHtcbiAgICAgICAgICBjaGFycy5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlcG9pbnRzLnNsaWNlKGksIGkgKyBsaW1pdCkpKTtcbiAgICAgICAgICBpICs9IGxpbWl0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGFycy5qb2luKCcnKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd3cml0ZVN0cmluZycsXG5cbiAgICAvLyBXcml0ZXMgVVRGLTggZW5jb2RlZCBzdHJpbmdcbiAgICAvLyBOb3RlOiBEb2VzIG5vdCB3cml0ZSBzdHJpbmcgbGVuZ3RoIG9yIHRlcm1pbmF0b3JcbiAgICAvL1xuICAgIC8vIEJhc2VkIG9uIERhdmlkIEZsYW5hZ2FuJ3MgQnVmZmVyVmlldyAoaHR0cHM6Ly9naXRodWIuY29tL2RhdmlkZmxhbmFnYW4vQnVmZmVyVmlldy9ibG9iL21hc3Rlci9CdWZmZXJWaWV3LmpzLy9MMjY0KVxuICAgIHZhbHVlOiBmdW5jdGlvbiB3cml0ZVN0cmluZyhzdHJpbmcpIHtcblxuICAgICAgLy8gRW5jb2RlZCBVVEYtOCBieXRlc1xuICAgICAgdmFyIGJ5dGVzID0gW107XG5cbiAgICAgIC8vIFN0cmluZyBsZW5ndGgsIG9mZnNldCBhbmQgYnl0ZSBvZmZzZXRcbiAgICAgIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuICAgICAgdmFyIGkgPSAwO1xuICAgICAgdmFyIGIgPSAwO1xuXG4gICAgICB3aGlsZSAoaSA8IGxlbmd0aCkge1xuICAgICAgICB2YXIgYyA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xuXG4gICAgICAgIGlmIChjIDw9IDEyNykge1xuICAgICAgICAgIC8vIE9uZSBieXRlIHNlcXVlbmNlXG4gICAgICAgICAgYnl0ZXNbYisrXSA9IGM7XG4gICAgICAgIH0gZWxzZSBpZiAoYyA8PSAyMDQ3KSB7XG4gICAgICAgICAgLy8gVHdvIGJ5dGUgc2VxdWVuY2VcbiAgICAgICAgICBieXRlc1tiKytdID0gMTkyIHwgKGMgJiAxOTg0KSA+Pj4gNjtcbiAgICAgICAgICBieXRlc1tiKytdID0gMTI4IHwgYyAmIDYzO1xuICAgICAgICB9IGVsc2UgaWYgKGMgPD0gNTUyOTUgfHwgYyA+PSA1NzM0NCAmJiBjIDw9IDY1NTM1KSB7XG4gICAgICAgICAgLy8gVGhyZWUgYnl0ZSBzZXF1ZW5jZVxuICAgICAgICAgIC8vIFNvdXJjZSBjaGFyYWN0ZXIgaXMgbm90IGEgVVRGLTE2IHN1cnJvZ2F0ZVxuICAgICAgICAgIGJ5dGVzW2IrK10gPSAyMjQgfCAoYyAmIDYxNDQwKSA+Pj4gMTI7XG4gICAgICAgICAgYnl0ZXNbYisrXSA9IDEyOCB8IChjICYgNDAzMikgPj4+IDY7XG4gICAgICAgICAgYnl0ZXNbYisrXSA9IDEyOCB8IGMgJiA2MztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBGb3VyIGJ5dGUgc2VxdWVuY2VcbiAgICAgICAgICBpZiAoaSA9PSBsZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VucGFpcmVkIHN1cnJvZ2F0ZSAnICsgc3RyaW5nW2ldICsgJyAoaW5kZXggJyArIGkgKyAnKScpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJldHJpZXZlIHN1cnJvZ2F0ZVxuICAgICAgICAgIHZhciBkID0gc3RyaW5nLmNoYXJDb2RlQXQoKytpKTtcbiAgICAgICAgICBpZiAoYyA8IDU1Mjk2IHx8IGMgPiA1NjMxOSB8fCBkIDwgNTYzMjAgfHwgZCA+IDU3MzQzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VucGFpcmVkIHN1cnJvZ2F0ZSAnICsgc3RyaW5nW2ldICsgJyAoaW5kZXggJyArIGkgKyAnKScpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBjcCA9ICgoYyAmIDEwMjMpIDw8IDEwKSArIChkICYgMTAyMykgKyA2NTUzNjtcblxuICAgICAgICAgIGJ5dGVzW2IrK10gPSAyNDAgfCAoY3AgJiAxODM1MDA4KSA+Pj4gMTg7XG4gICAgICAgICAgYnl0ZXNbYisrXSA9IDEyOCB8IChjcCAmIDI1ODA0OCkgPj4+IDEyO1xuICAgICAgICAgIGJ5dGVzW2IrK10gPSAxMjggfCAoY3AgJiA0MDMyKSA+Pj4gNjtcbiAgICAgICAgICBieXRlc1tiKytdID0gMTI4IHwgY3AgJiA2MztcbiAgICAgICAgfVxuXG4gICAgICAgICsraTtcbiAgICAgIH1cblxuICAgICAgdGhpcy53cml0ZShieXRlcyk7XG5cbiAgICAgIHJldHVybiBieXRlcy5sZW5ndGg7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAncmVhZENTdHJpbmcnLFxuXG4gICAgLy8gQWxpYXNlcyBmb3IgcmVhZGluZy93cml0aW5nIFVURi04IGVuY29kZWQgc3RyaW5nc1xuICAgIC8vIHJlYWRVVEZDaGFyczogdGhpcy46OnJlYWRTdHJpbmdcbiAgICAvLyB3cml0ZVVURkNoYXJzOiB0aGlzLjo6d3JpdGVTdHJpbmdcblxuICAgIC8vIFJlYWRzIFVURi04IGVuY29kZWQgQy1zdHJpbmcgKGV4Y2x1ZGluZyB0aGUgYWN0dWFsIE5VTEwtYnl0ZSlcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVhZENTdHJpbmcoKSB7XG4gICAgICB2YXIgYnl0ZXMgPSB0aGlzLl9yYXc7XG4gICAgICB2YXIgbGVuZ3RoID0gYnl0ZXMubGVuZ3RoO1xuICAgICAgdmFyIGkgPSB0aGlzLl9pbmRleDtcbiAgICAgIHdoaWxlIChieXRlc1tpXSAhPSAwICYmIGkgPCBsZW5ndGgpIHtcbiAgICAgICAgKytpO1xuICAgICAgfVxuXG4gICAgICBsZW5ndGggPSBpIC0gdGhpcy5faW5kZXg7XG4gICAgICBpZiAobGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgc3RyaW5nID0gdGhpcy5yZWFkU3RyaW5nKGxlbmd0aCk7XG4gICAgICAgIHRoaXMucmVhZEJ5dGUoKTtcbiAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnd3JpdGVDU3RyaW5nJyxcblxuICAgIC8vIFdyaXRlcyBVVEYtOCBlbmNvZGVkIEMtc3RyaW5nIChOVUxMLXRlcm1pbmF0ZWQpXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHdyaXRlQ1N0cmluZyhzdHJpbmcpIHtcbiAgICAgIHZhciBieXRlcyA9IHRoaXMud3JpdGVTdHJpbmcoc3RyaW5nKTtcbiAgICAgIHRoaXMud3JpdGVCeXRlKDApO1xuICAgICAgcmV0dXJuICsrYnl0ZXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAncHJlcGVuZCcsXG5cbiAgICAvLyBQcmVwZW5kcyBnaXZlbiBudW1iZXIgb2YgYnl0ZXNcbiAgICB2YWx1ZTogZnVuY3Rpb24gcHJlcGVuZChieXRlcykge1xuICAgICAgaWYgKGJ5dGVzIDw9IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0ludmFsaWQgbnVtYmVyIG9mIGJ5dGVzICcgKyBieXRlcyk7XG4gICAgICB9XG5cbiAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGggKyBieXRlcyk7XG4gICAgICB2aWV3LnNldCh0aGlzLl9yYXcsIGJ5dGVzKTtcbiAgICAgIHRoaXMuX2luZGV4ICs9IGJ5dGVzO1xuICAgICAgdGhpcy5idWZmZXIgPSB2aWV3LmJ1ZmZlcjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2FwcGVuZCcsXG5cbiAgICAvLyBBcHBlbmRzIGdpdmVuIG51bWJlciBvZiBieXRlc1xuICAgIHZhbHVlOiBmdW5jdGlvbiBhcHBlbmQoYnl0ZXMpIHtcbiAgICAgIGlmIChieXRlcyA8PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIG51bWJlciBvZiBieXRlcyAnICsgYnl0ZXMpO1xuICAgICAgfVxuXG4gICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoICsgYnl0ZXMpO1xuICAgICAgdmlldy5zZXQodGhpcy5fcmF3LCAwKTtcbiAgICAgIHRoaXMuYnVmZmVyID0gdmlldy5idWZmZXI7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdjbGlwJyxcblxuICAgIC8vIENsaXBzIHRoaXMgYnVmZmVyXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsaXAoKSB7XG4gICAgICB2YXIgYmVnaW4gPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRoaXMuX2luZGV4IDogYXJndW1lbnRzWzBdO1xuICAgICAgdmFyIGVuZCA9IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gdGhpcy5sZW5ndGggOiBhcmd1bWVudHNbMV07XG5cbiAgICAgIGlmIChiZWdpbiA8IDApIHtcbiAgICAgICAgYmVnaW4gPSB0aGlzLmxlbmd0aCArIGJlZ2luO1xuICAgICAgfVxuICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMuX2J1ZmZlci5zbGljZShiZWdpbiwgZW5kKTtcbiAgICAgIHRoaXMuX2luZGV4IC09IGJlZ2luO1xuICAgICAgdGhpcy5idWZmZXIgPSBidWZmZXI7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdzbGljZScsXG5cbiAgICAvLyBTbGljZXMgdGhpcyBidWZmZXJcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2xpY2UoKSB7XG4gICAgICB2YXIgYmVnaW4gPSBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IDAgOiBhcmd1bWVudHNbMF07XG4gICAgICB2YXIgZW5kID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGFyZ3VtZW50c1sxXTtcblxuICAgICAgdmFyIHNsaWNlID0gbmV3IEJ5dGVCdWZmZXIodGhpcy5fYnVmZmVyLnNsaWNlKGJlZ2luLCBlbmQpLCB0aGlzLm9yZGVyKTtcbiAgICAgIHJldHVybiBzbGljZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdjbG9uZScsXG5cbiAgICAvLyBDbG9uZXMgdGhpcyBidWZmZXJcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2xvbmUoKSB7XG4gICAgICB2YXIgY2xvbmUgPSBuZXcgQnl0ZUJ1ZmZlcih0aGlzLl9idWZmZXIuc2xpY2UoMCksIHRoaXMub3JkZXIsIHRoaXMuaW1wbGljaXRHcm93dGgpO1xuICAgICAgY2xvbmUuaW5kZXggPSB0aGlzLl9pbmRleDtcbiAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdyZXZlcnNlJyxcblxuICAgIC8vIFJldmVyc2VzIHRoaXMgYnVmZmVyXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJldmVyc2UoKSB7XG4gICAgICBBcnJheS5wcm90b3R5cGUucmV2ZXJzZS5jYWxsKHRoaXMuX3Jhdyk7XG4gICAgICB0aGlzLl9pbmRleCA9IDA7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd0b0FycmF5JyxcblxuICAgIC8vIEFycmF5IG9mIGJ5dGVzIGluIHRoaXMgYnVmZmVyXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHRvQXJyYXkoKSB7XG4gICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fcmF3LCAwKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd0b1N0cmluZycsXG5cbiAgICAvLyBTaG9ydCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBidWZmZXJcbiAgICB2YWx1ZTogZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgICB2YXIgb3JkZXIgPSB0aGlzLl9vcmRlciA9PSB0aGlzLmNvbnN0cnVjdG9yLkJJR19FTkRJQU4gPyAnYmlnLWVuZGlhbicgOiAnbGl0dGxlLWVuZGlhbic7XG4gICAgICByZXR1cm4gJ1tCeXRlQnVmZmVyOyBPcmRlcjogJyArIG9yZGVyICsgJzsgTGVuZ3RoOiAnICsgdGhpcy5sZW5ndGggKyAnOyBJbmRleDogJyArIHRoaXMuX2luZGV4ICsgJzsgQXZhaWxhYmxlOiAnICsgdGhpcy5hdmFpbGFibGUgKyAnXSc7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAndG9IZXgnLFxuXG4gICAgLy8gSGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgYnVmZmVyIHdpdGggZ2l2ZW4gc3BhY2VyXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHRvSGV4KCkge1xuICAgICAgdmFyIHNwYWNlciA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gJyAnIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXMuX3JhdywgZnVuY3Rpb24gKGJ5dGUpIHtcbiAgICAgICAgcmV0dXJuICgnMDAnICsgYnl0ZS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKSkuc2xpY2UoLTIpO1xuICAgICAgfSkuam9pbihzcGFjZXIpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3RvQVNDSUknLFxuXG4gICAgLy8gQVNDSUkgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBidWZmZXIgd2l0aCBnaXZlbiBzcGFjZXIgYW5kIG9wdGlvbmFsIGJ5dGUgYWxpZ25tZW50XG4gICAgdmFsdWU6IGZ1bmN0aW9uIHRvQVNDSUkoKSB7XG4gICAgICB2YXIgc3BhY2VyID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnICcgOiBhcmd1bWVudHNbMF07XG4gICAgICB2YXIgYWxpZ24gPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMV07XG4gICAgICB2YXIgdW5rbm93biA9IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8gJ++/vScgOiBhcmd1bWVudHNbMl07XG5cbiAgICAgIHZhciBwcmVmaXggPSBhbGlnbiA/ICcgJyA6ICcnO1xuICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLl9yYXcsIGZ1bmN0aW9uIChieXRlKSB7XG4gICAgICAgIHJldHVybiBieXRlIDwgMzIgfHwgYnl0ZSA+IDEyNiA/IHByZWZpeCArIHVua25vd24gOiBwcmVmaXggKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpO1xuICAgICAgfSkuam9pbihzcGFjZXIpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2J1ZmZlcicsXG5cbiAgICAvLyBSZXRyaWV2ZXMgYnVmZmVyXG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYnVmZmVyO1xuICAgIH0sXG5cbiAgICAvLyBTZXRzIG5ldyBidWZmZXIgYW5kIHNhbml0aXplcyByZWFkL3dyaXRlIGluZGV4XG4gICAgc2V0OiBmdW5jdGlvbiAoYnVmZmVyKSB7XG4gICAgICB0aGlzLl9idWZmZXIgPSBidWZmZXI7XG4gICAgICB0aGlzLl9yYXcgPSBuZXcgVWludDhBcnJheSh0aGlzLl9idWZmZXIpO1xuICAgICAgdGhpcy5fdmlldyA9IG5ldyBEYXRhVmlldyh0aGlzLl9idWZmZXIpO1xuICAgICAgdGhpcy5fc2FuaXRpemVJbmRleCgpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3JhdycsXG5cbiAgICAvLyBSZXRyaWV2ZXMgcmF3IGJ1ZmZlclxuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JhdztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd2aWV3JyxcblxuICAgIC8vIFJldHJpZXZlcyB2aWV3XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdmlldztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdsZW5ndGgnLFxuXG4gICAgLy8gUmV0cmlldmVzIG51bWJlciBvZiBieXRlc1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2J1ZmZlci5ieXRlTGVuZ3RoO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2J5dGVMZW5ndGgnLFxuXG4gICAgLy8gUmV0cmlldmVzIG51bWJlciBvZiBieXRlc1xuICAgIC8vIE5vdGU6IFRoaXMgYWxsb3dzIGZvciBCeXRlQnVmZmVyIHRvIGJlIGRldGVjdGVkIGFzIGEgcHJvcGVyIHNvdXJjZSBieSBpdHMgb3duIGNvbnN0cnVjdG9yXG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZW5ndGg7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnb3JkZXInLFxuXG4gICAgLy8gUmV0cmlldmVzIGJ5dGUgb3JkZXJcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9vcmRlcjtcbiAgICB9LFxuXG4gICAgLy8gU2V0cyBieXRlIG9yZGVyXG4gICAgc2V0OiBmdW5jdGlvbiAob3JkZXIpIHtcbiAgICAgIHRoaXMuX29yZGVyID0gISFvcmRlcjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdpbXBsaWNpdEdyb3d0aCcsXG5cbiAgICAvLyBSZXRyaWV2ZXMgaW1wbGljaXQgZ3Jvd3RoIHN0cmF0ZWd5XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5faW1wbGljaXRHcm93dGg7XG4gICAgfSxcblxuICAgIC8vIFNldHMgaW1wbGljaXQgZ3Jvd3RoIHN0cmF0ZWd5XG4gICAgc2V0OiBmdW5jdGlvbiAoaW1wbGljaXRHcm93dGgpIHtcbiAgICAgIHRoaXMuX2ltcGxpY2l0R3Jvd3RoID0gISFpbXBsaWNpdEdyb3d0aDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdpbmRleCcsXG5cbiAgICAvLyBSZXRyaWV2ZXMgcmVhZC93cml0ZSBpbmRleFxuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2luZGV4O1xuICAgIH0sXG5cbiAgICAvLyBTZXRzIHJlYWQvd3JpdGUgaW5kZXhcbiAgICBzZXQ6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIGluZGV4ICcgKyBpbmRleCArICcsIHNob3VsZCBiZSBiZXR3ZWVuIDAgYW5kICcgKyB0aGlzLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnYXZhaWxhYmxlJyxcblxuICAgIC8vIFJldHJpZXZlcyBudW1iZXIgb2YgYXZhaWxhYmxlIGJ5dGVzXG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZW5ndGggLSB0aGlzLl9pbmRleDtcbiAgICB9XG4gIH1dLCBbe1xuICAgIGtleTogJ0xJVFRMRV9FTkRJQU4nLFxuXG4gICAgLy8gQnl0ZSBvcmRlciBjb25zdGFudHNcbiAgICB2YWx1ZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH0sIHtcbiAgICBrZXk6ICdCSUdfRU5ESUFOJyxcbiAgICB2YWx1ZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9XSk7XG5cbiAgcmV0dXJuIEJ5dGVCdWZmZXI7XG59KSgpO1xuXG4vLyBHZW5lcmljIHJlYWRlclxudmFyIHJlYWRlciA9IGZ1bmN0aW9uIHJlYWRlcihtZXRob2QsIGJ5dGVzKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9yZGVyID0gYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0aGlzLl9vcmRlciA6IGFyZ3VtZW50c1swXTtcblxuICAgIGlmIChieXRlcyA+IHRoaXMuYXZhaWxhYmxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCByZWFkICcgKyBieXRlcyArICcgYnl0ZShzKSwgJyArIHRoaXMuYXZhaWxhYmxlICsgJyBhdmFpbGFibGUnKTtcbiAgICB9XG5cbiAgICB2YXIgdmFsdWUgPSB0aGlzLl92aWV3W21ldGhvZF0odGhpcy5faW5kZXgsIG9yZGVyKTtcbiAgICB0aGlzLl9pbmRleCArPSBieXRlcztcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG59O1xuXG4vLyBHZW5lcmljIHdyaXRlclxudmFyIHdyaXRlciA9IGZ1bmN0aW9uIHdyaXRlcihtZXRob2QsIGJ5dGVzKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB2YXIgb3JkZXIgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHRoaXMuX29yZGVyIDogYXJndW1lbnRzWzFdO1xuXG4gICAgdmFyIGF2YWlsYWJsZSA9IHRoaXMuYXZhaWxhYmxlO1xuICAgIGlmIChieXRlcyA+IGF2YWlsYWJsZSkge1xuICAgICAgaWYgKHRoaXMuX2ltcGxpY2l0R3Jvd3RoKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKGJ5dGVzIC0gYXZhaWxhYmxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHdyaXRlICcgKyB2YWx1ZSArICcgdXNpbmcgJyArIGJ5dGVzICsgJyBieXRlKHMpLCAnICsgYXZhaWxhYmxlICsgJyBhdmFpbGFibGUnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl92aWV3W21ldGhvZF0odGhpcy5faW5kZXgsIHZhbHVlLCBvcmRlcik7XG4gICAgdGhpcy5faW5kZXggKz0gYnl0ZXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG59O1xuXG4vLyBSZWFkZXJzIGZvciBieXRlcywgc2hvcnRzLCBpbnRlZ2VycywgZmxvYXRzIGFuZCBkb3VibGVzXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFkQnl0ZSA9IHJlYWRlcignZ2V0SW50OCcsIDEpO1xuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucmVhZFVuc2lnbmVkQnl0ZSA9IHJlYWRlcignZ2V0VWludDgnLCAxKTtcbkJ5dGVCdWZmZXIucHJvdG90eXBlLnJlYWRTaG9ydCA9IHJlYWRlcignZ2V0SW50MTYnLCAyKTtcbkJ5dGVCdWZmZXIucHJvdG90eXBlLnJlYWRVbnNpZ25lZFNob3J0ID0gcmVhZGVyKCdnZXRVaW50MTYnLCAyKTtcbkJ5dGVCdWZmZXIucHJvdG90eXBlLnJlYWRJbnQgPSByZWFkZXIoJ2dldEludDMyJywgNCk7XG5CeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFkVW5zaWduZWRJbnQgPSByZWFkZXIoJ2dldFVpbnQzMicsIDQpO1xuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0ID0gcmVhZGVyKCdnZXRGbG9hdDMyJywgNCk7XG5CeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlID0gcmVhZGVyKCdnZXRGbG9hdDY0JywgOCk7XG5cbi8vIFdyaXRlcnMgZm9yIGJ5dGVzLCBzaG9ydHMsIGludGVnZXJzLCBmbG9hdHMgYW5kIGRvdWJsZXNcbkJ5dGVCdWZmZXIucHJvdG90eXBlLndyaXRlQnl0ZSA9IHdyaXRlcignc2V0SW50OCcsIDEpO1xuQnl0ZUJ1ZmZlci5wcm90b3R5cGUud3JpdGVVbnNpZ25lZEJ5dGUgPSB3cml0ZXIoJ3NldFVpbnQ4JywgMSk7XG5CeXRlQnVmZmVyLnByb3RvdHlwZS53cml0ZVNob3J0ID0gd3JpdGVyKCdzZXRJbnQxNicsIDIpO1xuQnl0ZUJ1ZmZlci5wcm90b3R5cGUud3JpdGVVbnNpZ25lZFNob3J0ID0gd3JpdGVyKCdzZXRVaW50MTYnLCAyKTtcbkJ5dGVCdWZmZXIucHJvdG90eXBlLndyaXRlSW50ID0gd3JpdGVyKCdzZXRJbnQzMicsIDQpO1xuQnl0ZUJ1ZmZlci5wcm90b3R5cGUud3JpdGVVbnNpZ25lZEludCA9IHdyaXRlcignc2V0VWludDMyJywgNCk7XG5CeXRlQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0ID0gd3JpdGVyKCdzZXRGbG9hdDMyJywgNCk7XG5CeXRlQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZSA9IHdyaXRlcignc2V0RmxvYXQ2NCcsIDgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ5dGVCdWZmZXI7XG59LHt9XX0se30sWzFdKVxuKDEpXG59KTtcblxuICAvKlxuICogIEJpbmFyeVNvY2tldCAtIEJpbmFyeSBXZWIgU29ja2V0c1xuICogIENvcHlyaWdodCAoQykgMjAxNiAgUm9sYW5kIFNpbmdlciA8cm9sYW5kLnNpbmdlclthdF1kZXNlcnRiaXQuY29tPlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqICAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qXG4qICBUaGlzIGNvZGUgbGl2ZXMgaW5zaWRlIHRoZSBCaW5hcnlTb2NrZXQgZnVuY3Rpb24uXG4qL1xuXG52YXIgdXRpbHMgPSB7XG4gIC8vIE1pbWljcyBqUXVlcnkncyBleHRlbmQgbWV0aG9kLlxuICAvLyBTb3VyY2U6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTExOTcyNDcvamF2YXNjcmlwdC1lcXVpdmFsZW50LW9mLWpxdWVyeXMtZXh0ZW5kLW1ldGhvZFxuICBleHRlbmQ6IGZ1bmN0aW9uKCkge1xuICAgIGZvcih2YXIgaT0xOyBpPGFyZ3VtZW50cy5sZW5ndGg7IGkrKylcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gYXJndW1lbnRzW2ldKVxuICAgICAgICAgICAgaWYoYXJndW1lbnRzW2ldLmhhc093blByb3BlcnR5KGtleSkpXG4gICAgICAgICAgICAgICAgYXJndW1lbnRzWzBdW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcbiAgICByZXR1cm4gYXJndW1lbnRzWzBdO1xuICB9LFxuXG4gIC8vIFJldHVybiBhIGZ1bmN0aW9uIHdoaWNoIGlzIHRyaWdnZXJlZCBvbmx5IG9uY2Ugd2l0aGluIHRoZSBsaW1pdCBkdXJhdGlvbi5cbiAgLy8gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgdGhyb3R0bGU6IGZ1bmN0aW9uKGNhbGxiYWNrLCBsaW1pdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHdhaXQgPSBmYWxzZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICBpZiAoIXdhaXQpIHtcbiAgICAgICAgICBpZiAoaW1tZWRpYXRlKSB7IGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsIGFyZ3MpOyB9XG4gICAgICAgICAgd2FpdCA9IHRydWU7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3YWl0ID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoIWltbWVkaWF0ZSkgeyBjYWxsYmFjay5hcHBseShjb250ZXh0LCBhcmdzKTsgfVxuICAgICAgICAgIH0sIGxpbWl0KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgfVxufTtcblxuICAvKlxuICogIEJpbmFyeVNvY2tldCAtIEJpbmFyeSBXZWIgU29ja2V0c1xuICogIENvcHlyaWdodCAoQykgMjAxNiAgUm9sYW5kIFNpbmdlciA8cm9sYW5kLnNpbmdlclthdF1kZXNlcnRiaXQuY29tPlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqICAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qXG4gKiAgVGhpcyBjb2RlIGxpdmVzIGluc2lkZSB0aGUgQmluYXJ5U29ja2V0IGZ1bmN0aW9uLlxuICovXG5cbnZhciBvcGVuU29ja2V0ID0gZnVuY3Rpb24oaG9zdCwgb3B0aW9ucykge1xuICAvLyBJbmNsdWRlIHRoZSBkZXBlbmRlbmNpZXMuXG4gIC8qXG4gKiAgQmluYXJ5U29ja2V0IC0gQmluYXJ5IFdlYiBTb2NrZXRzXG4gKiAgQ29weXJpZ2h0IChDKSAyMDE2ICBSb2xhbmQgU2luZ2VyIDxyb2xhbmQuc2luZ2VyW2F0XWRlc2VydGJpdC5jb20+XG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiAgaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqICB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiAgTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiAgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uICBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLypcbiogIFRoaXMgY29kZSBsaXZlcyBpbnNpZGUgdGhlIEJpbmFyeVNvY2tldCBmdW5jdGlvbi5cbiovXG5cbnZhciBuZXdXZWJTb2NrZXQgPSBmdW5jdGlvbiAoKSB7XG4gIC8qXG4gICAqIFZhcmlhYmxlc1xuICAgKi9cblxuICB2YXIgcyA9IHt9LFxuICAgICAgd3M7XG5cblxuXG4gIC8qXG4gICAqIFNvY2tldCBsYXllciBpbXBsZW1lbnRhdGlvbi5cbiAgICovXG5cbiAgcy5vcGVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIEdlbmVyYXRlIHRoZSB3ZWJzb2NrZXQgdXJsLlxuICAgICAgICB2YXIgdXJsO1xuICAgICAgICBpZiAoaG9zdC5tYXRjaChcIl5odHRwczovL1wiKSkge1xuICAgICAgICAgICAgdXJsID0gXCJ3c3NcIiArIGhvc3Quc3Vic3RyKDUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXJsID0gXCJ3c1wiICsgaG9zdC5zdWJzdHIoNCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPcGVuIHRoZSB3ZWJzb2NrZXQgY29ubmVjdGlvblxuICAgICAgICB3cyA9IG5ldyBXZWJTb2NrZXQodXJsKTtcbiAgICAgICAgd3MuYmluYXJ5VHlwZSA9ICdhcnJheWJ1ZmZlcic7XG5cbiAgICAgICAgLy8gU2V0IHRoZSBjYWxsYmFjayBoYW5kbGVyc1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgcy5vbk1lc3NhZ2UoZXZlbnQuZGF0YSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgd3Mub25lcnJvciA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJ0aGUgd2Vic29ja2V0IGNsb3NlZCB0aGUgY29ubmVjdGlvbiB3aXRoIFwiO1xuICAgICAgICAgICAgaWYgKGV2ZW50LmNvZGUpIHtcbiAgICAgICAgICAgICAgICBtc2cgKz0gXCJ0aGUgZXJyb3IgY29kZTogXCIgKyBldmVudC5jb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnICs9IFwiYW4gZXJyb3IuXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHMub25FcnJvcihtc2cpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHdzLm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHMub25DbG9zZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHdzLm9ub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcy5vbk9wZW4oKTtcbiAgICAgICAgfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHMub25FcnJvcigpO1xuICAgIH1cbiAgfTtcblxuICBzLnNlbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIC8vIFNlbmQgdGhlIGRhdGEgdG8gdGhlIHNlcnZlclxuICAgIHdzLnNlbmQoZGF0YSk7XG4gIH07XG5cbiAgcy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIENsb3NlIHRoZSB3ZWJzb2NrZXQgaWYgZGVmaW5lZC5cbiAgICBpZiAod3MpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHdzLmNsb3NlKCk7XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgIH1cblxuICAgIHdzID0gdW5kZWZpbmVkO1xuICB9O1xuXG4gIHJldHVybiBzO1xufTtcblxuICAvKlxuICogIEJpbmFyeVNvY2tldCAtIEJpbmFyeSBXZWIgU29ja2V0c1xuICogIENvcHlyaWdodCAoQykgMjAxNiAgUm9sYW5kIFNpbmdlciA8cm9sYW5kLnNpbmdlclthdF1kZXNlcnRiaXQuY29tPlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiAgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqICAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuICogIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLiAgSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qXG4gKiAgVGhpcyBjb2RlIGxpdmVzIGluc2lkZSB0aGUgQmluYXJ5U29ja2V0IGZ1bmN0aW9uLlxuICovXG5cbnZhciBuZXdBamF4U29ja2V0ID0gZnVuY3Rpb24gKCkge1xuICAvKlxuICAgKiBDb25zdGFudHNcbiAgICovXG5cbiAgdmFyIHNlbmRUaW1lb3V0ID0gMzAwMDAsXG4gICAgICBwb2xsVGltZW91dCA9IDQ1MDAwO1xuXG4gIHZhciBEYXRhRGVsaW1pdGVyID0gJyMnO1xuXG4gIHZhciBSZXF1ZXN0VHlwZSA9IHtcbiAgICAgIEluaXQ6IDAsXG4gICAgICBQdXNoOiAxLFxuICAgICAgUG9sbDogMlxuICB9O1xuXG4gIHZhciBQb2xsVHlwZSA9IHtcbiAgICAgIERhdGE6ICAgIDAsXG4gICAgICBUaW1lb3V0OiAxLFxuICAgICAgQ2xvc2VkOiAgMlxuICB9O1xuXG5cblxuICAvKlxuICAgKiBWYXJpYWJsZXNcbiAgICovXG5cbiAgIHZhciBzID0ge30sXG4gICAgICAgdWlkLCBwb2xsVG9rZW4sIHB1c2hUb2tlbixcbiAgICAgICBwb2xsWGhyID0gZmFsc2UsXG4gICAgICAgc2VuZFhociA9IGZhbHNlLFxuICAgICAgIHBvbGwsXG4gICAgICAgcHVzaEFjdGl2ZSA9IGZhbHNlLFxuICAgICAgIHB1c2hCdWZmZXIgPSBbXTtcblxuXG5cbiAgLypcbiAgICogTWV0aG9kc1xuICAgKi9cblxuICBmdW5jdGlvbiBwb3N0QWpheCh1cmwsIHRpbWVvdXQsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgc3VjY2Vzcyh4aHIucmVzcG9uc2UpO1xuICAgIH07XG5cbiAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgZXJyb3IoKTtcbiAgICB9O1xuXG4gICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgZXJyb3IoXCJ0aW1lb3V0XCIpO1xuICAgIH07XG5cbiAgICB4aHIub3BlbignUE9TVCcsIHVybCwgdHJ1ZSk7XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcbiAgICB4aHIudGltZW91dCA9IHRpbWVvdXQ7XG4gICAgeGhyLnNlbmQobmV3IERhdGFWaWV3KGRhdGEpKTtcblxuICAgIHJldHVybiB4aHI7XG4gIH1cblxuICBmdW5jdGlvbiBzdG9wUmVxdWVzdHMoKSB7XG4gICAgLy8gU2V0IHRoZSBwb2xsIGZ1bmN0aW9uIHRvIGEgZHVtbXkgZnVuY3Rpb24uXG4gICAgLy8gVGhpcyB3aWxsIHByZXZlbnQgZnVydGhlciBwb2xsIGNhbGxzLlxuICAgIHBvbGwgPSBmdW5jdGlvbigpIHt9O1xuXG4gICAgLy8gS2lsbCB0aGUgYWpheCByZXF1ZXN0cy5cbiAgICBpZiAocG9sbFhocikge1xuICAgICAgICBwb2xsWGhyLmFib3J0KCk7XG4gICAgfVxuICAgIGlmIChzZW5kWGhyKSB7XG4gICAgICAgIHNlbmRYaHIuYWJvcnQoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cmlnZ2VyQ2xvc2VkKCkge1xuICAgIC8vIFN0b3AgdGhlIGFqYXggcmVxdWVzdHMuXG4gICAgc3RvcFJlcXVlc3RzKCk7XG5cbiAgICAvLyBUcmlnZ2VyIHRoZSBldmVudC5cbiAgICBzLm9uQ2xvc2UoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyaWdnZXJFcnJvcihtc2cpIHtcbiAgICAvLyBTdG9wIHRoZSBhamF4IHJlcXVlc3RzLlxuICAgIHN0b3BSZXF1ZXN0cygpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBlcnJvciBtZXNzYWdlLlxuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBcInRoZSBhamF4IHNvY2tldCBjbG9zZWQgdGhlIGNvbm5lY3Rpb24gd2l0aCBhbiBlcnJvci5cIjtcbiAgICB9XG5cbiAgICAvLyBUcmlnZ2VyIHRoZSBldmVudC5cbiAgICBzLm9uRXJyb3IobXNnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbmQocmVxVHlwZSwgaGVhZGVyU3RyLCBkYXRhLCBjYWxsYmFjaykge1xuICAgIHZhciBiID0gbmV3IEJ5dGVCdWZmZXIoMywgQnl0ZUJ1ZmZlci5CSUdfRU5ESUFOLCB0cnVlKTtcbiAgICBiLndyaXRlQnl0ZShyZXFUeXBlKTtcblxuICAgIHZhciBoZWFkZXJTdHJMZW4gPSAwO1xuICAgIGlmIChoZWFkZXJTdHIgJiYgaGVhZGVyU3RyLmxlbmd0aCA+IDApIHtcbiAgICAgIGhlYWRlclN0ckxlbiA9IGhlYWRlclN0ci5sZW5ndGg7XG4gICAgfVxuICAgIGIud3JpdGVCeXRlKGhlYWRlclN0ckxlbik7XG5cbiAgICBpZiAoaGVhZGVyU3RyTGVuID4gMCkge1xuICAgICAgYi53cml0ZVN0cmluZyhoZWFkZXJTdHIpO1xuICAgIH1cblxuICAgIGlmIChkYXRhICYmIGRhdGEuYnl0ZUxlbmd0aCA+IDApIHtcbiAgICAgIGIud3JpdGUoZGF0YSk7XG4gICAgfVxuXG4gICAgLy8gUGVyZm9ybSB0aGUgYWN0dWFsIGFqYXggcmVxdWVzdC5cbiAgICBzZW5kWGhyID0gcG9zdEFqYXgoaG9zdCwgc2VuZFRpbWVvdXQsIGIuYnVmZmVyLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgc2VuZFhociA9IGZhbHNlO1xuXG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKG1zZykge1xuICAgICAgc2VuZFhociA9IGZhbHNlO1xuICAgICAgdHJpZ2dlckVycm9yKG1zZyk7XG4gICAgfSk7XG4gIH1cblxuICBwb2xsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBiID0gbmV3IEJ5dGVCdWZmZXIoMywgQnl0ZUJ1ZmZlci5CSUdfRU5ESUFOLCB0cnVlKTtcbiAgICBiLndyaXRlQnl0ZShSZXF1ZXN0VHlwZS5Qb2xsKTtcblxuICAgIHZhciBoZWFkZXJTdHIgPSB1aWQgKyBEYXRhRGVsaW1pdGVyICsgcG9sbFRva2VuO1xuICAgIGIud3JpdGVCeXRlKGhlYWRlclN0ci5sZW5ndGgpO1xuICAgIGIud3JpdGVTdHJpbmcoaGVhZGVyU3RyKTtcblxuICAgIC8vIFBlcmZvcm0gdGhlIGFjdHVhbCBhamF4IHJlcXVlc3QuXG4gICAgcG9sbFhociA9IHBvc3RBamF4KGhvc3QsIHBvbGxUaW1lb3V0LCBiLmJ1ZmZlciwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHBvbGxYaHIgPSBmYWxzZTtcblxuICAgICAgdmFyIGIgPSBuZXcgQnl0ZUJ1ZmZlcihkYXRhLCBCeXRlQnVmZmVyLkJJR19FTkRJQU4pO1xuXG4gICAgICAvLyBFeHRyYWN0IHRoZSB0eW9lLlxuICAgICAgaWYgKGIubGVuZ3RoIDwgMSkge1xuICAgICAgICB0cmlnZ2VyRXJyb3IoXCJhamF4IHNvY2tldDogcG9sbDogaW52YWxpZCBzZXJ2ZXIgcmVzcG9uc2VcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciB0eXBlID0gYi5yZWFkQnl0ZSgpO1xuXG4gICAgICAvLyBDaGVjayBpZiB0aGlzIGFqYXggY29ubmVjdGlvbiB3YXMgY2xvc2VkLlxuICAgICAgaWYgKHR5cGUgPT0gUG9sbFR5cGUuQ2xvc2VkKSB7XG4gICAgICAgIHRyaWdnZXJDbG9zZWQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBWYWxpZGF0ZS5cbiAgICAgIGlmIChiLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgdHJpZ2dlckVycm9yKFwiYWpheCBzb2NrZXQ6IHBvbGw6IGludmFsaWQgc2VydmVyIHJlc3BvbnNlXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEV4dHJhY3QgYW5kIHNldCB0aGUgbmV3IHBvbGwgdG9rZW4uXG4gICAgICB2YXIgcG9sbFRva2VuTGVuID0gYi5yZWFkQnl0ZSgpO1xuICAgICAgcG9sbFRva2VuID0gYi5yZWFkU3RyaW5nKHBvbGxUb2tlbkxlbik7XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoaXMgYWpheCByZXF1ZXN0IGhhcyByZWFjaGVkIHRoZSBzZXJ2ZXIncyB0aW1lb3V0LlxuICAgICAgaWYgKHR5cGUgPT0gUG9sbFR5cGUuVGltZW91dCkge1xuICAgICAgICAvLyBKdXN0IHN0YXJ0IHRoZSBuZXh0IHBvbGwgcmVxdWVzdC5cbiAgICAgICAgcG9sbCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFN0YXJ0IHRoZSBuZXh0IHBvbGwgcmVxdWVzdC5cbiAgICAgIHBvbGwoKTtcblxuICAgICAgLy8gUmVtb3ZlIHRoZSBoZWFkZXIgZnJvbSB0aGUgYnVmZmVyLlxuICAgICAgYi5jbGlwKCk7XG5cbiAgICAgIC8vIENhbGwgdGhlIGV2ZW50LlxuICAgICAgcy5vbk1lc3NhZ2UoYi5idWZmZXIpO1xuICAgIH0sIGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgIHBvbGxYaHIgPSBmYWxzZTtcbiAgICAgIHRyaWdnZXJFcnJvcihtc2cpO1xuICAgIH0pO1xuICB9O1xuXG4gIHZhciBwdXNoID0gdXRpbHMudGhyb3R0bGUoZnVuY3Rpb24oKSB7XG4gICAgLy8gU2tpcCBpZiB0aGVyZSBpcyBhbHJlYWR5IGFuIGFjdGl2ZSBwdXNoIHJlcXVlc3QuXG4gICAgLy8gT25seSBvbmUgcHVzaCByZXF1ZXN0IGF0IG9uY2UgaXMgYWxsb3dlZC5cbiAgICAvLyBUaGUgbmV4dCBwdXNoIHdpbGwgYmUgdHJpZ2dlcmVkIGF1dG9tYXRpY2FsbHkuXG4gICAgaWYgKHB1c2hBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBPYnRhaW4gdGhlIHRvdGFsIGJ1ZmZlciBzaXplLlxuICAgIHZhciBpLCB0b3RhbFNpemUgPSAwO1xuICAgIGZvciAoaT0wOyBpIDwgcHVzaEJ1ZmZlci5sZW5ndGg7IGkrKykge1xuICAgICAgdG90YWxTaXplICs9IHB1c2hCdWZmZXJbaV0uYnl0ZUxlbmd0aDtcbiAgICB9XG5cbiAgICAvLyBNZXJnZSBhbGwgYnVmZmVyZWQgYnl0ZXMgaW50byBvbmUgc2luZ2xlIGJ1ZmZlci5cbiAgICB2YXIgYiA9IG5ldyBCeXRlQnVmZmVyKHRvdGFsU2l6ZSwgQnl0ZUJ1ZmZlci5CSUdfRU5ESUFOKTtcbiAgICBmb3IgKGk9MDsgaSA8IHB1c2hCdWZmZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGIud3JpdGUocHVzaEJ1ZmZlcltpXSk7XG4gICAgfVxuXG4gICAgLy8gQ2xlYXIgdGhlIHB1c2ggYnVmZmVyLlxuICAgIHB1c2hCdWZmZXIgPSBbXTtcblxuICAgIC8vIFBlcmZvcm0gdGhlIGFjdHVhbCBwdXNoIHJlcXVlc3QuXG4gICAgcHVzaEFjdGl2ZSA9IHRydWU7XG4gICAgc2VuZChSZXF1ZXN0VHlwZS5QdXNoLCB1aWQgKyBEYXRhRGVsaW1pdGVyICsgcHVzaFRva2VuLCBiLmJ1ZmZlciwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHVzaEFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICBpZiAoIWRhdGEgfHwgZGF0YS5ieXRlTGVuZ3RoIDw9IDApIHtcbiAgICAgICAgdHJpZ2dlckVycm9yKFwiYWpheCBzb2NrZXQ6IHB1c2g6IGludmFsaWQgc2VydmVyIHJlc3BvbnNlXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBiID0gbmV3IEJ5dGVCdWZmZXIoZGF0YSwgQnl0ZUJ1ZmZlci5CSUdfRU5ESUFOKTtcblxuICAgICAgLy8gU2V0IHRoZSBuZXcgcHVzaCB0b2tlbi5cbiAgICAgIHB1c2hUb2tlbiA9IGIucmVhZFN0cmluZygpO1xuXG4gICAgICAvLyBDaGVjayBpZiB0aGUgYnVmZmVyIGlzIGZpbGxlZCBhZ2Fpbi5cbiAgICAgIC8vIElmIHNvLCB0cmlnZ2VyIHRoZSBuZXh0IHB1c2guXG4gICAgICBpZiAocHVzaEJ1ZmZlci5sZW5ndGggPiAwKSB7XG4gICAgICAgIHB1c2goKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSwgNTApO1xuXG5cbiAgLypcbiAgICogU29ja2V0IGxheWVyIGltcGxlbWVudGF0aW9uLlxuICAgKi9cblxuICBzLm9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgYWpheCBzb2NrZXQgc2Vzc2lvblxuICAgIHNlbmQoUmVxdWVzdFR5cGUuSW5pdCwgbnVsbCwgbnVsbCwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGlmICghZGF0YSB8fCBkYXRhLmJ5dGVMZW5ndGggPD0gMCkge1xuICAgICAgICB0cmlnZ2VyRXJyb3IoXCJhamF4IHNvY2tldDogb3BlbjogaW52YWxpZCBzZXJ2ZXIgcmVzcG9uc2VcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gVHJhbnNmb3JtIHRvIHN0cmluZy5cbiAgICAgIHZhciBiID0gbmV3IEJ5dGVCdWZmZXIoZGF0YSwgQnl0ZUJ1ZmZlci5CSUdfRU5ESUFOKTtcbiAgICAgIGRhdGEgPSBiLnJlYWRTdHJpbmcoKTtcblxuICAgICAgLy8gU3BsaXQgdGhlIHN0cmluZy5cbiAgICAgIHZhciBzcGxpdCA9IGRhdGEuc3BsaXQoRGF0YURlbGltaXRlcik7XG4gICAgICBpZiAoc3BsaXQubGVuZ3RoICE9PSAzKSB7XG4gICAgICAgIHRyaWdnZXJFcnJvcihcImFqYXggc29ja2V0OiBmYWlsZWQgdG8gb2J0YWluIHVpZCBhbmQgdG9rZW5zXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFNldCB0aGUgdWlkIGFuZCB0aGUgdG9rZW5zLlxuICAgICAgdWlkID0gc3BsaXRbMF07XG4gICAgICBwb2xsVG9rZW4gPSBzcGxpdFsxXTtcbiAgICAgIHB1c2hUb2tlbiA9IHNwbGl0WzJdO1xuXG4gICAgICAvLyBTdGFydCB0aGUgbG9uZyBwb2xsaW5nIHByb2Nlc3MuXG4gICAgICBwb2xsKCk7XG5cbiAgICAgIC8vIFRyaWdnZXIgdGhlIGV2ZW50LlxuICAgICAgcy5vbk9wZW4oKTtcbiAgICB9KTtcbiAgfTtcblxuICBzLnNlbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIC8vIEFkZCB0aGUgZGF0YSB0byB0aGUgcHVzaCBidWZmZXIgcXVldWUuXG4gICAgcHVzaEJ1ZmZlci5wdXNoKGRhdGEpO1xuXG4gICAgLy8gUHVzaCB0aGUgZGF0YSB0byB0aGUgc2VydmVyICh0aHJvdHRsZWQpLlxuICAgIHB1c2goKTtcbiAgfTtcblxuICBzLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU3RvcCB0aGUgYWpheCByZXF1ZXN0cy5cbiAgICBzdG9wUmVxdWVzdHMoKTtcbiAgfTtcblxuICByZXR1cm4gcztcbn07XG5cblxuXG5cbiAgLypcbiAgICogQ29uc3RhbnRzXG4gICAqL1xuXG4gIHZhciBTb2NrZXRUeXBlcyA9IHtcbiAgICAgIFdlYlNvY2tldDogIFwiV2ViU29ja2V0XCIsXG4gICAgICBBamF4U29ja2V0OiBcIkFqYXhTb2NrZXRcIlxuICB9O1xuXG4gIHZhciBEZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIC8vIEZvcmNlIGEgc29ja2V0IHR5cGUuXG4gICAgICAvLyBWYWx1ZXM6IGZhbHNlLCBcIldlYlNvY2tldFwiLCBcIkFqYXhTb2NrZXRcIlxuICAgICAgZm9yY2VTb2NrZXRUeXBlOiBmYWxzZSxcblxuICAgICAgLy8gS2lsbCB0aGUgY29ubmVjdCBhdHRlbXB0IGFmdGVyIHRoZSB0aW1lb3V0LlxuICAgICAgY29ubmVjdFRpbWVvdXQ6ICAxMDAwMFxuICB9O1xuXG5cblxuICAvKlxuICAgKiBWYXJpYWJsZXNcbiAgICovXG5cbiAgdmFyIGJzLCAgICAgLy8gQmFja2VuZCBzb2NrZXQuXG4gICAgICBpc0Nsb3NlZCA9IGZhbHNlO1xuXG5cblxuICAvKlxuICAgKiBQdWJsaWMgSW5zdGFuY2VcbiAgICovXG5cbiAgdmFyIGluc3RhbmNlID0ge1xuICAgIC8vIFJldHVybiB0aGUgY3VycmVudCBzb2NrZXQgdHlwZS5cbiAgICAvLyBWYWx1ZXM6IFwiV2ViU29ja2V0XCIsIFwiQWpheFNvY2tldFwiXG4gICAgc29ja2V0VHlwZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYnMuc29ja2V0VHlwZTtcbiAgICB9LFxuXG4gICAgLy8gQ2xvc2UgdGhlIHNvY2tldCBjb25uZWN0aW9uLlxuICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIGJzLmNsb3NlKCk7XG4gICAgICB0cmlnZ2VyQ2xvc2UoKTtcbiAgICB9LFxuXG4gICAgLy8gUmV0dXJucyBhIGJvb2xlYW4gd2hlbmV2ZXIgdGhlIHNvY2tldCBpcyBjbG9zZWQuXG4gICAgaXNDbG9zZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGlzQ2xvc2VkO1xuICAgIH0sXG5cbiAgICAvLyBXcml0ZSB0aGUgQXJyYXlCdWZmZXIgdG8gdGhlIHNvY2tldC5cbiAgICB3cml0ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgaWYgKGlzQ2xvc2VkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQmluYXJ5U29ja2V0OiBmYWlsZWQgdG8gd3JpdGU6IHRoZSBzb2NrZXQgaXMgY2xvc2VkXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBlbHNlIGlmICghKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJCaW5hcnlTb2NrZXQ6IGZhaWxlZCB0byB3cml0ZSBkYXRhOiBkYXRhIGlzIG5vdCBvZiB0eXBlIEFycmF5QnVmZmVyXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChkYXRhLmJ5dGVMZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBicy5zZW5kKGRhdGEpO1xuICAgIH0sXG5cbiAgICAvLyBGdW5jdGlvbiB3aGljaCBpcyB0cmlnZ2VyZWQgYXMgc29vbiBhcyBuZXcgYnl0ZXMgYXJlIHJlY2VpdmVkLlxuICAgIC8vIFRoZSBwYXNzZWQgZGF0YSBpcyBhbiBBcnJheUJ1ZmZlci5cbiAgICBvblJlYWQ6IGZ1bmN0aW9uKGRhdGEpIHt9IC8vIFNldCB0byBhbiBlbXB0eSBmdW5jdGlvbi4gVGhpcyBlbGltaW5hdGVzIGFuIGV4dHJhIGNoZWNrLlxuXG4gICAgLypcbiAgICAgIC8vIEhpbnQ6IEZ1cnRoZXIgYXZhaWxhYmxlIGV2ZW50IGZ1bmN0aW9uLlxuXG4gICAgICAvLyBGdW5jdGlvbiB3aGljaCBpcyB0cmlnZ2VyZWQgYXMgc29vbiBhcyB0aGUgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZC5cbiAgICAgIG9uT3BlbjogZnVuY3Rpb24oKSB7fVxuXG4gICAgICAvLyBGdW5jdGlvbiB3aGljaCBpcyB0cmlnZ2VyZWQgYXMgc29vbiBhcyB0aGUgY29ubmVjdGlvbiBjbG9zZXMuXG4gICAgICBvbkNsb3NlOiBmdW5jdGlvbigpIHt9XG5cbiAgICAgIC8vIEZ1bmN0aW9uIHdoaWNoIGlzIHRyaWdnZXJlZCBhcyBzb29uIGFzIHRoZSBjb25uZWN0aW9uIGNsb3NlcyB3aXRoIGFuIGVycm9yLlxuICAgICAgLy8gQW4gb3B0aW9uYWwgZXJyb3IgbWVzc2FnZSBpcyBwYXNzZWQuXG4gICAgICAvLyBvbkNsb3NlIGlzIGFsc28gdHJpZ2dlcmVkIGFmdGVyd2FyZHMuXG4gICAgICBvbkVycm9yOiBmdW5jdGlvbihtc2cpIHt9XG4gICAgKi9cbiAgfTtcblxuXG5cbiAgLypcbiAgICogTWV0aG9kc1xuICAgKi9cblxuICBmdW5jdGlvbiB0cmlnZ2VyT3BlbigpIHtcbiAgICAvLyBUcmlnZ2VyIG9ubHkgb25jZS5cbiAgICBpZiAoYnMub3BlblRyaWdnZXJlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBicy5vcGVuVHJpZ2dlcmVkID0gdHJ1ZTtcblxuICAgIGlmIChpbnN0YW5jZS5vbk9wZW4pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGluc3RhbmNlLm9uT3BlbigpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkJpbmFyeVNvY2tldDogb25PcGVuOiBjYXRjaGVkIGV4Y2VwdGlvbjpcIiwgZSk7XG5cbiAgICAgICAgLy8gRW5zdXJlIHRvIGNsb3NlIHRoZSBzb2NrZXQuXG4gICAgICAgIGJzLmNsb3NlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJpZ2dlckNsb3NlKCkge1xuICAgIC8vIFRyaWdnZXIgb25seSBvbmNlLlxuICAgIGlmIChpc0Nsb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpc0Nsb3NlZCA9IHRydWU7XG5cbiAgICBpZiAoaW5zdGFuY2Uub25DbG9zZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaW5zdGFuY2Uub25DbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkJpbmFyeVNvY2tldDogb25DbG9zZTogY2F0Y2hlZCBleGNlcHRpb246XCIsIGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyaWdnZXJFcnJvcihtc2cpIHtcbiAgICAvLyBUcmlnZ2VyIG9ubHkgb25jZS5cbiAgICBpZiAoYnMuZXJyb3JUcmlnZ2VyZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYnMuZXJyb3JUcmlnZ2VyZWQgPSB0cnVlO1xuXG4gICAgaWYgKGluc3RhbmNlLm9uRXJyb3IpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGluc3RhbmNlLm9uRXJyb3IobXNnKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJCaW5hcnlTb2NrZXQ6IG9uRXJyb3I6IGNhdGNoZWQgZXhjZXB0aW9uOlwiLCBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjb25uZWN0U29ja2V0KCkge1xuICAgIC8vIENob29zZSB0aGUgc29ja2V0IGxheWVyIGRlcGVuZGluZyBvbiB0aGUgYnJvd3NlciBzdXBwb3J0LlxuICAgIGlmICgoIW9wdGlvbnMuZm9yY2VTb2NrZXRUeXBlICYmIHdpbmRvdy5XZWJTb2NrZXQpIHx8XG4gICAgICAgIG9wdGlvbnMuZm9yY2VTb2NrZXRUeXBlID09PSBTb2NrZXRUeXBlcy5XZWJTb2NrZXQpXG4gICAge1xuICAgICAgICBicyA9IG5ld1dlYlNvY2tldCgpO1xuICAgICAgICBicy5zb2NrZXRUeXBlID0gU29ja2V0VHlwZXMuV2ViU29ja2V0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYnMgPSBuZXdBamF4U29ja2V0KCk7XG4gICAgICAgIGJzLnNvY2tldFR5cGUgPSBTb2NrZXRUeXBlcy5BamF4U29ja2V0O1xuICAgIH1cblxuICAgIC8vIFN0YXJ0IHRoZSB0aW1lb3V0LlxuICAgIHZhciBjb25uZWN0VGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbm5lY3RUaW1lb3V0ID0gZmFsc2U7XG5cbiAgICAgICAgLy8gRW5zdXJlIHRoZSBzb2NrZXQgaXMgY2xvc2VkLlxuICAgICAgICBicy5jbG9zZSgpO1xuXG4gICAgICAgIHRyaWdnZXJFcnJvcihcImNvbm5lY3Rpb24gdGltZW91dFwiKTtcbiAgICAgICAgdHJpZ2dlckNsb3NlKCk7XG4gICAgfSwgb3B0aW9ucy5jb25uZWN0VGltZW91dCk7XG5cbiAgICAvLyBIZWxwZXIgZnVuY3Rpb24uXG4gICAgdmFyIHN0b3BDb25uZWN0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGNvbm5lY3RUaW1lb3V0ICE9PSBmYWxzZSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChjb25uZWN0VGltZW91dCk7XG4gICAgICAgICAgY29ubmVjdFRpbWVvdXQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9O1xuXG5cblxuICAgIC8vIFNldCB0aGUgYmFja2VuZCBzb2NrZXQgZXZlbnRzLlxuICAgIGJzLm9uT3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgc3RvcENvbm5lY3RUaW1lb3V0KCk7XG5cbiAgICAgIHRyaWdnZXJPcGVuKCk7XG4gICAgfTtcblxuICAgIGJzLm9uQ2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHN0b3BDb25uZWN0VGltZW91dCgpO1xuXG4gICAgICAvLyBFbnN1cmUgdGhlIHNvY2tldCBpcyBjbG9zZWQuXG4gICAgICBicy5jbG9zZSgpO1xuXG4gICAgICB0cmlnZ2VyQ2xvc2UoKTtcbiAgICB9O1xuXG4gICAgYnMub25FcnJvciA9IGZ1bmN0aW9uKG1zZykge1xuICAgICAgLy8gU3RvcCB0aGUgY29ubmVjdCB0aW1lb3V0LlxuICAgICAgc3RvcENvbm5lY3RUaW1lb3V0KCk7XG5cbiAgICAgIC8vIEVuc3VyZSB0aGUgc29ja2V0IGlzIGNsb3NlZC5cbiAgICAgIGJzLmNsb3NlKCk7XG5cbiAgICAgIHRyaWdnZXJFcnJvcihtc2cpO1xuICAgICAgdHJpZ2dlckNsb3NlKCk7XG4gICAgfTtcblxuICAgIGJzLm9uTWVzc2FnZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGluc3RhbmNlLm9uUmVhZChkYXRhKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJCaW5hcnlTb2NrZXQ6IG9uUmVhZDogY2F0Y2hlZCBleGNlcHRpb246XCIsIGUpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBDb25uZWN0IGR1cmluZyB0aGUgbmV4dCB0aWNrLlxuICAgIC8vIFRoZSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGNvbm5lY3QgdGhlIGV2ZW50IGZ1bmN0aW9ucyBmaXJzdC5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgYnMub3BlbigpO1xuICAgIH0sIDApO1xuICB9XG5cblxuXG4gIC8qXG4gICAqIEluaXRpYWxpemUgc2VjdGlvblxuICAgKi9cblxuICAvLyBDaGVjayBpZiBBcnJheUJ1ZmZlcnMgYXJlIHN1cHBvcnRlZC4gVGhpcyBpcyBhIG11c3QhXG4gIGlmICghd2luZG93LkFycmF5QnVmZmVyKSB7XG4gICAgY29uc29sZS5sb2coXCJCaW5hcnlTb2NrZXQ6IEFycmF5QnVmZmVycyBhcmUgbm90IHN1cHBvcnRlZCBieSB0aGlzIGJyb3dzZXIhXCIpO1xuICAgIHJldHVybiA7XG4gIH1cblxuICAvLyBNZXJnZSB0aGUgb3B0aW9ucyB3aXRoIHRoZSBkZWZhdWx0IG9wdGlvbnMuXG4gIG9wdGlvbnMgPSB1dGlscy5leHRlbmQoe30sIERlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcblxuICAvLyBQcmVwYXJlIHRoZSBob3N0IHN0cmluZy5cbiAgLy8gUHJlcGVudCB0aGUgY3VycmVudCBsb2NhdGlvbiBpZiB0aGUgaG9zdCB1cmwgc3RhcnRzIHdpdGggYSBzbGFzaC5cbiAgaWYgKGhvc3QubWF0Y2goXCJeL1wiKSkge1xuICAgIGhvc3QgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCArIGhvc3Q7XG4gIH1cbiAgLy8gVXNlIHRoZSBjdXJyZW50IGxvY2F0aW9uIGlmIHRoZSBob3N0IHN0cmluZyBpcyBub3Qgc2V0LlxuICBlbHNlIGlmICghaG9zdCkge1xuICAgIGhvc3QgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdDtcbiAgfVxuICAvLyBUaGUgaG9zdCBzdHJpbmcgaGFzIHRvIHN0YXJ0IHdpdGggaHR0cDovLyBvciBodHRwczovL1xuICBpZiAoIWhvc3QubWF0Y2goXCJeaHR0cDovL1wiKSAmJiAhaG9zdC5tYXRjaChcIl5odHRwczovL1wiKSkge1xuICAgIGNvbnNvbGUubG9nKFwiQmluYXJ5U29ja2V0OiBpbnZhbGlkIGhvc3Q6IG1pc3NpbmcgJ2h0dHA6Ly8nIG9yICdodHRwczovLychXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIENvbm5lY3QgdGhlIHNvY2tldC5cbiAgY29ubmVjdFNvY2tldCgpO1xuXG5cbiAgLy8gUmV0dXJuIHRoZSBuZXdseSBjcmVhdGVkIHNvY2tldC5cbiAgcmV0dXJuIGluc3RhbmNlO1xufTtcblxuXG4gIC8vIFRoZSBwdWJsaWMgQmluYXJ5U29ja2V0IGluc3RhbmNlLlxuICByZXR1cm4ge1xuICAgIC8vIE9wZW4gYW5kIHJldHVybiBhIG5ldyBCaW5hcnlTb2NrZXQuXG4gICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IGlzIHJlcXVpcmVkLiBJdCBkZWZpbmVzIGEgaG9zdCB3aGljaCBoYXMgdG8gc3RhcnQgd2l0aFxuICAgIC8vIGh0dHA6Ly8gb3IgaHR0cHM6Ly8gb3IgLyBmb3IgYW4gYWJzb2x1dGUgcGF0aCB1c2luZyB0aGUgY3VycmVudCBob3N0LlxuICAgIC8vIFRoZSBzZWNvbmQgYXJndW1lbnQgZGVmaW5lcyBvcHRpb25hbCBvcHRpb25zLlxuICAgIG9wZW46IG9wZW5Tb2NrZXQsXG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgQnl0ZUJ1ZmZlci5cbiAgICAvLyBPcHRpb25hbGx5IHNldCB0aGUgaW1wbGljaXRHcm93dGggYm9vbGVhbi5cbiAgICAvLyBXcmFwcGVyIGZvciBKYXZhU2NyaXB0J3MgQXJyYXlCdWZmZXIvRGF0YVZpZXcgbWFpbnRhaW5pbmcgaW5kZXggYW5kIGRlZmF1bHQgZW5kaWFubmVzcy5cbiAgICAvLyBNb3JlIGluZm9ybWF0aW9uOiBodHRwczovL2dpdGh1Yi5jb20vZGVzZXJ0Yml0L2J5dGUtYnVmZmVyXG4gICAgbmV3Qnl0ZUJ1ZmZlcjogZnVuY3Rpb24oZGF0YSwgaW1wbGljaXRHcm93dGgpIHtcbiAgICAgIHJldHVybiBuZXcgQnl0ZUJ1ZmZlcihkYXRhLCBCeXRlQnVmZmVyLkJJR19FTkRJQU4sIGltcGxpY2l0R3Jvd3RoKTtcbiAgICB9LFxuXG4gICAgLy8gQ29udmVydCBhbiBBcnJheUJ1ZmZlciB0byBhIHN0cmluZy5cbiAgICBieXRlc1RvU3RyaW5nOiBmdW5jdGlvbihiKSB7XG4gICAgICB2YXIgYmIgPSB0aGlzLm5ld0J5dGVCdWZmZXIoYik7XG4gICAgICByZXR1cm4gYmIucmVhZFN0cmluZygpO1xuICAgIH0sXG5cbiAgICAvLyBDb252ZXJ0IGEgc3RyaW5nIHRvIGFuIEFycmF5QnVmZmVyLlxuICAgIHN0cmluZ1RvQnl0ZXM6IGZ1bmN0aW9uKHMpIHtcbiAgICAgIHZhciBiID0gdGhpcy5uZXdCeXRlQnVmZmVyKDEsIHRydWUpO1xuICAgICAgYi53cml0ZVN0cmluZyhzKTtcbiAgICAgIHJldHVybiBiLmJ1ZmZlcjtcbiAgICB9XG4gIH07XG59KCk7XG4iXSwiZmlsZSI6ImJpbmFyeXNvY2tldC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
