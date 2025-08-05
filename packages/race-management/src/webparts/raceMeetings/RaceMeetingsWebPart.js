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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { PropertyPaneDropdown, PropertyPaneToggle, PropertyPaneLabel } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'RaceMeetingsWebPartStrings';
import RaceMeetings from './components/RaceMeetings';
import { RaceMeetingService } from '../../services/RaceMeetingService';
import { AUTHORITIES } from '../../models/IRaceMeeting';
var packageSolution = require('../../../config/package-solution.json');
var RaceMeetingsWebPart = /** @class */ (function (_super) {
    __extends(RaceMeetingsWebPart, _super);
    function RaceMeetingsWebPart() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._isDarkTheme = false;
        _this._environmentMessage = '';
        _this.tracks = [];
        return _this;
    }
    RaceMeetingsWebPart.prototype.render = function () {
        var element = React.createElement(RaceMeetings, {
            isDarkTheme: this._isDarkTheme,
            environmentMessage: this._environmentMessage,
            hasTeamsContext: !!this.context.sdks.microsoftTeams,
            userDisplayName: this.context.pageContext.user.displayName,
            context: this.context,
            defaultView: this.properties.defaultView,
            selectedAuthority: this.properties.selectedAuthority,
            selectedTrackId: this.properties.selectedTrackId,
            showPastMeetings: this.properties.showPastMeetings,
            showFutureMeetings: this.properties.showFutureMeetings,
            onUpdateFilters: this.updateFilters.bind(this)
        });
        ReactDom.render(element, this.domElement);
    };
    RaceMeetingsWebPart.prototype.updateFilters = function (authority, trackId) {
        this.properties.selectedAuthority = authority;
        this.properties.selectedTrackId = trackId;
        // Refresh the property pane to show updated values
        this.context.propertyPane.refresh();
        // Re-render to ensure consistency
        this.render();
    };
    RaceMeetingsWebPart.prototype.onInit = function () {
        var _this = this;
        this.raceMeetingService = new RaceMeetingService(this.context);
        return this._getEnvironmentMessage().then(function (message) {
            _this._environmentMessage = message;
            if (_this.properties.selectedAuthority) {
                return _this.loadTracksByAuthority(_this.properties.selectedAuthority);
            }
            return Promise.resolve();
        });
    };
    RaceMeetingsWebPart.prototype.loadTracksByAuthority = function (authority) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = this;
                        return [4 /*yield*/, this.raceMeetingService.getTracksByAuthority(authority)];
                    case 1:
                        _a.tracks = _b.sent();
                        this.context.propertyPane.refresh();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        console.error('Error loading tracks:', error_1);
                        this.tracks = [];
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RaceMeetingsWebPart.prototype.onPropertyPaneFieldChanged = function (propertyPath, oldValue, newValue) {
        var _this = this;
        if (propertyPath === 'selectedAuthority' && oldValue !== newValue) {
            this.properties.selectedTrackId = ''; // Reset track selection
            this.loadTracksByAuthority(newValue).then(function () {
                _this.context.propertyPane.refresh();
            }).catch(function (error) {
                console.error('Error updating tracks:', error);
            });
        }
    };
    RaceMeetingsWebPart.prototype._getEnvironmentMessage = function () {
        var _this = this;
        if (!!this.context.sdks.microsoftTeams) {
            return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
                .then(function (context) {
                var environmentMessage = '';
                switch (context.app.host.name) {
                    case 'Office':
                        environmentMessage = _this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
                        break;
                    case 'Outlook':
                        environmentMessage = _this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
                        break;
                    case 'Teams':
                    case 'TeamsModern':
                        environmentMessage = _this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
                        break;
                    default:
                        environmentMessage = strings.UnknownEnvironment;
                }
                return environmentMessage;
            });
        }
        return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
    };
    RaceMeetingsWebPart.prototype.onThemeChanged = function (currentTheme) {
        if (!currentTheme) {
            return;
        }
        this._isDarkTheme = !!currentTheme.isInverted;
        var semanticColors = currentTheme.semanticColors;
        if (semanticColors) {
            this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
            this.domElement.style.setProperty('--link', semanticColors.link || null);
            this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
        }
    };
    RaceMeetingsWebPart.prototype.onDispose = function () {
        ReactDom.unmountComponentAtNode(this.domElement);
    };
    Object.defineProperty(RaceMeetingsWebPart.prototype, "dataVersion", {
        get: function () {
            return Version.parse('1.0');
        },
        enumerable: false,
        configurable: true
    });
    RaceMeetingsWebPart.prototype.getPropertyPaneConfiguration = function () {
        var authorityOptions = __spreadArray([
            { key: '', text: 'All Authorities' }
        ], AUTHORITIES.map(function (auth) { return ({
            key: auth.code,
            text: auth.name
        }); }), true);
        var trackOptions = __spreadArray([
            { key: '', text: 'All Tracks' }
        ], this.tracks.map(function (track) { return ({
            key: track.trackId,
            text: track.trackName
        }); }), true);
        return {
            pages: [
                {
                    header: {
                        description: strings.PropertyPaneDescription
                    },
                    groups: [
                        {
                            groupName: 'Display Settings',
                            groupFields: [
                                PropertyPaneDropdown('defaultView', {
                                    label: 'Default Calendar View',
                                    options: [
                                        { key: 'day', text: 'Day View' },
                                        { key: 'week', text: 'Week View' },
                                        { key: 'month', text: 'Month View' }
                                    ]
                                }),
                                PropertyPaneToggle('showPastMeetings', {
                                    label: 'Show Past Meetings',
                                    checked: this.properties.showPastMeetings
                                }),
                                PropertyPaneToggle('showFutureMeetings', {
                                    label: 'Show Future Meetings',
                                    checked: this.properties.showFutureMeetings
                                })
                            ]
                        },
                        {
                            groupName: 'Filter Settings',
                            groupFields: [
                                PropertyPaneDropdown('selectedAuthority', {
                                    label: 'Filter by Authority',
                                    options: authorityOptions,
                                    selectedKey: this.properties.selectedAuthority
                                }),
                                PropertyPaneDropdown('selectedTrackId', {
                                    label: 'Filter by Track',
                                    options: trackOptions,
                                    selectedKey: this.properties.selectedTrackId,
                                    disabled: !this.properties.selectedAuthority
                                })
                            ]
                        },
                        {
                            groupName: 'About',
                            groupFields: [
                                PropertyPaneLabel('version', {
                                    text: "Version: ".concat(packageSolution.solution.version)
                                })
                            ]
                        }
                    ]
                }
            ]
        };
    };
    return RaceMeetingsWebPart;
}(BaseClientSideWebPart));
export default RaceMeetingsWebPart;
//# sourceMappingURL=RaceMeetingsWebPart.js.map