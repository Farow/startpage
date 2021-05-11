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

const ClickPreventedEvent = (() => {
	function dispatchOn(target) {
		target.dispatchEvent(new CustomEvent('clickprevented', { bubbles: true }));
	}

	return {
		dispatchOn: dispatchOn,
	};
})();

const CssHelper = (() => {
	let backgroundRule;

	/* */

	for (let styleSheet of document.styleSheets) {
		if (styleSheet.href.endsWith('style.css')) {
			getRules(styleSheet);
		}
	}

	function setBackground(value) {
		if (!(backgroundRule instanceof Object)) {
			console.error('backgroundRule has not been initialized.');
			return;
		}

		backgroundRule.style.background = value;
	}

	function getRules(styleSheet) {
		for (let cssRule of styleSheet.cssRules) {
			switch (cssRule.selectorText) {
				case '.background':
					backgroundRule = cssRule;
					break;
					break;
			}
		}

		if (!(backgroundRule instanceof Object)) {
			console.warn('Unable to find the .background CSS rule.');
		}
	}

	return {
		setBackground: setBackground,
	}
})();

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

		ClickPreventedEvent.dispatchOn(toggleEditButton);

		event.stopPropagation();
		event.preventDefault();
	}

	return {
		element: toggleEditButton,
	};
})();

const AddContainerButton = (() => {
	const button = new EditableTextButton('+ container');
	button.element.title = 'Adds a new container for bookmarks.\nPress enter to create.';

	button.onInput = onInput;

	function onInput(value) {
		BookmarkManager.addContainer(value);
	}

	return {
		element: button.element,
	};
})();

const EditBackgroundColorButton = (() => {
	const button = new EditableTextButton('+ background');
	button.element.title = 'Adjust the background.\nPress enter to save.';

	button.onChanged = onChanged;
	button.onInput = onInput;
	button.onClick = onClick;
	button.onDismiss = onDismiss;

	function onChanged(value) {
		CssHelper.setBackground(value);
	}

	function onInput(value) {
		BookmarkManager.setBackground(value);
		BookmarkManager.save();
	}

	function onClick() {
		button.element.textContent = BookmarkManager.settings.background;
	}

	function onDismiss() {
		CssHelper.setBackground(BookmarkManager.settings.background);
		button.element.textContent = '+ background';
	}

	return {
		element: button.element,
	}
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
				Configuration.validateJson(text);
				localStorage.setItem('data', text);
				setSuccess();
				location.reload();
			})
			.catch(error => { setError(error); });

		ClickPreventedEvent.dispatchOn(importButton);

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

		ClickPreventedEvent.dispatchOn(exportButton);

		event.stopPropagation();
		event.preventDefault();
	}

	return {
		element: exportButton,
	};
})();

const SideControls = (() => {
	const wrapper = document.createElement('div');
	wrapper.classList.add('side');

	wrapper.appendChild(ToggleEditModeButton.element);
	wrapper.appendChild(new Spacer(false).element);
	wrapper.appendChild(AddContainerButton.element);
	wrapper.appendChild(EditBackgroundColorButton.element);
	wrapper.appendChild(new Spacer(false).element);
	wrapper.appendChild(ImportButton.element);
	wrapper.appendChild(ExportButton.element);

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
	const settings = {};
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

	function setBackground(value) {
		settings.background = value;
		CssHelper.setBackground(value);
	}

	function save() {
		Configuration.save(toJSON());
	}

	function domReady() {
		if (containers.length == 0) {
			/* This is cleared when a container is added. */
			document.body.classList.add('empty');
		}

		for (let container of containers) {
			document.body.appendChild(container.element);
		}

		if (LocationParams.editVisible) {
			document.body.classList.add('empty');
		}

		document.body.appendChild(SideControls.element);
		document.body.appendChild(BookmarkEditor.element);
	}

	function load() {
		let configuration = Configuration.load(LocationParams.demo);
		Object.assign(settings, configuration.settings);

		for (let storedContainer of configuration.containers) {
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

		CssHelper.setBackground(settings.background);
	}

	function toObject() {
		return {
			settings: settings,
			containers: containers.map(c => c.toObject()),
		};
	}

	function toJSON() {
		return JSON.stringify(toObject(), null, 4);
	}

	return {
		addContainer: addContainer,
		setBackground: setBackground,
		save: save,
		toJSON: toJSON,
		get settings() { return Object.assign({ }, settings); },
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

function EditableTextButton(text) {
	const textButton = document.createElement('span');
	textButton.appendChild(document.createTextNode(text));
	textButton.classList.add('button');
	textButton.addEventListener('mousedown', setButtonEditable);

	/* Events are set through the exposed properties. */
	let onChanged, onInput, onClick, onDismiss;

	function setButtonEditable(event) {
		if (textButton.isContentEditable) {
			/* Clicking again adjusts the cursor position. */
			event.stopPropagation();
			return;
		}

		if (onClick instanceof Function) {
			onClick();
		}

		/* Keep a copy of the current text in case it's changed by the exposed element property. */
		text = textButton.textContent;

		textButton.contentEditable = true;
		textButton.addEventListener('keydown', keyListener);
		textButton.addEventListener('keyup', keyPressListener);
		textButton.addEventListener('blur', resetButton);
		document.addEventListener('clickprevented', clickPrevented);
		selectElement(textButton);

		event.preventDefault();
		event.stopPropagation();
	}

	function resetButton() {
		if (!textButton.isContentEditable) {
			return;
		}

		textButton.textContent = text;
		textButton.removeAttribute('contenteditable');
		textButton.removeEventListener('keydown', keyListener);
		textButton.removeEventListener('keyup', keyPressListener);
		textButton.removeEventListener('blur', resetButton);
		document.removeEventListener('clickprevented', clickPrevented);

		if (onDismiss instanceof Function) {
			onDismiss();
		}
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
				const userInput = textButton.textContent;
				resetButton();

				if (onInput instanceof Function) {
					onInput(userInput);
				}

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

	function keyPressListener(event) {
		if (onChanged instanceof Function) {
			onChanged(textButton.textContent);
		}
	}

	function clickPrevented(event) {
		if (event.target != textButton) {
			resetButton();
		}
	}

	return {
		set onChanged(callback) { onChanged = callback },
		set onInput(callback) { onInput = callback },
		set onClick(callback) { onClick = callback },
		set onDismiss(callback) { onDismiss = callback },
		element: textButton,
	};
}
