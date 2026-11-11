jQuery(document).ready(function ($) {

	$("a.open_lightbox").mwFrontLightbox();

});

(function($){

	let $content;
	let $inContent;
	let $container;
	let $overlay;
	let $box;
	let $inline;
	let $related;
	let index;
	let contentType;

	$.fn.mwFrontLightbox = function(options) {

		// for more selected elements
		if (this.length > 1){
			this.each(function() {
				$(this).mwFrontLightbox(options);
			});
			return this;
		}

		let $close;
		let $next;
		let $prev;
		let $element;

		// default setting
		let defaults = {
			html: false,
			inline: false,
			href: false,
			ajax: false,

			width: false,
			maxWidth: false,
			height: false,
			open: false,
			overlayColor: false,
			id: 'mw_lightbox_default',
			class: '',
			hideClose: false,
			target: document.body,

			onClosed: false,
			onComplete: false,
		};

		// setting
		let settings = $.extend( {}, defaults, options );

		$element = $(this);

		if(!settings.href) {
			settings.href = $element.attr('href');
		}

		if(settings.hideClose) {
			settings.class += ' mw_popup_hide_close';
		}

		let $tag = function(tag, id = '', className = '',  css = '') {
			let element = document.createElement(tag);

			if (id) {
				element.id = id;
			}

			if (className) {
				element.classList.add(className);
			}

			if (css) {
				element.style.cssText = css;
			}

			return $(element);
		}

		let open = function() {

			if(isOpen()) {
				returnInlineContent();
			}

			loadContent();

			if(!isOpen()) {

				getRelated();

				create();

				setTimeout(function () {
					$container.addClass('mw_popup_opened');
					$overlay.addClass('mw_popup_opened');
					$close.focus();
				}, 10);

				$('html').css('overflow', 'hidden');

				$('.mw_popup_container, .mw_popup_box').click(function(e){
					if(e.target === this) {
						close();
					}
				});

				if(contentType === 'image') {
					$('.mw_popup_next').click(function(e){
						index = getIndex(1);
						let $nextItem = $($related[index]);
						let $oldImg = $content.find('img');
						let $nextImg = $tag('img', '', 'mw_popup_next_img').attr('src', $nextItem.attr('href'));
						$content.append($nextImg);
						$oldImg.addClass('mw_popup_prev_img');
						setTimeout(function () {
							$oldImg.remove();
							$nextImg.removeClass('mw_popup_next_img');
						}, 100);
					});

					$('.mw_popup_prev').click(function(e){
						index = getIndex(-1);
						let $nextItem = $($related[index]);
						let $oldImg = $content.find('img');
						let $prevImg = $tag('img', '', 'mw_popup_prev_img').attr('src', $nextItem.attr('href'));
						$content.append($prevImg);
						$oldImg.addClass('mw_popup_next_img');
						setTimeout(function () {
							$oldImg.remove();
							$prevImg.removeClass('mw_popup_prev_img');
						}, 100);
					});
				}

				if (contentType === 'ajax') {
					addLoading();
				}

				$box.on('click', '.mw_popup_close', function(e){
					e.stopPropagation();
					e.preventDefault();
					close();
				});

				// Key Bindings
				$(document).bind('keydown.mw_lightbox', function (e) {
					let key = e.keyCode;
					if (isOpen() && key === 27) {
						e.preventDefault();
						close();
					}
					if (isOpen() && $related[1] && !e.altKey) {
						if (key === 37) {
							e.preventDefault();
							$prev.click();
						} else if (key === 39) {
							e.preventDefault();
							$next.click();
						}
					}
				});

			} else {
				addStyles();
				$container.attr('class', 'mw_popup_container mw_popup_opened ' + settings.class);
			}

			addContent();

			if (settings.onComplete) {
				settings.onComplete.call(this, $content, $element);
			}

		};

		let close = function() {
			$container.removeClass('mw_popup_opened');
			$overlay.removeClass('mw_popup_opened');

			if(settings.onClosed) {
				settings.onClosed.call();
			}

			returnInlineContent();

			// unbind keybind
			$(document).unbind('keydown.mw_lightbox');

			// remove lightbox
			setTimeout(function () {
				$content = undefined;
				$('.mw_popup_overlay').remove();
				$('.mw_popup_container').remove();
				$('html').css('overflow', 'auto');
			}, 200);
		};

		$element.close = function() {
			close();
		};

		let returnInlineContent = function() {
			// return content for inline mode
			if ($inline) {
				$inline.replaceWith($inContent);
			}
		}

		let create = function() {

			$overlay = $tag('div', '', 'mw_popup_overlay');
			$container = $tag('div', settings.id, 'mw_popup_container').addClass(settings.class);
			$box = $tag('div', '', 'mw_popup_box');
			$content = $tag('div', '', 'mw_popup_content');

			$close = $tag('a', '', 'mw_popup_close').attr('href', '#').html(
				'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve">' +
				'<path d="M13.4 12l5.3-5.3c0.4-0.4 0.4-1 0-1.4s-1-0.4-1.4 0l-5.3 5.3-5.3-5.3c-0.4-0.4-1-0.4-1.4 0s-0.4 1 0 1.4l5.3 5.3-5.3 5.3c-0.4 0.4-0.4 1 0 1.4 0.2 0.2 0.4 0.3 0.7 0.3s0.5-0.1 0.7-0.3l5.3-5.3 5.3 5.3c0.2 0.2 0.5 0.3 0.7 0.3s0.5-0.1 0.7-0.3c0.4-0.4 0.4-1 0-1.4l-5.3-5.3z"></path>' +
				'</svg>'
			);
			$next = $tag('a', '', 'mw_popup_next').attr('href', '#').html(
				'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve">' +
				'<path d="M15.7 11.3l-6-6c-0.4-0.4-1-0.4-1.4 0s-0.4 1 0 1.4l5.3 5.3-5.3 5.3c-0.4 0.4-0.4 1 0 1.4 0.2 0.2 0.4 0.3 0.7 0.3s0.5-0.1 0.7-0.3l6-6c0.4-0.4 0.4-1 0-1.4z"></path>' +
				'</svg>'
			);
			$prev = $tag('a', '', 'mw_popup_prev').attr('href', '#').html(
				'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve">' +
				'<path d="M10.4 12l5.3-5.3c0.4-0.4 0.4-1 0-1.4s-1-0.4-1.4 0l-6 6c-0.4 0.4-0.4 1 0 1.4l6 6c0.2 0.2 0.5 0.3 0.7 0.3s0.5-0.1 0.7-0.3c0.4-0.4 0.4-1 0-1.4l-5.3-5.3z"></path>\n' +
				'</svg>'
			);

			$box.append($close);
			$box.append($content)

			if(contentType === 'image' && $related.length > 1) {
				$box.append($next, $prev);
			}

			addStyles();

			$(settings.target).append($overlay, $container.append($box));

		};

		let addStyles = function() {
			if(settings.width) {
				$box.css({width:settings.width});
			}
			if(settings.maxWidth) {
				$box.css({maxWidth:settings.maxWidth});
			}
			if(settings.height) {
				$content.css({height:settings.height});
			}
			if(settings.overlayColor) {
				$overlay.css({backgroundColor:settings.overlayColor});
			}
		}

		let loadContent = function() {

			if(settings.html) {

				$inContent = $(settings.html);
				contentType = 'html';

			} else if(settings.ajax) {

				contentType = 'ajax';

			} else if (settings.inline) {

				$inContent = $(settings.href).eq(0);
				$inline = $('<div>').hide().insertBefore($inContent);
				contentType = 'inline';

			} else if(isImage(settings.href)) {
				let photo = new Image();
				photo.src = settings.href;
				$inContent = $(photo).addClass('mw_popup_image');
				contentType = 'image';
			} else {
				$inContent = $('<div class="mw_popup_error">Nepodařilo se načíst obsah</div>');
			}

		}

		let addContent = function() {

			if(contentType === 'image') {
				$container.addClass('mw_image_popup');
			} else {
				$container.removeClass('mw_image_popup');
			}
			if(contentType !== 'ajax') {
				$content.html('');
				$content.append($inContent);

				// bind videos
				if ($content.find('.mw_video_container').length) {
					$content.find('.mw_video_container').mwVideo();
				}
				// bind carousel
				if ($content.find('.miocarousel').length) {
					setTimeout(function() {
						$content.find('.miocarousel').MioCarousel({});
					}, 200); // becouse of lightbox animation
				}
			}
		}

		function isImage(url) {
			let pattern = /\.(gif|png|jp(e|g|eg)|bmp|ico|webp|jxr|svg)((#|\?).*)?$/i;
			return pattern.test(url);
		}

		function getRelated() {
			index = 0;
			let rel = $element.attr('rel');

			if (rel && rel !== false && rel !== 'nofollow') {
				$related = $('[rel="' + rel + '"]');
				index = $related.index($element);
			} else {
				$related = $element;
			}

		}

		function getIndex(increment) {
			let
				max = $related.length,
				newIndex = (index + increment) % max;

			return (newIndex < 0) ? max + newIndex : newIndex;
		}

		let isOpen = function() {

			if($content) {
				return true;
			}

			return false;
		}

		let addLoading = function() {
			$content.addClass('mw_loading');
		}
		let removeLoading = function() {
			$content.removeClass('mw_loading');
		}

		// open on $.mwLightbox();
		if (settings.open) {
			open();
		// click action on $.fn.mwLightbox()
		} else {
			this.click(function(e){
				open();
				e.preventDefault();
			});
		}

		return this;

	}

	$.mwFrontLightbox = function(options){
		options.open = true;
		$.fn.mwFrontLightbox(options);
	}

})(jQuery);
