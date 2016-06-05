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
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestExtractRemoteAddress(t *testing.T) {
	r, err := http.NewRequest("GET", "http://127.0.0.1", nil)
	require.NoError(t, err)

	r.RemoteAddr = "127.0.0.1:8888"
	s, b := extractRemoteAddress(r)
	require.Equal(t, "127.0.0.1:8888", s)
	require.True(t, b)

	r.Header.Add("X-Forwarded-For", " 1.1.1.1 ")
	s, b = extractRemoteAddress(r)
	require.Equal(t, "1.1.1.1:8888", s)
	require.False(t, b)

	r.Header.Del("X-Forwarded-For")
	r.Header.Add("X-Forwarded-For", " 1.1.1.1 , 2.2.2.2 , 3.3.3.3 ")
	s, b = extractRemoteAddress(r)
	require.Equal(t, "1.1.1.1:8888", s)
	require.False(t, b)

	r.Header.Del("X-Forwarded-For")
	r.Header.Add("X-Real-Ip", " 4.4.4.4 ")
	s, b = extractRemoteAddress(r)
	require.Equal(t, "4.4.4.4:8888", s)
	require.False(t, b)
}
