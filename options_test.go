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
	"testing"

	"github.com/stretchr/testify/require"
)

func TestOptionsSetDefaults(t *testing.T) {
	o := new(Options)
	o.setDefaults()
	require.Equal(t, defaultReadBufferSize, o.ReadBufferSize)
	require.Equal(t, defaultWriteBufferSize, o.WriteBufferSize)
	require.NotNil(t, o.CheckOrigin)
	require.False(t, o.DisableAjax)

	o.ReadBufferSize = 1
	o.WriteBufferSize = 1
	o.DisableAjax = true
	o.setDefaults()
	require.Equal(t, 1, o.ReadBufferSize)
	require.Equal(t, 1, o.WriteBufferSize)
	require.True(t, o.DisableAjax)
}
