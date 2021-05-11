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

const Configuration = (() => {
	const defaultSettings = {
		background: 'hsla(30, 20%, 90%, 1)',
	};

	const defaultConfiguration = {
		settings: defaultSettings,
		containers: [ ],
	};

	function load(demoMode) {
		if (demoMode) {
			return validateJson(demoConfiguration());
		}

		const storedData = localStorage.getItem('data');

		if (typeof storedData != 'string' || storedData.length == 0) {
			return defaultConfiguration;
		}

		try {
			return validateJson(storedData);
		}
		catch (error) {
			console.warn('Invalid data in localStorage, falling back to the default configuration.', error);
			return defaultConfiguration;
		}
	}

	function save(dataString) {
		localStorage.setItem('data', dataString);
	}

	function validateJson(jsonString) {
		if (typeof jsonString != "string" || jsonString.length == 0) {
			throw new Error('Not a string or empty string.');
		}

		let dataObject;

		try {
			dataObject = JSON.parse(jsonString);
		}
		catch(error) {
			throw new Error('Not a valid JSON string.');
		}

		if (typeof dataObject != 'object' || !(dataObject instanceof Object) ) {
			throw new Error('Root JSON element is not an object.');
		}

		if (!dataObject.hasOwnProperty('settings') || !(dataObject.settings instanceof Object)) {
			throw new Error('Settings property missing or contains invalid data.');
		}

		if (!dataObject.settings.hasOwnProperty('background')) {
			throw new Error('Settings has no background property.')
		}

		if (!dataObject.hasOwnProperty('containers') || !(dataObject.containers instanceof Array)) {
			throw new Error('Containers property missing or contains invalid data.');
		}

		for (let item of dataObject.containers) {
			if (!(item instanceof Object)) {
				throw new Error('Unexpected data in JSON array.');
			}

			if (!item.hasOwnProperty('title')) {
				throw new Error('Bookmark container has "title" property.');
			}

			if (!item.hasOwnProperty('bookmarks')) {
				throw new Error('Bookmark container has no "bookmarks" property.');
			}

			if (!(item.bookmarks instanceof Array)) {
				throw new Error('Bookmark container "bookmarks" property is not an array.');
			}

			for (let bookmark of item.bookmarks) {
				if (!bookmark.hasOwnProperty('title') && !bookmark.hasOwnProperty('spacer')) {
					throw new Error('Bookmark container contains invalid data.');
				}

				if (bookmark.hasOwnProperty('title') && !bookmark.hasOwnProperty('url')) {
					throw new Error('Bookmark has no "url" property.');
				}

				if (bookmark.hasOwnProperty('spacer') && !bookmark.hasOwnProperty('flexible')) {
					throw new Error('Spacer has no "flexible" property.');
				}
			}
		}

		return dataObject;
	}

	function demoConfiguration() {
		return `
			{
			    "settings": {
			        "background": "hsla(30, 30%, 90%, 1)"
			    },
			    "containers": [
			        {
			            "title": "news",
			            "bookmarks": [
			                {
			                    "title": "ars",
			                    "url": "https://arstechnica.com/"
			                },
			                {
			                    "title": "/r/news",
			                    "url": "https://www.reddit.com/r/news"
			                }
			            ]
			        },
			        {
			            "title": "social",
			            "bookmarks": [
			                {
			                    "title": "reddit",
			                    "url": "https://www.reddit.com/"
			                },
			                {
			                    "title": "linkedin",
			                    "url": "https://www.linkedin.com/"
			                }
			            ]
			        },
			        {
			            "title": "dev",
			            "bookmarks": [
			                {
			                    "title": "github",
			                    "url": "https://github.com/"
			                },
			                {
			                    "title": "gist",
			                    "url": "https://gist.github.com/"
			                },
			                {
			                    "title": "mdn",
			                    "url": "https://developer.mozilla.org/en-US/"
			                },
			                {
			                    "spacer": "true",
			                    "flexible": false
			                },
			                {
			                    "title": "/r/webdev",
			                    "url": "https://www.reddit.com/r/webdev"
			                },
			                {
			                    "title": "/r/programming",
			                    "url": "https://www.reddit.com/r/programming"
			                }
			            ]
			        },
			        {
			            "title": "entertainment",
			            "bookmarks": [
			                {
			                    "title": "twitch",
			                    "url": "https://twitch.tv/"
			                },
			                {
			                    "title": "youtube",
			                    "url": "https://www.youtube.com/"
			                }
			            ]
			        }
			    ]
			}
		`;
	}

	return {
		load: load,
		save: save,
		validateJson: validateJson,
	}
})();
