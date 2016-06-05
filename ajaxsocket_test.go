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
	"net"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestAjaxIOWriteDeadline(t *testing.T) {
	a := newAjaxIO()

	err := a.SetWriteDeadline(time.Now().Add(time.Second))
	require.NoError(t, err)
	_, err = a.Write([]byte{0, 1, 2, 3})
	require.Error(t, err)
	require.True(t, err.(net.Error).Timeout())

	err = a.SetWriteDeadline(time.Now().Add(-time.Second))
	require.NoError(t, err)
	_, err = a.Write([]byte{0, 1, 2, 3})
	require.Error(t, err)
	require.True(t, err.(net.Error).Timeout())
}

func TestAjaxWriteDeadline(t *testing.T) {
	a := newAjaxConn(defaultReadBufferSize, defaultWriteBufferSize)

	err := a.SetWriteDeadline(time.Now().Add(time.Second))
	require.NoError(t, err)
	_, err = a.Write(make([]byte, defaultWriteBufferSize+1))
	require.Error(t, err)
	require.True(t, err.(net.Error).Timeout())

	err = a.SetWriteDeadline(time.Now().Add(-time.Second))
	require.NoError(t, err)
	_, err = a.Write(make([]byte, defaultWriteBufferSize+1))
	require.Error(t, err)
	require.True(t, err.(net.Error).Timeout())
}

func TestAjaxIOReadDeadline(t *testing.T) {
	a := newAjaxIO()
	data := make([]byte, 256)

	err := a.SetReadDeadline(time.Now().Add(time.Second))
	require.NoError(t, err)
	_, err = a.Read(data)
	require.Error(t, err)
	require.True(t, err.(net.Error).Timeout())

	err = a.SetReadDeadline(time.Now().Add(-time.Second))
	require.NoError(t, err)
	_, err = a.Read(data)
	require.Error(t, err)
	require.True(t, err.(net.Error).Timeout())
}

func TestAjaxReadDeadline(t *testing.T) {
	a := newAjaxConn(defaultReadBufferSize, defaultWriteBufferSize)
	data := make([]byte, 256)

	err := a.SetReadDeadline(time.Now().Add(time.Second))
	require.NoError(t, err)
	_, err = a.Read(data)
	require.Error(t, err)
	require.True(t, err.(net.Error).Timeout())

	err = a.SetReadDeadline(time.Now().Add(-time.Second))
	require.NoError(t, err)
	_, err = a.Read(data)
	require.Error(t, err)
	require.True(t, err.(net.Error).Timeout())
}

func TestAjaxIORead(t *testing.T) {
	var wg sync.WaitGroup
	a := newAjaxIO()

	// ######
	// Test 1
	// ######

	sampleBuf := make([]byte, 256)
	for x := 0; x < len(sampleBuf); x++ {
		sampleBuf[x] = byte(x % 256)
	}

	wg.Add(1)
	go func() {
		defer wg.Done()

		for i := 0; i < 100; i++ {
			buf := make([]byte, 256)
			copy(buf, sampleBuf)

			a.ReadChan <- buf
		}
	}()

	var readBytes, count int
	data := make([]byte, 256)

	for count < 100 {
		n, err := a.Read(data[readBytes:])
		readBytes += n
		require.NoError(t, err)

		if readBytes < len(data) {
			continue
		}

		readBytes = 0
		count++

		require.Equal(t, sampleBuf, data)
	}

	wg.Wait()

	// ######
	// Test 2
	// ######

	sampleBuf = make([]byte, 256)
	for x := 0; x < len(sampleBuf); x++ {
		sampleBuf[x] = byte(x % 256)
	}

	wg.Add(1)
	go func() {
		defer wg.Done()

		buf := make([]byte, 256)
		copy(buf, sampleBuf)

		a.ReadChan <- buf
	}()

	readBytes = 0
	data = make([]byte, 1024)

	for {
		n, err := a.Read(data[readBytes:])
		readBytes += n
		require.NoError(t, err)

		if readBytes < len(sampleBuf) {
			continue
		}

		require.Equal(t, sampleBuf, data[:len(sampleBuf)])
		break
	}

	wg.Wait()

	// ######
	// Test 3
	// ######

	sampleBuf = make([]byte, 256)
	for x := 0; x < len(sampleBuf); x++ {
		sampleBuf[x] = byte(x % 256)
	}

	wg.Add(1)
	go func() {
		defer wg.Done()

		for i := 0; i < 100; i++ {
			buf := make([]byte, 256)
			copy(buf, sampleBuf)

			a.ReadChan <- buf
		}
	}()

	readBytes = 0
	count = 0
	data = make([]byte, 256)

	for count < 100 {
		buf := make([]byte, 1)
		n, err := a.Read(buf)
		require.NoError(t, err)

		for i, b := range buf[:n] {
			data[readBytes+i] = b
		}

		readBytes += n
		if readBytes < len(data) {
			continue
		}

		readBytes = 0
		count++

		require.Equal(t, sampleBuf, data)
	}

	wg.Wait()

	// ######
	// Test 4
	// ######

	sampleBuf = make([]byte, 256)
	for x := 0; x < len(sampleBuf); x++ {
		sampleBuf[x] = byte(x % 256)
	}

	wg.Add(1)
	go func() {
		defer wg.Done()

		for i := 0; i < 100; i++ {
			buf := make([]byte, 256)
			copy(buf, sampleBuf)

			a.ReadChan <- buf
		}
	}()

	readBytes = 0
	count = 0
	data = make([]byte, 256)

	for count < 100 {
		buf := make([]byte, 5)
		n, err := a.Read(buf)
		require.NoError(t, err)

		for i, b := range buf[:n] {
			data[readBytes+i] = b
		}

		readBytes += n
		if readBytes < len(data) {
			continue
		}

		readBytes = 0
		count++

		require.Equal(t, sampleBuf, data)
	}

	wg.Wait()

	// ######
	// Test 5
	// ######

	a.Close()
	_, err := a.Read(data)
	require.Equal(t, ErrClosed, err)
}
