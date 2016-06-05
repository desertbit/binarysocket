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

package main

import (
	"bufio"
	"log"
	"net"
	"net/http"

	"github.com/desertbit/binarysocket"
)

var (
	server *binarysocket.Server
)

func main() {
	// Create a new binarysocket web server.
	server = binarysocket.NewServer()

	// Start a new goroutine accepting new sockets.
	go acceptSockets()

	// Set the binarysocket server handler.
	http.Handle("/binsocket", server)

	// Set the http file server.
	http.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("public"))))
	http.Handle("/dist/", http.StripPrefix("/dist/", http.FileServer(http.Dir("../client/dist"))))

	// Start the http server.
	err := http.ListenAndServe(":8888", nil)
	if err != nil {
		log.Fatalf("ListenAndServe: %v", err)
	}
}

func acceptSockets() {
	// Accept all sockets.
	for {
		conn, err := server.Accept()
		if err != nil {
			log.Println(err)

			if err == binarysocket.ErrClosed {
				return
			}

			continue
		}

		go handleSocket(conn)
	}
}

func handleSocket(conn net.Conn) {
	log.Println("new socket connected")

	// Just read line by line.
	r := bufio.NewReader(conn)

	line, err := r.ReadString('\n')
	for err == nil {
		log.Print("received from client: ", line)

		// Echo back to the client.
		_, err = conn.Write([]byte(line))
		if err != nil {
			log.Fatalf("socket write error: %v", err)
		}

		// Read the next line.
		line, err = r.ReadString('\n')
	}

	if err != nil {
		log.Printf("socket read: %v", err)
	}
}
