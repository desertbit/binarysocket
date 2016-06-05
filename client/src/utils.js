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

/*
*  This code lives inside the BinarySocket function.
*/

var utils = {
  // Mimics jQuery's extend method.
  // Source: http://stackoverflow.com/questions/11197247/javascript-equivalent-of-jquerys-extend-method
  extend: function() {
    for(var i=1; i<arguments.length; i++)
        for(var key in arguments[i])
            if(arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];
    return arguments[0];
  },

  // Return a function which is triggered only once within the limit duration.
  // If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  throttle: function(callback, limit, immediate) {
    var wait = false;
    return function () {
      var context = this, args = arguments;
        if (!wait) {
          if (immediate) { callback.apply(context, args); }
          wait = true;
          setTimeout(function () {
            wait = false;
            if (!immediate) { callback.apply(context, args); }
          }, limit);
        }
      };
  }
};
