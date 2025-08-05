var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import * as React from 'react';
import styles from './RaceMeetings.module.scss';
import { AUTHORITIES } from '../../../models/IRaceMeeting';
import { RaceMeetingService } from '../../../services/RaceMeetingService';
import { Dropdown, DefaultButton, IconButton, Spinner, SpinnerSize, Stack, Text, MessageBar, MessageBarType, Panel, PanelType } from '@fluentui/react';
var RaceMeetings = /** @class */ (function (_super) {
    __extends(RaceMeetings, _super);
    function RaceMeetings(props) {
        var _this = _super.call(this, props) || this;
        _this.onViewChange = function (view) {
            _this.setState({ currentView: view }, function () { return _this.loadMeetings(); });
        };
        _this.onNavigate = function (direction) {
            var _a = _this.state, currentView = _a.currentView, currentDate = _a.currentDate;
            var newDate = new Date(currentDate.getTime());
            if (direction === 'today') {
                _this.setState({ currentDate: new Date() }, function () { return _this.loadMeetings(); });
                return;
            }
            var increment = direction === 'next' ? 1 : -1;
            switch (currentView) {
                case 'day':
                    newDate.setDate(newDate.getDate() + increment);
                    break;
                case 'week':
                    newDate.setDate(newDate.getDate() + (7 * increment));
                    break;
                case 'month':
                    newDate.setMonth(newDate.getMonth() + increment);
                    break;
            }
            _this.setState({ currentDate: newDate }, function () { return _this.loadMeetings(); });
        };
        _this.onAuthorityChange = function (event, option) {
            if (option) {
                var authority_1 = option.key;
                _this.setState({
                    selectedAuthority: authority_1,
                    selectedTrackId: '' // Reset track when authority changes
                }, function () {
                    _this.loadMeetings();
                    if (authority_1) {
                        _this.loadTracksByAuthority(authority_1);
                    }
                    else {
                        _this.setState({ tracks: [] });
                    }
                    // Call the callback to persist the selection
                    if (_this.props.onUpdateFilters) {
                        _this.props.onUpdateFilters(authority_1, '');
                    }
                });
            }
        };
        _this.onTrackChange = function (event, option) {
            if (option) {
                var trackId_1 = option.key;
                _this.setState({ selectedTrackId: trackId_1 }, function () {
                    _this.loadMeetings();
                    // Call the callback to persist the selection
                    if (_this.props.onUpdateFilters) {
                        _this.props.onUpdateFilters(_this.state.selectedAuthority, trackId_1);
                    }
                });
            }
        };
        _this.onClearFilters = function () {
            _this.setState({
                selectedAuthority: '',
                selectedTrackId: '',
                tracks: []
            }, function () {
                _this.loadMeetings();
                // Call the callback to persist the cleared selection
                if (_this.props.onUpdateFilters) {
                    _this.props.onUpdateFilters('', '');
                }
            });
        };
        _this.onMeetingClick = function (meeting) {
            _this.setState({
                selectedMeeting: meeting,
                isPanelOpen: true
            });
        };
        _this.onPanelDismiss = function () {
            _this.setState({
                selectedMeeting: null,
                isPanelOpen: false
            });
        };
        _this.state = {
            meetings: [],
            loading: false,
            error: null,
            currentView: props.defaultView || 'month',
            currentDate: new Date(),
            selectedAuthority: props.selectedAuthority || '',
            selectedTrackId: props.selectedTrackId || '',
            tracks: [],
            selectedMeeting: null,
            isPanelOpen: false
        };
        _this.raceMeetingService = new RaceMeetingService(props.context);
        return _this;
    }
    RaceMeetings.prototype.componentDidMount = function () {
        this.loadMeetings();
        if (this.state.selectedAuthority) {
            this.loadTracksByAuthority(this.state.selectedAuthority);
        }
    };
    RaceMeetings.prototype.componentDidUpdate = function (prevProps) {
        var _this = this;
        if (prevProps.selectedAuthority !== this.props.selectedAuthority ||
            prevProps.selectedTrackId !== this.props.selectedTrackId) {
            this.setState({
                selectedAuthority: this.props.selectedAuthority || '',
                selectedTrackId: this.props.selectedTrackId || ''
            }, function () {
                _this.loadMeetings();
                if (_this.props.selectedAuthority) {
                    _this.loadTracksByAuthority(_this.props.selectedAuthority);
                }
            });
        }
    };
    RaceMeetings.prototype.loadMeetings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, startDate, endDate, meetings, now_1, filteredMeetings, error_1, errorMessage;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.setState({ loading: true, error: null });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        _a = this.getDateRange(), startDate = _a.startDate, endDate = _a.endDate;
                        console.log('Loading meetings for date range:', {
                            startDate: startDate.toISOString(),
                            endDate: endDate.toISOString(),
                            view: this.state.currentView,
                            authority: this.state.selectedAuthority,
                            track: this.state.selectedTrackId
                        });
                        return [4 /*yield*/, this.raceMeetingService.getRaceMeetingsByDateRange(startDate, endDate, this.state.selectedAuthority ? [this.state.selectedAuthority] : undefined, this.state.selectedTrackId ? [this.state.selectedTrackId] : undefined)];
                    case 2:
                        meetings = _b.sent();
                        console.log("Loaded ".concat(meetings.length, " meetings:"), meetings);
                        now_1 = new Date();
                        now_1.setHours(0, 0, 0, 0);
                        filteredMeetings = meetings.filter(function (meeting) {
                            var meetingDate = new Date(meeting.cr4cc_race_date);
                            meetingDate.setHours(0, 0, 0, 0);
                            if (meetingDate < now_1 && !_this.props.showPastMeetings) {
                                return false;
                            }
                            if (meetingDate >= now_1 && !_this.props.showFutureMeetings) {
                                return false;
                            }
                            return true;
                        });
                        console.log("Filtered to ".concat(filteredMeetings.length, " meetings after applying past/future filters"));
                        this.setState({
                            meetings: filteredMeetings,
                            loading: false
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        console.error('Error loading meetings:', error_1);
                        errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                        this.setState({
                            error: "Failed to load race meetings: ".concat(errorMessage),
                            loading: false
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RaceMeetings.prototype.loadTracksByAuthority = function (authority) {
        return __awaiter(this, void 0, void 0, function () {
            var tracks, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Loading tracks for authority: ".concat(authority));
                        return [4 /*yield*/, this.raceMeetingService.getTracksByAuthority(authority)];
                    case 1:
                        tracks = _a.sent();
                        console.log("Loaded ".concat(tracks.length, " tracks:"), tracks);
                        this.setState({ tracks: tracks });
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error loading tracks:', error_2);
                        this.setState({ tracks: [] });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RaceMeetings.prototype.loadTracksByAuthorities = function (authorities) {
        return __awaiter(this, void 0, void 0, function () {
            var tracks, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Loading tracks for authorities: ".concat(authorities.join(', ')));
                        return [4 /*yield*/, this.raceMeetingService.getTracksByAuthorities(authorities)];
                    case 1:
                        tracks = _a.sent();
                        console.log("Loaded ".concat(tracks.length, " tracks:"), tracks);
                        this.setState({ tracks: tracks });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error loading tracks:', error_3);
                        this.setState({ tracks: [] });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RaceMeetings.prototype.getDateRange = function () {
        var _a = this.state, currentView = _a.currentView, currentDate = _a.currentDate;
        var startDate = new Date(currentDate.getTime());
        var endDate = new Date(currentDate.getTime());
        switch (currentView) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                var dayOfWeek = startDate.getDay();
                var diff = startDate.getDate() - dayOfWeek;
                startDate.setDate(diff);
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setMonth(endDate.getMonth() + 1);
                endDate.setDate(0);
                endDate.setHours(23, 59, 59, 999);
                break;
        }
        return { startDate: startDate, endDate: endDate };
    };
    RaceMeetings.prototype.getAuthorityColor = function (authority) {
        for (var _i = 0, AUTHORITIES_1 = AUTHORITIES; _i < AUTHORITIES_1.length; _i++) {
            var auth = AUTHORITIES_1[_i];
            if (auth.code === authority) {
                return auth.color;
            }
        }
        return '#666666';
    };
    RaceMeetings.prototype.renderCalendarHeader = function () {
        var _this = this;
        var _a = this.state, currentView = _a.currentView, currentDate = _a.currentDate;
        var viewOptions = [
            { key: 'day', text: 'Day' },
            { key: 'week', text: 'Week' },
            { key: 'month', text: 'Month' }
        ];
        var authorityOptions = AUTHORITIES.map(function (auth) { return ({
            key: auth.code,
            text: auth.name
        }); });
        var trackOptions = this.state.tracks.map(function (track) { return ({
            key: track.trackId,
            text: track.trackName
        }); });
        var dateFormat = currentView === 'month'
            ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : currentView === 'week'
                ? "Week of ".concat(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
                : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        return (React.createElement("div", { className: styles.calendarHeader },
            React.createElement(Stack, { horizontal: true, verticalAlign: "center", tokens: { childrenGap: 10 } },
                React.createElement(Stack.Item, null,
                    React.createElement(Stack, { horizontal: true, tokens: { childrenGap: 5 } },
                        React.createElement(IconButton, { iconProps: { iconName: 'ChevronLeft' }, title: "Previous", onClick: function () { return _this.onNavigate('prev'); } }),
                        React.createElement(DefaultButton, { text: "Today", onClick: function () { return _this.onNavigate('today'); } }),
                        React.createElement(IconButton, { iconProps: { iconName: 'ChevronRight' }, title: "Next", onClick: function () { return _this.onNavigate('next'); } }))),
                React.createElement(Stack.Item, { grow: true },
                    React.createElement(Text, { variant: "xLarge", className: styles.dateDisplay }, dateFormat)),
                React.createElement(Stack.Item, null,
                    React.createElement(Dropdown, { options: viewOptions, selectedKey: currentView, onChange: function (e, option) { return option && _this.onViewChange(option.key); }, styles: { root: { width: 100 } } }))),
            React.createElement(Stack, { horizontal: true, tokens: { childrenGap: 10 }, className: styles.filters },
                React.createElement(Stack.Item, { grow: true },
                    React.createElement(Dropdown, { placeholder: "Filter by Authority", options: authorityOptions, selectedKey: this.state.selectedAuthority, onChange: this.onAuthorityChange, styles: {
                            dropdown: { minWidth: 200 },
                            title: { fontSize: 13 }
                        } })),
                React.createElement(Stack.Item, { grow: true },
                    React.createElement(Dropdown, { placeholder: "Filter by Track", options: trackOptions, selectedKey: this.state.selectedTrackId, onChange: this.onTrackChange, disabled: this.state.tracks.length === 0 && !this.state.selectedAuthority, styles: {
                            dropdown: { minWidth: 200 },
                            title: { fontSize: 13 }
                        } })),
                (this.state.selectedAuthority || this.state.selectedTrackId) && (React.createElement(Stack.Item, null,
                    React.createElement(DefaultButton, { text: "Clear Filters", onClick: this.onClearFilters, iconProps: { iconName: 'Clear' } }))))));
    };
    RaceMeetings.prototype.renderDayView = function () {
        var _this = this;
        var dayMeetings = this.state.meetings;
        // If no meetings for the day, show a message
        if (dayMeetings.length === 0) {
            return (React.createElement("div", { className: styles.dayView },
                React.createElement("div", { className: styles.noMeetings }, "No race meetings scheduled for this day")));
        }
        // If we have meetings but no time data, show them in a list
        var hasTimeData = dayMeetings.some(function (meeting) { return meeting.cr4cc_first_race_time; });
        if (!hasTimeData) {
            return (React.createElement("div", { className: styles.dayView },
                React.createElement("div", { className: styles.meetingsList }, dayMeetings.map(function (meeting) { return (React.createElement("div", { key: meeting.cr4cc_racemeetingid, className: styles.meetingCard, style: { borderLeftColor: _this.getAuthorityColor(meeting.cr4cc_authority || '') }, onClick: function () { return _this.onMeetingClick(meeting); } },
                    React.createElement("div", { className: styles.meetingHeader },
                        React.createElement("div", { className: styles.meetingTitle }, meeting.cr4cc_track_name || 'Unknown Track'),
                        React.createElement("div", { className: styles.meetingAuthority }, meeting.cr4cc_authority)),
                    React.createElement("div", { className: styles.meetingDetails }, meeting.cr4cc_race_count ? "".concat(meeting.cr4cc_race_count, " races") : 'Race count not available'),
                    meeting.cr4cc_meeting_type && (React.createElement("div", { className: styles.meetingType }, meeting.cr4cc_meeting_type)))); }))));
        }
        // Original time grid view if we have time data
        var hours = [];
        for (var i = 0; i < 24; i++) {
            hours.push(i);
        }
        return (React.createElement("div", { className: styles.dayView },
            React.createElement("div", { className: styles.timeGrid }, hours.map(function (hour) { return (React.createElement("div", { key: hour, className: styles.hourSlot },
                React.createElement("div", { className: styles.hourLabel },
                    hour < 10 ? '0' + hour : hour,
                    ":00"),
                React.createElement("div", { className: styles.hourContent }, dayMeetings
                    .filter(function (meeting) {
                    if (!meeting.cr4cc_first_race_time)
                        return false;
                    try {
                        var meetingHour = new Date(meeting.cr4cc_first_race_time).getHours();
                        return meetingHour === hour;
                    }
                    catch (_a) {
                        return false;
                    }
                })
                    .map(function (meeting) { return (React.createElement("div", { key: meeting.cr4cc_racemeetingid, className: styles.meeting, style: { backgroundColor: _this.getAuthorityColor(meeting.cr4cc_authority || '') }, onClick: function () { return _this.onMeetingClick(meeting); } },
                    React.createElement("div", { className: styles.meetingTime }, meeting.cr4cc_first_race_time),
                    React.createElement("div", { className: styles.meetingTitle }, meeting.cr4cc_track_name),
                    React.createElement("div", { className: styles.meetingDetails },
                        meeting.cr4cc_race_count,
                        " races"))); })))); }))));
    };
    RaceMeetings.prototype.renderWeekView = function () {
        var _this = this;
        var startDate = this.getDateRange().startDate;
        var weekDays = [];
        for (var i = 0; i < 7; i++) {
            var date = new Date(startDate.getTime());
            date.setDate(startDate.getDate() + i);
            weekDays.push(date);
        }
        return (React.createElement("div", { className: styles.weekView },
            React.createElement("div", { className: styles.weekGrid }, weekDays.map(function (day) {
                var dayMeetings = _this.state.meetings.filter(function (meeting) {
                    var meetingDate = new Date(meeting.cr4cc_race_date);
                    return meetingDate.toDateString() === day.toDateString();
                });
                return (React.createElement("div", { key: day.toISOString(), className: styles.dayColumn },
                    React.createElement("div", { className: styles.dayHeader },
                        React.createElement("div", { className: styles.dayName }, day.toLocaleDateString('en-US', { weekday: 'short' })),
                        React.createElement("div", { className: styles.dayNumber }, day.getDate())),
                    React.createElement("div", { className: styles.dayContent }, dayMeetings.map(function (meeting) { return (React.createElement("div", { key: meeting.cr4cc_racemeetingid, className: styles.meeting, style: { backgroundColor: _this.getAuthorityColor(meeting.cr4cc_authority || '') }, onClick: function () { return _this.onMeetingClick(meeting); } },
                        React.createElement("div", { className: styles.meetingTime }, meeting.cr4cc_first_race_time),
                        React.createElement("div", { className: styles.meetingTitle }, meeting.cr4cc_track_name))); }))));
            }))));
    };
    RaceMeetings.prototype.renderMonthView = function () {
        var _this = this;
        var currentDate = this.state.currentDate;
        var firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        var lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        var startDate = new Date(firstDay.getTime());
        startDate.setDate(startDate.getDate() - startDate.getDay());
        var weeks = [];
        var currentWeek = new Date(startDate.getTime());
        while (currentWeek <= lastDay || currentWeek.getDay() !== 0) {
            var week = [];
            for (var i = 0; i < 7; i++) {
                week.push(new Date(currentWeek.getTime()));
                currentWeek.setDate(currentWeek.getDate() + 1);
            }
            weeks.push(week);
        }
        return (React.createElement("div", { className: styles.monthView },
            React.createElement("div", { className: styles.weekDays }, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (day) { return (React.createElement("div", { key: day, className: styles.weekDay }, day)); })),
            weeks.map(function (week, weekIndex) { return (React.createElement("div", { key: weekIndex, className: styles.week }, week.map(function (day) {
                var dayMeetings = _this.state.meetings.filter(function (meeting) {
                    var meetingDate = new Date(meeting.cr4cc_race_date);
                    return meetingDate.toDateString() === day.toDateString();
                });
                var isCurrentMonth = day.getMonth() === currentDate.getMonth();
                var isToday = day.toDateString() === new Date().toDateString();
                return (React.createElement("div", { key: day.toISOString(), className: "".concat(styles.day, " ").concat(!isCurrentMonth ? styles.otherMonth : '', " ").concat(isToday ? styles.today : '') },
                    React.createElement("div", { className: styles.dayNumber }, day.getDate()),
                    React.createElement("div", { className: styles.meetings }, dayMeetings.map(function (meeting, index) { return (React.createElement("div", { key: meeting.cr4cc_racemeetingid, className: styles.meetingRectangle, style: { backgroundColor: _this.getAuthorityColor(meeting.cr4cc_authority || '') }, onClick: function () { return _this.onMeetingClick(meeting); }, title: "".concat(meeting.cr4cc_track_name, " - ").concat(meeting.cr4cc_first_race_time || 'Time TBD') },
                        React.createElement("span", { className: styles.trackName }, meeting.cr4cc_track_name || 'Unknown Track'))); }))));
            }))); })));
    };
    RaceMeetings.prototype.renderMeetingPanel = function () {
        var _a = this.state, selectedMeeting = _a.selectedMeeting, isPanelOpen = _a.isPanelOpen;
        if (!selectedMeeting)
            return null;
        var authority = null;
        for (var _i = 0, AUTHORITIES_2 = AUTHORITIES; _i < AUTHORITIES_2.length; _i++) {
            var auth = AUTHORITIES_2[_i];
            if (auth.code === selectedMeeting.cr4cc_authority) {
                authority = auth;
                break;
            }
        }
        return (React.createElement(Panel, { isOpen: isPanelOpen, onDismiss: this.onPanelDismiss, type: PanelType.medium, headerText: selectedMeeting.cr4cc_track_name, closeButtonAriaLabel: "Close" },
            React.createElement("div", { className: styles.meetingDetails },
                React.createElement(Stack, { tokens: { childrenGap: 15 } },
                    React.createElement(Stack.Item, null,
                        React.createElement(Text, { variant: "large", block: true }, new Date(selectedMeeting.cr4cc_race_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }))),
                    authority && (React.createElement(Stack.Item, null,
                        React.createElement("div", { className: styles.authorityBadge, style: { backgroundColor: authority.color } }, authority.name))),
                    React.createElement(Stack.Item, null,
                        React.createElement(Text, { variant: "medium", block: true },
                            React.createElement("strong", null, "Meeting Type:"),
                            " ",
                            selectedMeeting.cr4cc_meeting_type || 'Not specified')),
                    React.createElement(Stack.Item, null,
                        React.createElement(Text, { variant: "medium", block: true },
                            React.createElement("strong", null, "Status:"),
                            " ",
                            selectedMeeting.cr4cc_status || 'Scheduled')),
                    React.createElement(Stack.Item, null,
                        React.createElement(Text, { variant: "medium", block: true },
                            React.createElement("strong", null, "Number of Races:"),
                            " ",
                            selectedMeeting.cr4cc_race_count || 'TBD')),
                    React.createElement(Stack.Item, null,
                        React.createElement(Text, { variant: "medium", block: true },
                            React.createElement("strong", null, "First Race:"),
                            " ",
                            selectedMeeting.cr4cc_first_race_time || 'TBD')),
                    React.createElement(Stack.Item, null,
                        React.createElement(Text, { variant: "medium", block: true },
                            React.createElement("strong", null, "Last Race:"),
                            " ",
                            selectedMeeting.cr4cc_last_race_time || 'TBD')),
                    selectedMeeting.cr4cc_notes && (React.createElement(Stack.Item, null,
                        React.createElement(Text, { variant: "medium", block: true },
                            React.createElement("strong", null, "Notes:"),
                            React.createElement("br", null),
                            selectedMeeting.cr4cc_notes)))))));
    };
    RaceMeetings.prototype.render = function () {
        var hasTeamsContext = this.props.hasTeamsContext;
        var _a = this.state, loading = _a.loading, error = _a.error, currentView = _a.currentView;
        return (React.createElement("div", { className: "".concat(styles.raceMeetings, " ").concat(hasTeamsContext ? styles.teams : '') },
            this.renderCalendarHeader(),
            error && (React.createElement(MessageBar, { messageBarType: MessageBarType.error, isMultiline: false }, error)),
            loading ? (React.createElement("div", { className: styles.loading },
                React.createElement(Spinner, { size: SpinnerSize.large, label: "Loading race meetings..." }))) : (React.createElement("div", { className: styles.calendarContent },
                currentView === 'day' && this.renderDayView(),
                currentView === 'week' && this.renderWeekView(),
                currentView === 'month' && this.renderMonthView())),
            React.createElement("div", { className: styles.legend },
                React.createElement(Text, { variant: "medium" }, "Authority Colors:"),
                React.createElement("div", { className: styles.legendItems }, AUTHORITIES.map(function (auth) { return (React.createElement("div", { key: auth.code, className: styles.legendItem },
                    React.createElement("div", { className: styles.legendColor, style: { backgroundColor: auth.color } }),
                    React.createElement("span", null, auth.code))); }))),
            this.renderMeetingPanel()));
    };
    return RaceMeetings;
}(React.Component));
export default RaceMeetings;
//# sourceMappingURL=RaceMeetings.js.map