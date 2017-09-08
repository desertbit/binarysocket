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

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

//###################//
//### wsConn Type ###//
//###################//

type wsConn struct {
	ws         *websocket.Conn
	reader     io.Reader
	remoteAddr net.Addr
}

func (c *wsConn) Read(data []byte) (n int, err error) {
	// Only retry once. Check the EOF comment down.
Loop:
	for i := 0; i <= 1; i++ {
		// Obtain the next reader from the websocket if nil.
		if c.reader == nil {
			_, c.reader, err = c.ws.NextReader()
			if err != nil {
				return 0, transformWebSocketError(err)
			}
		}

		// Read from the websocket.
		n, err = c.reader.Read(data)
		if err != nil {
			// Reset the reader if EOF is reached.
			// This will get the next reader during the next read.
			if err == io.EOF {
				c.reader = nil

				// If 0, EOF is returned, then immediately obtain the next reader and
				// retry once. Quote from package io:
				// An instance of this general case is that a Reader returning a non-zero
				// number of bytes at the end of the input stream may return either
				// err == EOF or err == nil. The next Read should return 0, EOF.
				if n == 0 {
					continue Loop
				}

				return n, nil
			}

			return n, transformWebSocketError(err)
		}

		return n, nil
	}

	return 0, nil
}

func (c *wsConn) Write(data []byte) (n int, err error) {
	err = c.ws.WriteMessage(websocket.BinaryMessage, data)
	if err != nil {
		return 0, transformWebSocketError(err)
	}

	return len(data), nil
}

func (c *wsConn) Close() error {
	return c.ws.Close()
}

func (c *wsConn) LocalAddr() net.Addr {
	return c.ws.LocalAddr()
}

func (c *wsConn) RemoteAddr() net.Addr {
	return c.remoteAddr
}

func (c *wsConn) SetDeadline(t time.Time) error {
	err := c.SetReadDeadline(t)
	if err != nil {
		return err
	}

	return c.SetWriteDeadline(t)
}

func (c *wsConn) SetReadDeadline(t time.Time) error {
	return c.ws.SetReadDeadline(t)
}

func (c *wsConn) SetWriteDeadline(t time.Time) error {
	return c.ws.SetWriteDeadline(t)
}

//###############//
//### Private ###//
//###############//

func (s *Server) handleWebSocketRequest(rw http.ResponseWriter, req *http.Request) {
	// Upgrade to a websocket.
	ws, err := s.upgrader.Upgrade(rw, req, nil)
	if err != nil {
		httpErrLog(rw, req, http.StatusBadRequest, fmt.Errorf("websocket: failed to upgrade to websocket layer: %v", err))
		return
	}
	// Create a new websocket connection instance.
	wsc := &wsConn{
		ws: ws,
	}

	// If special http headers are set to extract the real remote address, then use it.
	remoteAddrStr, requestRemoteAddrMethodUsed := extractRemoteAddress(req)
	if requestRemoteAddrMethodUsed {
		wsc.remoteAddr = ws.RemoteAddr()
	} else {
		wsc.remoteAddr = &addr{
			network: ws.RemoteAddr().Network(),
			str:     remoteAddrStr,
		}
	}

	// Finally handle over the new connection to the server.
	s.onNewSocketConn(wsc)
}

func transformWebSocketError(err error) error {
	// Websocket close code.
	wsCode := -1 // -1 for not set.

	// Try to obtain the websocket close code if present.
	// Assert to gorilla websocket CloseError type if possible.
	if closeErr, ok := err.(*websocket.CloseError); ok {
		wsCode = closeErr.Code
	}

	// Return the custom error if the websocket is closed.
	if wsCode == websocket.CloseNormalClosure ||
		wsCode == websocket.CloseGoingAway ||
		wsCode == websocket.CloseNoStatusReceived {
		return ErrClosed
	}

	return err
}
