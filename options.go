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

package binarysocket

import "net/http"

//#################//
//### Constants ###//
//#################//

const (
	defaultReadBufferSize  = 4096
	defaultWriteBufferSize = 4096
)

//####################//
//### Options Type ###//
//####################//

// Options define the BinarySocket optional options.
type Options struct {
	// ReadBufferSize and WriteBufferSize specify I/O buffer sizes. If a buffer
	// size is zero, then a default value of 4096 is used. The I/O buffer sizes
	// do not limit the size of the messages that can be sent or received.
	ReadBufferSize, WriteBufferSize int

	// CheckOrigin returns true if the request Origin header is acceptable. If
	// CheckOrigin is nil, the host in the Origin header must not be set or
	// must match the host of the request.
	// This method is used by the backend sockets before establishing connections.
	CheckOrigin func(r *http.Request) bool

	// DisableAjax deactivates the ajax backend.
	DisableAjax bool
}

func (o *Options) setDefaults() {
	if o.ReadBufferSize <= 0 {
		o.ReadBufferSize = defaultReadBufferSize
	}
	if o.WriteBufferSize <= 0 {
		o.WriteBufferSize = defaultWriteBufferSize
	}
	if o.CheckOrigin == nil {
		o.CheckOrigin = checkSameOrigin
	}
}
