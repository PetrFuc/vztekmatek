
jQuery(function ($) {

	$('.background_video iframe').mwBackgroundVideo();
	$('.open_element_lightbox').mwElementPopup();
	$('.open_mw_popup').mwPopup();
	$('.mw_cookie_management_container').mwCookieBar();
	mw_init_videos();
	$('.mw_phone_input_container').mwPhoneInput();
	//$('.mw_tabs_container').mwFrontTabs();
	mw_init_tabs(".mw_tabs_container");

	mw_init_contact_form('.ve_contact_form');
	mw_init_form('.ve_check_form');
	mw_init_webinar_registration_form('.ve_webinar_registration_form');

	$(window).on('scroll', function (e) {
		setParallaxScroll();
	});
	setParallaxScroll(true);

	setFixedHeader();

	// delay show
	$(".row_container_delay").each(function () {
		var $this = $(this);
		setTimeout(function () {
			/** Fade in to "flex" instead of "block" @see https://stackoverflow.com/a/28906733 */
			$this
				.css("display", "flex")
				.hide()
				.fadeIn("slow");
		}, $this.attr('data-delay') * 1000);
	});

	$(".element_container_delay").each(function () {
		var $this = $(this);
		setTimeout(function () {
			$this.fadeIn("slow");
		}, $this.attr('data-delay') * 1000);
	});

	$(".video_element_gdpr_agree_but").click(function () {
		var container = $(this).closest('.video_element_gdpr_content');
		if(container.find('input').prop('checked'))
		{
			$('.video_element_gdpr_content').remove();
			var date = new Date();
			date.setDate(date.getDate() + 365);
			document.cookie = "mw_allow_video_youtube=1;expires=" + date.toGMTString() + "; path=/";
		}
		else
		{
			container.remove();
		}
		return false;
	});

	$('body').on('click', '.mw_header_search_icon', function (e) {
		e.preventDefault();
		$('#header').addClass('mw_show_header_search');
		$('.mw_header_search_container input').focus();
		setTimeout(function () {
			$(document).on("click.closeHeaderSearch", function (event) {
				if (!$(event.target).closest(".mw_header_search_container .mw_search_form").length) {
					$('#header').removeClass('mw_show_header_search');
					$(document).off("click.closeHeaderSearch");
				}
			});
		}, 0);
	});

	/* ********************* Expanded text/block  ******************** */
	$('body').on('click', '.mw_expand_more', function () {
		let $container = $(this).closest('div');
		let $expandedContainer = $container.find('.mw_expanded_container');
		let $link = $(this);
		let max_height = $container.find('.mw_expanded_content').outerHeight();
		if ($expandedContainer.hasClass('mw_expanded')) {
			$expandedContainer.removeClass('mw_expanded');
			$expandedContainer.animate({ maxHeight: $expandedContainer.data('height') }, 400, function() {
				$link.removeClass('mw_expanded');
				$expandedContainer.css('max-height','');
			});
			if ($container[0].getBoundingClientRect().top < 0) {
				$("html, body").animate({
					scrollTop: $container.offset().top - 30
				}, 400);
			}
		} else {
			$expandedContainer.data('height', $expandedContainer.css('max-height'));
			$expandedContainer.animate({ maxHeight: max_height }, 400, function() {
				$expandedContainer.addClass('mw_expanded');
				$link.addClass('mw_expanded');
			});
		}
	});

	/* ********************* Scroll  ******************** */
	$('body').on('click', '.mw_scroll_tonext', function () {
		var position = $(this).offset().top + 66;


		// Subtract fixed header height
		if (jQuery('.ve_fixed_header').length) {
			position -= jQuery('#header').height()
		}

		$('html,body').animate({
			scrollTop: position
		}, 1000);
		return false;
	});

	/* ********************* Toggle target ******************** */
	$('body').on('click', '.mw_toggle_container', function (event) {
		var $this = $(this);
		var tar = $this.attr('data-target');
		if ($this.is('input[type=checkbox]')) {
			var checked = $this.prop('checked');
			if (checked)
				$('#' + tar).show();
			else
				$('#' + tar).hide();
		} else {
			$('#' + tar).toggle();
		}
	});

	// for table responsivity in blog article
	$('#blog-content table').each(function(){
		let $table = $(this);
		let headers = [];
		let th_count = 0;

		$table.find('thead th').each(function(){
			headers.push($(this).text().trim());
			th_count++;
		});

		if (th_count > 0) {
			$table.addClass('mw_responsive_table');
			$table.find('tbody tr').each(function(){
				$(this).find('td').each(function(i){
					$(this).attr('data-label', headers[i] || '');
				});
			});
		}

	});

	$(window).resize(mw_debouncer(mw_recalculate_fb_page_plugin_width, 500))
});

(function($) {
	$.fn.mwVideo = function(options) {

		return this.each(function() {

			let $container = $(this);
			let isMejs = $container.hasClass('mw_mejs_container');
			let isMobile = $container.hasClass('mw_video_mobile');
			const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
			let isOwn = $container.hasClass('mw_video_own');
			let isVertical = $container.hasClass('mw_video_vertical');
			var $video = $(this).find('.mw_video');
			if (isOwn) {
				$video = $(this).find('iframe');
			}
			let videoType = $container.data('type');
			this.isLazy = $container.hasClass('mw_video_lazy') && !isMejs;
			this.vimeoPlayer = null;
			let obj = this;

			if ($container.hasClass('mw_video_initialized')) {
				if (isMejs) {
					$video[1].player.pause();
				}
				return;
			}

			$container.addClass('mw_video_initialized');

			let loadVimeo = function () {
				if (obj.vimeoPlayer === null) {
					let selector = $video[0];
					if (isMejs) {
						selector = $container.find('iframe')[0];
					}
					obj.vimeoPlayer = new Vimeo.Player(selector);
				}
			}

			if (isMejs) {
				let features = ['playpause', 'progress', 'current', 'duration', 'volume', 'fullscreen'];

				if (videoType === 'vimeo' && isSafari && isMobile) {
					features.pop(); // remove fullscreen from control
				}

				let fakeFullscreen = false;
				if (videoType === 'vimeo' && isSafari) {
					fakeFullscreen = true;
				}

				let createMuteButton = function(player) {
					const button = document.createElement('div');
					button.className = 'mejs-button mejs-volume-button mejs-mw-mute-button';
					button.innerHTML = '<button type="button"></button>';

					// mute and unmute on click
					button.addEventListener('click', function() {
						if (player.media.muted) {
							player.setMuted(false);
							button.classList.add('mejs-mute');
							button.classList.remove('mejs-unmute');
						} else {
							player.setMuted(true);
							button.classList.remove('mejs-mute');
							button.classList.add('mejs-unmute');
						}
					});
					return button;
				}

				let videoSetting = {
					videoWidth: '100%',
					videoHeight: '100%',
					useFakeFullscreen: fakeFullscreen, // only for safari on pc
					features: features,
					youtube: {
						playsinline: 1,
						showinfo: 0
					},
					success: function (media, originalNode, player) {
						let mwLayer = $('<div class="mejs-mw-layer"></div>');
						$(player.layers).append(mwLayer);

						mwLayer.on('click', function () {
							if (media.paused) {
								media.play();
							} else {
								media.pause();
							}
						});

						// custom mobile safari vimeo fullscreen
						if (videoType === 'vimeo' && isSafari && isMobile) {
							let fullButton = document.createElement('div');
							fullButton.className = 'mejs-button mejs-fullscreen-button mw-vimeo-fullscreen';
							fullButton.innerHTML = '<button type="button"></button>';
							$(player.container).find('.mejs-controls').append(fullButton);
						}

						// speed control
						let speeds = ['0.50', '0.75', '1.00', '1.25', '1.50', '2.00'];
						let speedButton = document.createElement('div');
						speedButton.className = 'mejs_mw_speed-button';
						speedButton.innerHTML = '<span>1.00x</span>';
						let menu = document.createElement('ul');
						menu.className = 'mejs_mw_speed-selector';
						speeds.forEach(function (speed) {
							let item = document.createElement('li');
							item.setAttribute('data-speed', speed);
							item.innerHTML = speed + 'x';
							if (speed === '1.0') {
								item.className = 'current';
							}
							menu.appendChild(item);
						});
						speedButton.appendChild(menu);
						$(player.container).find('.mejs-fullscreen-button').before(speedButton);

						if (videoType === 'vimeo') {
							loadVimeo();

							// vimeo duration
							obj.vimeoPlayer.getDuration().then(function (duration) {
								media.duration = duration;
								let formattedTime = mejs.Utility.secondsToTimeCode(duration, false);
								$container.find('.mejs-duration').html(formattedTime);
							});

							// vimeo subtitles
							obj.vimeoPlayer.getTextTracks().then(function(tracks) {
								if (tracks.length) {
									let tracksButton = document.createElement('div');
									tracksButton.className = 'mejs-button mejs-captions-button';
									tracksButton.innerHTML = '<button type="button">CC</button>';
									let menu = document.createElement('ul');
									menu.className = 'mejs_mw_captions-selector';
									menu.innerHTML = '<li data-lang="">Off</li>';
									tracks.forEach(function (track) {
										let item = document.createElement('li');
										item.setAttribute('data-lang', track.language);
										item.innerHTML = track.label;
										menu.appendChild(item);
									});

									tracksButton.appendChild(menu);
									if ($(player.container).find('.mejs-volume-button').length) {
										$(player.container).find('.mejs-volume-button').after(tracksButton);
									} else {
										$(player.container).find('.mejs-time').after(tracksButton);
									}


									$container.find('.mejs-captions-button li').on('click', function(e) {
										let lang = $(this).data('lang');
										$container.find('.mejs_mw_captions-selector li').removeClass('current');
										$(this).addClass('current');
										if (videoType === 'youtube') {

										} else if (videoType === 'vimeo') {
											if (lang === "") {
												obj.vimeoPlayer.disableTextTrack()
											} else {
												obj.vimeoPlayer.enableTextTrack(lang);
											}
										}
									});
								}
							})
						}

						// mute and unmute button on mobile devices
						if ($(player.container).find('.mejs-volume-button').length === 0) {
							let muteButton = createMuteButton(player);

							$(media).on('play', function () {
								if (player.media.muted) {
									muteButton.classList.add('mejs-unmute');
									muteButton.classList.remove('mejs-mute');
								} else {
									muteButton.classList.add('mejs-mute');
								}
								muteButton.style.display = 'block';
							});

							$(media).on('pause', function () {
								muteButton.style.display = 'none';
							});

							$(player.container).find('.mejs-time').after(muteButton);
						}

						// set size for vertical videos
						if (isVertical) {
							let width = $container.find('.mw_video_frame').width();
							player.setPlayerSize(width, width * 1.777);
						}

						// z-index fix on safari on fake fullscreen
						if (isSafari && isMobile) {
							$container.find('.mejs-fullscreen-button').on('click', function(e) {
								if ($container.find('.mejs-container').hasClass('mejs-container-fullscreen')) {
									$container.closest('.element_container').css('z-index', 3);
									$container.closest('.col').css('z-index', 3);
								} else {
									$container.closest('.element_container').css('z-index', 2);
									$container.closest('.col').css('z-index', 2);
								}
							});
						}
					}
				};

				// prevent move video on arrows key if container has class mw_video_hide_progress
				if ($container.hasClass('mw_video_hide_progress')) {
					videoSetting.keyActions = [
						{
							keys: [37, 39], // right and left arrows keys
							action: function(player, media, key, event) {
								event.preventDefault();
							}
						},
					];
				}

				$video.mediaelementplayer(videoSetting);
			}

			// video chapters
			$container.find('.mw_video_chapters a').on('click', function(e) {
				e.preventDefault();
				let time = $(this).data('time');
				if (time !== undefined) {
					seekVideo(time);
				}
			});

			$container.find('.mw-vimeo-fullscreen').on('click', function(e) {
				loadVimeo();
				obj.vimeoPlayer.getPaused().then(function(paused) {
					if(paused){
						obj.vimeoPlayer.play().then(function() {
							obj.vimeoPlayer.requestFullscreen();
						});
					} else {
						obj.vimeoPlayer.requestFullscreen();
					}
				});
			});

			$container.find('.mejs_mw_speed-button li').on('click', function(e) {
				let speed = $(this).data('speed');
				$container.find('.mejs_mw_speed-button span').html(speed + 'x');
				$container.find('.mejs_mw_speed-button li').removeClass('current');
				$(this).addClass('current');
				if (videoType === 'youtube') {
					$container.find('iframe')[0].contentWindow.postMessage('{"event":"command","func":"setPlaybackRate","args":[' + speed + ', true]}', '*');
				} else if (videoType === 'vimeo') {
					loadVimeo();
					obj.vimeoPlayer.setPlaybackRate(speed);
				}
			});

			// video popups
			$container.find('.mw_video_open_popup').click(function(e) {
				e.preventDefault();
				$container.addClass('mw_video_popup_opened');
				$container.closest('.col').addClass('mw_col_with_popup_opened');
				$('body').addClass('mw_element_popup_opened');

				if (videoType === 'vimeo' && isMejs) {
					let ratio = 0.5625;
					if (isVertical) {
						ratio = 1.777;
					}
					let popupWidth = $container.find('.mw_video_frame').width();
					$video[0].player.setPlayerSize(popupWidth, popupWidth * ratio);
				}

				playVideo();
			});

			$container.find('.mw_video_popup_content').click(function(e) {
				e.stopPropagation();
			});

			let onPlaying = function() {
				$video[0].player.pause();
				$video[0].player.media.removeEventListener('playing', onPlaying);
			};

			$container.find('.mw_video_popup_container').click(function(e) {
				e.preventDefault();
				$container.removeClass('mw_video_popup_opened');
				$container.closest('.col').removeClass('mw_col_with_popup_opened');
				$('body').removeClass('mw_element_popup_opened');
				if (isMejs) {
					if(!$video[0].player.paused) {
						$video[0].player.media.addEventListener('pause', function onPause() {
							$video[0].player.media.removeEventListener('playing', onPlaying);
							$video[0].player.media.removeEventListener('pause', onPause);
						});
						$video[0].player.media.addEventListener('playing', onPlaying);
					}
					$video[0].player.pause();
				} else if (videoType === 'youtube') {
					$video[0].contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
				} else if (videoType === 'vimeo') {
					loadVimeo();
					obj.vimeoPlayer.pause();
				}

			});

			$container.find('.mw_video_poster_container').click(function(e) {
				e.preventDefault();

				playVideo();
			});

			// play video

			let playVideo = function () {
				if (obj.isLazy) {
					$container.find('.mw_video_poster_container').addClass('cms_nodisp');
					let video_url = $video.data("src");
					if (!$video.attr("src") && video_url) {
						$video.attr("src", video_url);
						$video.on('load', function() {
							play();
						});
					} else if ($video.attr("src")) {
						play();
					}
				} else {
					play();
				}
			}

			let play = function () {
				if (isMejs) {
					$video[0].player.play();
				} else if (videoType === 'youtube') {
					$video[0].contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
				} else if (videoType === 'vimeo') {
					loadVimeo();
					obj.vimeoPlayer.play();
				}
			}

			// seek video

			let seekVideo = function (time) {
				if (obj.isLazy) {
					$container.find('.mw_video_poster_container').addClass('cms_nodisp');
					let video_url = $video.data("src");
					if (!$video.attr("src") && video_url) {
						$video.attr("src", video_url);
						$video.on('load', function() {
							seek(time);
						});
					} else if ($video.attr("src")) {
						seek(time);
					}
				} else {
					seek(time);
				}
			}

			let seek = function (time) {
				if (isMejs) {
					$video[0].player.setCurrentTime(time);
					$video[0].player.play();
				} else if (videoType === 'youtube') {
					$video[0].contentWindow.postMessage('{"event":"command","func":"seekTo","args":[' + time + ', true]}', '*');
				} else if (videoType === 'vimeo') {
					loadVimeo();
					obj.vimeoPlayer.setCurrentTime(time);
					obj.vimeoPlayer.play();
				}
			}

		});
	};
})(jQuery);

function mw_init_video(target) {
	jQuery(target).mwVideo();
}

function mw_init_videos() {
	var $allContainers = jQuery('.mw_video_container:not(.ve_popup_container .mw_video_container)');
	var $eager = $allContainers.not('.mw_video_lazy_init');
	var $lazy = $allContainers.filter('.mw_video_lazy_init');

	$eager.mwVideo();

	if (!$lazy.length) {
		return;
	}

	if (typeof IntersectionObserver === 'undefined') {
		// Fallback for very old browsers without IntersectionObserver — initialize all eagerly.
		$lazy.removeClass('mw_video_lazy_init').mwVideo();
		return;
	}

	var observer = new IntersectionObserver(function (entries, obs) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				var $container = jQuery(entry.target);
				$container.removeClass('mw_video_lazy_init');
				$container.mwVideo();
				obs.unobserve(entry.target);
			}
		});
	}, { rootMargin: '500px' });

	$lazy.each(function () {
		observer.observe(this);
	});
}

function mw_recalculate_fb_page_plugin_width() {
	var $fb = jQuery('.fb-page');
	if (!$fb.length) {
		return;
	}

	var init = false;

	$fb.each(function () {
		var $this = jQuery(this);
		var elementWidth = parseInt($this.width());
		var containerWidth = parseInt($this.parent().width());

		if (containerWidth && elementWidth) {
			var maxWidth = $this.attr('data-max-width') || 500;
			var minWidth = 180;

			containerWidth = Math.max(Math.min(containerWidth, maxWidth), minWidth);
			if (elementWidth !== containerWidth) {
				$this.attr('data-width', containerWidth);
				$this.removeAttr('fb-iframe-plugin-query');
				$this.html('');

				init = true;
			}
		}
	});

	if (init) {
		mw_init_facebook();
	}
}

function mw_debouncer(func, timeout) {
	var timeoutID, timeout = timeout || 200;
	return function () {
		var scope = this, args = arguments;
		clearTimeout(timeoutID);
		timeoutID = setTimeout(function () {
			func.apply(scope, Array.prototype.slice.call(args));
		}, timeout);
	}
}

function mw_init_contact_form(target) {
	jQuery(target).mwForm({
		onsubmit: function (self, $form) {
			var form = $form.serialize();
			var button = self.$el.find("button");
			button.addClass('working');
			jQuery.post(ajaxurl, 'action=ve_send_contact_form&' + form, function (data) {

				if (data.redirect) {
					const target = self.$el.find('input[name="form_redirect_url"]').attr('data-target');
					if (target === 'parent') {
						parent.location.replace(data.redirect);
					} else {
						window.location.replace(data.redirect);
					}
				} else {
					self.showMessage(data);
					button.removeClass('working');
				}
			}).fail(function () {

				self.showMessage({'sended': 'error', 'message': front_texts.nosended});
				button.removeClass('working');

			});
			return false;
		}
	});
}

function mw_init_facebook() {
	if (typeof FB.XFBML.parse === "undefined") {
		console.log('Function "FB.XFBML.parse" is undefined')
		return;
	}

	FB.XFBML.parse();
}

function mw_init_form(target) {
	jQuery(target).mwForm();
}

function mw_init_tabs(target) {
	jQuery(target).mwFrontTabs();
}

function mw_init_webinar_registration_form(target) {
	const $forms = jQuery(target);

	if ($forms.length === 0) {
		return;
	}

	const isPopupWindowOpen = function(popupWindow) {
		return popupWindow && !popupWindow.closed && typeof popupWindow.closed !== 'undefined';
	};

	// Check and refresh webinar cache
	const refreshedWebinars = new Set();

	$forms.each(function() {
		const $form = jQuery(this);
		const $container = $form.closest('.in_element_content');
		const needsRefresh = $container.attr('data-webinar-needs-refresh') === '1';
		const platform = $container.attr('data-webinar-platform');
		const webinarId = $container.attr('data-webinar-id');
		const cacheNonce = $container.attr('data-webinar-cache-nonce');

		if (needsRefresh && platform && webinarId && cacheNonce) {
			const webinarKey = platform + webinarId;

			if (!refreshedWebinars.has(webinarKey)) {
				refreshedWebinars.add(webinarKey);

				jQuery.post(ajaxurl, {
					action: 've_refresh_webinar_cache',
					platform: platform,
					webinar_id: webinarId,
					_wpnonce: cacheNonce
				});
			}
		}
	});

	// Open blank window on button click (Safari requires this in direct click handler)
	$forms.each(function() {
		const $form = jQuery(this);
		const willOpenNewTab = $form.data('open-new-tab') === 1;

		if (willOpenNewTab) {
			$form.find('button[type="submit"]').on('click.webinarPopup', function() {
				const newWindow = window.open('about:blank', '_blank');

				if (newWindow) {
					try {
						// Prevent reverse-tabnabbing
						newWindow.opener = null;
					} catch (e) {
						// Browser has already restricted access to the opener
					}

					// Inject spinner HTML
					try {
						const $container = $form.closest('.in_element_content');
						const platform = $container.attr('data-webinar-platform') || '';
						const platformTitle = platform === 'webinarjam' ? 'WebinarJam' : platform === 'everwebinar' ? 'EverWebinar' : '';

						const doc = newWindow.document;
						doc.open();
						doc.close();

						doc.title = platformTitle;

						const style = doc.createElement('style');
						style.textContent = 'body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;height:100dvh;background:#fff}.spinner{width:70px;height:70px;border:4px solid rgba(200,200,200,0.3);border-top-color:#27a8d7;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
						doc.head.appendChild(style);

						const spinner = doc.createElement('div');
						spinner.className = 'spinner';
						doc.body.appendChild(spinner);
					} catch (e) {
						// Spinner not injected, keep about:blank
					}

					$form.data('webinar-popup-window', newWindow);
				}
			});

			// Close popup if validation fails (validation adds error classes or error messages)
			let validationObserver = null;

			$form.on('submit.webinarPopupCleanup', function() {
				// Defensive check to prevent multiple observers in case of unexpected behavior
				if (validationObserver) {
					validationObserver.disconnect();
				}

				validationObserver = new MutationObserver(function(mutations) {
					const hasErrors = $form.find('.ve_form_error_message').length > 0;

					if (hasErrors) {
						const popupWindow = $form.data('webinar-popup-window');
						if (isPopupWindowOpen(popupWindow)) {
							popupWindow.close();
						}
						$form.removeData('webinar-popup-window');
						validationObserver.disconnect();
					}
				});

				validationObserver.observe($form[0], {
					attributes: true,
					attributeFilter: ['class'],
					childList: true,
					subtree: true
				});

				// Store observer reference for cleanup
				$form.data('webinar-validation-observer', validationObserver);
			});
		}
	});

	$forms.mwForm({
		onsubmit: function (self, $form) {
			let form = $form.serialize();

			const urlParams = new URLSearchParams(window.location.search);
			const utmParams = [];

			// Get all UTM parameters from the URL
			for (const [key, value] of urlParams) {
				if (key.startsWith('utm_')) {
					utmParams.push('utm_params[' + encodeURIComponent(key) + ']=' + encodeURIComponent(value));
				}
			}

			// Add UTM parameters to form data
			if (utmParams.length > 0) {
				form += '&' + utmParams.join('&');
			}

			const button = self.$el.find("button");
			button.addClass('working');

			// Get the pre-opened window from click handler (Safari requirement)
			const newWindow = $form.data('webinar-popup-window') || null;
			$form.removeData('webinar-popup-window');

			// Disconnect validation observer since validation passed and we're proceeding with AJAX
			const validationObserver = $form.data('webinar-validation-observer');
			if (validationObserver) {
				validationObserver.disconnect();
				$form.removeData('webinar-validation-observer');
			}

			jQuery.post(ajaxurl, 'action=ve_process_webinar_registration&' + form, function (data) {
				if (data.popup_url || data.thank_you_url) {
					const doRedirect = function (url) {
						const target = self.$el.find('input[name="form_redirect_url"]').attr('data-target');

						if (target === 'parent') {
							parent.location.assign(url);
						} else {
							window.location.assign(url);
						}
					};

					if (data.target_blank) {
						if (isPopupWindowOpen(newWindow)) {
							// Popup is open - redirect popup to webinar/payment URL
							if (data.popup_url) {
								newWindow.location.href = data.popup_url;
							} else {
								// URL is missing, something failed unexpectedly, close popup
								newWindow.close();
							}

							// If thank you page is set, redirect origin page to it, otherwise show message
							if (data.thank_you_url) {
								doRedirect(data.thank_you_url);
							} else {
								self.showMessage({'sended': 'ok', 'message': data.message});
								button.removeClass('working');
							}
						} else {
							// Popup is blocked - redirect origin page to webinar/payment URL (higher priority than thank you page)
							if (data.popup_url) {
								doRedirect(data.popup_url);
							} else {
								// URL is missing, something failed unexpectedly, show error message
								self.showMessage({'sended': 'error', 'message': front_texts.nosended});
								button.removeClass('working');
							}
						}
					} else {
						if (data.thank_you_url) {
							doRedirect(data.thank_you_url);
						} else {
							// URL is missing, unable to redirect, show message instead
							self.showMessage({'sended': 'ok', 'message': data.message});
							button.removeClass('working');
						}
					}
				} else {
					// No redirect - close popup if it was opened
					if (isPopupWindowOpen(newWindow)) {
						newWindow.close();
					}
					self.showMessage(data);
					button.removeClass('working');
				}

				if (data.new_nonce) {
					self.$el.find('input[name="mw_wpnonce_webinar_reg"]').val(data.new_nonce);
				}
			}).fail(function () {
				// AJAX failed - close popup if it was opened
				if (isPopupWindowOpen(newWindow)) {
					newWindow.close();
				}
				self.showMessage({'sended': 'error', 'message': front_texts.nosended});
				button.removeClass('working');
			});

			return false;
		}
	});
}

function mw_init_password_input(target) {
	jQuery(target).mwPasswordInput();
}

function mw_load_added_ss_form(target, content) {
	var $target = jQuery(target);

	var old = window.document.write;
	window.document.write = function (html) {
		$target.html(html);
		window.document.write = old;
	}

	$target.html(content);
}

function mw_load_added_script(target, url, html) {
	var $target = jQuery(target);

	if(html)
		$target.html(html);

	var script = document.createElement("script");
	script.async = true;
	script.src = url;
	$target.append(script);
}

function mw_load_added_fapi_form(target, but_class, content, clientDetails) {
	var $target = jQuery(target);

	var old = window.document.write;
	window.document.write = function (html) {
		$target.html(html);
		window.document.write = old;

		mw_fill_fapi_form_old(clientDetails);
		$target.find("#frm-submit").addClass(but_class);
	}

	mw_fill_fapi_form_new(clientDetails)

	var wrapper = document.createElement('div');
	wrapper.innerHTML= content;
	var script = document.createElement('script');
	script.src = wrapper.firstChild.src;
	script.type = 'text/javascript';

	$target.html('');
	document.querySelector(target).append(script);

	// Remove possibly loaded Fapi scripts because Fapi will load them again in it's internal initialization
	var fapiInternalScripts = ['https://form.fapi.cz/js/jQueryFapi.js', 'https://form.fapi.cz/js/netteFormsFapi.js'];
	jQuery('script').each(function () {
		if (fapiInternalScripts.indexOf(this.src) !== -1) {
			this.parentNode.removeChild(this);
		}
	});
}

function mw_load_fapi_form(target, but_class, clientDetails) {
	var $target = jQuery(target);
	mw_fill_fapi_form_old(clientDetails);
	mw_fill_fapi_form_new(clientDetails)
	$target.find("#frm-submit").addClass(but_class);
}

function mw_fill_fapi_form_old(clientDetails) {
	if (clientDetails && clientDetails !== 'null') {
		clientDetails = jQuery.parseJSON(clientDetails);
		var $form = jQuery("#frm-showUserForm");
		if (!$form.length) {
			return;
		}

		var inputNames = ["name", "surname", "email", "mobil", "street", "city", "postcode", "company", "ic", "dic"];
		for (var i in inputNames) {
			var name = inputNames[i];
			var value = clientDetails[name];
			if (value !== undefined) {
				$form.find("[name=" + name + "]").val(value);
			}
		}
	}
}

function mw_fill_fapi_form_new(clientDetails) {
	set_singleton_event_listener('fapiFormMounted', function (e) {
		if (clientDetails && clientDetails !== 'null') {
			var values = jQuery.parseJSON(clientDetails);
			var formWrapper = e.detail.formWrapper || null;
			if (formWrapper !== null) {
				var inputNames = ["email", "phone", "first_name", "last_name", "company", "ico", "dic", "street", "city", "zip"];
				for (var i in inputNames) {
					var name = inputNames[i];
					var value = values[name];
					if (value !== undefined) {
						var input = formWrapper.querySelector("[name=" + name + "]");
						if (input !== null) {
							input.value = value;
						}
					}
				}
			}
		}
	});
}

/** @see https://stackoverflow.com/a/17391426 */
var set_singleton_event_listener = (function(element){
	var handlers = {};
	return function(evtName, func){
		handlers.hasOwnProperty(evtName) && element.removeEventListener(evtName, handlers[evtName]);
		if (func) {
			handlers[evtName] = func;
			element.addEventListener(evtName, func);
		} else {
			delete handlers[evtName];
		}
	};
})(document);


/* ********************* Fixed header  ******************** */
function setFixedHeader() {
	if (jQuery('.ve_fixed_header').length) {
		var header_position = jQuery(".ve_fixed_header").offset();

		jQuery(window).on('scroll load', function (e) {
			var header_height = jQuery('#header').height();
			var padding_bottom = header_height;
			if (jQuery('.ve_fixed_header').length === 0) padding_bottom = 0;
			if (jQuery('.mw_transparent_header').length) padding_bottom = 0;

			var scroll = jQuery(window).scrollTop();
			var fixed_desktop_only = jQuery(".ve_fixed_header").hasClass('ve_fixed_desktop_only');
			if (scroll > header_position.top && (!fixed_desktop_only || jQuery(window).width() >= 767)) {
				jQuery(".ve_fixed_header").addClass("ve_fixed_header_scrolled");
				jQuery("header").css('paddingBottom', padding_bottom);

				if (e.type === 'load' && window.location.hash) {
					var anchor = document.querySelector(window.location.hash);
					if (anchor !== null) {
						var isScrolledToAnchor = Math.floor(anchor.getBoundingClientRect().top) === 0;
						if (isScrolledToAnchor) {
							// jQuery(window).scrollTop(scroll - header_height);
							jQuery('html, body').animate({scrollTop: '-=' + header_height + 'px'}, 0);
						}
					}
				}
			} else {
				jQuery(".ve_fixed_header_scrolled").removeClass("ve_fixed_header_scrolled");
				jQuery("header").css('paddingBottom', '0');
				//jQuery("header").height('auto');
			}
		});
	}
}

function setParallaxScroll(init = false) {
	if (jQuery('.background_parallax').length) {
		jQuery('.background_parallax').each(function () {
			var $el = jQuery(this);
			updateParallax($el);
		});
	}
}

function updateParallax($el) {

	var diff = jQuery(window).scrollTop() - $el.closest('.row').offset().top;
	var yPos = +(diff * 0.4);

	var coords = yPos + 'px';

	$el.css({
		backgroundPositionY: coords
	});
}


/* ********************* FAQ  ******************** */
function faqClick(element, cssid) {
	jQuery(element).toggleClass('ve_faq_question_open');
	jQuery(element).toggleClass('ve_faq_question_close');
	jQuery(element).next(cssid + " .ve_faq_answer").slideToggle();
}

// smooth link scroll

jQuery(function () {
	jQuery('.menu a[href*="#"]:not([href="#"]),.ve_content_button[href*="#"]:not([href="#"]),.element_image a[href*="#"]:not([href="#"]),.entry_content a[href*="#"]:not([href="#"]),.mw_feature_title_link[href*="#"],.mw_feature_icon[href*="#"],.mw_icon_text a[href*="#"], .link_element_container a[href*="#"]:not([href="#"]), .mw_element_item a[href*="#"]:not([href="#"])').on('click', function () {
		if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
			var target = jQuery(this.hash);
			var $fixedHeader = jQuery('.ve_fixed_header');
			var fixedHeaderHeight = $fixedHeader.height() || 0;
			var fixedAndNotScrolled = $fixedHeader.hasClass('mw_transparent_header') && !$fixedHeader.hasClass('ve_fixed_header_scrolled');

			if (fixedAndNotScrolled) {
				// Because transparent header has absolute position
				$fixedHeader.removeClass('mw_transparent_header');
			}

			target = target.length ? target : jQuery('[name=' + this.hash.slice(1) + ']');
			if (target.length) {
				jQuery('html,body').animate({
					scrollTop: (target.offset().top - fixedHeaderHeight)
				}, 1000, 'swing', function() {
					if (fixedAndNotScrolled) {
						$fixedHeader.addClass('mw_transparent_header');
					}
				});
				if (jQuery('#mobile_nav').is(':visible')) {
					jQuery('#header .header_nav_container').removeClass('open');
					jQuery('.mw_mobile_nav_close_overlay').remove();
					jQuery('body').removeClass('mobile_menu_opened');
				}
				return false;
			}
		}
	});
});


function initialize_google_maps() {
	jQuery('.mw_google_map_container').each(function () {
		var def_setting = {
			address: 'Praha',
			zoom: 12,
			scrollwheel: false,
		};

		var setting = JSON.parse(jQuery(this).attr('data-setting'));

		setting = jQuery.extend(def_setting, setting);

		initialize_google_map(jQuery(this).attr('id'), setting);

	});
}

function initialize_google_map(map_id, setting) {
	var address = setting.address;
	var geocoder = new google.maps.Geocoder();
	var map = new google.maps.Map(document.getElementById(map_id), {
		zoom: setting.zoom,
		scrollwheel: setting.scrollwheel,
		center: {lat: -25.363, lng: 131.044},
	});
	if (geocoder) {
		geocoder.geocode({
			'address': address
		}, function (results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
				if (results && results[0]) {
					map.setCenter(results[0].geometry.location);

					var infowindow = new google.maps.InfoWindow({
						content: '<b>' + address + '</b>',
					});

					var marker = new google.maps.Marker({
						position: results[0].geometry.location,
						map: map,
						title: address
					});

					marker.addListener('click', function () {
						infowindow.open(map, marker);
					});

				} else {
					jQuery('#' + map_id + '_error').show();
				}
			} else {
				jQuery('#' + map_id + '_error').show();
			}
		});
	}

	var mapdata = {
		map: map,
		address: address
	};
	jQuery('#' + map_id).data('map', mapdata);
}

;(function (factory) {

	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if (typeof exports !== 'undefined') {
		module.exports = factory(require('jquery'));
	} else {
		factory(jQuery);
	}

})(function ($) {
	// background video
	var MwBackgroundVideo = (function (element) {

		function _MwBackgroundVideo(element) {

			this.$el = $(element);
			this.$el.hide();
			var self = this;

			$(element).load(function () {
				self.sizeTheVideo();
				self.$el.show();
			});
			$(window).resize(function () {
				self.sizeTheVideo();
				console.log('resize');
			});

		}

		return _MwBackgroundVideo;

	})();

	MwBackgroundVideo.prototype.sizeTheVideo = function () {

		var w = this.$el.closest('div').width();
		var h = this.$el.closest('div').height();

		if (w > (h / 9 * 16)) {
			this.$el.css({
				'width': w + 'px',
				'height': w / 16 * 9 + 'px',
				'margin-left': -w / 2 + 'px',
				'margin-top': -w / 32 * 9 + 'px'
			});
		} else {
			this.$el.css({
				'width': h / 9 * 16 + 'px',
				'height': h + 'px',
				'margin-left': -h / 9 * 8 + 'px',
				'margin-top': -h / 2 + 'px'
			});
		}

	}

	$.fn.mwBackgroundVideo = function (options) {
		return this.each(function (index, el) {
			el.MwBackgroundVideo = new MwBackgroundVideo(el, options);
		});
	};

	// popup
	var MwPopup = (function (options) {

		/**
		 * Buffer of keys to open parent popups
		 * @type {Array}
		 */
		var buffer = [];

		function _MwPopup(element, options) {
			this.$el = $(element);
			var self = this;

			let defaults = {
				open: false,
				key: false
			};

			// setting
			let settings = $.extend( {}, defaults, options );
			if(settings.key && settings.open) {
				open(self, settings.key);
			} else {
				this.$el.click(function () {
					var key = $(this).attr('data-id');
					open(self, key);
					return false;
				});
			}

		}

		function open(self, key) {
			let id = $("#ve_popup_container_" + key);
			let popup_width = id.attr('data-width');
			let background = id.attr('data-bg');
			buffer.push(key);

			$.mwFrontLightbox({
				width: "90%",
				maxWidth: popup_width,
				inline: true,
				href: "#ve_popup_container_" + key,
				class: 'mw_popup_transparent_content',
				overlayColor: background,
				onComplete: function () {

					$("#ve_popup_container_" + key + ' .ve_content_button').click(function () {
						self.setCookie(key);
					});

				},
				onClosed: function () {
					self.setCookie(key);

					buffer.pop() // Remove current key
					if (buffer.length >= 1) {
						// Open parent popup if there is still some key in buffer
						open(self, buffer.pop())
					}
				}
			});

		}

		return _MwPopup;
	})();

	MwPopup.prototype.setCookie = function (key) {
		var delay = $("#ve_popup_container_" + key).attr('data-delay');

		var now = new Date();
		var time = now.getTime();
		var expireTime = time + 1000 * 3600 * delay * 24;
		now.setTime(expireTime);
		if (delay > 0) document.cookie = "ve_popup_" + key + "=1;expires=" + now.toGMTString() + "; path=/";
	}

	$.fn.mwPopup = function (options) {

		if(this.length > 0) {
			return this.each(function (index, el) {
				el.MwPopup = new MwPopup(el, options);
			});
		}

	};

	$.mwPopup  = function (options) {
		options.open = true;
		new MwPopup(this, options);
	};

	// element popup
	var MwElementPopup = (function (element) {

		function _MwElementPopup(element) {
			this.$el = $(element);
			var self = this;

			this.$el.mwFrontLightbox({
				inline: true,
				href: self.$el.attr('data-popup'),
				maxWidth: "90%",
				width: "600px",
			});

		}

		return _MwElementPopup;

	})();

	$.fn.mwElementPopup = function (options) {
		return this.each(function (index, el) {
			el.MwElementPopup = new MwElementPopup(el, options);
		});
	};

	// password input
	let MwPasswordInput = (function (element) {

		function _MwPasswordInput(element) {
			this.$el = $(element);
			this.$input = this.$el.find('input');
			this.$hideIcon = this.$el.find('.mw_password_input_hide');
			this.$showIcon = this.$el.find('.mw_password_input_show');
			let self = this;

			this.$hideIcon.click(function(){
				self.$input.attr('type', 'password');
				$(this).hide();
				self.$showIcon.show();
			});
			this.$showIcon.click(function(){
				self.$input.attr('type', 'text');
				$(this).hide();
				self.$hideIcon.show();
			});

		}

		return _MwPasswordInput;

	})();

	$.fn.mwPasswordInput = function (options) {
		return this.each(function (index, el) {
			el.MwPasswordInput = new MwPasswordInput(el, options);
		});
	};

	// contact form
	var MwForm = (function (element) {

		function _MwForm(element, settings) {
			this.$el = $(element);

			this.defaults = {
				onsubmit: null,
			};
			this.settings = $.extend({}, this, this.defaults, settings);

			var self = this;

			if (this.$el.hasClass("ve_content_form_antispam")) {
				this.$el.attr('action', this.$el.attr('data-action'));
			}

			this.$el.submit(function (e) {
				var error = false;
				var err_class = "ve_error_form";

				self.$el.find(".ve_error_form").removeClass("ve_error_form");
				self.$el.find(".ve_form_checkbox_container_error").removeClass("ve_form_checkbox_container_error");
				self.$el.find(".ve_form_error_message").remove();

				self.$el.find(".ve_form_required").each(function () {
					if ($(this).hasClass('ve_form_checkbox')) {
						if (!$(this).is(':checked')) error = true;
					} else if ($(this).hasClass('ve_form_checkbox_container')) {

						if ($('input:checkbox:checked', this).length < 1) {
							error = true;
							err_class = "ve_form_checkbox_container_error";
						}

					} else if ($(this).hasClass('ve_form_radio_container')) {

						if ($('input:radio:checked', this).length < 1) {
							error = true;
							err_class = "ve_form_checkbox_container_error";
						}

					} else {
						if ($(this).val() == "") error = true;
					}

					if (error) {
						$(this).addClass(err_class);
						var err = $(this).attr('data-errorm');
						if (!err) err = front_texts.required;

						if ($(this).hasClass('ve_form_checkbox')) {
							$(this).closest('label').after('<div class="ve_form_error_message">' + err + '</p>');
						} else $(this).after('<div class="ve_form_error_message">' + err + '</p>');

						self.scrollOnError($(this));

						return false;
					}
				});

				//check number
				if (!error) {
					self.$el.find(".ve_form_number").each(function () {
						var value = $(this).val() || '';
						var number = value.trim();

						if (!$.isNumeric(number)) {
							$(this).addClass("ve_error_form");
							alert(front_texts.wrongnumber);
							self.scrollOnError($(this));
							return false;
						}
					});
				}

				if (!error) {
					let emailReg = /^([\w-+\.]+@([\w-]+\.)+[\w-]{2,10})?$/;

					self.$el.find(".ve_form_email").each(function () {
						let emailaddressVal = $(this).val().trim();

						$(this).val(emailaddressVal);
						if (!emailReg.test(emailaddressVal)) {
							$(this).addClass("ve_error_form");
							$(this).after('<div class="ve_form_error_message">' + front_texts.wrongemail + '</p>');
							self.scrollOnError($(this));
							error = true;
						}
					});
				}

				// Validate phone numbers via AJAX (server-side PhoneNumberUtil)
				if (!error) {
					let phoneInputs = [];
					let cellPhone = self.$el.find('.ve_form_row_df_cellphone input.ve_form_text');
					let phone = self.$el.find('.ve_form_row_df_phone input.ve_form_text');

					if (cellPhone.length !== 0 && cellPhone.val().length) {
						phoneInputs.push(cellPhone);
					}
					if (phone.length !== 0 && phone.val().length) {
						phoneInputs.push(phone);
					}

					// _phoneValidated flag: set to true after successful validation, which skips AJAX on programmatic re-submit; then reset below
					if (phoneInputs.length && !self._phoneValidated) {
						e.preventDefault();

						let button = self.$el.find("button");
						let pending = phoneInputs.length;
						let hasError = false;

						button.addClass('working');

						// Collect all responses before showing errors (in order to display them all at once)
						let results = [];

						// Process results once all AJAX calls have completed (success or failure)
						let onAllComplete = function () {
							button.removeClass('working');

							results.forEach(function (result) {
								if (!result.data.valid) {
									hasError = true;
									result.input.addClass("ve_error_form");
									result.input.after('<div class="ve_form_error_message">' + result.data.message + '</div>');
								}
							});

							if (!hasError) {
								self._phoneValidated = true;
								self.$el.submit();
							} else {
								// Scroll to the topmost invalid phone field
								let firstError = results.filter(function (r) { return !r.data.valid; })
									.reduce(function (a, b) {
										return a.input.offset().top < b.input.offset().top ? a : b;
									});

								self.scrollOnError(firstError.input);
							}
						};

						phoneInputs.forEach(function (input, index) {
							$.post(ajaxurl, {action: 'mw_validate_phone', phone: input.val()})
								.done(function (data) {
									results[index] = {input: input, data: data};
								})
								.fail(function () {
									results[index] = {input: input, data: {valid: false, message: front_texts.nosended}};
								})
								.always(function () {
									pending--;

									if (pending === 0) {
										onAllComplete();
									}
								});
						});

						return false;
					}
				}

				// Reset flag so next manual submit triggers validation again
				self._phoneValidated = false;

				if (error) {
					return false;
				}
				// contact form sending
				else {

					if (self.settings.onsubmit) {
						self.settings.onsubmit.call(this, self, $(this));
						return false;
					}

					if(self.$el.hasClass('mw_funnel_contact_conversion')) {
						var mail = self.$el.find(".ve_form_email").val();
						var funnel_id = self.$el.attr('data-funnel');
						$.ajax({
							type: 'POST',
							data: {"action": "mwSendMailConversion", "contact": mail, "funnel_id": funnel_id},
							url: ajaxurl,
							success: function (content) {
								self.$el.off("submit");
								self.$el.submit();
								//console.log(content);
							}
						});
						return false;
					}
				}


			});

			this.$el.on("click", ".ve_error_form", function () {
				$(this).removeClass("ve_error_form");
				$(this).closest('.ve_form_row').find('.ve_form_error_message').remove();
			});
			this.$el.find(".ve_form_message").click(function () {
				self.closeMessage();
			});

		}

		return _MwForm;

	})();

	MwForm.prototype.scrollOnError = function (element) {
		let elementOffset = element.offset().top - 50;
		let scrollTo = elementOffset;
		let scrollSelector = 'html, body';
		let offsetSelector = 'body';

		if(element.closest('.mw_popup_container').length) {
			scrollSelector = '.mw_popup_container';
			offsetSelector = '.mw_popup_box';
			scrollTo = elementOffset - $(offsetSelector).offset().top;
		}

		if (elementOffset > $(offsetSelector).offset().top) {
			$(scrollSelector).animate({
				scrollTop: scrollTo
			}, 500);
		}
	}

	MwForm.prototype.showMessage = function (data) {
		this.$el.find('.ve_form_message span').html(data.message);
		this.$el.find('.ve_form_message').removeClass('ve_form_message_error ve_form_message_ok').addClass('ve_form_message_' + data.sended).fadeIn(200);
		if (data.sended === 'ok') {
			this.clearForm();
		}
	}

	MwForm.prototype.closeMessage = function () {
		this.$el.find('.ve_form_message').fadeOut(200, function () {
			$(this).find('span').html('');
			$(this).removeClass('ve_form_message_error ve_form_message_ok');
		});
	}
	MwForm.prototype.clearForm = function () {
		this.$el.find(".ve_form_row input").each(function () {
			$(this).val("");
		});
		this.$el.find(".ve_form_row textarea").val('');
		this.$el.find(".ve_form_row select").val('');
	}

	$.fn.mwForm = function (options) {
		return this.each(function (index, el) {
			el.MwForm = new MwForm(el, options);
		});
	};

	// cookie bar
	var MwCookieBar = (function (element) {

		function _MwCookieBar(element) {
			this.$el = $(element);
			var obj = this;

			if(this.showCookieBar()) {
				this.$el.show();
			}

			this.$el.find(".mw_cookie_open_setting").click(function () {
				obj.$el.find(".mw_cookie_bar").hide();

				const $source = obj.$el.find(".mw_cookie_setting_popup_content");

				let $popup = $('.mw_cookie_setting_popup');
				if (!$popup.length) {
					$popup = $('<div class="mw_cookie_setting_popup"></div>').appendTo('body');
				}

				$popup.append($source.children().clone(true, true));

				//obj.$el.find(".mw_cookie_setting_popup").show();

				var cookie = obj.getCookie();
				var preferences = false;
				var marketing = false;
				var analytics = false;

				if(cookie) {
					var cookieData = JSON.parse(cookie);
					preferences = Boolean(cookieData.permissions.preferences);
					marketing = Boolean(cookieData.permissions.marketing);
					analytics = Boolean(cookieData.permissions.analytics);
				}

				$popup.find(".mw_cookie_setting_switch_preferences input").prop('checked', preferences);
				$popup.find(".mw_cookie_setting_switch_marketing input").prop('checked', marketing);
				$popup.find(".mw_cookie_setting_switch_analytics input").prop('checked', analytics);

				$popup.find(".mw_cookie_setting_form_item_head").click(function () {
					var container = $(this).closest('.mw_cookie_setting_form_item');
					container.find('.mw_cookie_setting_form_item_text').slideToggle();
					container.find('.mw_cookie_setting_arrow').toggleClass('opened');
				});

				$popup.find(".mw_switch").click(function(e) {
					e.stopPropagation();
				});

				// close popup
				$popup.find(".mw_cookie_setting_popup_close").click(function(e) {
					obj.$el.find(".mw_cookie_bar").show();
					$popup.remove();
					return false;
				});

				// allow all
				$popup.find(".mw_cookie_allow_all_button").click(function () {
					obj.saveCookie();
					obj.remove();
					return false;
				});

				// deny all
				$popup.find(".mw_cookie_deny_all_button").click(function () {
					obj.saveCookie(0,0,0,0);
					obj.remove();

					return false;
				});

				// save setting
				$popup.find(".mw_cookie_save_setting").click(function () {
					var preferences = 0;
					var marketing = 0;
					var analytics = 0;
					var others = 0;
					if($popup.find('input:checked[name=preferences]').length)
					{
						preferences = 1;
					}
					if($popup.find('input:checked[name=marketing]').length && $popup.find('input[name=marketing]'))
					{
						marketing = 1;
					}
					if($popup.find('input:checked[name=analytics]').length)
					{
						analytics = 1;
					}
					obj.saveCookie(preferences, marketing, analytics, others);
					obj.remove();
					return false;
				});

				return false;
			});

			// allow all
			this.$el.find(".mw_cookie_bar .mw_cookie_allow_all_button").click(function () {
				obj.saveCookie();
				obj.remove();
				return false;
			});

			// deny all
			this.$el.find(".mw_cookie_bar .mw_cookie_deny_all_button").click(function () {
				obj.saveCookie(0,0,0,0);
				obj.remove();

				return false;
			});
		}

		return _MwCookieBar;

	})();

	MwCookieBar.prototype.remove = function () {
		if(this.$el.hasClass('mw_cookie_bar_management_container'))
		{
			this.$el.remove();
		}
		$(".mw_cookie_setting_popup").remove();
	}

	MwCookieBar.prototype.showCookieBar = function () {
		var cookie = this.getCookie();
		if(cookie) {
			return false;
		}
		else {
			return true;
		}
	}

	MwCookieBar.prototype.getCookie = function() {
		const name = "mw_cookie_permissions=";
		const cDecoded = decodeURIComponent(document.cookie); //to be careful
		const cArr = cDecoded.split('; ');
		let res = null;
		cArr.forEach(val => {
			if (val.indexOf(name) === 0) res = val.substring(name.length);
		})
		return res
	}

	MwCookieBar.prototype.saveCookie = function (preferences = 1, marketing = 1, analytics = 1, others = 1) {
		var date = new Date();
		var id = this.getId();

		var json_str = JSON.stringify({
			'id': id,
			'date': date.toGMTString(),
			'permissions': {
				'preferences': preferences,
				'marketing': marketing,
				'analytics': analytics,
				'others': others,
			}
		});

		let mGranted = marketing ? 'granted' : 'denied';
		let aGranted = analytics ? 'granted' : 'denied';
		let pGranted = preferences ? 'granted' : 'denied';

		if (typeof gtag === 'function') {
			gtag('consent', 'update', {
				'ad_storage': mGranted,
				'ad_personalization': mGranted,
				'ad_user_data': mGranted,
				'analytics_storage': aGranted,
				'personalization_storage': pGranted,
				'security_storage': 'granted',
				'functionality_storage': 'granted',
			});
		}

		if (typeof window.dataLayer !== 'undefined') {
			window.dataLayer.push({
				'event': 'consent_update',
				'analytics_consent': aGranted,
				'preferences_consent': pGranted,
				'ad_consent': mGranted,
			});
		}

		date.setDate(date.getDate() + 365);
		document.cookie = 'mw_cookie_permissions=' + json_str + '; path=/; expires=' + date.toGMTString();
		if(!analytics)
		{
			document.cookie = 'mw_allow_video_youtube=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		}

		// save to db
		$.ajax({
			type: 'POST',
			data: {
				'action': 'mwSaveCookieConsent',
				'id': id,
				'preferences': preferences,
				'marketing': marketing,
				'analytics': analytics,
			},
			url: ajaxurl,
		});
	}

	MwCookieBar.prototype.getId = function ()
	{
		var cookie = this.getCookie();

		if(cookie) {
			var cookieData = JSON.parse(cookie);
			if(cookieData.id)
			{
				return cookieData.id;
			}
		}

		var d = new Date().getTime();
		if (window.performance && typeof window.performance.now === "function")
		{
			d += performance.now();
			// use high-precision timer if available
		}
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
		{
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
	    return uuid;
	}

	$.fn.mwCookieBar = function (options) {
		return this.each(function (index, el) {
			el.MwCookieBar = new MwCookieBar(el, options);
		});
	};

	// phone input
	let MwPhoneInput = (function (element) {

		function _MwPhoneInput(element) {
			this.$el = $(element);
			let obj = this;

			this.$el.find(".mw_phone_slected_country").click(function () {
				obj.$el.find('.mw_phone_country_dropdown').toggle();
			});

			this.$el.find(".mw_phone_input").focusout(function () {
				obj.$el.find('.mw_phone_country_dropdown').hide();
			});

			this.$el.mouseleave(function () {
				obj.$el.find('.mw_phone_country_dropdown').hide();
			});

			this.$el.find(".mw_phone_country_dropdown a").click(function () {
				obj.$el.find('.mw_phone_slected_country input').val($(this).data('value'));
				obj.$el.find('.mw_phone_slected_country span').attr('class', $(this).find('.mw_flag').attr('class'));
				obj.$el.find('.mw_phone_country_dropdown').hide();
				obj.$el.find(".mw_phone_input").focus();
			});
		}

		return _MwPhoneInput;

	})();

	$.fn.mwPhoneInput = function (options) {
		return this.each(function (index, el) {
			el.MwPhoneInput = new MwPhoneInput(el, options);
		});
	};

	// tabs
	var MwFrontTabs = (function (element, settings) {
		function _MwFrontTabs(element, settings) {

			this.$el = $(element);

			this.defaults = {
				change: null,
			};
			this.settings = $.extend({}, this, this.defaults, settings);

			let identificator = this.$el.find('.mw_tabs').data('tabs');

			var obj = this;

			// clear button
			this.$el.children('.mw_tabs').find('a').on('click', function (e) {
				e.preventDefault();
				const tabId = $(this).attr('href').replace(/^#/, "");
				const target = '.mw_tab_' + tabId;
				const url = new URL(window.location);

				obj.$el.find('.mw_tabs li').removeClass("active");
				$(this).closest('li').addClass("active");
				obj.$el.find(".mw_tab").hide();
				obj.$el.find(target).show();

				url.searchParams.set(identificator, tabId);
				window.history.pushState({}, '', url);

				const parentUrl = new URL(window.parent.location);
				parentUrl.searchParams.set(identificator, tabId);
				window.parent.history.pushState({}, '', parentUrl);
			});

			window.addEventListener('popstate', function () {
				const urlParams = new URLSearchParams(window.location.search);
				const tabId = urlParams.get(identificator);

				if (tabId) {
					const target = '.mw_tab_' + tabId;

					obj.$el.find('.mw_tabs li').removeClass("active");
					obj.$el.find(`.mw_tabs a[href="${tabId}"]`).closest('li').addClass("active");

					obj.$el.find(".mw_tab").hide();
					obj.$el.find(target).show();
				}
			});
		}
		return _MwFrontTabs;
	})();

	$.fn.mwFrontTabs = function (options) {
		return this.each(function (index, el) {
			el.MwFrontTabs = new MwFrontTabs(el, options);
		});
	};

});
