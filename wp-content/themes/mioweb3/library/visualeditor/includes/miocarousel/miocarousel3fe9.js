/*
 * We trigger the factory() function is different
 * ways to support modular JavaScript libraries.
 */
;(function (factory) {

	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if (typeof exports !== 'undefined') {
		module.exports = factory(require('jquery'));
	} else {
		factory(jQuery);
	}

})(function ($) {

	let MioCarousel = (function (element, settings) {

		function _MioCarousel(element, settings) {
			let duration = 3000;
			let speed = 500;
			let autoplay = 1;
			let indicators = 1;
			let animation = 'fade';
			let height = 0;
			let showDelayed = 0;

			if ($(element).is('[data-duration]')) duration = $(element).attr("data-duration");
			if ($(element).is('[data-speed]')) speed = parseInt($(element).attr("data-speed"));
			if ($(element).is('[data-autoplay]')) autoplay = parseInt($(element).attr("data-autoplay"));
			if ($(element).is('[data-indicators]')) indicators = parseInt($(element).attr("data-indicators"));
			if ($(element).is('[data-animation]')) animation = $(element).attr("data-animation");
			if ($(element).is('[data-height]')) height = $(element).attr("data-height");

			this.defaults = {
				slideDuration: duration,
				speed: speed,
				indicators: indicators,
				animation: animation,
				arrowRight: '.mc_arrow_container-right',
				arrowLeft: '.mc_arrow_container-left',
				autoplay: autoplay,
				height: height,
			};

			this.settings = $.extend({}, this, this.defaults, settings);

			// This object holds values that will change as the plugin operates
			this.initials = {
				currSlide: 0,
				nextSlide: 0,
				visibleItems: 0,
				correction: 0,
				slideWidth: '100%',
				totalSlides: false,
				isReordered: false,
			};

			// Attaches the properties of this.initials as direct properties of MioCarousel
			$.extend(this, this.initials);

			this.$el = $(element);

			// Ensure that the value of 'this' always references MioCarousel
			this.changeSlide = $.proxy(this.changeSlide, this);

			let obj = this;

			let $delayContainer = this.$el.closest('.element_container_delay');
			if($delayContainer.length) {
				showDelayed = parseFloat($delayContainer.attr('data-delay'));
			}

			if(showDelayed > 0) {
				setTimeout(function () {
					obj.init();
				}, (showDelayed * 1000) + 100);
			} else {
				this.init();
			}

			let res;
			let lastWindowWidth = $(window).width();
			$(window).resize(function () {
				let currentWindowWidth = $(window).width();
				if (currentWindowWidth !== lastWindowWidth) {
					clearTimeout(res);
					res = setTimeout(function () {
						obj.onResize();
					}, 200);
					lastWindowWidth = currentWindowWidth;
				}
			});
		}

		return _MioCarousel;

	})();

	/**
	 * Called once per instance
	 * @params void
	 * @returns void
	 *
	 */
	MioCarousel.prototype.init = function (setInterval = true) {

		this.$el.find('.mw_fake_slide').remove();

		this.$slides = this.$el.find('.slide');

		// set speed animation
		this.$el.get(0).style.setProperty('--animation-speed', this.settings.speed/1000 + 's');
		this.currSlide = 0;

		if(this.settings.animation !== 'fade') {
			this.processSlides();
		}

		this.totalSlides = this.$slides.length;
		if (this.settings.animation === 'slide') {
			this.totalSlides = Math.ceil(this.totalSlides / this.visibleItems);
		} else if (this.settings.animation === 'slideone') {
			this.$el.find('.miocarousel_slides').get(0).style.setProperty('--slide-width', this.slideWidth);
		}

		if(this.settings.animation === 'slide' && this.totalSlides * this.visibleItems > this.$slides.length) {
			let count = this.totalSlides * this.visibleItems - this.$slides.length;
			for (let i = 0; i < count; i++) {
				this.$el.find('.miocarousel_slides').append('<div class="mw_fake_slide slide col-' + this.visibleItems + '"></div>');
			}
			this.$slides = this.$el.find('.slide');
		}

		this.build();

		if (this.totalSlides > 1) {
			this.events();
			if(setInterval) {
				this.initTimer();
			}
		}
	};

	/**
	 * Creates a list of indicators based on the amount of slides
	 * @params void
	 * @returns void
	 *
	 */
	MioCarousel.prototype.build = function () {
		this.$el.find('.indicators').remove();
		var $indicators = this.$el.append('<ul class="indicators" ></ul>').find('.indicators');
		for (var i = 0; i < this.totalSlides; i++) $indicators.append('<li data-index=' + i + '></li>');
		this.$el.find('.indicators li').eq(0).addClass('active');
	};

	/**
	 * Activates the first slide
	 * Activates the first indicator
	 * @params void
	 * @returns void
	 *
	 *
	MioCarousel.prototype.activate = function () {
		this.$el.find('.slide').removeClass('active');
		this.$el.find('.indicators li').removeClass('active');

		this.$currSlide = this.$el.find('.slide').eq(0);
		this.$el.find('.slide').eq(0).addClass('active');

	};*/

	MioCarousel.prototype.onResize = function () {
		this.clearTimer();
		this.$el.removeClass('transition');
		this.setSlide(0);
		this.visibleItems = 0;
		this.init(true);
		this.reorder(0);
		this.setSlide(0);
	};

	MioCarousel.prototype.processSlides = function () {
		let visibleItems = 0;
		let order = 0;

		const rectContainer = this.$el.find('.miocarousel-inner').get(0).getBoundingClientRect();
		const tolerance = (rectContainer.right - rectContainer.left) * 0.1;
		// find visible items
		this.$slides.removeClass('active');
		this.$slides.each(function() {
			const rectSlide = $(this).get(0).getBoundingClientRect();

			if(rectSlide.left >= (rectContainer.left - tolerance) && rectSlide.right <= (rectContainer.right + tolerance)) {
				$(this).addClass('active');
				visibleItems++;
			}
			$(this).attr('data-order', order);
			order++;
		});
		// number of visible items
		if (this.visibleItems === 0) {
			this.visibleItems = visibleItems;
		}

		if(this.$slides.length > 1) {
			let first = this.$slides.get(0).getBoundingClientRect();
			let second = this.$slides.get(1).getBoundingClientRect();
			this.slideWidth = (second.left - first.left) + 'px';
		}

	};

	/**
	 * Associate event handlers to events
	 * For arrow events, we send the placement of the next slide to the handler
	 * @params void
	 * @returns void
	 *
	 */
	MioCarousel.prototype.events = function () {
		this.unbindEvents();
		this.$el
			.on('click', this.settings.arrowRight, {direction: 'right'}, this.changeSlide)
			.on('click', this.settings.arrowLeft, {direction: 'left'}, this.changeSlide)
			.on('click', '.indicators li', this.changeSlide);
	};
	MioCarousel.prototype.unbindEvents = function () {
		this.$el.off('click', this.settings.arrowRight);
		this.$el.off('click', this.settings.arrowLeft);
		this.$el.off('click', '.indicators li');
	}

	/**
	 * TIMER
	 * Resets the timer
	 * @params void
	 * @returns void
	 *
	 */
	MioCarousel.prototype.clearTimer = function () {
		if (this.timer) clearInterval(this.timer);
	};

	/**
	 * TIMER
	 * Initialise the timer
	 * @params void
	 * @returns void
	 *
	 */
	MioCarousel.prototype.initTimer = function () {
		if (this.settings.autoplay) this.timer = setInterval(this.changeSlide, this.settings.slideDuration);
	};

	/**
	 * MAIN LOGIC HANDLER
	 * Triggers a set of subfunctions to carry out the animation
	 * @params	object	event
	 * @returns void
	 *
	 */
	MioCarousel.prototype.changeSlide = function (e) {
		//Ensure that animations are triggered one at a time
		if (this.throttle) return;
		this.throttle = true;

		//Stop the timer as the animation is getting carried out
		this.clearTimer();

		// Returns the animation direction (left or right)
		let direction = this._direction(e);

		// Selects the next slide
		let animate = this._next(e, direction);
		if (!animate) return;

		this.reorderSlides(direction);

		this._Animation(this);
	};

	MioCarousel.prototype.reorderSlides = function (direction) {

		if (this.settings.animation === 'fade') {
		 return;
		}

		let correction = 0;
/*
		console.log('next:' + this.nextSlide);
		console.log('slide:' + this.currSlide);
		console.log('cor:' + this.correction);
		console.log(direction);
		console.log('-------');
*/
		if (this.nextSlide < 0) {
			correction = (this.nextSlide + this.correction) * this.itemsPerSlide();
			this.reorder(correction);
			this.nextSlide = 0;
			this.setSlide(1);
		} else if (this.nextSlide > (this.totalSlides - this.visibleSlides())) {
			correction = (this.nextSlide + this.correction - (this.totalSlides - this.visibleSlides())) * this.itemsPerSlide();
			this.reorder(correction);
			this.nextSlide = this.currSlide;
			this.setSlide(this.currSlide - 1);
		}
/*
		console.log('next:' + this.nextSlide);
		console.log('slide:' + this.currSlide);
		console.log('cor:' + this.correction);
		console.log('-------------------------');
*/
	};

	MioCarousel.prototype.reorder = function (correction) {
		if (correction < 0) {
			this.$slides.slice(correction).css('order', -1);
		} else if (correction > 0) {
			this.$slides.slice(0,correction).css('order', 99999);
		} else {
			this.$slides.css('order', 1);
		}
		this.correction = correction;
	};

	MioCarousel.prototype.itemsPerSlide = function () {
		if (this.settings.animation === 'slide') {
			return this.visibleItems;
		}
		return 1;
	};

	MioCarousel.prototype.visibleSlides = function () {
		if (this.settings.animation === 'slideone') {
			return this.visibleItems;
		}
		return 1;
	};

	MioCarousel.prototype.isEndSlide = function () {
		if(this.isBeginning() || this.isEnd() ) {
			return true;
		}
		return false;
	};

	MioCarousel.prototype.isEnd = function () {
		if(this.correction === (this.visibleSlides() * this.itemsPerSlide()) ) {
			return true;
		}
		return false;
	};

	MioCarousel.prototype.isBeginning = function () {
		if(this.correction === -(this.visibleSlides() * this.itemsPerSlide())) {
			return true;
		}
		return false;
	};

	/**
	 * Returns the animation direction, right or left
	 * @params	object	event
	 * @returns strong	animation direction
	 *
	 */
	MioCarousel.prototype._direction = function (e) {
		let direction;

		// Default to forward movement
		if (typeof e !== 'undefined') {
			direction = (typeof e.data === 'undefined' ? 'right' : e.data.direction);
		} else {
			direction = 'right';
		}
		return direction;
	};

	/**
	 * Updates our plugin with the next slide number
	 * @params	object	event
	 * @params	string	animation direction
	 * @returns boolean continue to animate?
	 *
	 */
	MioCarousel.prototype._next = function (e, direction) {

		// to default order
		if (this.isEndSlide() && this.settings.animation !== 'fade') {

			let jumpToSlide;

			if (this.isBeginning()) {
				jumpToSlide = this.totalSlides - this.visibleSlides();
			} else if(this.isEnd()) {
				jumpToSlide = 0;
			}

			this.reorder(0);
			this.setSlide(jumpToSlide);

		}

		// If the event was triggered by a slide indicator, we store the data-index value of that indicator
		let index = (typeof e !== 'undefined' ? $(e.currentTarget).data('index') : undefined);

		//Logic for determining the next slide
		switch (true) {
			//If the event was triggered by an indicator, we set the next slide based on index
			case(typeof index !== 'undefined'):
				/*
				if (this.nextSlide == index + 1) {
					this.initTimer();
					return false;
				}*/
				if(this.currSlide === 0 && index >= this.totalSlides - 1) {
					this.nextSlide = -1
				} else if(this.currSlide - this.correction === (this.totalSlides - 1) && index === 0) {
					this.nextSlide = this.currSlide + 1;
				} else {
					this.nextSlide = index - this.correction;
				}
				break;
			case(direction == 'right'):
				this.nextSlide = this.currSlide + 1;
				break;
			case(direction == 'left'):
				this.nextSlide = this.currSlide - 1;
				break;
		}

		return true;
	};

	/**
	 * Executes the animation
	 * @params	object	Jquery object the next slide to slide into view
	 * @params	string	animation direction
	 * @returns void
	 *
	 */
	MioCarousel.prototype._Animation = function (obj) {

		setTimeout(function () {
			obj.$el.addClass('transition');
			obj.setSlide(this.nextSlide);
			obj._updateIndicators();
			setTimeout(obj.afterAnimation, obj.settings.speed, this);
		}.bind(this), 10);

	};

	MioCarousel.prototype.setSlide = function (nextSlide) {
		if (this.settings.animation === 'fade') {
			if(nextSlide > (this.totalSlides - 1)) {
				nextSlide = 0;
			} else if(nextSlide < 0) {
				nextSlide = (this.totalSlides - 1);
			}
			let $nextSlide = this.$el.find('.slide').eq(nextSlide);
			let $currSlide = this.$el.find('.slide').eq(this.currSlide);
			$currSlide.removeClass('active');
			$nextSlide.addClass('active');
		} else {
			this.$el.find('.miocarousel_slides').get(0).style.setProperty('--current-slide', nextSlide);
		}

		this.currSlide = nextSlide;
	};

	MioCarousel.prototype.afterAnimation = function (obj) {
		obj.initTimer();
		obj.$el.removeClass('transition');

		if(obj.settings.animation !== 'fade') {
			obj.processSlides();
		}
		obj.throttle = false;
	};

	/**
	 * Ensures the slide indicators are pointing to the currently active slide
	 * @params	void
	 * @returns	void
	 *
	 */
	MioCarousel.prototype._updateIndicators = function () {
		let id = this.currSlide + (this.correction / this.itemsPerSlide());
		if (id < 0) {
			id = this.totalSlides + (this.correction / this.itemsPerSlide());
		} else if (id >= this.totalSlides) {
			id = this.correction - (this.visibleSlides() * this.itemsPerSlide());
		}
		this.$el.find('.indicators li').removeClass('active').eq(id).addClass('active');
	};

	/**
	 * Initialize the plugin once for each DOM object passed to jQuery
	 * @params	object	options object
	 * @returns void
	 *
	 */
	$.fn.MioCarousel = function (options) {

		return this.each(function (index, el) {

			el.MioCarousel = new MioCarousel(el, options);

		});

	};


});

jQuery(function ($) {
	$('.miocarousel:not(.ve_popup_container .miocarousel)').MioCarousel({});
});
