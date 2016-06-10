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
	"bufio"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

//#################//
//### Constants ###//
//#################//

const (
	ajaxUIDLength       = 40
	ajaxPollTokenLength = 20
	ajaxPushTokenLength = 20

	ajaxPollTimeout       = 35 * time.Second
	ajaxSocketTimeout     = 45 * time.Second // Has to be bigger than the poll timeout.
	ajaxFlushAfterTimeout = 3 * time.Millisecond

	ajaxHeaderSize       = 2   // In Bytes
	ajaxHeaderStrMaxSize = 255 // In Bytes

	ajaxDataDelimiter = "#"

	ajaxRequestInit byte = 0
	ajaxRequestPush byte = 1
	ajaxRequestPoll byte = 2

	ajaxPollCmdData    byte = 0
	ajaxPollCmdTimeout byte = 1
	ajaxPollCmdClosed  byte = 2
)

//#####################//
//### ajaxConn Type ###//
//#####################//

type ajaxConn struct {
	io              *ajaxIO
	bufReader       *bufio.Reader
	bufWriter       *bufio.Writer
	bufWriterMutex  sync.Mutex
	bufWriterFlushT *time.Timer

	uid        string
	userAgent  string
	remoteIP   string
	remoteAddr net.Addr
	localAddr  net.Addr

	pollRequestActive      bool
	pollRequestActiveMutex sync.Mutex
	pollToken              string

	pushRequestActive      bool
	pushRequestActiveMutex sync.Mutex
	pushToken              string

	closedChan chan struct{}
	closeMutex sync.Mutex

	timeout *time.Timer
}

func newAjaxConn(readBufferSize, writeBufferSize int) *ajaxConn {
	io := newAjaxIO()

	c := &ajaxConn{
		io:              io,
		bufReader:       bufio.NewReaderSize(io, readBufferSize),
		bufWriter:       bufio.NewWriterSize(io, writeBufferSize),
		bufWriterFlushT: time.NewTimer(ajaxFlushAfterTimeout),
		closedChan:      make(chan struct{}),
		timeout:         time.NewTimer(ajaxSocketTimeout),
	}

	// Start the flushing buffered write routine.
	go func() {
		for {
			select {
			case <-c.bufWriterFlushT.C:
				func() {
					c.bufWriterMutex.Lock()
					defer c.bufWriterMutex.Unlock()

					if c.bufWriter.Buffered() == 0 {
						return
					}

					err := c.bufWriter.Flush()
					if err != nil {
						Log.Warningf("ajax: failed to flush write buffer: %v", err)
						c.Close()
					}
				}()

			case <-c.closedChan:
				return
			}
		}
	}()

	return c
}

func (c *ajaxConn) Write(data []byte) (n int, err error) {
	c.bufWriterMutex.Lock()
	defer c.bufWriterMutex.Unlock()

	n, err = c.bufWriter.Write(data)
	if err != nil {
		return n, err
	}

	// Reset the timer to flush the write buffer.
	c.bufWriterFlushT.Reset(ajaxFlushAfterTimeout)

	return
}

func (c *ajaxConn) Read(data []byte) (int, error) {
	return c.bufReader.Read(data)
}

func (c *ajaxConn) Close() error {
	c.closeMutex.Lock()
	defer c.closeMutex.Unlock()

	// Check if closed.
	select {
	case <-c.closedChan:
		return nil
	default:
	}

	close(c.closedChan)

	c.io.Close()

	return nil
}

func (c *ajaxConn) LocalAddr() net.Addr {
	return c.localAddr
}

func (c *ajaxConn) RemoteAddr() net.Addr {
	return c.remoteAddr
}

func (c *ajaxConn) SetDeadline(t time.Time) error {
	err := c.SetReadDeadline(t)
	if err != nil {
		return err
	}

	return c.SetWriteDeadline(t)
}

func (c *ajaxConn) SetReadDeadline(t time.Time) error {
	return c.io.SetReadDeadline(t)
}

func (c *ajaxConn) SetWriteDeadline(t time.Time) error {
	return c.io.SetWriteDeadline(t)
}

//###############################//
//### ajaxConn Type - Private ###//
//###############################//

func (c *ajaxConn) lockPollRequest() bool {
	c.pollRequestActiveMutex.Lock()
	defer c.pollRequestActiveMutex.Unlock()

	if c.pollRequestActive {
		return false
	}

	c.pollRequestActive = true
	return true
}

func (c *ajaxConn) unlockPollRequest() {
	c.pollRequestActiveMutex.Lock()
	defer c.pollRequestActiveMutex.Unlock()

	c.pollRequestActive = false
}

func (c *ajaxConn) lockPushRequest() bool {
	c.pushRequestActiveMutex.Lock()
	defer c.pushRequestActiveMutex.Unlock()

	if c.pushRequestActive {
		return false
	}

	c.pushRequestActive = true
	return true
}

func (c *ajaxConn) unlockPushRequest() {
	c.pushRequestActiveMutex.Lock()
	defer c.pushRequestActiveMutex.Unlock()

	c.pushRequestActive = false
}

func (c *ajaxConn) compareIP(remoteAddr string) bool {
	ip, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		return false
	}

	return c.remoteIP == ip
}

//###################//
//### ajaxIO Type ###//
//###################//

type ajaxIO struct {
	WriteChan chan []byte
	ReadChan  chan []byte

	closedChan chan struct{}
	readBuf    []byte

	writeDeadline      time.Time
	writeDeadlineMutex sync.Mutex
	readDeadline       time.Time
	readDeadlineMutex  sync.Mutex
}

func newAjaxIO() *ajaxIO {
	a := &ajaxIO{
		WriteChan:  make(chan []byte),
		ReadChan:   make(chan []byte),
		closedChan: make(chan struct{}),
	}

	return a
}

func (a *ajaxIO) Write(data []byte) (n int, err error) {
	// Obtain the write timeout duration.
	timeoutDuration, timeoutIsZero := func() (time.Duration, bool) {
		a.writeDeadlineMutex.Lock()
		defer a.writeDeadlineMutex.Unlock()

		if a.writeDeadline.IsZero() {
			return 0, true
		}

		return a.writeDeadline.Sub(time.Now()), false
	}()

	// Only start a timeout if set (not zero).
	timeoutChan := make(chan struct{})
	if !timeoutIsZero {
		if timeoutDuration > 0 {
			timeout := time.AfterFunc(timeoutDuration, func() {
				close(timeoutChan)
			})
			defer timeout.Stop()
		} else {
			// Immediately timeout if the timeout is exceeded.
			close(timeoutChan)
		}
	}

	select {
	case a.WriteChan <- data:
		return len(data), nil
	case <-timeoutChan:
		return 0, &netError{msg: "write timeout", temporary: true, timeout: true}
	case <-a.closedChan:
		return 0, ErrClosed
	}
}

func (a *ajaxIO) Read(data []byte) (n int, err error) {
	// Check if there is still data present from the previous read.
	if len(a.readBuf) > 0 {
		n = copy(data, a.readBuf)
		a.readBuf = a.readBuf[n:]
		return n, nil
	}

	// Obtain the read timeout duration.
	timeoutDuration, timeoutIsZero := func() (time.Duration, bool) {
		a.readDeadlineMutex.Lock()
		defer a.readDeadlineMutex.Unlock()

		if a.readDeadline.IsZero() {
			return 0, true
		}

		return a.readDeadline.Sub(time.Now()), false
	}()

	// Only start a timeout if set (not zero).
	timeoutChan := make(chan struct{})
	if !timeoutIsZero {
		if timeoutDuration > 0 {
			timeout := time.AfterFunc(timeoutDuration, func() {
				close(timeoutChan)
			})
			defer timeout.Stop()
		} else {
			// Immediately timeout if the timeout is exceeded.
			close(timeoutChan)
		}
	}

	select {
	case buf := <-a.ReadChan:
		n = copy(data, buf)
		if n < len(buf) {
			a.readBuf = buf[n:]
		}

		return n, nil

	case <-timeoutChan:
		return 0, &netError{msg: "read timeout", temporary: true, timeout: true}

	case <-a.closedChan:
		return 0, ErrClosed
	}
}

func (a *ajaxIO) Close() {
	close(a.closedChan)
}

func (a *ajaxIO) SetWriteDeadline(t time.Time) error {
	a.writeDeadlineMutex.Lock()
	defer a.writeDeadlineMutex.Unlock()

	a.writeDeadline = t

	return nil
}

func (a *ajaxIO) SetReadDeadline(t time.Time) error {
	a.readDeadlineMutex.Lock()
	defer a.readDeadlineMutex.Unlock()

	a.readDeadline = t

	return nil
}

//###############//
//### Private ###//
//###############//

func (s *Server) handleAjaxSocketRequest(rw http.ResponseWriter, req *http.Request) {
	remoteAddr, _ := extractRemoteAddress(req)
	userAgent := req.Header.Get("User-Agent")

	// Extract the header.
	reqType, headerStr, err := extractHeader(req.Body)
	if err != nil {
		httpErrLog(rw, req, http.StatusBadRequest, fmt.Errorf("ajax: failed to extract header: %v", err))
		return
	}

	// Determine the request type.
	if reqType == ajaxRequestPush {
		err = s.pushAjaxRequest(headerStr, remoteAddr, userAgent, rw, req)
	} else if reqType == ajaxRequestPoll {
		err = s.pollAjaxRequest(headerStr, remoteAddr, userAgent, rw)
	} else if reqType == ajaxRequestInit {
		err = s.initAjaxRequest(remoteAddr, userAgent, rw)
	} else {
		err = fmt.Errorf("invalid request type: %v", reqType)
	}

	// Handle the error.
	if err != nil {
		httpErrLog(rw, req, http.StatusBadRequest, fmt.Errorf("ajax: %v", err))
		return
	}
}

func (s *Server) initAjaxRequest(remoteAddr, userAgent string, w http.ResponseWriter) error {
	// Create a new ajaxsocket connection instance.
	a := newAjaxConn(s.options.ReadBufferSize, s.options.WriteBufferSize)
	a.userAgent = userAgent
	a.remoteAddr = &addr{
		network: "tcp",
		str:     remoteAddr,
	}
	a.localAddr = &addr{
		network: "tcp",
		str:     "unknown", // TODO: Obtain this from the request.
	}

	remoteIP, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		return err
	}
	a.remoteIP = remoteIP

	var uid string
	func() {
		// Lock the mutex
		s.ajaxSocketsMutex.Lock()
		defer s.ajaxSocketsMutex.Unlock()

		// Obtain a new unique ID.
		for {
			// Generate it.
			uid = randomString(ajaxUIDLength)

			// Check if the new UID is already used.
			// This is very unlikely, but we have to check this!
			_, ok := s.ajaxSockets[uid]
			if !ok {
				// Break the loop if the UID is unique.
				break
			}
		}

		// Set the UID.
		a.uid = uid

		// Add the new ajax socket to the map.
		s.ajaxSockets[uid] = a
	}()

	// Start a goroutine which removes the socket again from the map
	// as soon as the socket is closed.
	go func() {
		<-a.closedChan

		// Lock the mutex
		s.ajaxSocketsMutex.Lock()
		defer s.ajaxSocketsMutex.Unlock()

		// Remove again from the ajax socket map.
		delete(s.ajaxSockets, a.uid)
	}()

	// Start a goroutine to close the socket on timeout.
	go func() {
		<-a.timeout.C
		a.Close()
	}()

	// Create a new poll and push token.
	a.pollToken = randomString(ajaxPollTokenLength)
	a.pushToken = randomString(ajaxPushTokenLength)

	// Tell the client the UID and the tokens.
	_, err = io.WriteString(w, uid+ajaxDataDelimiter+a.pollToken+ajaxDataDelimiter+a.pushToken)
	if err != nil {
		return err
	}

	// Finally handle over the new connection to the server.
	s.onNewSocketConn(a)

	return nil
}

func (s *Server) pushAjaxRequest(headerStr, remoteAddr, userAgent string, rw http.ResponseWriter, req *http.Request) (err error) {
	// Extract the uid and the push token.
	i := strings.Index(headerStr, ajaxDataDelimiter)
	if i < 0 {
		return fmt.Errorf("push: invalid request: missing ajax data delimiter")
	}
	uid := headerStr[:i]
	pushToken := headerStr[i+1:]

	// Obtain the ajax socket with the uid.
	a := func() *ajaxConn {
		// Lock the mutex.
		s.ajaxSocketsMutex.Lock()
		defer s.ajaxSocketsMutex.Unlock()

		// Obtain the ajax socket with the uid-
		a, ok := s.ajaxSockets[uid]
		if !ok {
			return nil
		}
		return a
	}()
	if a == nil {
		return fmt.Errorf("push: client requested an invalid ajax socket: uid is invalid")
	}

	// The IP addresses have to match.
	if !a.compareIP(remoteAddr) {
		return fmt.Errorf("push: invalid remote address")
	}

	// The user agents have to match.
	if a.userAgent != userAgent {
		return fmt.Errorf("push: invalid user agent")
	}

	// Only allow one push request at once.
	if !a.lockPushRequest() {
		return fmt.Errorf("push: another push request for the same socket is active")
	}
	defer a.unlockPushRequest()

	// Check if the push tokens match.
	if a.pushToken != pushToken {
		return fmt.Errorf("push: invalid push token")
	}

	// Create a new push token.
	a.pushToken = randomString(ajaxPushTokenLength)

	// Send the new push token to the client.
	_, err = io.WriteString(rw, a.pushToken)
	if err != nil {
		return err
	}

	// Read from the body.
	var n int
	for {
		data := make([]byte, 256)
		n, err = req.Body.Read(data)
		if err != nil && err != io.EOF {
			return err
		}

		// Write the received data to the read channel.
		if n > 0 {
			a.io.ReadChan <- data[:n]
		}

		if err == io.EOF {
			return nil
		}

		if n == 0 {
			time.Sleep(10000 * time.Nanosecond)
		}
	}
}

func (s *Server) pollAjaxRequest(headerStr, remoteAddr, userAgent string, w http.ResponseWriter) (err error) {
	// Extract the uid and the poll token.
	i := strings.Index(headerStr, ajaxDataDelimiter)
	if i < 0 {
		return fmt.Errorf("poll: invalid request: missing ajax data delimiter")
	}
	uid := headerStr[:i]
	pollToken := headerStr[i+1:]

	// Obtain the ajax socket with the uid.
	a := func() *ajaxConn {
		// Lock the mutex.
		s.ajaxSocketsMutex.Lock()
		defer s.ajaxSocketsMutex.Unlock()

		// Obtain the ajax socket with the uid.
		a, ok := s.ajaxSockets[uid]
		if !ok {
			return nil
		}
		return a
	}()
	if a == nil {
		return fmt.Errorf("poll: client requested an invalid ajax socket: uid is invalid")
	}

	// The remote addresses have to match.
	if !a.compareIP(remoteAddr) {
		return fmt.Errorf("poll: invalid remote address")
	}

	// The user agents have to match.
	if a.userAgent != userAgent {
		return fmt.Errorf("poll: invalid user agent")
	}

	// Only allow one poll request at once.
	if !a.lockPollRequest() {
		return fmt.Errorf("poll: another poll request for the same socket is active")
	}
	defer a.unlockPollRequest()

	// Check if the poll tokens match.
	if a.pollToken != pollToken {
		return fmt.Errorf("poll: invalid poll token")
	}

	// Reset the socket timeout.
	a.timeout.Reset(ajaxSocketTimeout)

	// Create a new poll token.
	a.pollToken = randomString(ajaxPollTokenLength)

	// Create a timeout timer for the poll.
	timeout := time.NewTimer(ajaxPollTimeout)
	defer timeout.Stop()

	// Send messages as soon as there are some available.
	select {
	case data := <-a.io.WriteChan:
		// Send the message type and the poll token length.
		_, err = w.Write([]byte{ajaxPollCmdData, byte(len(a.pollToken))})
		if err != nil {
			return err
		}

		// Send the poll token.
		_, err = w.Write([]byte(a.pollToken))
		if err != nil {
			return err
		}

		// Send the data.
		_, err = w.Write(data)
		if err != nil {
			return err
		}

		// Ensure, that after a certain timeout a new poll request has to be made.
		timeout.Reset(10 * time.Millisecond)

		// Write more data if available.
	WriteLoop:
		for {
			select {
			case data = <-a.io.WriteChan:
				_, err = w.Write(data)
				if err != nil {
					return err
				}

			case <-timeout.C:
				break WriteLoop

			case <-a.closedChan:
				break WriteLoop

			default:
				// Check if there is new data available after a short timeout.
				time.Sleep(500000 * time.Nanosecond)
				if len(a.io.WriteChan) > 0 {
					continue WriteLoop
				}

				break WriteLoop
			}
		}

	case <-timeout.C:
		// Tell the client that this ajax connection has reached the timeout.
		// Send the message type and the poll token length.
		_, err = w.Write([]byte{ajaxPollCmdTimeout, byte(len(a.pollToken))})
		if err != nil {
			return err
		}

		// Send the poll token.
		_, err = w.Write([]byte(a.pollToken))
		if err != nil {
			return err
		}

	case <-a.closedChan:
		// Tell the client that this ajax connection is closed.
		_, err = w.Write([]byte{ajaxPollCmdClosed})
		if err != nil {
			return err
		}
	}

	return nil
}

func extractHeader(body io.ReadCloser) (reqType byte, headerStr string, err error) {
	if body == nil {
		return 0, "", fmt.Errorf("body is empty")
	}

	var n, totalBytesRead int
	header := make([]byte, ajaxHeaderSize)

	// Only read the header from the io Reader.
	for totalBytesRead < ajaxHeaderSize {
		n, err = body.Read(header[totalBytesRead:])
		totalBytesRead += n
		if err != nil {
			if err == io.EOF {
				break
			}
			return 0, "", err
		}
	}

	if totalBytesRead != ajaxHeaderSize {
		return 0, "", fmt.Errorf("invalid header size")
	}

	// Extract the request type and the additional header string size.
	reqType = header[0]
	headerStrSize := int(header[1])

	// Read the additional string if present.
	if headerStrSize > 0 {
		if headerStrSize > ajaxHeaderStrMaxSize {
			return 0, "", fmt.Errorf("invalid header string size")
		}

		header = make([]byte, headerStrSize)
		totalBytesRead = 0

		for totalBytesRead < headerStrSize {
			n, err = body.Read(header[totalBytesRead:])
			totalBytesRead += n
			if err != nil {
				if err == io.EOF {
					break
				}
				return 0, "", err
			}
		}

		if totalBytesRead != headerStrSize {
			return 0, "", fmt.Errorf("invalid header string size")
		}

		// Extract the header string.
		headerStr = string(header)
	}

	return reqType, headerStr, nil
}
