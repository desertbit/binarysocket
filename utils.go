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
	"crypto/rand"
	"net"
	"net/http"
	"net/url"
	"strings"

	"github.com/Sirupsen/logrus"
)

var (
	// Log is the public logrus value used internally.
	Log = logrus.New()
)

//###############//
//### Private ###//
//###############//

// httpErrLog writes the HTTP status code and logs the error.
func httpErrLog(w http.ResponseWriter, r *http.Request, statusCode int, err error) {
	// Set the HTTP status code.
	w.WriteHeader(statusCode)

	// Get the remote address and user agent.
	remoteAddr, _ := extractRemoteAddress(r)
	userAgent := r.Header.Get("User-Agent")

	// Log the invalid request.
	Log.WithFields(logrus.Fields{
		"remoteAddress": remoteAddr,
		"userAgent":     userAgent,
		"url":           r.URL.Path,
	}).Warningf("handle HTTP request: %v", err)
}

// extractRemoteAddress returns the IP address of the request.
// If the X-Forwarded-For or X-Real-Ip http headers are set, then
// they are used to obtain the remote address.
// The boolean is true, if the remote address is obtained using the
// request's RemoteAddr() method.
// A "IP:port" string is returned.
func extractRemoteAddress(r *http.Request) (string, bool) {
	// Split the host and port of the remote address.
	_, port, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		// Just return the remote address if an error occurrs.
		return r.RemoteAddr, true
	}

	// The request header.
	hdr := r.Header

	// Try to obtain the ip from the X-Forwarded-For header
	ip := hdr.Get("X-Forwarded-For")
	if len(ip) > 0 {
		// X-Forwarded-For is potentially a list of addresses separated with ","
		parts := strings.Split(ip, ",")
		if len(parts) > 0 {
			ip = strings.TrimSpace(parts[0])

			if len(ip) > 0 {
				return ip + ":" + port, false
			}
		}
	}

	// Try to obtain the ip from the X-Real-Ip header
	ip = strings.TrimSpace(hdr.Get("X-Real-Ip"))
	if len(ip) > 0 {
		return ip + ":" + port, false
	}

	// Fallback to the request remote address
	return r.RemoteAddr, true
}

// checkSameOrigin returns true if the origin is not set or is equal to the request host.
// Source from gorilla websockets.
func checkSameOrigin(r *http.Request) bool {
	origin := r.Header["Origin"]
	if len(origin) == 0 {
		return true
	}
	u, err := url.Parse(origin[0])
	if err != nil {
		return false
	}
	return u.Host == r.Host
}

// randomString generates a random string.
func randomString(n int) (string, error) {
	const alphanum = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
	var bytes = make([]byte, n)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	for i, b := range bytes {
		bytes[i] = alphanum[b%byte(len(alphanum))]
	}
	return string(bytes), nil
}
