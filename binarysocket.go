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

// Package binarysocket is a real-time bidirectional binary socket library for the web.
// It offers a clean, robust and efficient way to connect webbrowsers with a go-backend in a simple way.
// It automatically detects supported socket layers and chooses the most suitable one.
// This library offers a net.Conn interface on the go-backend site and a similar net.Conn
// interface on the client javascript site. That's awesome, right?
// You already have a Go application using a TCP connection?
// Just drop in the BinarySocket package, fire up a HTTP server and that's it.
// No further adaptions are required in the backend. Instead of writing one backend
// which is responsible to communicate with web-application and another backend which
// communicates with other go programs, BinarySocket eliminates this duplication.
package binarysocket

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

//##################//
//### Constants ####//
//##################//

const (
	acceptConnBufferSize = 10
)

//##################//
//### Variables ####//
//##################//

var (
	// ErrClosed defines the error if the connection was closed.
	ErrClosed = errors.New("closed")
)

//####################//
//### Server Type ####//
//####################//

// Server implements the web server which handles the websocket
// and ajax connections.
type Server struct {
	options        *Options
	acceptConnChan chan net.Conn
	checkOrigin    func(r *http.Request) bool

	closedChan chan struct{}
	closeMutex sync.Mutex

	// Websocket.
	upgrader websocket.Upgrader

	// Ajaxsocket.
	ajaxSockets      map[string]*ajaxConn
	ajaxSocketsMutex sync.Mutex
}

// NewServer creates a new server instance.
// Optionally pass the BinarySocket options.
func NewServer(opts ...*Options) *Server {
	var o *Options
	if len(opts) > 0 {
		o = opts[0]
	} else {
		o = new(Options)
	}
	o.setDefaults()

	s := &Server{
		options:        o,
		checkOrigin:    o.CheckOrigin,
		closedChan:     make(chan struct{}),
		acceptConnChan: make(chan net.Conn, acceptConnBufferSize),

		upgrader: websocket.Upgrader{
			CheckOrigin:     o.CheckOrigin,
			ReadBufferSize:  o.ReadBufferSize,
			WriteBufferSize: o.WriteBufferSize,
			Error:           httpErrLog,
		},

		ajaxSockets: make(map[string]*ajaxConn),
	}

	return s
}

// Accept waits for the next client socket connection and returns a generic Conn.
// Returns ErrClosed if the server is closed.
func (s *Server) Accept() (net.Conn, error) {
	select {
	case conn := <-s.acceptConnChan:
		return conn, nil
	case <-s.closedChan:
		return nil, ErrClosed
	}
}

// IsClosed returns a boolean indicating if the server is closed.
// This does not indicate the http server state.
func (s *Server) IsClosed() bool {
	select {
	case <-s.closedChan:
		return true
	default:
		return false
	}
}

// Close the server by blocking all new incoming connections.
// This does not close the http server.
func (s *Server) Close() error {
	s.closeMutex.Lock()
	defer s.closeMutex.Unlock()

	if s.IsClosed() {
		return nil
	}

	close(s.closedChan)

	// Close all connections in the accept channel.
	go func() {
		for i := 0; i < len(s.acceptConnChan); i++ {
			select {
			case conn := <-s.acceptConnChan:
				go conn.Close()
			default:
				return
			}
		}
	}()

	return nil
}

// ServeHTTP implements the HTTP Handler interface of the http package.
func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Block if closed.
	if s.IsClosed() {
		http.Error(w, "Service Unavailable", http.StatusServiceUnavailable)
		return
	}

	// Check the origin.
	if !s.checkOrigin(r) {
		httpErrLog(w, r, http.StatusForbidden, fmt.Errorf("origin not allowed"))
		return
	}

	// Determine the socket request type.
	if r.Method == "POST" {
		if s.options.DisableAjax {
			httpErrLog(w, r, http.StatusForbidden, fmt.Errorf("ajax backend is disabled"))
			return
		}

		// Handle the ajax request.
		s.handleAjaxSocketRequest(w, r)
	} else if r.Method == "GET" {
		// Handle the websocket request.
		s.handleWebSocketRequest(w, r)
	} else {
		httpErrLog(w, r, http.StatusMethodNotAllowed, fmt.Errorf("invalid request method: %s", r.Method))
		return
	}
}

//################//
//### Private ####//
//################//

func (s *Server) onNewSocketConn(conn net.Conn) {
	// Add the new connection to the accept channel.
	s.acceptConnChan <- conn
}
