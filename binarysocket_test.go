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
	"log"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestMain(m *testing.M) {
	// Start the http server.
	go func() {
		err := http.ListenAndServe(":44444", nil)
		if err != nil {
			log.Fatalf("ListenAndServe: %v", err)
		}
	}()

	// Wait for the http server to be online.
	isReady := false
	for i := 0; i < 50; i++ {
		resp, err := http.Get("http://127.0.0.1:44444")
		if err != nil {
			time.Sleep(10 * time.Millisecond)
			continue
		}
		resp.Body.Close()

		isReady = true
		break
	}
	if !isReady {
		log.Fatalln("failed to start http server")
	}

	os.Exit(m.Run())
}

func TestAcceptClose(t *testing.T) {
	server := NewServer()
	server.Close()

	conn, err := server.Accept()
	require.Nil(t, conn)
	require.Equal(t, ErrClosed, err)
}
