/**
 * @author lucas@pieui.com
 */
// SE Wrapper function
(function () {
 	
	// Check jQ exists
	if(typeof window.jQuery != 'undefined') {
		
		// Set jQ alias in here
		var $ = window.jQuery;
		
		// Startup plugin --------------------------------------------------------------------------------------
		$.fn.dt_picker = function(options) {
			return this.each(function() {
				// Shortcut to (jq object 'this')
				var _t = $(this);
				_t.dt_data = {};
				// Combine settings into defaults
				var _s = $.extend({}, $.fn.dt_picker.defaults, options);
				_t.data('dt_settings',_s);
				// Do we have our basic container in the page?
				var _c = dt_html.create_container(_s);
				
				// Get and reset val function if not input type
				if(_t[0].tagName.toLowerCase() !== 'input') {
					_t.val = _t.text;
				}
				
				var dt_encode = dt_date.encode;
				
				var obj_val_date = dt_date.decode(_t.val(),_s.date_time_format,_s.default_date_time,_s.just_date);
				
				// Check the min / max dates
				if(_s.min_date !== null && obj_val_date.getTime() < _s.min_date.getTime()) {
					obj_val_date = _s.min_date;
				}
				if(_s.max_date !== null && obj_val_date.getTime() > _s.max_date.getTime()) {
					obj_val_date = _s.max_date;
				}
				
				_t.data('dt_curr_date', obj_val_date);
				var mid_mon = new Date(_t.data('dt_curr_date').valueOf());
				mid_mon.setDate(15);
				_t.data('dt_mid_mon_date', mid_mon);
				
				// If allow blank
				if(_s.allow_blank && _t.val().replace(/\s+/g,'') == '') {
					_t.val('');
				} else {
					_t.val(dt_encode(_t.data('dt_curr_date'),_s.date_time_format,_s.just_date));
				}
				
				// Visual settings
				dt_event.attach_obj(_t,_s);
				
				var dt_delay = dt_utils.delay;
				
				// Click and focus
				_t.click(function(e){
					dt_utils.yield(function() {
						dt_event.show_cal(_t, _s,e);
					});
					
					dt_delay(100,function() {
						$(window).bind('resize.dt_move_cal',function(e) {
							dt_event.show_and_position_cal(_t, _s);
						});
					});
					
					dt_delay(200,function() {
						$(document).bind('click.dt_hide_cal',function(e) {
							dt_event.hide_cal(_t, _s,e);
						});
					});
				});
				
				// Locks the field / obj data
				var f_format = _s.date_time_format;
				
				_t.blur(function(e){
					if(_s.allow_blank && _t.val().replace(/\s+/g,'') == '') {
						_t.val('');
					} else {
						_t.val(dt_encode(_t.data('dt_curr_date'),f_format, _s.just_date));
					}
				});
				
				_t.keyup(function(e){
					if(_s.allow_blank && _t.val().replace(/\s+/g,'') == '') {
						_t.val('');
						return false;
					}
					// Backspace
					if(e.keyCode == 8 && _s.allow_blank) {
						_t.val('');
						return false;
					}
					// Delete
					if(e.keyCode == 46 && _s.allow_blank) {
						_t.val('');
						return false;
					}
					_t.val(dt_encode(_t.data('dt_curr_date'),f_format,_s.just_date));
				});
			});
		};
		
		// Default settings ------------------------------------------------------------------------------------
		$.fn.dt_picker.defaults = {
			allow_blank				: false,
			cal_container_class		:'dt_picker',
			cal_container_id		:'dt_picker_popup',
			cal_layout				: 'month', // or fortnight or week
			date_time_format		: 'DD-MM-YYYY hh:mm:ss', // requires 24 hr format
			default_date_time		: new Date(),
			first_day_of_week		: 'Sun', // or Mon - redundant on horz layout
			just_date				: false,
			min_date				: null,
			max_date				: null,
			show_months				: 3,
			show_time_chooser		: true,
			time_display			: 24, // or 12
			update_cb				: null,
			clear_cb				: null,
			visual_time_chooser		: true
		};
		
		// Public Methods ------------------------------------------------------------------------------
		
		// Override defaults for page
		$.fn.dt_picker.new_defaults = function(options) {
			var _s = $.extend({}, $.fn.dt_picker.defaults, options);
			$.fn.dt_picker.defaults = _s;
		};
		
		$.fn.dt_insert = function(val){
			return this.each(function(){
				var _t = $(this);
				var _s = _t.data('dt_settings');
				
				// Get and reset val function if not input type
				if(_t[0].tagName.toLowerCase() !== 'input') {
					_t.val = _t.text;
				}
				
				// Do visible insert
				_t.val(val);
				
				// Invis data insert
				_t.data('dt_curr_date', dt_date.decode(_t.val(),_s.date_time_format,_s.default_date_time));
				var mid_mon = new Date(_t.data('dt_curr_date').valueOf());
				mid_mon.setDate(15);
				_t.data('dt_mid_mon_date', mid_mon);
			});
		};
		
		// Get date as date or string
		$.fn.dt_getCurrDate = function() {
			var jThis    = $(this[0]);
			var settings = jThis.data('dt_settings');
			var date = jThis.data('dt_curr_date');
			return {
				asString: dt_date.encode(date,settings.date_time_format,settings.just_date),
				asDate:   date
			};
		};
		
		// Set current date
		$.fn.dt_setCurrDate = function(date) {
			var dateObj, dateStr;
			var jThis    = $(this[0]);
			var settings = jThis.data('dt_settings');
			
			if(jThis[0].tagName.toLowerCase() !== 'input') {
				jThis.val = jThis.text;
			}
			
			if(typeof date == 'string') {
				dateStr = date;
				dateObj = dt_date.decode(date,settings.date_time_format,settings.default_date_time);
			} else {
				dateObj = date;
				dateStr = dt_date.encode(date,settings.date_time_format,settings.just_date);
			}
			
			jThis.val(dateStr);
			jThis.data('dt_curr_date',dateObj);
			var mid_mon = new Date(dateObj.valueOf());
			mid_mon.setDate(15);
			jThis.data('dt_mid_mon_date', mid_mon);
			
			return this;
		}
		
		
		// Private functions -----------------------------------------------------------------------------------
		
		// Events group
		var dt_event = {
			attach_obj: function(obj, settings) {
				obj.addClass('dt_picker_obj_attached');
				if(settings.allow_blank) {
					var button = $('<span class="dt_clear_field_button" title="Clear field"><span>X</span></span>');
					button.click(function() {
						if(settings.clear_cb !== null  && typeof settings.clear_cb == 'function'){
							settings.clear_cb.call(obj);
						}
						obj.val('');
					});
					button.css({height:Math.round(obj.outerHeight())+'px'});
					obj.after(button);
				}
			},
			
			show_cal: function(obj, settings) {
				var dt_delay = dt_utils.delay;
				// Show it
				dt_utils.yield(function() {
					dt_event.show_and_position_cal(obj,settings);
				});
				
				// Time chooser
				dt_delay(12, function() {
					if(settings.show_time_chooser == true && settings.just_date !== true) {
						dt_event.show_time_chooser(obj, settings);
					} 
				});
				
				// Set back / forward events
				dt_delay(25,function() {
					dt_event.set_back_forward_events(obj,settings);
				});
				
				var curr_date = new Date(obj.data('dt_curr_date').valueOf());
				var mid_mon_date = new Date(obj.data('dt_mid_mon_date').valueOf());
				var months = settings.show_months;
				var layout = settings.cal_layout;
				
				var cont = $('div#'+settings.cal_container_id+'_inner');
				cont.html('');
				
				$('div#'+settings.cal_container_id).removeClass('dt_layout_month dt_layout_fortnight dt_layout_week');
				$('div#'+settings.cal_container_id).addClass('dt_layout_' + settings.cal_layout);
				
				var i=0;
				do {
					var temp_date = new Date(mid_mon_date.valueOf());
					temp_date.setMonth(mid_mon_date.getMonth()+i);
					var table = dt_html.create_cal_data(temp_date,layout,obj,settings);
					var selected = table.find('.dt_selected');
					var theader = dt_event.find_cell_matching_header(selected);
					theader.addClass('dt_selected');
					cont.append(table);
					i++;
				} while( i<months);
				
			},
			
			date_chosen: function(cell, obj, settings) {
				// Check it's not a disabled cell
				if(cell.hasClass('dt_min_date_disabled') || cell.hasClass('dt_max_date_disabled')) {
					return;
				}
				
				var curr_date = new Date(obj.data('dt_curr_date').valueOf());
				var table_data = cell.closest('table').data('dt_data');
				var day_num = parseInt(cell.text());
				var month_num = table_data.month;
				var year_num = table_data.year;
				var new_date = new Date();
				new_date.setFullYear(year_num);
				new_date.setMonth(month_num);
				new_date.setDate(day_num);
				// Off we go
				var dt_y = dt_utils.yield;
				dt_y(function(arr) {
					dt_event.update_date_obj(arr[0],arr[1],arr[2]);
				},[new_date, obj, settings]);
				dt_y(function(arr) {
					dt_event.update_selected_date(arr[0],arr[1],arr[2], arr[3]);
				},[cell, obj, settings]);
				
				if(settings.just_date == true) {
					dt_y(function(arr) {
						dt_event.hide_cal(arr[0],arr[1],arr[2], arr[3]);
					},[obj, settings,cell]);
				}
			},
			
			time_chosen: function(cell, obj, settings) {
				var curr_date = obj.data('dt_curr_date');
				var table = cell.closest('table');
				if(table.hasClass('dt_time_chooser_hours')) {
					curr_date.setHours(cell.text());
				}
				if(table.hasClass('dt_time_chooser_minutes')) {
					curr_date.setMinutes(cell.text());
				}
				if(table.hasClass('dt_time_chooser_seconds')) {
					curr_date.setSeconds(cell.text());
				}
				var dt_y = dt_utils.yield;
				dt_y(function(arr) {
					dt_event.update_date_obj(arr[0],arr[1],arr[2]);
				},[curr_date, obj, settings]);
				
				dt_y(function(arr) {
					dt_event.update_selected_time(arr[0],arr[1],arr[2]);
				},[cell, obj, settings]);
			},
			
			update_date_obj: function(date, obj, settings) {
				var curr_val = obj.val();
				var curr_time = new Date(obj.data('dt_curr_date').valueOf());
				// Set new date's time to current time.
				date.setSeconds(curr_time.getSeconds());
				date.setMinutes(curr_time.getMinutes());
				date.setHours(curr_time.getHours());
				
				var new_date = dt_date.encode(date, settings.date_time_format, settings.just_date);
				
				obj.data('dt_curr_date',date);
				
				obj.val(new_date);
				
				if(settings.update_cb !== null && typeof settings.update_cb == 'function') {
					dt_utils.yield(function() {
						settings.update_cb({
							date_time: date,
							enc_date_time: new_date
						});
					});
				}
				
				var flicker_time = 1000;
				var flicker = function(){
					obj.addClass(settings.cal_container_class + '_updated_hilighter');
					dt_utils.delay(flicker_time, function(obj){
						obj.removeClass(settings.cal_container_class + '_updated_hilighter');
					}, obj);
				};
				dt_utils.yield(flicker);
			},
			
			update_selected_date: function(cell, obj, settings) {
				$('div#' + settings.cal_container_id + '_inner table .dt_selected').removeClass('dt_selected');
				cell.addClass('dt_selected');
				var theader = dt_event.find_cell_matching_header(cell);
				theader.addClass('dt_selected');
			},
			
			update_selected_time: function(cell, obj, settings) {
				var table = cell.closest('table');
				table.find('td.dt_selected').removeClass('dt_selected');
				cell.addClass('dt_selected');
			},
			
			find_cell_matching_header: function(cell) {
				var table = cell.closest('table');
				var headers = table.find('th');
				var cell_row = cell.parent().children();
				var col_num = 0;
				cell_row.each(function(i) {
					if(this == cell[0]) {
						col_num = i;
						return false;
					}
				});
				if(headers.length !== cell_row.length) {
					return $(headers[col_num+1]);
				} else {
					return $(headers[col_num]);
				}
			},
			
			set_cell_events: function(obj,settings) {
				var tables = $('div#'+settings.cal_container_id+'_inner table');
				var cells = $('div#'+settings.cal_container_id+'_inner table td');
				
				var dt_y = dt_utils.yield;
				cells.each(function(i) {
					dt_y(function(arr) {
						dt_event.set_single_cell_bits(arr[0],arr[1],arr[2]);
					},[this,obj,settings]);
				});
			},
			
			set_single_cell_bits: function(cell, obj, settings) {
				var this_cell = $(cell);
				
				if(this_cell.hasClass('dt_date_disabled')) {
					return false;
				}
				
				var th = dt_event.find_cell_matching_header(this_cell);
				
				// Check against min / max date
				if(settings.min_date !== null || settings.max_date !== null) {
					var table_data = this_cell.closest('table').data('dt_data');
					var day_num = parseInt(this_cell.text());
					var month_num = table_data.month;
					var year_num = table_data.year;
					var new_date = new Date();
					new_date.setFullYear(year_num);
					new_date.setMonth(month_num);
					new_date.setDate(day_num);
					
					// Test against min
					if(settings.min_date !== null && new_date.getTime() < settings.min_date.getTime()) {
						this_cell.addClass('dt_min_date_disabled');
						this_cell.attr({title:'Sorry, this date is not available'});
					}
					
					// Test against max
					if(settings.max_date !== null && new_date.getTime() > settings.max_date.getTime()) {
						this_cell.addClass('dt_max_date_disabled');
						this_cell.attr({title:'Sorry, this date is not available'});
					}
				}
				
				// Events
				this_cell.mouseenter(function() {
					this_cell.addClass('dt_hover');
					th.addClass('dt_hover');
				});
				this_cell.mouseleave(function() {
					this_cell.removeClass('dt_hover');
					th.removeClass('dt_hover');
				});
				this_cell.click(function() {
					dt_utils.yield(function(arr) {
						dt_event.date_chosen(arr[0],arr[1],arr[2]);
					},[this_cell,obj,settings]);
				});
			},
			
			set_time_cell_events: function(obj,settings) {
				var tables = $('div#'+settings.cal_container_id+'_time_chooser table');
				var cells  = $('div#'+settings.cal_container_id+'_time_chooser table td');
				var dt_y = dt_utils.yield;
				cells.each(function(i) {
					dt_y(function(arr) {
						dt_event.set_single_time_cell_events(arr[0],arr[1],arr[2]);
					},[this,obj,settings]);
				});
			},
			
			set_time_select_events: function(obj,settings) {
				var selects = $('div#'+settings.cal_container_id+'_time_chooser select');
				selects.each(function(i){
					var sel_this = $(this);
					var parent = sel_this.parent();
					sel_this.change(function() {
						var curr_date = obj.data('dt_curr_date');
						if(parent.hasClass('dt_time_chooser_hours_sel')) {
							curr_date.setHours(sel_this.val())
						}
						if(parent.hasClass('dt_time_chooser_mins_sel')) {
							curr_date.setMinutes(sel_this.val())
						}
						if(parent.hasClass('dt_time_chooser_secs_sel')) {
							curr_date.setSeconds(sel_this.val())
						}
						dt_event.update_date_obj(curr_date,obj,settings);
					});
				});
			},
			
			set_single_time_cell_events: function(cell, obj, settings) {
				var this_cell = $(cell);
				
				if(this_cell.hasClass('dt_time_disabled')) {
					return false;
				}
				
				// Events
				this_cell.mouseenter(function() {
					this_cell.addClass('dt_hover');
				});
				this_cell.mouseleave(function() {
					this_cell.removeClass('dt_hover');
				});
				this_cell.click(function() {
					dt_utils.yield(function(arr) {
						dt_event.time_chosen(arr[0],arr[1],arr[2]);
					},[this_cell,obj,settings]);
				});
			},
			
			set_back_forward_events: function(obj,settings) {
				var back_button = $('a#' + settings.cal_container_id +'_back_month_button');
				var forw_button = $('a#' + settings.cal_container_id +'_forward_month_button');
				var close_button = $('a#' + settings.cal_container_id +'_close_cal_button');
				
				back_button.unbind('click.dt_back_month');
				forw_button.unbind('click.dt_forward_month');
				close_button.unbind('click.dt_close_cal');
				
				// Back event
				back_button.bind('click.dt_back_month',function() {
					var new_date = dt_date.add_months(obj.data('dt_mid_mon_date'),settings.show_months*-1);
					if(settings.min_date !== null) {
						var mid_mon_min = new Date(settings.min_date.getTime());
						mid_mon_min.setDate(15);
					}
					// Test min_date
					if(settings.min_date !== null && new_date.getTime() < mid_mon_min.getTime()) {
						new_date.setFullYear(mid_mon_min.getFullYear());
						new_date.setMonth(mid_mon_min.getMonth());
					}
					obj.data('dt_mid_mon_date',new_date);
					dt_utils.yield(function() {
						dt_event.show_cal(obj,settings);
					});
				});
				
				// Forward event
				forw_button.bind('click.dt_forward_month',function() {
					var new_date = dt_date.add_months(obj.data('dt_mid_mon_date'),settings.show_months);
					// TODO: Test max_date properly
					if(settings.max_date !== null) {
						var mid_mon_max = new Date(settings.max_date.getTime());
						mid_mon_max.setDate(15);
					}
					if(settings.max_date !== null && new_date.getTime() > mid_mon_max.getTime()) {
						new_date.setFullYear(mid_mon_max.getFullYear());
						new_date.setMonth(mid_mon_max.getMonth());
					}
					obj.data('dt_mid_mon_date',new_date);
					dt_utils.yield(function() {
						dt_event.show_cal(obj,settings);
					});
				});
				
				// Close cal button
				close_button.bind('click.dt_close_cal',function(e) {
					dt_utils.yield(function() {
						dt_event.hide_cal(obj,settings,e);
					});
				});
			},
			
			show_time_chooser: function(obj,settings) {
				var outer = $('div#' + settings.cal_container_id);
				$('div#'+settings.cal_container_id+'_time_chooser').remove();
				var time_div = $('<div id="'+settings.cal_container_id+'_time_chooser"></div>');
				outer.append(time_div);
				
				var time = new Date(obj.data('dt_curr_date').valueOf());
				var hours = time.getHours();
				var mins = time.getMinutes();
				var secs = time.getSeconds();
				
				var html = null;
				var dt_delay = dt_utils.delay;
				if(settings.visual_time_chooser == false) {
					html = dt_html.create_time_selects(time, obj, settings);
					time_div.append(html);
					// Set time cell events
					dt_delay(10,function() {
						dt_event.set_time_select_events(obj,settings);
					});
				} else {
					html = dt_html.create_time_tables(time, obj, settings);
					time_div.append(html);
					// Set time cell events
					dt_delay(10,function() {
						dt_event.set_time_cell_events(obj,settings);
					});
				}
				
			},
			
			hide_time_chooser: function(obj,settings) {
				var time_div = $('div#'+settings.cal_container_id+'_time_chooser');
				time_div.remove();
			},
			
			show_and_position_cal: function(obj,settings) {
				// Unbind resize to stop IE being crazy
				$(window).unbind('resize.dt_move_cal');
				
				var obj_height = Math.round(obj.outerHeight());
				var obj_width  = Math.round(obj.outerWidth());
				var obj_offset = obj.offset();
				var window_bounds = {w: $(window).width(), h: $(window).height()};
				
				var cont = $('div#'+settings.cal_container_id);
				var cont_bounds = {w:cont.outerWidth(),h:cont.outerHeight()};
				
				cont.css({
					display:'block',
					visibility:'hidden',
					left:obj_offset.left + 'px',
					top:(obj_offset.top + obj_height) + 'px'
				});
				
				var bot_right = {
					x:(obj_offset.left + cont_bounds.w),
					y:(obj_height + obj_offset.top + cont_bounds.h)
				};
				
				var diff = {
					x:(window_bounds.w - bot_right.x),
					y:(window_bounds.h - bot_right.y)
				};
				
				if(diff.x < 0) {
					var new_left = (obj_offset.left + diff.x) - 15;
				} else {
					var new_left = obj_offset.left;
				}
				
				var dt_delay = dt_utils.delay;
				cont.css({
					display:'block',
					left: new_left + 'px',
					top: obj_offset.top + obj_height + 'px',
					visibility: 'visible'
				});
								
				// Set cell click events
				dt_utils.yield(function() {
					dt_event.set_cell_events(obj,settings);
				});
				
				// Move IE6 Shim into position
				if (typeof document.body.style.maxHeight == 'undefined') {
					dt_delay(5,function() {
						$('div#'+settings.cal_container_id+'_iframe_shim').css({
							width:  cont.outerWidth()+'px',
							height: cont.outerHeight() + 'px',
							display: 'block',
							left: new_left + 'px',
							top: obj_offset.top + obj_height + 'px'
						});
					});
				}
				
				// Put resize back again
				dt_delay(333,function() {
					$(window).bind('resize.dt_move_cal',function(e) {
						dt_event.show_and_position_cal(obj,settings);
					});
				});
			},
			
			hide_cal:function(obj, settings, event) {
				if(event.target == obj[0]) {
					return false;
				}
				
				if($(event.target).closest('div#'+settings.cal_container_id).length !==0 && event.currentTarget !== $('a#'+settings.cal_container_id+'_close_cal_button')[0]) {
					return false;
				}
				
				// Clean up
				dt_utils.yield(function() {
					
					// Remove IE6 Shim 
					if (typeof document.body.style.maxHeight == 'undefined') {
						$('div#'+settings.cal_container_id+'_iframe_shim').css({
							display:'none'
						})
					}
					
					var cont = $('div#'+settings.cal_container_id);
					cont.css({
						display:'none',
						left: '0px',
						top: '0px',
						width: ''
					});
					
					var back_button = $('a#' + settings.cal_container_id +'_back_month_button');
					var forw_button = $('a#' + settings.cal_container_id +'_forward_month_button');
					back_button.unbind('click.dt_back_month');
					forw_button.unbind('click.dt_forward_month');
					
					obj.data('dt_curr_date',new Date(obj.data('dt_curr_date').valueOf()));
					dt_event.hide_time_chooser(obj, settings);
					
					$(document).unbind('click.dt_hide_cal');
					$(window).unbind('resize.dt_move_cal');
				});
				
			}
		};
		
		// HTML builder group
		var dt_html = {
			// Create popup container
			create_container: function create_container(settings) {
				var div_id = settings.cal_container_id;
				var div_class = settings.cal_container_class;
				// Test for IE6, add iframe shim
				var shim = '';
				if(typeof document.body.style.maxHeight == 'undefined') {
					shim = '<div id="'+div_id+'_iframe_shim"><iframe frameborder="0" scrollbar="no" style="filter:alpha(opacity=51);"></iframe></div>';
				}
				
				if($('div#' + div_id).length == 0) {
					var cont_html = '<div id="'+div_id+'" class="'+div_class+'"><div id="'+div_id+'_header">';
					cont_html += '<a id="'+div_id+'_back_month_button"title="Move calendar back"><span>Back</span></a>';
					cont_html += '<a id="'+div_id+'_forward_month_button" title="Move calendar forward"><span>Forward</span></a>';
					cont_html += '<a id="'+div_id+'_close_cal_button" title="Close picker"><span>Close</span></a></div>';
					cont_html += '<div id="'+div_id+'_inner"></div></div>'+shim;
					var container = $(cont_html);
					container.appendTo('body');
					return $('div#' + div_id + '_inner');
				} else {
					return $('div#' + div_id + '_inner');
				}
			},
			// Create cal html
			create_cal_data: function(date,layout,obj,settings) {
				var d_data = dt_data.date.day;
				var m_data = dt_data.date.month;
				
				var l_bound = 1;
				var u_bound = m_data.get_num_days(date);
				
				var row_len = 0;
				
				if(layout == 'month') {
					row_len = u_bound;
				} else {
					row_len = 7;
				}
				
				var html = '';
				var tbl_head = '';
				var tbl_body = '';
				var this_date = new Date(date.valueOf());
				var sel_date = new Date(obj.data('dt_curr_date').valueOf());
				
				if(layout == 'month') {
					
					html += '<table class="dt_picker_cal_layout dt_month" cellpadding="0" cellspacing="0">';
					
					// Much simpler / faster engine
					var i = l_bound;
					var title = m_data.get_name[this_date.getMonth()];
					title += ', ' + this_date.getFullYear();
					
					do {
						this_date.setDate(i);
						var day_txt = d_data.get_short_name[this_date.getDay()].substr(0,1);
						var day_num = i;
						var cell_class = '';
						
						if(day_txt.toLowerCase() == 's') {
							cell_class = 'dt_weekend';
						}
						
						if(this_date.toDateString() == sel_date.toDateString()) {
							cell_class = 'dt_selected';
						}
						
						if(cell_class == 'dt_selected') {
							tbl_head += '<th class="">' + day_txt + '</th>';
						} else {
							tbl_head += '<th class="'+cell_class+'">' + day_txt + '</th>';
						}
						
						var t_title = d_data.get_name[this_date.getDay()] + ' ' + day_num + ' ' + title;
						
						tbl_body += '<td class="'+cell_class+'" title="'+t_title+'">' + day_num + '</td>';
						
						i++;
					} while(i <= u_bound);
					
					
					html += '<tr><th rowspan="2" class="dt_month_header"><span class="month_name">' + m_data.get_short_name[date.getMonth()] + '</span> ';
					html += '<span class="year">'+date.getFullYear()+'</span></th>';
					html += tbl_head + '</tr><tr>' + tbl_body + '</tr>';
					
					html += '</table>';
					
				} else {
					// Setup vars to handle both fortnight and week
					var desired_row_len = 7;
					if(layout == 'fortnight') {
						desired_row_len = 14;
					}
					
					html += '<table class="dt_picker_cal_layout dt_fortnight" cellpadding="0" cellspacing="0">';
					html += '<tr><th class="dt_month_header" colspan="'+desired_row_len+'">'+m_data.get_short_name[date.getMonth()]+' '+date.getFullYear()+'</th></tr>';
					
					var first_day = 0; // Sunday is default
					if(settings.first_day_of_week.toLowerCase() == 'mon') {
						first_day = 1;
					}
					
					var month_first_day = new Date(this_date.valueOf());
					month_first_day.setDate(1);
					month_first_day = month_first_day.getDay();
					
					html += '<tr>';
					var d=first_day;
					do {
						var this_d = d;
						if(d > 6) {
							this_d = d - 7;
						}
						if(d > 13) {
							this_d = d - 14;
						}
						
						var day_txt = d_data.get_short_name[this_d].substr(0,1)
						var cell_class = '';
						// Weekend class
						if(day_txt.toLowerCase() == 's') {
							cell_class = 'dt_weekend';
						}
						
						html += '<th class="'+cell_class+'">'+day_txt+'</th>';
						d++;
					} while( d<desired_row_len+first_day);
					html += '</tr><tr>';
					
					var row_count = l_bound;
					var i = l_bound;
					var title = m_data.get_name[this_date.getMonth()];
					title += ', ' + this_date.getFullYear();
					do {
						this_date.setDate(i);
						var date_num = i;
						var day_num = this_date.getDay();
						var cell_class = '';
						
						// Left pad routine
						if(i == l_bound) {
							if(first_day == 0 && day_num !== 0) {
								for(var k=0; k< day_num; k++) {
									html += '<td class="dt_date_disabled"></td>';
									row_count++;
								}
							}
							// Monday first day padding
							if(first_day == 1 && day_num > 1) {
								for(var s=0; s< day_num-1; s++) {
									html += '<td class="dt_date_disabled"></td>';
									row_count++;
								}
							}
							// Sunday in Monday first week scenario
							if (first_day == 1 && day_num == 0) {
								for(var h=0; h< 6; h++) {
									html += '<td class="dt_date_disabled"></td>';
									row_count++;
								}
							}
						}
						
						var class_name = '';
						if(day_num == 0 || day_num == 6) {
							class_name = 'dt_weekend';
						}
						// Set selected class
						if(this_date.toDateString() == sel_date.toDateString()) {
							class_name = 'dt_selected';
						}
						
						var t_title = d_data.get_name[this_date.getDay()] + ' ' + date_num + ' ' + title;
						
						html += '<td class="'+class_name+'" title="'+t_title+'">'+date_num+'</td>';
						
						// Right pad routine
						if(i >= u_bound) {
							for(var g=0; g< desired_row_len-row_count; g++) {
								html += '<td class="dt_date_disabled"></td>';
							}
						}
						
						// Next row
						if(row_count % desired_row_len == 0 && i !== u_bound) {
							html += '</tr><tr>';
							row_count = 0;
						}
						row_count++;
						i++;
						
					} while(i <= u_bound);
					
					html += '</tr>';
	
					html += '</table>';
				}
				
				// Pin some data to this table
				var table = $(html);
				table.data('dt_data',{
					month:this_date.getMonth(),
					year:this_date.getFullYear()
				});
				return table;
				
			},
			
			create_time_tables: function(time, obj, settings) {
				var hours = time.getHours();
				var mins = time.getMinutes();
				var secs = time.getSeconds();
				var max_width = 15;
				
				if(settings.cal_layout == 'month') {
					var max_width = 30;
				}
				
				var hour_tbl = '<table cellpadding="0" cellspacing="0" class="dt_time_chooser_hours"><tr>';
				var mins_tbl = '<table cellpadding="0" cellspacing="0" class="dt_time_chooser_minutes"><tr>';
				var secs_tbl = '<table cellpadding="0" cellspacing="0" class="dt_time_chooser_seconds"><tr>';
				
				var hour_rowspan = 1;
				var mins_rowspan = 1;
				var secs_rowspan = 1;
				
				if(max_width == 30) {
					hour_rowspan = 1;
					mins_rowspan = 2;
					secs_rowspan = 2;
				}
				
				var col_span = 1;
				if(max_width !== 30) {
					var col_span = 15;
				}
				
				hour_tbl += '<th rowspan="'+hour_rowspan+'" colspan="'+col_span+'">Hours</th>';
				mins_tbl += '<th rowspan="'+mins_rowspan+'" colspan="'+col_span+'">Minutes</th>';
				secs_tbl += '<th rowspan="'+secs_rowspan+'" colspan="'+col_span+'">Seconds</th>';
				
				if(max_width !== 30) {
					hour_tbl += '</tr><tr>';
					mins_tbl += '</tr><tr>';
					secs_tbl += '</tr><tr>';
				}
				
				var disp_offset = 24 - settings.time_display;
				
				var y=0;
				do {
					if((y) % max_width == 0 && y !== 0) {
						if(max_width !== 30 && y < 24) {
							hour_tbl += '</tr><tr>';
						}
						mins_tbl += '</tr><tr>';
						secs_tbl += '</tr><tr>';
					}
					
					if(y < 24) {
						var hr_class = '';
						if(disp_offset !== 0) {
							var h_disp = y - disp_offset;
							var am_pm_text = ' pm';
							
							if(h_disp < 0) {
								h_disp = y;
								am_pm_text = ' am';
							}
							if(h_disp == 0) {
								h_disp = 12;
							}
						} else {
							var h_disp = y - disp_offset;
							var am_pm_text = ':00 hrs';
						}
						
						if(y == hours) {
							hr_class = 'class="dt_selected"';
						}
						hour_tbl += '<td '+hr_class+' title="'+h_disp+''+am_pm_text+'">'+y+'</td>';
					} else {
						if(y < 30) {
							hour_tbl += '<td class="dt_time_disabled"></td>';
						}
					}
					var mn_class = '';
					if(y == mins) {
						mn_class = 'class="dt_selected"';
					}
					mins_tbl += '<td '+mn_class+'>'+y+'</td>';
					var sc_class = '';
					if(y == secs) {
						sc_class = 'class="dt_selected"';
					}
					secs_tbl += '<td '+sc_class+'>'+y+'</td>';
					y++;
					
				} while(y<60);
				
				hour_tbl += '</tr></table>';
				mins_tbl += '</tr></table>';
				secs_tbl += '</tr></table>';
				
				return hour_tbl + mins_tbl + secs_tbl;
			},
			
			create_time_selects: function(time, obj, settings) {
				var hours = time.getHours();
				var mins = time.getMinutes();
				var secs = time.getSeconds();
				
				var disp_offset = 24 - settings.time_display;
				
				// Create hours select
				var h_sel = '<div class="dt_time_chooser_hours_sel"><label>Hours:</label> <select>';
				h_sel += '<optgroup label="am">';
				var h=0;
				do {
					var h_disp = h - disp_offset;
					if(h_disp < 0) {
						h_disp = h;
					}
					if(h_disp == 0) {
						h_disp = 12;
					}
					
					if(h == hours) {
						h_sel += '<option value="'+h+'" selected="selected">'+h_disp+'</option>';
					} else {
						h_sel += '<option value="'+h+'">'+h_disp+'</option>';
					}
					if(h == 11) {
						h_sel += '</optgroup><optgroup label="pm">';
					}
					h++
				} while(h< 24);
				h_sel += '</optgroup></select></div>';
				
				// Create mins select
				var m_sel = '<div class="dt_time_chooser_mins_sel"><label>Minutes:</label> <select>';
				var m=0;
				do {
					if(m == mins) {
						m_sel += '<option value="'+m+'" selected="selected">'+m+'</option>';
					} else {
						m_sel += '<option value="'+m+'">'+m+'</option>';
					}
					m++;
				} while(m< 60);
				m_sel += '</select></div>';
				
				// Create secs select
				var s_sel = '<div class="dt_time_chooser_secs_sel"><label>Seconds:</label> <select>';
				var s=0;
				do {
					if(s == secs) {
						s_sel += '<option value="'+s+'" selected="selected">'+s+'</option>';
					} else {
						s_sel += '<option value="'+s+'">'+s+'</option>';
					}
					s++;
				} while( s< 60);
				s_sel += '</select></div>';
				
				var html = h_sel + m_sel + s_sel;
				
				return html;
			}
		};
		
		// Date methods group
		var dt_date = {
			// Decode from str
			decode: function(str,format,default_dt,just_date) {
				// If nothing to do
				if(str == '' || str == null || typeof str == 'undefined') {
					return default_dt;
				}
				
				// Let's get tearing
				var D_pos = format.search(/DD/);
				var M_pos = format.search(/MM/);
				var Y_pos = format.search(/YYYY/);
				var h_pos = format.search(/hh/);
				var m_pos = format.search(/mm/);
				var s_pos = format.search(/ss/);
				
				var date = new Date();
				date.setFullYear(str.substr(Y_pos,4));
				date.setMonth(str.substr(M_pos,2)-1);
				date.setDate(str.substr(D_pos,2));
				date.setHours(str.substr(h_pos,2));
				date.setMinutes(str.substr(m_pos,2));
				date.setSeconds(str.substr(s_pos,2));
				
				// Check it's a valid date
				if(isNaN(date.valueOf()) || date.valueOf() < 0){
					return default_dt;
				}
				
				return date;
			},
			// Encode to str
			encode: function(date,format,just_date) {
				var D = date.getDate().toString();
				var M = (date.getMonth()+1).toString();
				var Y = date.getFullYear().toString();
				var h = date.getHours().toString();
				var m = date.getMinutes().toString();
				var s = date.getSeconds().toString();
				
				// Right pad if necessary
				D = (D.length == 1) ? '0' + D : D;
				M = (M.length == 1) ? '0' + M : M;
				
				h = (h.length == 1) ? '0' + h : h;
				m = (m.length == 1) ? '0' + m : m;
				s = (s.length == 1) ? '0' + s : s;
				
				var str = format;
				str = str.replace(/DD/,D);
				str = str.replace(/MM/,M);
				str = str.replace(/YYYY/,Y);
				
				if(just_date == true) {
					h = m = s = '~@~';
					str = str.replace(/(hh|mm|ss)/g,h);
					str = str.replace(/[^0-9]*~@~[^0-9]*/g,'');
					str = str.replace(/^\s*(\S+)\s*$/g,'$1');
				} else {
					str = str.replace(/hh/,h);
					str = str.replace(/mm/,m);
					str = str.replace(/ss/,s);
					str = str.replace(/^\s*(\S+)\s*$/g,'$1');
				}
				
				return str;
			},
			// Add / remove months
			add_months: function(date,months) {
				var new_date = new Date(date.valueOf());
				new_date.setDate(15);
				var new_month = new_date.getMonth() + months;
				new_date.setMonth(new_month);
				return new_date;
			}
		};
		
		// Utility group
		var dt_utils = {
			// Yielder
			yield : function(in_function,data) {
				var cb = function() {
					return (function() {
						in_function(data);
					})();
				}
				return window.setTimeout(cb,0);
			},
			// Delay
			delay : function(delay,in_function,data) {
				var cb = function() {
					return (function() {
						in_function(data);
					})();
				}
				return window.setTimeout(cb,delay);
			},
			// Debugger
			debug: function debug(obj) {
				if(typeof window.loadFirebugConsole !== 'undefined') {
					console.debug(obj);
				} else {
					if(window.console && window.console.log) {
						console.log(obj);
					} else {
						if(typeof obj !== 'undefined' && obj !== null) {
							alert(obj.toString());
						}
					}
				}
			}
		};
		
		// Various data clumps group
		var dt_data = {
			date: {
				day: {
					get_name: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
					get_short_name:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
					get_num: function(str) {
						var lookup = {'sun':0,'mon':1,'tue':2,'wed':3,'thu':4,'fri':5,'sat':6};
						var test = str.toLowerCase().substr(0,2);
						return lookup[test];
					}
				},
				month: {
					get_name:['January','February','March','April','May','June','July','August','September','October','November','December'],
					get_short_name:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
					get_num:function(str) {
						var lookup = {'jan':0,'feb':1,'mar':2,'apr':3,'may':4,'jun':5,'jul':6,'aug':7,'sep':8,'oct':9,'nov':10,'dec':11};
						var test = str.toLowerCase().substr(0,2);
						return lookup[test];
					},
					get_num_days: function(date){
						var month = date.getMonth();
						var month_days = [31,28,31,30,31,30,31,31,30,31,30,31];
						// February
						if(date.getFullYear() % 4 == 0 && month == 1) {
							month_days[1] = 29;
						}
						return month_days[month]
					}
				}
			}
		}
		
	};
	
 })();
