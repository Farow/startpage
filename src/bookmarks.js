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

const ToggleEditModeButton = (() => {
	const toggleEditButton = document.createElement('span');
	toggleEditButton.appendChild(document.createTextNode('+ edit'));
	toggleEditButton.classList.add('button', 'always-visible');
	toggleEditButton.addEventListener('mousedown', toggleEditMode);

	function toggleEditMode(event) {
		document.body.classList.toggle('edit-enabled');
		const currentSymbol = toggleEditButton.firstChild.substringData(0, 1);

		if (currentSymbol == '+') {
			toggleEditButton.firstChild.replaceData(0, 1, '-');
		}
		else {
			toggleEditButton.firstChild.replaceData(0, 1, '+');
		}

		event.stopPropagation();
		event.preventDefault();
	}

	return {
		element: toggleEditButton,
	};
})();

const AddContainerButton = (() => {
	const addContainerButton = document.createElement('span');
	addContainerButton.appendChild(document.createTextNode('+ container'));
	addContainerButton.classList.add('button');
	addContainerButton.addEventListener('mousedown', setButtonEditable);

	function setButtonEditable(event) {
		if (addContainerButton.isContentEditable) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		addContainerButton.contentEditable = true;
		addContainerButton.addEventListener('keydown', keyListener);
		addContainerButton.addEventListener('blur', resetButton);
		selectElement(addContainerButton);

		event.preventDefault();
		event.stopPropagation();
	}

	function resetButton() {
		if (!addContainerButton.isContentEditable) {
			return;
		}

		addContainerButton.innerHTML = '';
		addContainerButton.appendChild(document.createTextNode('+ container'));
		addContainerButton.removeAttribute('contenteditable');
		addContainerButton.removeEventListener('keydown', keyListener);
		addContainerButton.removeEventListener('blur', resetButton);
		document.getSelection().removeAllRanges();
	}

	function selectElement(element) {
		const range = document.createRange();
		range.selectNodeContents(element);

		const selection = document.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}

	function keyListener(event) {
		switch (event.key) {
			case 'Enter':
				const userInput = addContainerButton.textContent;
				resetButton();

				BookmarkManager.addContainer(userInput);

				event.preventDefault();
				event.stopPropagation();
				return;
			case 'Tab':
			case 'Escape':
				resetButton();
				event.preventDefault();
				event.stopPropagation();
				return;
			default:
				event.stopPropagation();
		}
	}

	return {
		element: addContainerButton,
	};
})();

const ExportButton = (() => {
	const exportButton = document.createElement('span');
	exportButton.appendChild(document.createTextNode('+ export'));
	exportButton.title = 'Exports bookmarks to the clipboard.';
	exportButton.classList.add('button');
	exportButton.addEventListener('mousedown', exportBookmarks);

	function exportBookmarks(event) {
		navigator.clipboard.writeText(BookmarkManager.toJSON())
			.then(() => {
				const currentSymbol = exportButton.firstChild.substringData(0, 1);
				if (currentSymbol == '+') {
					exportButton.firstChild.replaceData(0, 1, '✓');
					setTimeout(() => {
						exportButton.firstChild.replaceData(0, 1, '+');
					}, 2000);
				}
			})
			.catch(error => {
				const currentSymbol = exportButton.firstChild.substringData(0, 1);
				if (currentSymbol == '+') {
					exportButton.firstChild.replaceData(0, 1, '✗');
					exportButton.title = error;

					setTimeout(() => {
						exportButton.firstChild.replaceData(0, 1, '+');
						exportButton.title = 'Exports bookmarks to the clipboard.';
					}, 2000);
				}
			});

		event.stopPropagation();
		event.preventDefault();
	}

	return {
		element: exportButton,
	};
})();

const ImportButton = (() => {
	const importButton = document.createElement('span');
	importButton.appendChild(document.createTextNode('+ import'));
	importButton.title = 'Imports bookmarks from the clipboard.';
	importButton.classList.add('button');
	importButton.addEventListener('mousedown', importBookmarks);

	let timeout;

	function importBookmarks(event) {
		navigator.clipboard.readText()
			.then(text => {
				BookmarkManager.validateData(text);
				localStorage.setItem('data', text);
				setSuccess();
				location.reload();
			})
			.catch(error => { setError(error); });

		event.preventDefault();
		event.stopPropagation();
	}

	function setSuccess() {
		const currentSymbol = importButton.firstChild.substringData(0, 1);
		if (currentSymbol == '+') {
			clearTimeout(timeout);
			importButton.firstChild.replaceData(0, 1, '✓');
			timeout = setTimeout(() => {
				importButton.firstChild.replaceData(0, 1, '+');
			}, 5000);
		}
	}

	function setError(error) {
		const currentSymbol = importButton.firstChild.substringData(0, 1);
		if (currentSymbol == '+') {
			clearTimeout(timeout);
			importButton.firstChild.replaceData(0, 1, '✗');
			importButton.title = error;

			timeout = setTimeout(() => {
				importButton.firstChild.replaceData(0, 1, '+');
				importButton.title = 'Imports bookmarks from the clipboard.';
			}, 5000);
		}
	}

	return {
		element: importButton,
	};
})();

const SideControls = (() => {
	const wrapper = document.createElement('div');
	wrapper.classList.add('side');

	wrapper.appendChild(ToggleEditModeButton.element);
	wrapper.appendChild(AddContainerButton.element);
	wrapper.appendChild(ExportButton.element);
	wrapper.appendChild(ImportButton.element);

	return {
		element: wrapper,
	};
})();

const BookmarkEditor = (() => {
	const wrapper = document.createElement('div');
	wrapper.classList.add('bookmark-editor');
	wrapper.style.display = 'none';

	const titleInput = document.createElement('input');
	titleInput.placeholder = 'title';

	const urlInput = document.createElement('input');
	urlInput.placeholder = 'url';

	wrapper.appendChild(titleInput);
	wrapper.appendChild(urlInput);

	let promiseResolve, promiseReject;

	function edit(bookmark) {
		if (promiseReject instanceof Function) {
			promiseReject();
		}

		wrapper.removeAttribute('style');

		const bookmarkCoords = bookmark.element.getBoundingClientRect();
		wrapper.style.left = (bookmarkCoords.x + window.scrollX) + 'px';
		wrapper.style.top = (bookmarkCoords.y + window.scrollY) + 'px';

		titleInput.value = bookmark.title;
		urlInput.value = bookmark.url;


		titleInput.focus();
		titleInput.setSelectionRange(0, urlInput.value.length);

		titleInput.addEventListener('keydown', keyListener);
		urlInput.addEventListener('keydown', keyListener);

		return new Promise((resolve, reject) => [ promiseResolve, promiseReject ] = [ resolve, reject ]);
	}

	function hide() {
		wrapper.style.display = 'none';
		titleInput.removeEventListener('keydown', keyListener);
		urlInput.removeEventListener('keydown', keyListener);
	}

	function keyListener(event) {
		switch(event.key) {
			case 'Enter':
				hide();
				promiseResolve([titleInput.value, urlInput.value]);
				event.preventDefault();
				event.stopPropagation();
				return;
			case 'Tab':
				if (event.target == titleInput) {
					urlInput.focus();
					urlInput.setSelectionRange(0, urlInput.value.length);
				}
				else {
					titleInput.focus();
					titleInput.setSelectionRange(0, titleInput.value.length);
				}

				event.preventDefault();
				event.stopPropagation();
				return;
			case 'Escape':
				hide();
				promiseReject();
			default:
				event.stopPropagation();
		}
	}

	return {
		element: wrapper,
		edit: edit,
	}
})();

const BookmarkManager = (() => {
	const containers = [];

	document.addEventListener('DOMContentLoaded', domReady);
	load();

	function addContainer(title) {
		const container = new BookmarkContainer(title);

		// Insert before the + container button.
		document.body.insertBefore(container.element, SideControls.element);
		document.body.classList.remove('empty');

		containers.push(container);
		save();
	}

	function save() {
		localStorage.setItem('data', toJSON());
	}

	function validateData(data) {
		if (typeof data != "string" || data.length == 0) {
			throw new Error('Not a string.');
		}

		let dataObject;

		try {
			dataObject = JSON.parse(data);
		}
		catch(error) {
			throw new Error('Not a JSON string.');
		}

		if (!(dataObject instanceof Array)) {
			throw new Error('Root JSON element is not an array.');
		}

		for (let item of dataObject) {
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

	function domReady() {
		if (containers.length == 0) {
			// This is cleared when a container is added.
			document.body.classList.add('empty');
		}

		for (let container of containers) {
			document.body.appendChild(container.element);
		}

		document.body.appendChild(SideControls.element);
		document.body.appendChild(BookmarkEditor.element);
	}

	function load() {
		let storedContainers = [];

		try {
			storedContainers = validateData(localStorage.getItem('data'));
		}
		catch(error) {
			console.error('Invalid data in localStorage:', error);
		}

		for (let storedContainer of storedContainers) {
			const container = new BookmarkContainer(storedContainer.title);
			containers.push(container);

			for (let storedBookmark of storedContainer.bookmarks) {
				if (storedBookmark.hasOwnProperty('title')) {
					const bookmark = new Bookmark(storedBookmark.title, storedBookmark.url);
					container.addBookmark(bookmark);
				}
				else if (storedBookmark.hasOwnProperty('spacer')) {
					const spacer = new Spacer(storedBookmark.flexible);
					container.addSpacer(spacer);
				}
			}
		}
	}

	function toObject() {
		return containers.map(c => c.toObject());
	}

	function toJSON() {
		return JSON.stringify(toObject(), null, 4);
	}

	return {
		addContainer: addContainer,
		save: save,
		toJSON: toJSON,
		validateData, validateData,
	};
})();

function BookmarkContainer(title) {
	const wrapper = document.createElement('div');
	wrapper.classList.add('bookmark-container');

	const titleElement = document.createElement('div');
	titleElement.classList.add('container-title');

	const unread = document.createElement('span');
	unread.classList.add('unread');

	const addBookmarkButton = document.createElement('div');
	addBookmarkButton.classList.add('button');
	addBookmarkButton.appendChild(document.createTextNode('+ bookmark'));
	addBookmarkButton.addEventListener('mousedown', addNewBookmark);

	const addSpacerButton = document.createElement('div');
	addSpacerButton.classList.add('button');
	addSpacerButton.appendChild(document.createTextNode('+ spacer'));
	addSpacerButton.addEventListener('mousedown', addNewSpacer);

	const addFlexibleSpacerButton = document.createElement('div');
	addFlexibleSpacerButton.classList.add('button');
	addFlexibleSpacerButton.appendChild(document.createTextNode('+ flexible spacer'));
	addFlexibleSpacerButton.addEventListener('mousedown', addNewFlexibleSpacer);

	titleElement.appendChild(unread);
	titleElement.appendChild(document.createTextNode(title));
	wrapper.appendChild(titleElement);
	wrapper.appendChild(addBookmarkButton);
	wrapper.appendChild(addSpacerButton);
	wrapper.appendChild(addFlexibleSpacerButton);

	const items = [];
	const bookmarks = [ ];

	function addBookmark(bookmark) {
		wrapper.insertBefore(bookmark.element, addBookmarkButton);
		bookmarks.push(bookmark);
	}

	function addNewBookmark(event) {
		const bookmark = new Bookmark('', '');
		addBookmark(bookmark);
		BookmarkEditor.edit(bookmark)
			.then(([title, url]) => {
				bookmark.title = title;
				bookmark.url = url;
				BookmarkManager.save();
			});

		event.preventDefault();
		event.stopPropagation();
	}

	function addSpacer(spacer) {
		wrapper.insertBefore(spacer.element, addBookmarkButton);
		bookmarks.push(spacer);
	}

	function addNewSpacer(event) {
		addSpacer(new Spacer(false));
		BookmarkManager.save();

		event.preventDefault();
		event.stopPropagation();
	}

	function addNewFlexibleSpacer(event) {
		addSpacer(new Spacer(true));
		BookmarkManager.save();

		event.preventDefault();
		event.stopPropagation();
	}

	function toObject() {
		return {
			title: title,
			bookmarks: bookmarks.map(b => b.toObject()),
		}
	}

	function toJSON() {
		return JSON.stringify(toObject());
	}

	return {
		element: wrapper,
		addBookmark: addBookmark,
		addSpacer: addSpacer,
		toObject: toObject,
		toJSON: toJSON,
	};
}

function Bookmark(title, url) {
	const wrapper = document.createElement('div');
	wrapper.classList.add('bookmark');

	const unread = document.createElement('span');
	unread.classList.add('unread');

	const link = document.createElement('a');
	link.textContent = title;
	link.href = url;

	wrapper.appendChild(unread);
	wrapper.appendChild(link);

	function toObject() {
		return {
			title: link.textContent,
			url: link.getAttribute('href'),
		};
	}

	function toJSON() {
		return JSON.stringify(toObject());
	}

	return {
		element: wrapper,
		get title() { return link.textContent; },
		set title(title) { link.textContent = title; },
		get url() { return link.getAttribute('href'); },
		set url(url) { link.href = url },
		hostname: link.hostname,
		toObject: toObject,
		toJSON: toJSON,
	};
}

function Spacer(flexible) {
	const spacer = document.createElement('div');
	spacer.classList.add('spacer');

	if (flexible) {
		spacer.classList.add('flexible');
	}

	function toObject() {
		return {
			spacer: true,
			flexible: flexible,
		};
	}

	return {
		element: spacer,
		toObject: toObject,
	};
}
