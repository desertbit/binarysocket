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
  @@include('./vendor/byte-buffer.js')
  @@include('./utils.js')
  @@include('./socket.js')

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
