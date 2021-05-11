/**
 * Startpage - a minimalist startpage, also available as a browser extension.
 * Copyright (C) 2021-present Farow
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict';

/**
 * Store search parameters of the url in LocationParams.
 * The startpage can then use these to override the default behavior and settings.
 */

const LocationParams = (() => {
	const params = new URLSearchParams(document.location.search);
	const handled = {};
	const validParams = {};

	for(var key of params.keys()) {
		if (handled.hasOwnProperty(key)) {
			continue;
		}

		handleParam(key, params.getAll(key));

		/* Prevent handling the same key more than once. */
		handled[key] = true;
	}

	function handleParam(name, value) {
		switch (name) {
			case 'demo':
				validParams[name] = true;
				break;
			case 'clear':
				validParams[name] = true;
				break;
		}
	}

	return validParams;
})();
