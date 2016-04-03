/**
 * @fileOverview CWIC is a jQuery plug-in to access the Cisco Web Communicator.<br>
 * Audio and Video media require the Cisco Web Communicator add-on to be installed.<br>
 * @version 11.0.1.102, Unified Communications System Release 11.0 MR1
 */

/*
    CWIC is a jQuery plug-in to access the Cisco Web Communicator

    CWIC uses jQuery features such as:<ul>
    <li>'cwic' namespacing: jQuery.cwic();</li>
    <li>custom events (.cwic namespace): conversationStart.cwic</li>
    <li>attach data with the 'cwic' key: ui.data('cwic', conversation)</li>
    </ul>

    Audio and Video media require the Cisco Web Communicator add-on to be installed

*/
/**
 * Global window namespace
 * @name window
 * @namespace
 */

(function ($) {
    'use strict';
/** @scope $.fn.cwic */

    // a global reference to the CWC native plugin API
    var _plugin = null;

    // client id to differentiate between cwic instances in separate tabs (generated only once per cwic instance)
    var clientId;

    // we have to keep the reference to one of the video objects for active conversation.
    // This is neccessary for calling "removeWindowFromCall" after conversation is ended.
    var activeConversation = {
        videoObject: null, // first video object added to conversation
        window: null,
        lastId: -1 // see addWindowToCall() for explanation
    };
    
    var emailForManualSignIn = 'jabbersdk@any.domain';
    
    // 21px width - this works for surface pro device on Chrome 44
    // see http://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes
    // for chrome it can be calculated with:  window.inner - document.documentElement.clientWidth
    var scrollBarWidth = 21; 
    
        // jsdoc does not seem to like enumerating properties (fields) of objects it already considers as properties (fields).
    /** cwic error object
    * @name $.fn.cwic-errorMapEntry
    * @namespace
    * @property {String} code a unique error identifier
    * @property {String} message the message associated with the error
    * @property {Any} [propertyName] Additional properties that will be passed back when an error is raised.
    */
    
    /**
    * The error map used to build errors triggered by cwic. <br>
    * Keys are error codes (strings), values objects associated to codes. <br>
    * By default the error object contains a single 'message' property. <br>
    * The error map can be customized via the init function. <br>
    * @namespace
    */
    var errorMap = {

        /** Unknown: unknown error or exception
         * @type $.fn.cwic-errorMapEntry
         */
        Unknown: {
            code: 'Unknown',
            message: 'Unknown error'
        },

        /** PluginNotAvailable: plugin not available (not installed, not enabled or unable to load)
         * @type $.fn.cwic-errorMapEntry
         */
        PluginNotAvailable: {
            code: 'PluginNotAvailable',
            message: 'Plugin not available'
        },

        /** BrowserNotSupported: browser not supported
         * @type $.fn.cwic-errorMapEntry
         */
        BrowserNotSupported: {
            code: 'BrowserNotSupported',
            message: 'Browser not supported'
        },

        /** InvalidArguments: invalid arguments
         * @type $.fn.cwic-errorMapEntry
         */
        InvalidArguments: {
            code: 'InvalidArguments',
            message: 'Invalid arguments'
        },

        /** InvalidState: invalid state for operation (e.g. startconversation when phone is not registered)
         * @type $.fn.cwic-errorMapEntry
         */
        InvalidState: {
            code: 'InvalidState',
            message: 'Invalid State'
        },

        /** NativePluginError: plugin returned an error
         * @type $.fn.cwic-errorMapEntry
         */
        NativePluginError: {
            code: 'NativePluginError',
            message: 'Native plugin error'
        },

        /** OperationNotSupported: operation not supported
         * @type $.fn.cwic-errorMapEntry
         */
        OperationNotSupported: {
            code: 'OperationNotSupported',
            message: 'Operation not supported'
        },

        /** InvalidTFTPServer: The configured TFTP server is incorrect
         * @type $.fn.cwic-errorMapEntry
         */
        InvalidTFTPServer: {
            code: 'InvalidTFTPServer',
            message: 'The configured TFTP server is incorrect'
        },
        /** InvalidCCMCIPServer: The configured CCMCIP server is incorrect
         * @type $.fn.cwic-errorMapEntry
         */
        InvalidCCMCIPServer: {
            code: 'InvalidCCMCIPServer',
            message: 'The configured CCMCIP server is incorrect'
        },
        /** InvalidCTIServer: The configured CTI server is incorrect
         * @type $.fn.cwic-errorMapEntry
         */
        InvalidCTIServer: {
            code: 'InvalidCTIServer',
            message: 'The configured CTI server is incorrect'
        },
        /** ReleaseMismatch: release mismatch
         * @type $.fn.cwic-errorMapEntry
         */
        ReleaseMismatch: {
            code: 'ReleaseMismatch',
            message: 'Release mismatch'
        },

        /** NoDevicesFound: no devices found for supplied credentials
         * @type $.fn.cwic-errorMapEntry
         */
        NoDevicesFound: {
            code: 'NoDevicesFound',
            message: 'No devices found'
        },

        /** TooManyPluginInstances: already logged in in another process (browser or window in internet explorer)
         * @type $.fn.cwic-errorMapEntry
         */
        TooManyPluginInstances: {
            code: 'TooManyPluginInstances',
            message: 'Too many plug-in instances'
        },

        /** AuthenticationFailure: authentication failed - invalid or missing credentials/token or incorrect server parameters
         * @type $.fn.cwic-errorMapEntry
         */
        AuthenticationFailure: {
            code: 'AuthenticationFailure',
            message: 'Authentication failed'
        },

        /** SignInError: other sign-in error
         * @type $.fn.cwic-errorMapEntry
         */
        SignInError: {
            code: 'SignInError',
            message: 'Sign-in Error'
        },

        /** CallControlError: error performing call control operation
         * @type $.fn.cwic-errorMapEntry
         */
        CallControlError: {
            code: 'CallControlError',
            message: 'Call control error'
        },

        /** PhoneConfigGenError: other phone configuration error
         * @type $.fn.cwic-errorMapEntry
         */
        PhoneConfigGenError: {
            code: 'PhoneConfigGenError',
            message: 'Phone configuration error'
        },

        /** CreateCallError: error creating a new call. Possible causes:<br>
         * - the device is not available anymore<br>
         * - the maximum number of active calls configured on the user's line was reached<br>
         * @type $.fn.cwic-errorMapEntry
         */
        CreateCallError: {
            code: 'CreateCallError',
            message: 'Cannot create call'
        },

        /** NetworkError: No network connection or SSL/TLS connection error
         * @type $.fn.cwic-errorMapEntry
         */
        NetworkError: {
            code: 'NetworkError',
            message: 'Network error'
        },

        /** VideoWindowError: error modifying video association (e.g. removing non-attached window or adding non-existing window)
         * @type $.fn.cwic-errorMapEntry
         */
        VideoWindowError: {
            code: 'VideoWindowError',
            message: 'Video window error'
        },

        /** CapabilityMissing: Capability missing (e.g. no capability to merge call to conference or to transfer a call)
         * @type $.fn.cwic-errorMapEntry
         */
        CapabilityMissing: {
            code: 'CapabilityMissing',
            message: 'Capability Missing'
        },

        /** NotUserAuthorized: user did not authorize the add-on to run
         * @type $.fn.cwic-errorMapEntry
         */
        NotUserAuthorized: {
            code: 'NotUserAuthorized',
            message: 'User did not authorize access'
        },

        /** OperationFailed: System not started or fully operational
         * @type $.fn.cwic-errorMapEntry
         */
        OperationFailed: {
            code: 'OperationFailed',
            message: 'Operation Failed'
        },

        /** ExtensionNotAvailable: browser extension not available (not installed, not enabled or unable to load)
         * @type $.fn.cwic-errorMapEntry
         */
        ExtensionNotAvailable: {
            code: 'ExtensionNotAvailable',
            message: 'Browser extension not available'
        },

        /** DockingCapabilitiesNotAvailable: External video docking capabilities not available
         * @type $.fn.cwic-errorMapEntry
         */
        DockingCapabilitiesNotAvailable: {
            code: 'DockingCapabilitiesNotAvailable',
            message: 'External video docking capabilities not available'
        },

        /** DockArgumentNotHTMLElement: Dock needs to be called on an HTMLElement
         * @type $.fn.cwic-errorMapEntry
         */
        DockArgumentNotHTMLElement: {
            code: 'DockArgumentNotHTMLElement',
            message: 'Dock needs to be called on an HTMLElement'
        },

        /** ServiceDiscoveryMissingOrInvalidCallback: Service discovery lifecycle error (no callback defined or exception occured within callback for some of lifecycle states)
         * @type $.fn.cwic-errorMapEntry
         */
        ServiceDiscoveryMissingOrInvalidCallback: {
            code: 'ServiceDiscoveryMissingOrInvalidCallback',
            message: 'Service Discovery Error - Callback not implemented or exception occured'
        },

        /** SSOMissingOrInvalidRedirectURI: Single Sign On redirect uri is missing or invalid (OAuth2)
         * @type $.fn.cwic-errorMapEntry
         */
        SSOMissingOrInvalidRedirectURI: {
            code: 'SSOMissingOrInvalidRedirectURI',
            message: 'Redirect URI missing or invalid'
        },

        /** InvalidUserInput: User input invalid (email, password, redirectUri, etc.)
         * @type $.fn.cwic-errorMapEntry
         */
        InvalidUserInput: {
            code: 'InvalidUserInput',
            message: 'Invalid user input'
        },

        /** CertificateError: Cannot start a new session due to a certificate problem.
         * @type $.fn.cwic-errorMapEntry
         */
        CertificateError: {
            code: 'CertificateError',
            message: 'Certificate error'
        },

        /** InvalidURLFragment: Invalid SSO URL fragment received from child window (popup or iFrame)
         * @type $.fn.cwic-errorMapEntry
         */
        InvalidURLFragment: {
            code: 'InvalidURLFragment',
            message: 'Invalid URL fragment received'
        },

        /** ErrorReadingConfig: Attempt to load startup handler config failed. Check if StartupHandlerConfig.xml file is present in installation directory.
         * @type $.fn.cwic-errorMapEntry
         */
        ErrorReadingConfig: {
            code: 'ErrorReadingConfig',
            message: 'Error reading config'
        },

        /** UnexpectedLifecycleState: Unexpected application lifecycle state.
         * @type $.fn.cwic-errorMapEntry
         */
        UnexpectedLifecycleState: {
            code: 'UnexpectedLifecycleState',
            message: 'Unexpected application lifecycle state'
        },

        /** SSOStartSessionError: SSO start session error, probably because of missing token.
         * @type $.fn.cwic-errorMapEntry
         */
        SSOStartSessionError: {
            code: 'SSOStartSessionError',
            message: 'SSO start session error'
        },

        /** SSOCanceled: SSO canceled.
         * @type $.fn.cwic-errorMapEntry
         */
        SSOCanceled: {
            code: 'SSOCanceled',
            message: 'SSO canceled'
        },

        /** SSOInvalidUserSwitch: You have attempted to sign in as a different user. To switch user you must call resetData API.
         * @type $.fn.cwic-errorMapEntry
         */
        SSOInvalidUserSwitch: {
            code: 'SSOInvalidUserSwitch',
            message: 'Invalid user switch'
        },

        /** SSOSessionExpired: SSO session has expired.
         * @type $.fn.cwic-errorMapEntry
         */
        SSOSessionExpired: {
            code: 'SSOSessionExpired',
            message: 'SSO session expired'
        },

        /** ServiceDiscoveryFailure: Cannot find services automatically. Try to set up server addresses manually.
         * @type $.fn.cwic-errorMapEntry
         */
        ServiceDiscoveryFailure: {
            code: 'ServiceDiscoveryFailure',
            message: 'Cannot find services automatically'
        },

        /** CannotConnectToServer: Cannot communicate with the server.
         * @type $.fn.cwic-errorMapEntry
         */
        CannotConnectToServer: {
            code: 'CannotConnectToServer',
            message: 'Cannot connect to CUCM server'
        },

        /** SelectDeviceFailure: Connecting to phone device failed.
         * @type $.fn.cwic-errorMapEntry
         */
        SelectDeviceFailure: {
            code: 'SelectDeviceFailure',
            message: 'Connecting to phone device failed'
        },

        /** NoError: no error (success)
         * @type $.fn.cwic-errorMapEntry
         */
        NoError: {
            code: 'NoError',
            message: 'No error'
        }
    };

    var errorMapAlias = {
        //origin in plugin - ApiReturnCodeEnum
        eCreateCallFailed: 'CreateCallError',
        eCallOperationFailed: 'CallControlError',
        eNoActiveDevice: 'PhoneConfigGenError',
        eLoggedInLock: 'TooManyPluginInstances',
        eLogoutFailed: 'SignInError',
        eNoWindowExists: 'VideoWindowError',
        eInvalidWindowIdOrObject: 'VideoWindowError', // for addPreviewWindow and removePreviewWindow (CSCuo00772 and CSCuo00654)
        eWindowAlreadyExists: 'VideoWindowError',
        eNoPhoneMode: 'InvalidArgument',
        eInvalidArgument: 'InvalidArguments',
        eOperationNotSupported: 'OperationNotSupported',
        eCapabilityMissing: 'CapabilityMissing',
        eNotUserAuthorized: 'NotUserAuthorized',
        eSyntaxError: 'NativePluginError',
        eOperationFailed: 'OperationFailed',
        eInvalidCallId: 'InvalidArguments',
        eInvalidState: 'InvalidState',
        eNoError: 'NoError',
        eUnknownServiceEvent: 'Unknown', // default for service events

        Ok: 'NoError',

        // Telephony service event codes
        Unknown: 'Unknown',
        DeviceRegNoDevicesFound: 'NoDevicesFound',
        NoCredentialsConfiguredServerHealth: 'AuthenticationFailure',
        InvalidCredential: 'AuthenticationFailure',
        InvalidCredentialServerHealth: 'AuthenticationFailure',
        InvalidCCMCIPServer: 'InvalidCCMCIPServer',
        InvalidTFTPServer: 'InvalidTFTPServer',
        InvalidCTIServer: 'InvalidCTIServer',
        NoNetwork: 'NetworkError',
        TLSFailure: 'NetworkError',
        SSLConnectError: 'NetworkError',
        ServerConnectionFailure: 'CannotConnectToServer',
        ServerAuthenticationFailure: 'AuthenticationFailure',
        SelectDeviceFailure: 'SelectDeviceFailure',
        InValidConfig: 'AuthenticationFailure', //The last attempt at authentication with CUCM failed because of invalid configuration. The CCMIP server, port etc was incorrect.
        ServerCertificateRejected: 'CertificateError',
        InvalidToken: 'AuthenticationFailure',
        InvalidAuthorisationTokenServerHealth: 'AuthenticationFailure',

        // System service event codes
        ErrorReadingConfig: 'ErrorReadingConfig',
        InvalidStartupHandlerState: 'UnexpectedLifecycleState',
        InvalidLifeCycleState: 'UnexpectedLifecycleState', // The Lifecycle was requested to Start or Stop while in an invalid state.
        InvalidCertRejected: 'CertificateError',
        SSOPageLoadError: 'UnexpectedLifecycleState', // wrong input provided to "OnNavigationCompleted"
        SSOStartSessionError: 'SSOStartSessionError',
        SSOUnknownError: 'UnexpectedLifecycleState', // wrong input provided to "OnNavigationCompleted"
        SSOCancelled: 'SSOCancelled',
        SSOCertificateError: 'CertificateError',
        SSOInvalidUserSwitch: 'SSOInvalidUserSwitch',
        SSOWhoAmIFailure: 'SSOStartSessionError',
        SSOSessionExpired: 'SSOSessionExpired',
        ServiceDiscoveryFailure: 'ServiceDiscoveryFailure', // Cannot find your services automatically. Click advanced settings to set up manually.
        ServiceDiscoveryAuthenticationFailure: 'AuthenticationFailure',
        ServiceDiscoveryCannotConnectToCucmServer: 'CannotConnectToServer',
        ServiceDiscoveryNoCucmConfiguration: 'ServiceDiscoveryFailure',
        ServiceDiscoveryNoSRVRecordsFound: 'ServiceDiscoveryFailure',
        ServiceDiscoveryCannotConnectToEdge: 'CannotConnectToServer',
        ServiceDiscoveryNoNetworkConnectivity: 'NetworkError',
        ServiceDiscoveryUntrustedCertificate: 'CertificateError'

        // Connection failure codes
        // if something breaks connection during the session
        // a lot of connection failure codes have the same name as above codes, so it's not repeated here.
    };

    var getError = function (key, backupkey) {
        var errorMapKey = 'Unknown';
        if (errorMapAlias[key]) {
            errorMapKey = errorMapAlias[key];
        } else if (errorMap[key]) {
            errorMapKey = key;
        } else if (backupkey && errorMapAlias[backupkey]) {
            errorMapKey = errorMapAlias[backupkey];
        } else if (backupkey && errorMap[backupkey]) {
            errorMapKey = backupkey;
        }
        return errorMap[errorMapKey];
    };

    /** cwic global settings, they can be overridden by passing options to init
    * @namespace
    */
    var settings = {
        /** The handler to be called when the API is ready and authorized.<br>
        * The values in the defaults parameter can be used when invoking registerPhone.<br>
        * The API is ready when:<ul>
        *      <li>The document (DOM) is ready.</li>
        *      <li>The Cisco Web Communicator add-on was found and could be loaded.</li>
        *      <li>User authorization status is "UserAuthorized" (since 3.0.1).</li></ul>
        * @type Function=null
        * @param {Object} defaults An object containing default values retrieved from URL query parameters user and/or cucm <i>e.g: http://myserver/phone?user=foo&cucm=1.2.3.4 </i><br>
        * @param {Boolean} registered Phone registration status - true if the phone is already registered (can be used when using SDK in multiple browser tabs), false otherwise
        * @param {String} mode The phone's current call control mode - "SoftPhone" or "DeskPhone"
        */
        ready: null,
        /** Device prefix to use for default softphone device prediction algorithm. If not set, default prefix is 'ecp'. See also {@link $.fn.cwic-settings.predictDevice}.
        * @type String='ecp'
        */
        devicePrefix: 'ecp',
        /** Callback function to predict softphone device name<br>
        * Device prediction algorithm is used to predict softphone device name in switchPhoneMode API function. If device name is not provided in the form of non-empty string, predictDevice function is used to predict device name. If custom predictDevice is not provided, default implementation is to concatenate settings.devicePrefix + options.username, where options.username is the name of the currently logged-in user.
        * @name $.fn.cwic-settings.predictDevice
        * @type Function=null
        * @function
        * @param {Object} options
        * @param {String} options.username
        */
        /** A flag to indicate to cwic that it should log more messages.
        * @type Boolean=false
        */
        verbose: true,
        /** Handler to be called when cwic needs to log information.<br>
        * Default is to use console.log if available, otherwise do nothing.
        * @function
        * @param {String} msg the message
        * @param {Object} [context] the context of the message
        * @type Function
        */
        log: function (msg, context) {
            if (typeof console !== 'undefined' && console.log) {
                console.log(msg);
                if (context) {
                    console.log(context);
                }
            }
        },
        /** The handler to be called if the API could not be initialized.<br>
        * The basic properties of the error object are listed, however more may be added based on the context of the error.<br>
        * If the triggered error originated from a caught exception, the original error properties are included in the error parameter.<br>
        * An error with code 1 (PluginNotAvailable) can have an extra 'pluginDisabled' property set to true.<br>
        * @type Function
        * @param {Object} error see {@link $.fn.cwic-errorMap}
        * @param {String} [error.message] message associated with the error.
        * @param {Number} error.code code associated with the error
        */
        error: function (error) {
            _log('Error: ', error);
        },
        /**
        * Allows the application to extend the default error map.<br>
        * This parameter is a map of error id to {@link $.fn.cwic-errorMapEntry}
        * It may also be a map of error id to String
        * By default error messages (String) are associated to error codes (map keys, Numbers).<br>
        * The application can define new error codes, or associate a different message/object to a pre-defined error code. <br>
        *   Default error map: {@link $.fn.cwic-errorMap}<br>
        * @name $.fn.cwic-settings.errorMap
        * @type $.fn.cwic-errorMapEntry{}
        */
        errorMap: {},
        /**
        * A callback used to indicate that CWIC must show the user authorization dialog before the application can use
        * the CWIC API.  Can be used to display instructions to the user, etc. before the user authorization dialog is
        * displayed to the user.  If implemented, the application must call the {@link $.fn.cwic-showUserAuthorization} API to show the
        * user authorization dialog and obtain authorization from the user before using the CWIC API.
        * If null, the user authorization dialog will be displayed when the application calls CWIC 'init', unless
        * the domain has been previously authorized through the authorization dialog by the user selecting the "Always
        * Allow" button, or the applications domain has been allowed by administrative whitelist.
        * @since 3.0.1
        * @type Function=null
        * @function
        */
        delayedUserAuth: null,
        /** 
        * A flag to indicate if service discovery based sign in is active. 
        * If discovery lifecycle callbacks are not implemented, set this value to false.  
        * @type Boolean=true
        */
        serviceDiscovery: true,
        /**
        * OAuth2 redirect_uri parameter. An URL to which an OAuth token is sent. Required for SSO sign in scenario.
        */
        redirectUri: '',
        /**
         * Discovery lifecycle callback for "User Profile Required" lifecycle event. Only happens on first use.
         * After first use, plugin caches user email address/domain and callback won't be triggered again.
         * Call resetData API to change email address. 
         * @param {Function} setEmail          Callback to call to continue with sign-in.
         * @param {string}   cachedEmail       Cached previous value of email which could be used to populate input field on UI.
         */
        emailRequired: function (setEmail, cachedEmail) {
            _log(false, 'emailRequired callback not implemented, cannot proceed with sign in');
            throw {
                name: errorMap.ServiceDiscoveryMissingOrInvalidCallback.message,
                message: "emailRequired not implemented",
                toString: function () {
                    return this.name + ": " + this.message;
                }
            };
        },
        /**
         * Discovery lifecycle callback for "Credentials Required" lifecycle event.
         * @param {Function} setCredentials    Callback to call to set credentials and to continue with sign-in.
         * @param {string}   cachedUser        Cached username value which could be used to populate input field on UI.
        */
        credentialsRequired: function (setCredentials, cachedUser) {
            _log(false, 'credentialsRequired callback not implemented, cannot proceed with sign in');
            throw {
                name: errorMap.ServiceDiscoveryMissingOrInvalidCallback.message,
                message: "credentialsRequired not implemented",
                toString: function () {
                    return this.name + ": " + this.message;
                }
            };
        },
        /**
         * Discovery lifecycle callback for "SSO Signed In" lifecycle state. Only happens when the app has successfully been authenticated. 
         * This does not mean that phone is ready to use, telephony device connection flow is initiated afterwards. Implementation of signedIn callback is optional.
         */
        signedIn: function () {
            _log(false, 'default signedIn callback called...');
        }
    };

    var defaultSettings = $.extend({}, settings);

    function resetInitSettings() {
        settings = defaultSettings;
    }
    
    // --------------------------------------------------------
    // Helper tools - BEGIN
    // --------------------------------------------------------

    /**
     * Helper function. Wraps a function of arity n into another anonymous function of arity 0. Used for passing a function with bound(pre-set) arguments as properties on event objects.
     * @param   {Function} f function to wrap
     * @param   {Any} arg f's argument
     * @private                  
     */
    function wrap(f) {
        var fn = f,
            args = [].slice.call(arguments, 1);
        return function () {
            return fn.apply(this, args);
        };
    }
    
    function debounce(fn, t) {
        // IE8 has a bug. When createWindow API adds NPAPI object tag, setTimeout function doesn't work any more!
        // So, when IE8 is detected, fallback to no debouncing.
        // jQuery 1.9 removed support for $.browser!
        if (!$.browser) {
            _log(false, '*******************************************************************************************************');
            _log(false, '*******************************************************************************************************');
            _log(false, "Jabber Web SDK with this version of jQuery won't work on IE8! (for IE8 support, use jQuery < 1.9)");
            _log(false, '*******************************************************************************************************');
            _log(false, '*******************************************************************************************************');
        } else if ($.browser.msie && $.browser.version === '8.0') {
            return fn;
        }
        
        var timeout = null;
        
        return function () {
            var args = arguments,
                self = this;
            
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(function () {
                timeout = null;
                fn.apply(self, args);
            }, t);
        };
    }
    
    /**
     * Function decorator which negates the result of passed function 
     * @param   {Function} fn function to decorate
     * @returns {Function} negated passed-in function
     * @private                    
     */
    function not(fn) {
        return function () {
            return !fn.apply(this, [].slice.call(arguments));
        };
    }
    
    /**
     * Check if some value is an object. Needed because of JS quirk "typeof null" returns "object"
     * @param   {Any} o value to check
     * @returns {Boolean} result of check
     * @private                   
     */
    function isObject(o) {
        return typeof o === 'object' && o !== null;
    }
    
    var isNotObject = not(isObject);
    
    function isNumeric(obj) {
		return !$.isArray(obj) && (obj - parseFloat(obj) + 1) >= 0;
	}
    
    function isMac() {
        return navigator.platform && navigator.platform.indexOf('Mac') !== -1;
    }
    
    /**
     * send string to plugin for encryption
     * @param {String} str
     * @param {Function} cb(error, result)  callback to be called with result/error
     * @private                      
     */
    function encrypt(str, cb) {
        function encryptCb(res) {
            if (res) {
                cb(null, res);
            } else {
                cb('Empty response from plugin');
            }
        }

        if (str && typeof str === 'string') {
            _sendClientRequest('encryptCucmPassword', str, encryptCb);
        } else {
            cb('Invalid input string');
        }
    }

    var validators = (function () {
        var validatorsMap;

        function validateEmail(email) {
            // FUTURE
            return true;
        }
        function validateSSOUrl(url) {
            // FUTURE
            return true;
        }

        function validateUrl(url) {
            // FUTURE
            return true;
        }

        function validateUsername(username) {
            // FUTURE (how to validate encrypted string!?)

            return true;
        }

        function validatePassphrase(passphrase) {
            return true;
        }

        function validateCredentials(usr, pass) {
            return true;
        }
        
        function validateSSOToken(urlFragmentWithToken) {
            // FUTURE
            return true;
        }
        
        validatorsMap = {
            email: {
                validate: validateEmail,
                isValid: validateEmail,
                isNotValid: not(validateEmail)
            },
            ssourl: {
                validate: validateSSOUrl,
                isValid: validateSSOUrl,
                isNotValid: not(validateSSOUrl)
            },
            credentials: {
                validate: validateCredentials,
                isValid: validateCredentials,
                isNotValid: not(validateCredentials)
            },
            url: {
                validate: validateUrl,
                isValid: validateUrl,
                isNotValid: not(validateUrl)
            },
            passphrase: {
                validate: validatePassphrase,
                isValid: validatePassphrase,
                isNotValid: not(validatePassphrase)
            },
            username: {
                validate: validateUsername,
                isValid: validateUsername,
                isNotValid: not(validateUsername)
            },
            ssotoken: {
                validate: validateSSOToken,
                isValid: validateSSOToken,
                isNotValid: not(validateSSOToken)
            }
        };

        return {
            get: function getValidator(validatorName) {
                var validator;

                if (typeof validatorName !== 'string') {
                    throw new TypeError(validator + ' is not a string');
                }

                validator = validatorsMap[$.trim(validatorName)];

                if (validator) {
                    return validator;
                } else {
                    throw new Error(validatorName + ' is not defined');
                }

            }
        };
    }());
    
    // --------------------------------------------------------
    // Helper tools - END
    // --------------------------------------------------------

    var isMultimediaStarted = false;
    var pendingConnect = null;

    var lastConversationMap = {};

    /**
    * Registration object with properties of the currently logged in session <br>
    * expanded below in _getRegistrationObject() and authenticateCcmcip() <br>
    * @type Object
    * @private
    */

    var registration,
        regGlobals = {},
        transferCallGlobals = {
            endTransfer: function () {
                this.inProgress = false;
                this.completeBtn = null;
                this.callId = null;
            }
        },
        SSOGlobals;

    function resetGlobals() {
        _log(true, 'resetGlobals: reseting ...');
        var user = regGlobals.user || '',
            email = regGlobals.email || '',
            manual = regGlobals.manual,
            unregisterCb = regGlobals.unregisterCb || null, // cannot overwrite because it waits for 'SIGNEDOUT' state to occur!
            errorState = regGlobals.errorState || '', // after error, logout is called. We must save this values for the next sign in attempt 
            lastAuthenticatorId = regGlobals.lastAuthenticatorId || null,
            lastAuthStatus = regGlobals.lastAuthStatus || '';
        
        SSOGlobals = {
            inProgress: false,
            canCancel: false
            //popup: null, [postponed]
            //popupParams: {}, [postponed]
        };
        
        transferCallGlobals.endTransfer();
        
        regGlobals = {
            registeringPhone: false,
            manual: manual,
            signingOut: false,
            endingCallForId: -1,
            switchingMode: false,
            telephonyDevicesSet: false,
            lastConnectedDevice: '',
            lastAuthStatus: lastAuthStatus,
            errorState: errorState,
            lastAuthenticatorId: lastAuthenticatorId,
            successCb: null,
            errorCb: null,
            CUCM: [],
            user: user,
            password: '',
            email: email,
            unregisterCb: unregisterCb,
            authenticatedCallback: null,
            credentialsRequiredCalled: false,
            emailRequiredCalled: false
        };
        
        registration = {
            devices: {} // map of available devices (key is device name)
        };
    }
    
    resetGlobals();
    
    //******************************************
    // SSO related work
    //******************************************
    /**
     * Initiates service discovery based sign-in. Before using this API, following callbacks must be defined in init API:
     * <ul>
     * <li>emailRequired</li>
     * <li>credentialsRequired</li>
     * <li>signedIn</li>
     * </ul>
     * After successfull service discovery either SSO or credentials based authentication occurs depending on UCM configuration.
     * @param {Object} args A map with:
     * @param {String} [args.mode]  Register the phone in this mode. Available modes are "SoftPhone" or "DeskPhone". Default of intelligent guess is applied after a device is selected.<br>
     * @param {Function} [args.devicesAvailable(devices, phoneMode, selectDeviceCb)] Callback called after successful authentication. Might be called multiple times.
     * If this callback is not specified, cwic applies the default device selection algorithm.  An array of {@link device} objects is passed so the application can select the device.<br>
     * To complete the device registration, call the selectDeviceCb(phoneMode, deviceName, lineDN) function that is passed in to devicesAvailable as the third parameter. 
     * lineDN argument is optional and it is valid only in deskphone mode. It is ignored in softphone mode. 
     * @param {Boolean} [args.forceRegistration] Specifies whether to forcibly unregister other softphone instances with CUCM. Default is false. See GracefulRegistration doc for more info.
     * @param {Function} [args.success(registration)] Callback called when registration succeeds. A {@link registration} object is passed to the callback
     * @param {Function} [args.error(errorMapEntry)] Callback called if the registration fails. 
     */
    function startDiscovery(args) {
        var $this = this;
        
        if (!args) {
            _log(true, 'startDiscovery: empty arguments received');
            args = {};
        }
        
        _log(true, 'startDiscovery called with arguments: ', args);
        
        setRegGlobalsD(args, $this);
        
        if (canProceed(args, $this) === false) {
            return $this;
        }
        
        // start service discovery
        SSOGlobals.inProgress = true;
        _sendClientRequest('startSignIn', {
            manualSettings: false
        });
        
        return $this;
    }
    
    // D for Discovery
    function setRegGlobalsD(args, $this) {
        var devicesAvailableCb = $.isFunction(args.devicesAvailable) ? args.devicesAvailable : null;
        
        regGlobals.registeringPhone = true;
        regGlobals.manual = false;
        regGlobals.successCb = $.isFunction(args.success) ? args.success : null;
        regGlobals.errorCb = $.isFunction(args.error) ? args.error : null;
        regGlobals.CUCM = 'discovery based address';
        
        regGlobals.authenticatedCallback = getAuthenticatedCb(devicesAvailableCb, $this);
        
        // reset global registration object
        registration = {
            mode: args.mode || 'SoftPhone',
            devices: {},
            forceRegistration: args.forceRegistration || false
        };
        _log(true, 'setRegGlobalsD: regGlobals set: ', regGlobals);
        _log(true, 'setRegGlobalsD: registration set: ', registration);
    }
    
    // also triggers error as a side effect. (_triggerError does not stop the execution of current function, so it must be done manually in top function)
    function canProceed(args, $this) {
        if (!_plugin) {
            _triggerError($this, regGlobals.errorCb, errorMap.PluginNotAvailable, 'Plug-in is not available or has not been initialized', {registration: registration});
            return false;
        }
        
        if (args.mode && typeof args.mode === 'string' && !args.mode.match(/^(SoftPhone|DeskPhone)$/)) {
            _triggerError($this, regGlobals.errorCb, errorMap.InvalidArguments, 'Invalid phone mode "' + registration.mode + '"', {registration: registration});
            return false;
        }
        
        return true;
    }
       
    // authenticatedCallback is called after receiving authenticationresult event with positive outcome
    // required both for manual and sd based sign in
    function getAuthenticatedCb(devicesAvailableCb, $this) {
        
        function sendConnectMsg(deviceName, lineDN) {
            // cannot send connect msg before MM has started
            var canConnect = isMultimediaStarted;

            if (!canConnect) {
                _log(true, 'cannot send "connect" now ... waiting for multimedia start!');
                pendingConnect = wrap(sendConnectMsg, deviceName, lineDN);

                return;
            }

            // because of stream like behavior of available devices list, availableDevicesCB could be triggered multiple times, 
            // so we need to guard against calling connect multiple times  for the same device 
            // on failure, regGlobals.lastConnectedDevice will be reset, so it should not block connectiong to device again after failure
            if (!deviceName || deviceName === regGlobals.lastConnectedDevice) {
                _log(true, 'authenticatedCb: device name empty or already sent "connect" message for this device, returning...', deviceName);
                return;
            }
            
            lineDN = lineDN || '';
            regGlobals.lastConnectedDevice = deviceName;
            
            _sendClientRequest('connect',
                { phoneMode: registration.mode, deviceName: deviceName, lineDN: lineDN, forceRegistration: registration.forceRegistration }, $.noop,
                function errorCb(error) {
                    _triggerError($this, regGlobals.errorCb, getError(error), error, {registration: registration});
                }
                              );
        }
        
        return function (_devices) {
            var defaultDevice,
                i;
            
            _log(true, 'Entering authenticatedCallback');
            
            if (_devices.length === 0) {
                _log(true, 'authenticatedCallback: devices list of zero length received');
            }
             
            if (devicesAvailableCb) {
                try {
                    devicesAvailableCb(_devices, registration.mode, function (phoneMode, deviceName, lineDN) {
                        
                        // in softphone mode, lineDN is not allowed
                        if (phoneMode === 'SoftPhone' || !lineDN) {
                            lineDN = '';
                        }
                        
                        _log(true, 'connecting to user selected device: ', deviceName);
                        
                        sendConnectMsg(deviceName, lineDN);
                    });
                } catch (devicesAvailableException) {
                    _log('Exception occurred in application devicesAvailable callback', devicesAvailableException);
                    if (typeof console !== 'undefined' && console.trace) {
                        console.trace();
                    }
                }
            } else {
                defaultDevice = {name: ''};
                //...use the first available one
                for (i = 0; i < _devices.length; i++) {
                    if (registration.mode === 'SoftPhone' && _devices[i].isSoftPhone) {
                        // Note device objects retrieved from ECC will have device model description in device.modelDescription
                        // This differs from csf node.js module 'phoneconfig' implementation which puts it in device.model - this is also removed from 11.0
                        // device.model is removed from 11.0 release
                        if (_devices[i].modelDescription.match(/^\s*Cisco\s+Unified\s+Client\s+Services\s+Framework\s*$/i)) { // On CUCM Product Type: Cisco Unified Client Services Framework
                            defaultDevice = _devices[i];
                            break;
                        }
                    }
                    if (registration.mode === 'DeskPhone' && _devices[i].isDeskPhone) {
                        defaultDevice = _devices[i];
                        break;
                    }
                }
                _log(true, 'connecting to discovered device: ', defaultDevice);
                
                sendConnectMsg(defaultDevice.name);
            }
        };
    }
    
        
    /**
     * Cancels ongoing Single Sign On procedure if internal 'canCancelSingleSignOn' capability is enabled. 
     * 'canCancelSingleSignOn' is enabled immediately before 'ssoNavigateTo.cwic' event is triggered. It is disabled again after the token is acquired or after 'cancelSSO' call.
     * @since: 4.0.0 <br>
     */
    function cancelSSO() {
        var $this = this;
        if (SSOGlobals.canCancel) {
            // set to false early to prevent multiple calls to plugin. (It would be set to false anyway by plugin when Lifecycle state changes)
            SSOGlobals.canCancel = false;
            _sendClientRequest('cancelSingleSignOn', {});
        } else {
            _log(false, 'SSO(cancelSSO): Not possible to cancel SSO in the current state');
        }
        
        return $this;
    }
      
    /**
     * Clears cached user and system data. Must be called before manual sign in if previous sign in type was discovery based.
     * Can only be called in signed out state. 
     */
    function resetData() {
        function resetCompleted() {
            // check if success cb means that reset is finished? Maybe call this on InvokeResetData event?
        }
        // it's possible to call this function only in state LifeCycleStateEnum::SIGNEDOUT
        _sendClientRequest('resetData', {}, resetCompleted);
        
        if (localStorage) {
            _log(true, 'Removing data from localStorage...');
            localStorage.removeItem('_cwic_cache_email');
        }
    }

    // FUTURE
    // function getSSOSessionTimeRemaining() {
    //     function remainingTimeCb(time) {
    //         // do something with time
    //     }
    //     _sendClientRequest('getSSOSessionTimeRemaining', remainingTimeCb, {});
    // } 
    
    /**
     * Handler for 'ssonavigateto' event. Constructs valid sso url and triggers public event 'ssoNavigateTo.cwic'.
     * Developers have to implement logic for redirecting to passed url (popup or iframe).
     * @param   {jQuery} $this plugin
     * @param   {String}   url   base url passed from JCF
     * @fires 'ssoNavigateTo.cwic'
     * @private
     */
    function _triggerSSONavigateTo($this, url) {
        if (!settings.redirectUri) {
            return _triggerError($this, SSOGlobals.args.error, errorMap.SSOMissingOrInvalidRedirectURI);
        }
        
        var newUrl,
            params,
            paramsObj = {},
            urlParts = url.split('?'),
            server = urlParts[0];
        
        _log(true, 'Plugin sent URL: ' + url);

        try {
            params = urlParts[1].split('&'); // split url to form ['param1=value', 'param2=value']
            // convert array to object
            $.each(params, function (index, pair) {
                var param = pair.split('=');
                paramsObj[param[0]] = param[1];
            });
        } catch (e) {
            _log(true, 'Invalid SSO URL received', e);
            throw new Error('SSO authorization service URL invalid format');
        }

        paramsObj.client_id = 'C69908c4f345729af0a23cdfff1d255272de942193e7d39171ddd307bc488d7a1';
        paramsObj.redirect_uri = settings.redirectUri; // encodeURIComponent(settings.redirectUri); - not needed, $ does it in param method
        
        newUrl = server + '?' + $.param(paramsObj);
        
        _log(true, 'New URL generated: ' + newUrl);
        
        var event = $.Event('ssoNavigateTo.cwic');
        event.url = newUrl;
        $this.trigger(event);
    }

    /**
     * Only happens:
     *    1. On first use if bootstrapped 
     *    2. Provisioned keys have  not been set to auto generate user profile (for Jabber)
     *    3. Discovery error occurs
     * @param   {jQuery} $this  jquery object on which SDK is initiated
     * @param   {string[]}  content.errors List of errors
     * @param   {errorMapEntry}   content.error First error from the list converted to errorMapEntry object
     * @private
     */
    function _triggerEmailRequired($this, content) {
        if (!regGlobals.registeringPhone) {
            return;
        }
        
        var error = content.error,
            emailValidator = validators.get('email'),
            cachedEmail = '',
            emailFromLocalStorage;
        
        function setEmailAddress(email) {
            _log(true, 'setEmailAddress: ' + email);
            if (emailValidator.isNotValid(email)) {
                _triggerEmailRequired($this, {
                    error: getError('InvalidUserInput'),
                    errors: ['Invalid email submited']
                });

                return;
            }

            regGlobals.email = email;
            if (email !== emailForManualSignIn) {
                registration.email = email;
            }
            
            if (localStorage) {
                if (email !== emailForManualSignIn && email !== localStorage.getItem('_cwic_cache_email')) {
                    _log(true, 'saving email to localStorage');
                    localStorage.setItem('_cwic_cache_email', email);
                }
            } else {
                _log(false, 'localStorage not available, check IE mode the app is running in ...');
            }
            
            _sendClientRequest('setUserProfileEmailAddress', {email: email});
        }
        
        // if manual login, skip emailRequired callback calling and immediately set email with arbitrary value, it will be ignored anyway
        // if error is present, call error callback, defined in registerPhone args, and optionally stop lifecycle
        if (regGlobals.manual) {
            if (error) {
                stopSignInFromER($this, error);
                return;
            }
            return setEmailAddress(emailForManualSignIn);
        }
        
        if (regGlobals.emailReguiredCalled) {
            if (!error) {
                error = 'ServiceDiscoveryFailure';
            }
            
            return stopSignInFromER($this, error);
        }
        
        regGlobals.emailReguiredCalled = true;
        
        if (localStorage) {
            emailFromLocalStorage = localStorage.getItem('_cwic_cache_email');
            
            if (emailFromLocalStorage) {
                setEmailAddress(emailFromLocalStorage);
                return;
            }
        } else {
            _log(true, 'localStorage not available, check IE mode the app is running in ...');
        }
        
        if (regGlobals.email && typeof regGlobals.email === 'string' && regGlobals.email !== emailForManualSignIn) {
            cachedEmail = regGlobals.email;
        } else if (regGlobals.user && typeof regGlobals.user === 'string') {
            cachedEmail = regGlobals.user + '@';
        }
        
        try {
            settings.emailRequired(setEmailAddress, cachedEmail);
        } catch (e) {
            // not implemented
            return _triggerError($this, settings.error, errorMap.ServiceDiscoveryMissingOrInvalidCallback, e);
        }
        
    }
    
    
    
    /**
     * Handler for credentialsrequired event (Service discovery found home cluster without SSO enabled). Only happens when:
     *        1. Non SSO sign out
     *        2. Non SSO credentials not already set
     *        3. Non SSO authentication error
     * @param   {Object}   content event arguments object
     * @param   {string[]}   content.errors List of status or error messages
     * @param   {errorMapEntry}   content.error First error from the list converted to errorMapEntry object
     * @param   {Number}   content.authenticatorId Authenticator ID for which credentials are required                          
     * @private
     */
    function _triggerCredentialsRequired($this, content) {
        if (!regGlobals.registeringPhone) {
            return;
        }
        
        var error = content.error,
            credentialsValidator = validators.get('credentials'),
            authId = content.authenticatorId,
            cachedUser = '';
            
        //
        // --------------------------------------------  
        function provideManualCredentials($this) {
            if (regGlobals.user && regGlobals.passphrase) {
                return setCredentials(regGlobals.user, regGlobals.passphrase);
            } else {
                // should never happened, because credentials are checked in the beginning of registerPhone API
                // ... actually it happens after sign out, if the following credentialsRequired event is not ignored.
                stopSignInFromCR($this, getError('AuthenticationFailure'), authId);
                return;
            }
        }
        
        function getUserFromCache() {
            if (regGlobals.user) {
                return regGlobals.user;
            } else if (regGlobals.email && typeof regGlobals.email === 'string') {
                return regGlobals.email.split('@')[0];
            } else {
                return '';
            }
        }
        
        function callCredentialsRequiredCb($this) {
            if (error && regGlobals.credentialsRequiredCalled) {
                return stopSignInFromCR($this, error);
            }
            regGlobals.credentialsRequiredCalled = true;
            
            try {
                settings.credentialsRequired(setCredentials, cachedUser);
            } catch (e) {
                // not implemented or exception occurred
                return _triggerError($this, settings.error, errorMap.ServiceDiscoveryMissingOrInvalidCallback, e);
            }
        }
        
        function setCredentials(username, passphrase) {
            var isEncrypted = false;
            
            function encryptCb(error, result) {
                if (error) {
                    return _triggerError($this, settings.error, getError('NativePluginError'), error);
                }
                passphrase = result;

                _sendClientRequest('setUserProfileCredentials', {
                    username: username,
                    password: passphrase,
                    authenticator: authId
                });
            }
            
            if (passphrase && passphrase.encrypted) {
                passphrase = passphrase.encrypted;
                isEncrypted = true;
            }

            if (credentialsValidator.isNotValid(username, passphrase)) {
                return _triggerCredentialsRequired($this, {
                    errors: ['InvalidCredentials'],
                    error: getError('AuthenticationFailure'),
                    authenticatorId: authId
                });
            }
            
            registration.user = regGlobals.user = username;
            
            if (isEncrypted === false) {
                encrypt(passphrase, encryptCb);
            } else {
                _sendClientRequest('setUserProfileCredentials', {
                    username: username,
                    password: passphrase,
                    authenticator: authId
                });
            }
        }
        //
        //-------------------------------------------------------------
        
        // if manual login, skip credentialsRequired callback calling and immediately set credentials with user provided values
        // when logged in in manual mode, then signout, credentialsRequired event will be triggered, but we need to ignore it
        if (regGlobals.manual) {
            if (error) {
                _log(true, 'returning from credentialsRequired in manual mode, because of error...');
                stopSignInFromCR($this, error, authId);
                return;
            }
            provideManualCredentials($this);
        } else {
            cachedUser = getUserFromCache();
            
            callCredentialsRequiredCb($this);
        }
        return;
    }
    
    // CR for Credentials Required
    function stopSignInFromCR($this, error, authId) {
        regGlobals.errorState = 'credentialsRequired';
        regGlobals.lastAuthenticatorId = authId;
        stopSignIn($this, error);
    }
    
    // ER for Email Required
    function stopSignInFromER($this, error) {
        regGlobals.errorState = 'emailRequired';
        localStorage && localStorage.removeItem('_cwic_cache_email');
        stopSignIn($this, error);
    }

    function stopSignIn($this, error) {
        _triggerError($this, regGlobals.errorCb, errorMap.AuthenticationFailure, error, {registration: registration});
        
        resetGlobals(); // will delete errorCb, don't call it before
    }
    
    function _triggerSSOSignInFailed($this, content) {
        if (!regGlobals.registeringPhone) {
            return;
        }
        
        var error = content.error;
        SSOGlobals.inProgress = false;
        stopSignIn($this, error);
    }
    
    /**
     * Only happens when the app has successfully been authenticated with the primary authenticator. Calls signedIn callback.
     * SignedIn state means that Lifecycle state is changed to 'SIGNEDIN'. Device connection is performed after this event is triggered.
     * @param {JQuery} $this 
     * @private                             
     */
    function _triggerSignedIn($this) {
        SSOGlobals.inProgress = false;
        _log(true, '_triggerSignedIn called');
        _log(true, '_triggerSignedIn: authenticatedCB present: ', regGlobals.authenticatedCallback ? true : false);
        _log(true, '_triggerSignedIn: telephonyDevicesSet: ', regGlobals.telephonyDevicesSet);

        if (regGlobals.authenticatedCallback && regGlobals.telephonyDevicesSet) {
           // regGlobals.telephonyDevicesSet = false; // it will be reset on sign out
            _log(true, 'Proceeding with device selection immediately after SignedIn event');
            proceedWithDeviceSelection();
        } else {
            // device selection will be done after devices are received... see _triggerTelephonyDevicesChange
            _log(true, '_triggerSignedIn: Cannot proceed with device selection until devices are ready...');
        }

        try {
            settings.signedIn();
        } catch (e) {
            // signedIn callback is optional
            _log(true, 'No signedIn callback defined...');
        }
    }
    
    /**
     * Handler for telephonydeviceschange event. Triggered every time devices are changed.
     * When user is switched, this event will also triger with empty device list. That event should be filtered.
     * @param {Array}   content.devices array of available devices
     * @private
     */
    function _triggerTelephonyDevicesChange($this, content) {
        _log(true, '_triggerTelephonyDevicesChange called with following data: ', content);
        _log(true, '_triggerTelephonyDevicesChange: regGlobals: ', regGlobals);

        if (content.devices && content.devices.length > 0 && regGlobals.registeringPhone) {
            // TelephonyDevicesChange event is triggered for each device in the list. We don't know when the last device is discovered.
            // calling getAvailableDevices after first TelephonyDevicesChange event is received seems to be good enough.
            // additionally we debounced TelephonyDevicesChange event, so this callback will be called only after timeout of 20ms expires between successive events
            regGlobals.telephonyDevicesSet = true;

            // We now want to call devices available cb for every change event during registration.
            _log(true, 'Proceeding with device selection after waiting for TelephonyDevicesChange event.');
            proceedWithDeviceSelection();
        }
    }
    
    // debounce to reduce possibility for devicesAvailableCb to be called more then once ... but anyway it should not be a problem if it's called more then once.
    var _triggerTelephonyDevicesChangeDebounced = debounce(_triggerTelephonyDevicesChange, 20);
        
    function proceedWithDeviceSelection() {
        _log(true, 'proceedWithDeviceSelection called');
        _updateRegistration(regGlobals.currState, regGlobals.authenticatedCallback);
    }
    
    /**
     * Handler for invokeresetdata event. It should clear all cached information by browser.
     * In reality it can just clear/reset to default SSOGlobals object.
     * Candidate for removal.
     * @private
     */
    function _triggerInvokeResetData() {
        _log(true, 'SSO: Invoke Reset Data Triggered.');
    }

    /**
     * Handler for ssoshowwindow event. It signals when the popup/iframe for SSO login should be shown/hidden during the
     * login phase.
     * This is Jabber specific. Jabber SDK does not send URL for every page HTML page, but only when token is acquired.
     * Candidate for removal.
     * @private
     */
    function _triggerSSOShowWindow(show) {
        _log(true, 'SSO: Show Window Triggered!');
    }
    
    /**
     * Handler for lifecyclestatechanged event.
     * @param {string} content New lifecycle state (CSFUnified::LifeCycleStateEnum::LifeCycleState)
     * Candidate for removal.
     * @private                        
     */
    function _triggerLifecycleStateChanged($this, state) {
        _log(true, 'System lifecycle state changed. New state: ' + state);

        if (regGlobals.signingOut && state === 'SIGNEDOUT') {
            regGlobals.signingOut = false;
            // emulating eIdle connection state to force calling of 'unregisterCb'
            // because SIGNEDOUT lifecycle state comes a lot earlier than connection state update.
            // Registered phone is unavailable in between anyway.
            _triggerProviderEvent($this, 'eIdle');

        }

        if (state === 'SIGNINGOUT') {
            regGlobals.signingOut = true;
        }
        
        // calling reset in the middle of discovery sign in lifecycle, causes Authentication Failure, if emailrequired callback is already called
        // ...so during reset we reset emailReguiredCalled flag to handle this situation...
        if (state === 'RESETTING') {
            regGlobals.emailReguiredCalled = false;
        }

    }
    
    /**
     * Handler for lifecyclessosessionchanged event. Used only for debugging.
     * @param {string} content New lifecycle session state
     * Candidate for removal.
     * @private                        
     */
    function _triggerLifecycleSSOSessionChanged($this, content) {
        _log(true, 'SSO: Lifecycle session changed. New state: ' + content);
    }
    
    /**
     * Handler for cancancelssochanged event. Signals if it is possible to cancel ongoing SSO login.
     * @param {Object}   content 
     * @param {Boolean}   content.cancancel  
     * @private                                      
     */
    function _triggerCanCancelSSOChanged($this, content) {
        _log(true, 'SSO: CanCancel property changed. New state: ' + content.cancancel);
        SSOGlobals.canCancel = content.cancancel;
    }
        
    /**
     * internal function to release all SSO related resources on
     * (window.unload event) and on invokeResetData
     * To be implemented if needed
     * @private
     */
    function _resetSSO() {

    }
    
    //******************************************
    // END SSO related work
    //******************************************
    
    //******************************************
    // Certificate validation
    //******************************************
    // callback which submits user's choice to accept or reject the certificate
    // fp - string, accept - boolean
    function handleInvalidCert(fp, accept) {
        if (fp && (typeof fp === 'string') && (typeof accept === 'boolean')) {
            _log(true, 'handleInvalidCertificate sending response: ' + accept + ' (for fingerprint - ' + fp);
            _sendClientRequest('handleInvalidCertificate', {certFingerprint: fp, accept: accept});
                                                           
        } else {
            throw new TypeError('handleInvalidCert: Wrong arguments!');
        }
    }
    // Inalid certificate event handler
    function _triggerInvalidCertificate($this, content) {
        /*
            content properties:
                - certFingerprint
                - identifierToDisplay
                - certSubjectCN
                - referenceId
                - invalidReasons
                - subjectCertificateData
                - intermediateCACertificateData
                - allowUserToAccept
                - persistAcceptedDecision
        */
        if ($.isArray(content.invalidReasons)) {
            content.invalidReasons = $.map(content.invalidReasons, function (elem) {
                return elem.invalidReason;
            });
        } else {
            content.invalidReasons = [];
        }
        //Emit public event
        var event = $.Event('invalidCertificate.cwic');
        event.info = content;
        event.respond = handleInvalidCert;

        $this.trigger(event);
    }
    //******************************************
    // END Certificate validation
    //******************************************
    
    // -------------------------------------------
    // BEGIN: Call transfer related event handling
    // -------------------------------------------
    
    /**
     * Completes ongoing call transfer
     * @param {Number} callId conversation id of active conversation
     * @private                       
     */
    function completeTransfer($this, callId) {
        if (transferCallGlobals.inProgress) {
            _sendClientRequest('completeTransfer', {
                callId: callId
            }, $.noop, function errorCb(error) {
                _triggerError($this, getError(error, 'NativePluginError'), 'completeTransfer', error);
            });
            transferCallGlobals.endTransfer();
            return true;
        } else {
            _log(true, 'completeTransfer: transfer not in progress, returning from function...');
            return false;
        } 
    }
    
    /**
     * Enables button wrapped in jQuery object
     * @param   {jQuery} $el selected button object
     * @returns {jQuery} button passed-in
     * @private                         
     */
    function enable($el) {
        if (!($el instanceof jQuery)) {
            throw new TypeError('enable function accepts only jQuerys');
        }
        $el.attr('disabled', false);
        return $el;
    }
    
    /**
     * Disables button wrapped in jQuery object
     * @param   {jQuery} $el selected button object
     * @returns {jQuery} button passed-in
     * @private                         
     */
    function disable($el) {
        if (!($el instanceof jQuery)) {
            throw new TypeError('disable function accepts only jQuery objects');
        }
        $el.attr('disabled', true);
        return $el;
    }
   

    /**
     * Event handler for 'attendedtransferstatechange' event
     * @private
     */
    function _triggerAttendedTransferStateChange($this, content) {
        //Emit public event
        var event = $.Event('callTransferInProgress.cwic'),
            callId = content.callId,
            $completeBtn = transferCallGlobals.completeBtn;
            
        transferCallGlobals.callId = callId;
        
        // add wrapped function to event object
        event.completeTransfer = wrap(completeTransfer, $this, callId);
        
        /**Helper function for completing call transfer. Calls passed-in function and disables complete and cancel buttons
         * @param   {Function} f function wrap and to call before disabling buttons 
         * @returns {Function} wrapped function, ready to be attached as event handler 
         * @private                    
         */      
        function finishCallTransfer(event) {
            completeTransfer($this, callId);
        
            if ($completeBtn) {
                disable($completeBtn).unbind();
            }
        }

        if (!callId) {
            _log('_triggerAttendedTransferStateChange: No callId received from the plugin. Returning from the function...');
            return;
        }
        _log(true, '_triggerAttendedTransferStateChange: Received callId: ' + callId);
        
        // check if complete and cancel buttons are passed in
        if (typeof $completeBtn === 'string') {
            $completeBtn = $('#' + $completeBtn);
        }
        
        // duck typing to check if passed-in buttons are jQuery objects that we need
        if ($completeBtn && (typeof $completeBtn.one === 'function') && $completeBtn.attr) {
            enable($completeBtn).unbind().one('click', finishCallTransfer);

            return;
        } else {
            $this.trigger(event);
            return;
        }
    }
    
    // ------------------------------------------
    // END: Call transfer related event handling
    // ------------------------------------------
    
    function _triggerCurrentRingtoneChanged($this, content) {
        var event = $.Event('ringtoneChange.cwic');
        event.currentRingtone = content.ringtone;
        $this.trigger(event);
    }

    function _triggerMultimediaCapabilitiesStarted($this, isMultimediaCapabilityStarted) {
        isMultimediaStarted = isMultimediaCapabilityStarted;
        
        var event = $.Event('multimediaCapabilities.cwic');
        event.multimediaCapability = isMultimediaCapabilityStarted;
        $this.trigger(event);
        
        if (isMultimediaCapabilityStarted) {
            getAvailableRingtones($this);
            _sendClientRequest('getMultimediaDevices', function mmDevicesCb(content) {
                _triggerMMDeviceEvent($this, content);
            });

            if (typeof pendingConnect === 'function') {
                _log(true, 'Sending delayed "connect" message');
                pendingConnect();
                pendingConnect = null;
            }
        }
    }


    /**
    * an internal function to log messages
    * @param {Boolean} [isVerbose] indicates if msg should be logged in verbose mode only (configurable by the application). true - show this log only in verbose mode, false - always show this log  <br>
    * @param {String} msg the message to be logged (to console.log by default, configurable by the application)  <br>
    * @param {Object} [context] a context to be logged <br>
    */
    function _log() {
        var isVerbose = typeof arguments[0] === 'boolean' ? arguments[0] : false;
        var msg = typeof arguments[0] === 'string' ? arguments[0] : arguments[1];
        var context = typeof arguments[1] === 'object' ? arguments[1] : arguments[2];

        if ((!isVerbose || (isVerbose && settings.verbose)) && $.isFunction(settings.log)) {
            try {
                var current = new Date();
                var timelog = current.getDate() + '/' +
                              ('0' + (current.getMonth() + 1)).slice(-2) + '/' +
                              current.getFullYear() + ' ' +
                              ('0' + current.getHours()).slice(-2) + ':' +
                              ('0' + current.getMinutes()).slice(-2) + ':' +
                              ('0' + current.getSeconds()).slice(-2) + '.' +
                              ('00' + current.getMilliseconds()).slice(-3) + ' ';
                settings.log('[cwic] ' + timelog + msg, context);
            } catch (e) {
                // Exceptions in application-define log functions can't really be logged
            }
        }
    }

    // Helper function to check if plug-in is still available.
    // Related to DE3975. The CK advanced editor causes the overflow CSS attribute to change, which in turn
    // removes and replaces the plug-in during the reflow losing all state.
    var _doesPluginExist = function () {
        var ret = true;
        if (!_plugin || !_plugin.api) {
            _log(true, '_doesPluginExist failed basic existence check');
            ret = false;
        } else if (typeof _plugin.api.sendRequest === 'undefined' && typeof _plugin.api.postMessage === 'undefined') {
            _log(true, '_doesPluginExist failed sendRequest/postMessage method check');
            ret = false;
        }

        return ret;
    };

    // support unit tests for IE
    // should be more transparent than this, but tell that to internet explorer - you can't override attachEvent...
    var _addListener = function (obj, type, handler) {
        try {
            // if the object has a method called _addListener, then we're running a unit test.
            if (obj._addListener) {
                obj._addListener(type, handler, false);
            } else if (obj.attachEvent) {
                obj.attachEvent('on' + type, handler);
            } else {
                obj.addEventListener(type, handler, false);
            }
        } catch (e) {
            _log('_addListener error: ', e);
        }
    };
    var _removeListener = function (obj, type, handler) {
        try {
            // if the object has a method called _addListener, then we're running a unit test.
            if (obj._addListener) {
                return;
                //obj._removeListener(type,handler,false);
            } else if (obj.attachEvent) {
                obj.detachEvent('on' + type, handler);
            } else {
                obj.removeEventListener(type, handler, false);
            }
        } catch (e) {
            _log('_removeListener error: ', e);
        }
    };

    var _handlePluginMessage = function _handlePluginMessage(msg) {
        var $this = (_plugin) ? _plugin.scope : this,
            i;

        if (msg.ciscoChannelServerMessage) {
            if (msg.ciscoChannelServerMessage.name === 'ChannelDisconnect') {
                _log('Extension channel disconnected', msg.ciscoChannelServerMessage);
                _plugin = null;
                clientRequestCallbacks.purge();
                _triggerError($this, settings.error, errorMap.ExtensionNotAvailable, 'Lost connection to browser extension');
            } else if (msg.ciscoChannelServerMessage.name === 'HostDisconnect') {
                _log('Host application disconnected', msg.ciscoChannelServerMessage);
                _plugin = null;
                clientRequestCallbacks.purge();
                _triggerError($this, settings.error, errorMap.PluginNotAvailable, 'Lost connection to plugin');
            } else {
                _log('ciscoChannelServerMessage unknown name: ' + msg.ciscoChannelServerMessage.name);
            }
        } else if (msg.ciscoSDKServerMessage) {
            var content = msg.ciscoSDKServerMessage.content;
            var error = msg.ciscoSDKServerMessage.error;
            var msgId = msg.ciscoSDKServerMessage.replyToMessageId;
            var name = msg.ciscoSDKServerMessage.name;

            _log(true, '_handlePluginMessage: ' + name, msg.ciscoSDKServerMessage);

            // *************************************************************
            // Lifecycle errors customizations BEGIN
            // *************************************************************
            // plugin sends an array of error codes. We never seen more then one error in that array,
            // so we will take only the first error and send it as a string to handlers instead of array.
            // We will log other errors if present

            // content.errors is like [{error: 'err1'}, {error:'err2'}]
            // simplify it to array of strings.
            if (content && content.errors) {
                content.errors = $.map(content.errors, function (errorObj) {
                    return errorObj.error !== '' ? errorObj.error : null;
                });

                _log(true, 'Lifecycle error list contains ' + content.errors.length + ' errors');
                for (i = 0; i < content.errors.length; i++) {
                    _log(true, 'Lifecycle error from the list', content.errors[i]);
                }
                
                content.error = content.errors.length ?
                        getError(content.errors[0]) :
                        null;
            }
            
            // empty string is passed when there is no error is JCF
            if (content && content.errors === '') {
                _log(true, 'Received empty string instead of lifecycle error list');
                content.errors = [];
                content.error = null;
            }

            // *************************************************************
            // Lifecycle errors customizations END
            // *************************************************************


            // first check if we have a callback waiting
            if (msgId) {
                clientRequestCallbacks.callCallback(msgId, error, content);
            }

            // then trigger any other matching events
            switch (name) {
            case 'init':
                _cwic_onInitReceived(content);
                break;
            case 'userauthorized':
                _cwic_userAuthHandler(content);
                break;
            case 'connectionstatuschange':
                _triggerProviderEvent($this, content);
                break;
            case 'multimediacapabilitiesstarted':
                _triggerMultimediaCapabilitiesStarted($this, true);
                break;
            case 'multimediacapabilitiesstopped':
                _triggerMultimediaCapabilitiesStarted($this, false);
                break;
            case 'ringtonechanged':
                _triggerCurrentRingtoneChanged($this, content);
                break;
            case 'attendedtransferstatechange':
                _triggerAttendedTransferStateChange($this, content);
                break;
            case 'multimediadevicechange':
                 //multimedia devices changed, now go get the new list
                if (isMultimediaStarted) {
                    _sendClientRequest('getMultimediaDevices', function mmDevicesCb(content) {
                        _triggerMMDeviceEvent($this, content);
                    });
                }
                break;
            case 'connectionfailure':
                // all errors should be handled through lifecycle states
                _log(true, 'Connection Failure event received with reason: ', content);
                if (content === 'None') {
                    _log(false, 'Received "None", returning...');
                    return;
                }
                var errorKey = getError(content, 'ServerConnectionFailure');
                _triggerError($this, regGlobals.errorCb, errorKey, content, { registration: registration });
                break;
            case 'authenticationresult':
                _triggerAuthResultAndStatus($this, content);
                break;
            case 'telephonydeviceschange':
                _triggerTelephonyDevicesChangeDebounced($this, content);
                break;
            case 'callstatechange':
                _triggerConversationEvent($this, content, 'state');
                break;
            case 'externalwindowevent':
                _triggerExternalWindowEvent($this, content);
                //for docking to work we need to know when video is being received
                dockGlobals.isVideoBeingReceived = content.showing;
                break;
            case 'dockexternalwindowneeded':
                _triggerDockExternalWindowNeeded($this);
                break;
            case 'videoresolutionchange':
                _log(true, 'video resolution change detected for call ' + content.callId +
                     '. Height: ' + content.height +
                     ', width: ' + content.width, content);
                // trigger a conversation event with a 'videoResolution' property
                _triggerConversationEvent($this, {
                    callId: content.callId,
                    videoResolution: {
                        width: content.width,
                        height: content.height
                    }
                }, 'render');
                break;
            case 'ssonavigateto':
                _triggerSSONavigateTo($this, content);
                break;
            case 'userprofilecredentialsrequired':
                // content.errors - [string], content.error - string, content.authenticatorId - number
                _triggerCredentialsRequired($this, content);
                break;
            case 'ssosigninrequired':
                // content.errors - [string], content.error - string
                _triggerSSOSignInFailed($this, content);
                break;
            case 'userprofileemailaddressrequired':
                // content.errors - [string], content.error - string
                _triggerEmailRequired($this, content);
                break;
            case 'loggedin':
                _triggerSignedIn($this);
                break;
            case 'invokeresetdata':
                _triggerInvokeResetData(content);
                break;
            case 'ssoshowwindow':
                _triggerSSOShowWindow(content);
                break;
            case 'ssosessionexpirypromptrequired':
                _triggerSSOSessionExpiryPromptRequired();
                break;
            case 'lifecyclestatechanged':
                _triggerLifecycleStateChanged($this, content);
                break;
            case 'lifecyclessosessionchanged':
                _triggerLifecycleSSOSessionChanged($this, content);
                break;
            case 'cancancelsinglesignonchanged':
                _triggerCanCancelSSOChanged($this, content);
                break;
            case 'invalidcertificate':
                _triggerInvalidCertificate($this, content);
                break;
            default:
               // _log(true, 'ciscoSDKServerMessage unknown name '+name, msg);
            }
        } else {
            _log(true, 'Unknown msg from plugin: ', msg);
        }
    };


    // Good-enough unique ID generation:
    // used for clienId (generated only once per cwic instance) and message ids (generated for each message)
    // Just needs to be unique for this channel across restarts of this client,
    // just in case there's an old server reply in the pipeline.
    function generateUniqueId() {
        return (new Date()).valueOf().toString() + Math.floor((Math.random() * 10000) + 1).toString();
    }

    /**
    * sends clientRequest message to browser plugin/extension
    * @param {String} name
    * @param {Object|String} content Object or string to be passed as arguments for the named request
    * @param {Function} [successCb(result)] Function to be called upon recieving success reply to the request.
    *                    replyCb should take object as argument the return result from native function.
    * @param {Function} [errorCb(errorMapAlias)] Function to be called upon recieving error reply to the request.
    *                    errorCb should take object as argument an errorMapAlias string.  If no errorCb is provided
    *                    then a generic error.cwic event will be triggered instead.
    * @private
    */
    function _sendClientRequest() {
        if (!_plugin || !_plugin.api) {
            _log('_sendClientRequest no plugin available');
            return false;
        }

        var name = arguments[0];
        var content = null;
        var successCb = null;
        var $this = _plugin.scope || this;

        if ($.isFunction(arguments[1])) {
            successCb = arguments[1];
        } else {
            content = arguments[1];
        }

        // create a default error callback
        var errorCb = function (errorMapAlias) {
            _triggerError($this, getError(errorMapAlias), { 'nativeError': errorMapAlias, 'nativeRequest': name, 'nativeArgs': content }, 'error returned from native plugin');
        };

        if ($.isFunction(arguments[2])) {
            if (successCb === null) {
                successCb = arguments[2];
            } else {
                errorCb = arguments[2];
            }
        }

        if ($.isFunction(arguments[3])) {
            errorCb = arguments[3];
        }

        // if nothing else, default to no-op
        successCb = successCb || $.noop;

        var maskContent = (name === 'encryptCucmPassword') ? '*****' : content;
        _log(true, '_sendClientRequest: ' + name, { 'successCb': successCb, 'errorCb': errorCb, 'content': maskContent });


        // Good-enough unique ID generation:
        // Just needs to be unique for this channel across restarts of this client,
        // just in case there's an old server reply in the pipeline.
        var uid = (name === 'init') ? 0 : generateUniqueId();

        var clientMsg = {
            ciscoSDKClientMessage: {
                'messageId': uid,
                'name': name,
                // if null, set content undefined so that it is omited from the JSON msg
                'content': (content === null) ? undefined : content
            }
        };

        // clone the msg object to allow masking of password for the log
        var logMsg = $.extend({}, clientMsg.ciscoSDKClientMessage);
        logMsg.content = maskContent;
        _log(true, 'send ciscoSDKClientMessage: ' + name, logMsg);

        //send message to Chrome
        if (_plugin.api.sendRequest) {
            _plugin.api.sendRequest(clientMsg);
        } else if (_plugin.api.postMessage) {
            clientId = clientId || generateUniqueId();
            var clientInfoJSON = {
                    'id': clientId,
                    'url': window.location.href,
                    'hostname': window.location.hostname,
                    'name': window.document.title
                };
            //*****JSON message changed, so it fits NPAPI expectations
            var NPAPI_Msg = {'ciscoChannelMessage': $.extend(clientMsg, {'client': clientInfoJSON})};

            //send message to browsers that support NPAPI
            _plugin.api.postMessage(JSON.stringify(NPAPI_Msg));
        }

        // asynchronous back end so we store the callback
        clientRequestCallbacks.callbacks[uid] = { 'successCb': successCb, 'errorCb': errorCb };
    }

    var clientRequestCallbacks = {
        // callbacks[messageId] = { 'successCb' : successCb, 'errorCb' : errorCb }
        callbacks: [],

        callCallback: function (messageId, error, nativeResult) {
            if (!this.callbacks[messageId]) {
                return;
            }
            var callback, arg;
            if (error && error !== 'eNoError') {
                callback = this.callbacks[messageId].errorCb;
                arg = error;
            } else {
                callback = this.callbacks[messageId].successCb;
                arg = nativeResult;
            }

            if ($.isFunction(callback)) {
                _log(true, 'clientRequestCallbacks calling result callback for msgId: ' + messageId);
                try {
                    callback(arg);
                } catch (e) {
                    _log('Exception occurred in clientRequestCallbacks callback', e);
                }
            }
            delete this.callbacks[messageId];
        },

        purge: function () {
            this.callbacks = [];
        }
    };

    function rebootIfBroken(rebootCb) {

        var pluginExists = _doesPluginExist();
        if (!pluginExists) {
            _log('Plugin does not exist. Restarting....');
            rebootCb();
        }

        return pluginExists;
    }

    // Returns null if plugin is not installed, 0 if the plugin is installed, but
    // we can't tell what version it is, or the version of the plugin.
    function _getNpapiPluginVersion() {
        // regexp to get the version of the plugin.
        var r2 = /(\d+\.\d+\.\d+\.\d+)/;
        var match,
            version = null;
        var pluginMimeType = navigator.mimeTypes['application/x-ciscowebcommunicator'];
        var cwcPlugin = pluginMimeType ? pluginMimeType.enabledPlugin : undefined;

        if (cwcPlugin) {
            // plugin is enabled
            version = 0;
            if (cwcPlugin.version) {
                // use explicit version if provided by browser
                version = cwcPlugin.version;
            } else {
                // extract version from description
                match = r2.exec(cwcPlugin.description);
                if (match && match[0]) {
                    version = match[0];
                }
            }
        }
        return version;
    }

    /**
    * Versions, states and capabilities.
    * @returns {aboutObject}
    */
    function about() {
        _log(true, 'about', arguments);

        /*
         * Versioning scheme: Release.Major.Minor.Revision
         * Release should be for major feature releases (such as video)
         * Major for an API-breaking ship within a release (or additional APIs that won't work without error checking on previous plug-ins).
         * Minor for non API-breaking builds, such as bug fix releases that strongly recommend updating the plug-in
         * Revision for unique build tracking.
        */

        var ab = {
            javascript: {
                version: '11.0.1.102',
                system_release: 'Cisco Unified Communications System Release 11.0 MR1'
            },
            jquery: {
                version: $.fn.jquery
            },
            channel: null,    // chrome extension, if any
            plugin: null,       // either NPAPI plugin or native host app
            states: {
                system: 'unknown',
                device: {
                    exists: false,
                    inService: false,
                    lineDNs: [],
                    modelDescription: '',
                    name: ''
                }
            },
            capabilities: {},
            upgrade: {}
        };

        // get local cwic javascript version
        var m = ab.javascript.version.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
        if (m) {
            ab.javascript.release = m[1];
            ab.javascript.major = m[2];
            ab.javascript.minor = m[3];
            ab.javascript.revision = m[4];
        }

        // get channel extension version, if any
        if (typeof cwic_plugin !== 'undefined') {
            ab.channel = cwic_plugin.about();
            // at some point, validation of compatibility of Chrome Extension might be needed, but not for now.
        }

        // get plugin (either NPAPI or native host) version and validate compatibility
        if (_plugin && _plugin.version) {
            ab.plugin = {
                version: _plugin.version
            };
        } else {
            var version = _getNpapiPluginVersion();
            if (version === 0) {
                // something is installed but we can't identify it
                ab.upgrade.plugin = 'mandatory';
            } else if (version) {
                // we extracted a version
                ab.plugin = { version: { plugin : version } };
            }
        }

        if (ab.plugin) {
            m = ab.plugin.version.plugin.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
            if (m) {
                ab.plugin.release = m[1];
                ab.plugin.major = m[2];
                ab.plugin.minor = m[3];
                ab.plugin.revision = m[4];
            }

            // compare javascript and plugin versions to advise about upgrade
            if (ab.javascript.release > ab.plugin.release) {
                // release mismatch, upgrade plugin
                ab.upgrade.plugin = 'mandatory';
            } else if (ab.javascript.release < ab.plugin.release) {
                // release mismatch, upgrade javascript
                ab.upgrade.javascript = 'mandatory';
            } else if (ab.javascript.release === ab.plugin.release) {
                // same release, compare major
                if (ab.javascript.major > ab.plugin.major) {
                    // newer javascript should always require new plugin
                    ab.upgrade.plugin = 'mandatory';
                } else if (ab.javascript.major < ab.plugin.major) {
                    // newer plugin should generally be backward compatible
                    ab.upgrade.javascript = 'recommended';
                } else if (ab.javascript.major === ab.plugin.major) {
                    // same release.major, compare minor
                    if (ab.javascript.minor > ab.plugin.minor) {
                        ab.upgrade.plugin = 'recommended';
                    } else if (ab.javascript.minor < ab.plugin.minor) {
                        ab.upgrade.javascript = 'recommended';
                    }
                }
            }
        } else {
            ab.upgrade.plugin = 'unknown';
        }

        if (_plugin) {
            // _plugin.connectionStatus gets set/updated along the way.  If not, keep default from above.
            ab.states.system = _plugin.connectionStatus || ab.states.system;
            // registration.device gets set in _updateRegistration and registerPhone.  If not, use default device from above.
            ab.states.device = registration.device || ab.states.device;
            // _plugin.capabilities gets set by _cwic_onFBPluginLoaded.  If not, keep default from above.
            ab.capabilities = _plugin.capabilities || ab.capabilities;
        }

        return ab;
    }

    /**
    * predict a device based on username
    * @param {Object} options
    * @type {String}
    */
    function _predictDevice(options) {
        if ($.isFunction(settings.predictDevice)) {
            try {
                return settings.predictDevice(options);
            } catch (predictDeviceException) {
                _log('Exception occurred in application predictDevice callback', predictDeviceException);
                if (typeof console !== 'undefined' && console.trace) {
                    console.trace();
                }
            }

        } else {
            return (options.username) ? settings.devicePrefix + options.username : '';
        }
    }
    
    var videowindowloadedcallbacks = {
        windowobjects: [],
        getWindowId: function (args) {
            var win = args.window;
            var windowid = this.windowobjects.indexOf(win);
            if (windowid === -1 && !args.readOnly) {
                this.windowobjects.push(win);
                windowid = this.windowobjects.indexOf(win);
                this.callbacks[windowid] = {};
            }
            return windowid;
        },
        // callbacks[windowId] = {pluginId: {callback: <function>, wascalled: <bool> }}
        callbacks: [],

        callCallback: function (win, pluginIdIn) {
            function callbackInner($this, windowId, pluginId) {
                if ($this.callbacks[windowId].hasOwnProperty(pluginId)) {
                    var onloaded = $this.callbacks[windowId][pluginId];
                    if (!onloaded.wascalled && onloaded.callback) {
                        try {
                            onloaded.callback(pluginId);
                        } catch (videoLoadedException) {
                            _log('Exception occurred in application videoLoaded callback', videoLoadedException);
                            if (typeof console !== 'undefined' && console.trace) {
                                console.trace();
                            }
                        }
                        onloaded.wascalled = true;
                    }
                }
            }
            

            var windowId = this.getWindowId({ window: win, readOnly: true }),
                pluginId;

            if (pluginIdIn) {
                // Correct plugin id provided by v3 MR2 or later plugin, just call the correct one.
                callbackInner(this, windowId, pluginIdIn);
            } else {
                // Fallback to the old buggy way where thh id was not available in the onload callback.
                for (pluginId in this.callbacks[windowId]) {
                    if (this.callbacks[windowId].hasOwnProperty(pluginId)) {
                        callbackInner(this, windowId, pluginId);
                    }
                }
            }
        }
    };

    // we should call configure method only once, when first video object is created...
    var configureCalled = false;

    function generateMessageParamsForIBVideo(callId) {
        var cid = clientId || generateUniqueId(),
            mid = generateUniqueId(),
            url = window.location.href,
            hostname = window.location.hostname,
            name = window.document.title,
            ret,
            callIdInt;

        ret = [mid, cid, url, hostname, name];

        if (callId) {
            try {
                callIdInt = parseInt(callId, 10);
            } catch (e) {
                _log(true, 'generateMessageParamsForIBVideo: invalid callId received...');
                callIdInt = -1;
            }
            ret.unshift(callIdInt);
        }

        return ret;
    }

    /**
     *
     * @param {Object} args
     * @param {Object|String} args.obj Video plugin object
     * @param {String} args.methodName Method name on video object
     * @param {Function} [args.error]
     * @param {Function} [args.success]
     * @param {String} [args.callId]
     * @private
     */
    function callMethodOnVideoObj(args) {
        var obj = args.obj,
            methodName = args.methodName,
            successCb = args.success,
            errorCb = args.error,
            msgParams;

        msgParams = generateMessageParamsForIBVideo(args.callId);

        if (obj && (typeof obj[methodName] === 'function' || typeof obj[methodName] === 'object')) { // on IE, NPAPI function is type of 'object'!
            _log(true, 'preparing to call "' + methodName + '" method on video object, with parameters', msgParams);
            obj[methodName].apply(this, msgParams);
            if (successCb) {
                successCb(obj);
            }
        } else {
            _log(true, 'calling "' + methodName + '" method on video object failed!');
            if (errorCb) {
                errorCb(getError('InvalidArguments'));
            }
        }
    }

    /**
     * global(window) level function object to handle video plug-in object onLoad
     * @type function
     * @param  {Object} videopluginobject video plug-in object (DOM Element)
     * @param {Object} win Optional window object. Used only if it's called from _cwic_onPopupVideoPluginLoaded
     * @returns undefined
     */
    window._cwic_onVideoPluginLoaded = function (videopluginobject, win) {
        _log('_cwic_onVideoPluginLoaded called');
        var winObj = win || window;

        if (!configureCalled) {
            callMethodOnVideoObj({
                obj: videopluginobject,
                methodName: 'configure',
                success: function successCb() {
                    configureCalled = true;
                }
            });
        }

        // For backward compatibility with existing apps, call the createVideoWindow success callback
        videowindowloadedcallbacks.callCallback(winObj, videopluginobject.loadid);
    };


    /**
     * global(window) level function to handle video plug-ins loaded in iframe/popup window.
     * Should be called from video object onLoad handler {@link $.fn.cwic-createVideoWindow}.<br>
     * Example onLoad function in iframe.html
     * @example
     * function onvideoPluginLoaded(obj) {
     *     window.parent._cwic_onPopupVideoPluginLoaded(obj, window);
     * }
     * @returns undefined
     * @param  {JSAPI} videopluginobject video plug-in object (DOM Element)
     * @param  {DOMWindow} win iframe or popup window
     * @public
     */
    window._cwic_onPopupVideoPluginLoaded = function (videopluginobject, win) {
        _log('_cwic_onPopupVideoPluginLoaded called');

        _cwic_onVideoPluginLoaded(videopluginobject, win);
    };
    
    /**
    * global(window) level function object to handle SSO token receiving from child window (popup or iFrame).
    * Should be called after the token is returned in URL of the target HTML page configured via 'redirect_uri' parameter.
    * @type function
    * @param  {Object} msg     message received from popup/iFrame
    * @param {string} msg.url URL with parameters: <ul><li>access_token - returned token</li><li>token_type - Always "Bearer"</li><li>expires_in - Number of seconds the returned token is valid</li></ul>
    * @example
    * //As soon as the page loads, call SSO token handler on the parent window (parent page is a page with cwic.js loaded)
    * window.onload = function(e) {
    *     // The SSO token information is available in a URL fragment. Pass a whole URL string to SSO token handler
    *     window.opener._cwic_onSSOTokenReceived(location.hash);
    *     window.close() 
    * };
    * @public
    */
    window._cwic_onSSOTokenReceived = function onSSOTokenReceived(msg) {
        var url = msg.url,
            ssoTokenValidator = validators.get('ssotoken');
            
        if (ssoTokenValidator.isValid(url)) {
            _sendClientRequest('ssoNavigationCompleted', {result: 200, url: url, document: ''});
            
        } else {
            throw new Error(errorMap.InvalidURLFragment.code);
        }
    };

    /**
    * Update the global registration object with information from the native plug-in
    */
    function _updateRegistration(state, updateRegCb) {
        var props = {};
        
        function getDevicesCb(res) {
            var devices;

            if (res.devices) {
                props.devices = res.devices;
            }
            if (res.device) {
                props.device = res.device;
                registration.device = $.extend({}, res.device);
            }
            if (res.line) {
                props.line = res.line;
                registration.line = $.extend(registration.line, res.line);
            }

            if ((state === 'eIdle' && props.devices) || (props.devices && props.device && props.line)) {
                devices = $.makeArray(props.devices);
                // merge device information returned by the plug-in
                $.each(devices, function (i, device) {
                    if (device.name) {
                        var deviceName = $.trim(device.name);
                        registration.devices[deviceName] = $.extend({}, registration.devices[deviceName], device);
                    }
                });
                
                if ($.isFunction(updateRegCb)) {
                    // devicesAvailableCb needs raw devices array, not what was put in registration.devices
                    /*
                     * name
                     * description
                     * model
                     * modelDescription
                     * isSoftPhone
                     * isDeskPhone
                     * lineDNs[]
                     * serviceState
                     */
                    updateRegCb(devices);
                }
            }
        }
        //
        //--------------------------------------------
        
        // add device and line info except during logout
        if (state !== 'eIdle') { // state = connection status, not a call state!
            _sendClientRequest('getProperty', 'device', getDevicesCb);
            _sendClientRequest('getProperty', 'line', getDevicesCb);
        }

        getAvailableDevices(getDevicesCb);  
    }
    
    function getAvailableDevices(getDevicesCb) {
        _sendClientRequest('getAvailableDevices', getDevicesCb);
    }

    function _triggerProviderEvent($this, state) {
        // state = connection status, not call state!
        _log(true, 'providerState ' + state);

        var event = $.Event('system.cwic');
        event.phone = { status: state, ready: false };

        // _updateRegistration provides a devices list to the callback but we don't use it here
        var updateRegCb = function () {
            // add global registration to the system event
            event.phone.registration = registration;

            // otherwise, state is our connectionStatus
            _plugin.connectionStatus = state;
            if (state === 'eReady') {
                // call success callback only if registering phone
                if (regGlobals.registeringPhone || regGlobals.switchingMode) {
                    regGlobals.registeringPhone = false;
                    regGlobals.switchingMode = false;

                    // finish registering

                    if (regGlobals.successCb) {
                        // extend a local copy of registration to be passed to client's callback
                        var localRegistration = $.extend({}, registration, {
                            cucm: $.makeArray(regGlobals.CUCM),
                            password: regGlobals.passphrase,
                            passphrase: regGlobals.passphrase,
                            mode: null
                        });
                        var getPropsCb = function (res) {
                            _log(true, 'getPropsCb res: ' + JSON.stringify(res));
                            
                            $.extend(localRegistration, { mode: res.mode });
             
                            try {
                                regGlobals.successCb(localRegistration);
                            } catch (successException) {
                                _log('Exception occurred in application success callback', successException);
                                if (typeof console !== 'undefined' && console.trace) {
                                    console.trace();
                                }
                            }   
                        };
                        
                        _sendClientRequest('getProperty', 'mode', getPropsCb);
                    } else {
                        _log('warning: no registerPhone success callback');
                    }
                }

                event.phone.ready = true;
                $this.trigger(event);
                
                var callsCb = function (result) {
                    $.each($.makeArray(result.calls), function (i, call) {
                        _triggerConversationEvent($this, call, 'state');
                    });
                };
                _sendClientRequest('getCalls', callsCb);
            } else if (state === 'eIdle') { // state = connection status, not a call state!
                if (typeof regGlobals.unregisterCb === 'function') {
                    regGlobals.unregisterCb();
                }

                $this.trigger(event);
            } else {
                $this.trigger(event);
            }
        };
        // update global registration
        _updateRegistration(state, updateRegCb);
    }

    // Called by _cwic_userAuthHandler when user authorization status is UserAuthorized.
    // This occurs either directly from _cwic_onInitReceived in the whitelisted case,
    // or when userauthorized event is received in showUserAuthorization case.
    function _cwic_onPluginReady($this) {
        var error;
        try {
            var defaults = {},
                phoneRegistered = false;

            // current connectionStatus was cached in _plugin before calling _cwic_onPluginReady
            var currState = _plugin.connectionStatus;

            if (currState === 'eReady') { // state = connection status, not a call state!
                phoneRegistered = true;
            }

            // fire and forget requests

            // Get initial mm device list.  If web calls cwic getMultimediaDevices before this returns, they'll get no devices.
            // That's ok because the success callback here is _triggerMMDeviceEvent, which tells the webapp to refresh its list.
            // todo: mediadevices service: move after login and revert
            //_sendClientRequest('getMultimediaDevices', function mmDevicesCb(content) {
            //    _triggerMMDeviceEvent($this, content);
            //});

            // wait for reply
            var modeCb = function (result) {
                if ($.isFunction(settings.ready)) {
                    try {
                        settings.ready(defaults, phoneRegistered, result.mode);
                    } catch (readyException) {
                        _log('Exception occurred in application ready callback', readyException);
                        if (typeof console !== 'undefined' && console.trace) {
                            console.trace();
                        }
                    }
                }
            };
            _sendClientRequest('getProperty', 'mode', modeCb);

            if (phoneRegistered) {
                var callsCb = function (result) {
                    $.each($.makeArray(result.calls), function (i, call) {
                        _triggerConversationEvent($this, call, 'state');
                    });
                };
                _sendClientRequest('getCalls', callsCb);
            } else {
                // CSCue51645 ensure app is in sync with initial plug-in state
                _triggerProviderEvent($this, currState);
            }

            return;
        } catch (e) {
            if (typeof console !== 'undefined') {
                if (console.trace) {
                    console.trace();
                }
                if (console.log && e.message) {
                    console.log('Exception occured in _cwic_onPluginReady() ' + e.message);
                }
            }
            _plugin = null;
            error = $.extend({}, errorMap.PluginNotAvailable, e);
            _triggerError($this, settings.error, 'Cannot Initialize Cisco Web Communicator', error);
        }

    }
    
    /**
    * Wait for the document to be ready, and try to load the Cisco Web Communicator add-on.<br>
    * If cwic was successfully initialized, call the options.ready handler, <br>
    * passing some stored properties (possibly empty), <br>
    * otherwise call the options.error handler<br>
    * @param {Object} options Is a set of key/value pairs to configure the phone registration.  See {@link $.fn.cwic-settings} for options.
    * @example
    * jQuery('#phone').cwic('init', {
    *   ready: function(defaults) {
    *     console.log('sdk is ready');
    *   },
    *   error: function(error) {
    *     console.log('sdk cannot be initialized : ' + error.message);
    *   },
    *   log: function(msg, exception) {
    *     console.log(msg); if (exception) { console.log(exception); }
    *   },
    *   errorMap: {
    *     // localized message for error code 'AuthenticationFailure'
    *     AuthenticationFailure : { message: 'Nom d'utilisateur ou mot de passe incorrect' }
    *   },
    *   predictDevice: function(args) {
    *       return settings.devicePrefix + args.username;
    *   }
    *});
    */
    function init(options) {
        var $this = this,
            paramsCheck;
        
        _log('init', arguments);
        
        extendDefaultSettingsObject(options);
            
        // check sd params after extending settings object because user defined error callback should be copied to settings object first
        paramsCheck = validateDiscoveryParams(options);
        if (!paramsCheck.result) {
            return _triggerError($this, settings.error, errorMap.InvalidArguments, paramsCheck.reason.join(', '));
        }
        
        registerGlobalInitHandlers($this);
             
        initAddonOnDocumentReady($this);
         
        return $this;
    }

    function extendDefaultSettingsObject(options) {
        // replace or extend the default error map
        if (typeof options.errorMap !== 'undefined') {
            // extend the default errorMap
            $.each(options.errorMap, function (key, info) {
                if (typeof info === 'string') {
                    errorMap[key] = $.extend({}, errorMap[key], { message: info });
                } else if (typeof info === 'object') {
                    errorMap[key] = $.extend({}, errorMap[key], info);
                } else {
                    _log('ignoring invalid custom error [key=' + key + ']', info);
                }
            });
        }

        // extend the default settings
        $.extend(settings, options);
    }

    function validateDiscoveryParams(options) {
        var ret = {result: true, reason: []};
        // check service discovery related properties if necessary
        if (settings.serviceDiscovery) {
            if (typeof options.credentialsRequired !== 'function') {
                ret.reason.push('No credentialRequired callback provided');
                ret.result = false;
            }
            
            if (typeof options.emailRequired !== 'function') {
                ret.reason.push('No emailRequired callback provided');
                ret.result = false;
            }
            
            if (!options.redirectUri || typeof options.redirectUri !== 'string') {
                ret.reason.push('No redirectUri parameter provided');
                ret.result = false;
            }
        }
        
        return ret;
    }
    
    function registerGlobalInitHandlers($this) {
        window._cwic_userAuthHandler = function (result) {
            _plugin.userAuthStatus = (result) ? 'UserAuthorized' : 'UserDenied';
            _log('_cwic_userAuthHandler result: ' + _plugin.userAuthStatus);

            if (result === true) {
                //_getAvailableRingtones($this); // todo: mediadevices service: move after login and revert when JCF fix is ready

                _sendClientRequest('getProperty', 'connectionStatus', function (result) {
                    _plugin.connectionStatus = result.connectionStatus;
                    _cwic_onPluginReady($this);
                });
            } else {
                _triggerError($this, settings.error, 'Cannot Initialize Cisco Web Communicator', errorMap.NotUserAuthorized);

                if (_plugin.deniedCb) {
                    _plugin.deniedCb();
                    _plugin.deniedCb = null;
                }
            }
        };
        
        /**
        * Called by _handlePluginMessage after the init reply is received.
        * @param {object} [content] Data payload of the init reply message when called by _handlePluginMessage.
        * @param {object} content.version Version details for the loaded plug-in.
        * @param {object} content.instanceId
        * @param {object} content.userauthstatus
        * @param {object} content.capabilities
        * @returns undefined
        * @private
        */
        window._cwic_onInitReceived = function (content) {
            var error;

            if (typeof cwic_plugin !== 'undefined' && _plugin !== null) {
                // what to do if _cwic_onPluginLoaded called twice without first unloading?
                _log('plugin is already loaded.');
                return;
            }

            try {
                if (typeof cwic_plugin !== 'undefined') {
                    //for Chrome
                    // plug-in is available, update global reference
                    _plugin = {};
                    _plugin.scope = $this;
                    _plugin.api = cwic_plugin;
                }

                if (_plugin.api) {
                    _plugin.instanceId = content.instanceId;
                    _plugin.version = content.version;
                    _plugin.userAuthStatus = content.userauthstatus;
                    _plugin.capabilities = content.capabilities;
                } else {
                    throw getError('PluginNotAvailable');
                }

                _log('initialized ' + _plugin.userAuthStatus + ' plugin', _plugin.version);

                var ab = about();
                if (ab.upgrade.plugin === 'mandatory') {
                    _triggerError($this, settings.error, errorMap.PluginNotAvailable, 'Cisco Web Communicator cannot be used when plugin upgrade is "mandatory"');
                    return;
                }

                $(window).unload(function () {
                    shutdown.call($this, true);
                });

                if (_plugin.userAuthStatus === 'MustShowAuth') {
                    //  MustShowAuth implies we either do delayed Auth or we pop the dialog now
                    if ($.isFunction(settings.delayedUserAuth)) {
                        settings.delayedUserAuth();
                    } else {
                        // No additional deniedCb is needed.  _cwic_userAuthHandler will trigger NotUserAuthorized error.
                        showUserAuthorization({ denied : $.noop });
                    }
                } else if (_plugin.userAuthStatus === 'UserAuthorized') {
                    // domain whitelisting can give us immediate authorization
                    _cwic_userAuthHandler(true);
                }

                return;
            } catch (e) {
                if (typeof console !== 'undefined') {
                    if (console.trace) {
                        console.trace();
                    }
                    if (console.log && e.message) {
                        console.log('Exception occured in _cwic_onInitReceived() ' + e.message);
                    }
                }

                _plugin = null;
                error = $.extend({}, errorMap.PluginNotAvailable, e);
            }

            return _triggerError($this, settings.error, 'Cannot Initialize Cisco Web Communicator', error);
        };

        /**
        * Phone Object onLoad handler. This function is called as the onload callback for the NPAPI plugin.
        * @returns undefined
        * @private
        */
        window._cwic_onFBPluginLoaded = function () {
            var error;

            if (_plugin !== null) {
                // what to do if _cwic_onFBPluginLoaded called twice without first unloading?
                _log('plugin is already loaded.');
                return;
            }

            try {
                // plug-in is available, update global reference
                _plugin = {};
                _plugin.scope = $this;

                // look for npapi object
                var cwcObject = document.getElementById('cwc-plugin'); // don't use jQuery to get NPAPI objects, it doesn't work for jQuery 1.5+

                if (cwcObject) {
                    _plugin.api = cwcObject;
                    _registerNpapiCallbacks();
                    _sendClientRequest('init');
                } else {
                    throw getError('PluginNotAvailable');
                }

                return;
            } catch (e) {
                if (typeof console !== 'undefined') {
                    if (console.trace) {
                        console.trace();
                    }
                    if (console.log && e.message) {
                        console.log('Exception occured in _cwic_onFBPluginLoaded() ' + e.message);
                    }
                }

                _plugin = null;
                error = $.extend({}, errorMap.PluginNotAvailable, e);
            }

            return _triggerError($this, settings.error, 'Cannot Initialize Cisco Web Communicator', error);
        }; 
    }
    
    function initAddonOnDocumentReady($this) {
        $(document.body).ready(function () {
            initAddon($this);
        });
    }

    function initAddon($this) {
        if (_plugin !== null) {
            return;
        }
        
        try {
            discoverPluginTypeAndInit($this);
        } catch (e) {
            _plugin = null;
            _triggerError($this, settings.error, e);
        }
    }

    // discover addon type: FB plugin(NPAPI/ActiveX) or Chrome Native Host
    function discoverPluginTypeAndInit($this) {
        var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
        if (is_chrome === true) {
            // try release extId first
            var extSettings = {
                cwicExtId : 'ppbllmlcmhfnfflbkbinnhacecaankdh',
                verbose : settings.verbose
            };

            var createScript = function (extSettings) {
                var s = document.createElement('script');
                s.id = extSettings.cwicExtId;
                s.onload = function () {
                    cwic_plugin.init(_handlePluginMessage, extSettings);
                };
                s.onerror = function () {
                    _triggerError($this, settings.error, errorMap.ExtensionNotAvailable, 'Chrome requires Cisco Web Communicator extension');
                };
                s.src = 'chrome-extension://' + s.id + '/cwic_plugin.js';
                return s;
            };

            if (typeof cwic_plugin === 'undefined') {
                var script = createScript(extSettings);
                script.onerror = function () {
                    // remove our first attempt
                    try {
                        document.head.removeChild(document.getElementById(extSettings.cwicExtId));
                    } catch (e) {
                    }
                    // try or dev extId second
                    _log('Failed loading release version of Chrome extension.  Attempting to load dev version next.');
                    extSettings.cwicExtId = 'kekllijkldgcokjdjphahkijinjhlapf';
                    script = createScript(extSettings);
                    document.head.appendChild(script);
                };
                document.head.appendChild(script);
            } else {
                _log(true, 'calling init on previously loaded cwic_plugin script');
                extSettings.cwicExtId = cwic_plugin.about().cwicExtId;
                cwic_plugin.init(_handlePluginMessage, extSettings);
            }
            return;
        }

        var npapiPlugin = false;
        var pluginMimeType = navigator.mimeTypes['application/x-ciscowebcommunicator'];
        if ('ActiveXObject' in window) {
            // IE - try to load the ActiveX/NPAPI plug-in, throw an error if it fails
            try {
                var dummyAXObj1 = new ActiveXObject('CiscoSystems.CWCVideoCall');
                // no exception, plug-in is available
                // how to check plug-in is enabled in IE ?
                npapiPlugin = true;
            } catch (e1) {
                _log(true, 'ActiveXObject("CiscoSystems.CWCVideoCall") exception: ' + e1.message);
                // check if previous release is installed
                try {
                    var dummyAXObj2 = new ActiveXObject('ActivexPlugin.WebPhonePlugin.1');
                    // no exception. previous plug-in is available
                    throw getError('ReleaseMismatch');
                } catch (e2) {
                    _log(true, 'ActiveXObject("ActivexPlugin.WebPhonePlugin.1") exception: ' + e2.message);
                    throw getError('PluginNotAvailable');
                }
            }
        } else if (typeof pluginMimeType !== 'undefined') {
            // Firefox or Safari with our plugin
            npapiPlugin = true;
        } else {
            // plug-in not available, check if any previous release is installed
            pluginMimeType = navigator.mimeTypes['application/x-ciscowebphone'];
            if (typeof pluginMimeType !== 'undefined') {
                // previous plug-in is available
                throw getError('ReleaseMismatch');
            }
        }

        if (npapiPlugin) {
            $(document.body).append('<object id="cwc-plugin" width="1" height="1" type="application/x-ciscowebcommunicator"><param name="onload" value="_cwic_onFBPluginLoaded"></param></object>');
        } else {
            throw getError('PluginNotAvailable');
        }
    }
    
    var videopluginid = 1;

    /**
    * Creates an object that can be passed to startConversation, addPreviewWindow, or updateConversation('addRemoteVideoWindow').
    * The object is inserted into the element defined by the jQuery context - e.g. jQuery('#placeholder').cwic('createVideoWindow')
    * inserts the videowindow under jQuery('#placeholder')
    * <br>
    * <br>NOTE: This function will just 'do nothing' and the success() callback will never be called if either of the following are true:
    * <ul>
    * <li>video is not supported on the platform, see {@link aboutObject#capabilities:video}</li>
    * <li>video plugin objects are not supported in the browser, see {@link aboutObject#capabilities:videoPluginObject}</li>
    * </ul>
    * NOTE: System resources used when video windows are created cannot be reliably released on all platforms.  The application should reuse the
    * video objects returned by createVideoWindow, rather than creating new windows for each call to avoid performance problems on some client platforms.
    * @example $('#videocontainer').cwic('createVideoWindow', {
    *      id: 'videoplugin',
    *      success: function(pluginid) {$('#conversation').cwic('updateConversation',{'addRemoteVideoWindow': pluginid});}
    * });
    * @param {Object} [settings] Settings to use when creating the video render object
    * @param {String} [settings.id = generated] The DOM ID of the element to be created
    * @param {Function} [settings.success] Called when the object is loaded and ready for use plug-in ID is passed as a parameter
    * @param {String} [settings.onload] Not recommended for video windows created in the same window as the main phone plug-in.
    * <br>Mandatory in popup windows or iframes. The string must be the name of a function in the global scope, and the function
    * must call parent or opener {@link window._cwic_onPopupVideoPluginLoaded}.  This function will be called in the onload handler
    * of the video object.
    * <br>Single parameter is the videoplugin object that must be passed to the parent handler.
    */
    function createVideoWindow(settings) {
        var $this = this;
        var ab = about();
        if (ab.capabilities.video && ab.capabilities.videoPluginObject) {
            settings = settings || {};
            settings.window = settings.window || window;

            var mimetype = 'application/x-cisco-cwc-videocall';
            var onload = settings.onload || '_cwic_onVideoPluginLoaded';
            var callback = settings.success;
            var id = settings.id || '_cwic_vw' + videopluginid;
            videopluginid++;

            var windowid = videowindowloadedcallbacks.getWindowId({ window: settings.window });
            videowindowloadedcallbacks.callbacks[windowid][id] = { callback: callback, wascalled: false };

            var elemtext = '<object type="' + mimetype + '" id="' + id + '"><param name="loadid" value="' + id + '"></param><param name="onload" value="' + onload + '"></param></object>';
            $($this).append(elemtext);
        }

        return $this;
    }

    // generalization for executing video object operations.
    // Validates window object passed in
    function execVideoObjectOperation(args) {
        _log(true,'execVideoObjectOperation called with arguments', args);

        var winObj = args.window || window,
            videoObject = args.videoObject,
            methodName = args.methodName;

        if (typeof videoObject === 'string') {
            try {
                videoObject = winObj.document.getElementById(videoObject);
            } catch (e) {
                _log(true,'execVideoObjectOperation: invalid window object');
                // handle wrong window object
                if (args.error) {
                    args.error(getError('InvalidArguments'));
                }
                return;
            }
        }

        // validates video object and calls methodName on that object
        callMethodOnVideoObj({
            obj: videoObject,
            methodName: methodName,
            error: args.error || null,
            success: args.success || null,
            callId: args.callId || null
        });
    }

    /**
     * Assign a video window object to preview (self-view).
     * @example
     * $('#phone').cwic('addPreviewWindow',{previewWindow: 'previewVideoObjectID'});
     * $('#phone').cwic('addPreviewWindow',{previewWindow: previewVideoObject, window: iFramePinPWindow});
     * $('#phone').cwic('addPreviewWindow',{previewWindow: 'previewVideoObjectID', error: function(err){console.log(err)}});
     * @param {Object} args arguments object
     * @param {DOMWindow} [args.window] DOM Window that contains the plug-in Object defaults to current window
     * @param {String|Object} args.previewWindow ID or DOM element of preview window
     * @param {Function} [args.error] Called when arguments object is malformed, i.e. args.previewWindow ID or DOM element is non-existent or malformed
     */
    function addPreviewWindow(args) {
        var $this = this,
            ab = about();
          
        if (ab.capabilities.videoPluginObject === false) {
            _log(false, 'addPreviewWindow called from unsupported browser');
            return;
        } 

        args.methodName = 'addPreviewWindow';
        args.videoObject = args.previewWindow;

        execVideoObjectOperation(args);

        return $this;
    }
    /**
     * Remove a video window object from preview (self-view)
     * @example
     * $('#phone').cwic('removePreviewWindow', {
     *   previewWindow: 'previewVideoObjectID'
     * });
     * 
     * $('#phone').cwic('removePreviewWindow', {
     *   previewWindow: previewVideoObject, 
     *   window: iFramePinPWindow
     * });
     * 
     * $('#phone').cwic('removePreviewWindow', {
     *   previewWindow: 'previewVideoObjectID', 
     *   error: function (err) {
     *     console.log(err)
     *   }
     * });
     * @param {Object} args arguments object
     * @param {DOMWindow} [args.window] DOM Window that contains the plug-in Object defaults to current window
     * @param {String|Object} args.previewWindow id or DOM element of preview window
     * @param {Function} [args.error] Called when arguments object is malformed, i.e. args.previewWindow ID or DOM element is non-existent or malformed
     */
    function removePreviewWindow(args) {
        var $this = this,
            ab = about();
          
        if (ab.capabilities.videoPluginObject === false) {
            _log(false, 'removePreviewWindow called from unsupported browser');
            return;
        }      

        args.methodName = 'removePreviewWindow';
        args.videoObject = args.previewWindow;

        execVideoObjectOperation(args);

        return $this;
    }

    /**
     * Called from "startConversation" or "updateConversation"
     * @param {Object} args
     * @param {String} args.callId
     * @param {DOMWindow} args.window
     * @param {String|Object} args.remoteVideoWindow
     * @private
     */
    function addWindowToCall(args) {
        var $this = this,
            scb = args.success,
        // flag to distinguish between cases when "startRemoteVideo" or "addWindowToCall" methods should be called
        // We should call startRemoteVideo when:
        //     - new conversation is started (from startConversation API)
        //     - conversation is started without video and later video window is added through updateConversation
        //     - when swithing between 2 conversations (hold/resume)
        // We should call addWindowToCall when:
        //     - new video window is added (updateConversation.addWindowToCall) for the current conversation which already have at least 1 video window
        // All those calles are covered with activeConversation.lastId flag.
        // This flag is set when new video window is added (not when new conversation is started!) keeping the last callId value when video window was added last time
            newCall = false,
            ab = about();
          
        if (ab.capabilities.videoPluginObject === false) {
            _log(false, 'addWindowToCall called from unsupported browser');
            return;
        }  

        if (activeConversation.lastId !== args.callId) {
            newCall = true;
        }

        _log(true, 'addWindowToCall() called with arguments: ', args);
        _log(true, 'addWindowToCall(): activeConversation object: ', activeConversation);

        args.methodName = newCall ? 'startRemoteVideo' : 'addWindowToCall';
        _log(true, 'addWindowToCall() calling ' + args.methodName);

        args.videoObject = args.remoteVideoWindow;

        args.success = function (videoObj) {
            if (newCall) {
                _log(true, 'addWindowToCall(): setting activeConversation object');
                activeConversation.videoObject = videoObj;
                activeConversation.window = args.window;
                activeConversation.lastId = args.callId;
            }

            if ($.isFunction(scb)) { // if successCb was set, call it
                scb();
            }
        };

        execVideoObjectOperation(args);

        return $this;
    }

    /**
     * Called from "updateConversation"
     * @param {Object} args
     * @param {String} args.callId
     * @param {DOMWindow} args.window
     * @param {String|Object} args.remoteVideoWindow
     * @param {Boolean} args.endCall
     * @private
     */
    function removeWindowFromCall(args) {
        var $this = this,
            endCall = args.endCall, // flag to distinguish between conversation end and updateConv.removeWindowFromCall
            ab = about();
          
        if (ab.capabilities.videoPluginObject === false) {
            _log(false, 'removeWindowFromCall called from unsupported browser');
            return;
        } 
        
        if (activeConversation.lastId !== args.callId) {
            _log('cannot call removeWindowFromCall for callId ' + args.callId + '. Last call id was: ' + activeConversation.lastId);
            return;
        }

        _log(true, 'removeWindowFromCall() called with arguments: ', args);
        _log(true, 'removeWindowFromCall(): activeConversation object: ', activeConversation);

        args.methodName = endCall ? 'stopRemoteVideo' : 'removeWindowFromCall';
        _log(true, 'removeWindowFromCall() calling method ' + args.methodName);
        args.videoObject = args.remoteVideoWindow;

        execVideoObjectOperation(args);

        return $this;
    }


    /**
    * Shuts down the API<br>
    * <ul><li>Unregisters the phone</li>
    * <li>Unbinds all cwic events handlers</li>
    * <li>Clears all cwic data</li>
    * <li>Releases the Cisco Web Communicator add-on instance</li></ul>
    * @example
    *  jQuery(window).unload(function() { <br>
    *      // not necessary, it is already done in cwic.js by default
    *      // jQuery('#phone').cwic('shutdown'); <br>
    *  }); <br>
     * @example
     * jQuery('#shutdown').click(function() { <br>
    *      jQuery('#phone').cwic('shutdown'); <br>
    *  }); <br>
    */
    function shutdown(auto) {
        var $this = this;
        _log(true, 'shutdown', arguments);

        resetInitSettings();

        // auto means that shutdown is called from onunload event and not by calling API
        if (auto) {
            // _sendClientRequest('autologout'); TODO: implement
        } else {
            signOut();
        }
        
        _resetSSO();

        // unbind all cwic events handlers
        $this.unbind('.cwic');
        
        // unbind NPAPI events handlers
        _unregisterNpapiCallbacks();

        _sendClientRequest('releaseInstance');
        clientRequestCallbacks.purge();

        _plugin = null;
    }

    /**
    * Authentication result handler. Only logs received event. Sign in logic is moved to lifecycle event handlers.
    * @private
    */
    function _triggerAuthResultAndStatus($this, resultAndStatus) {
        var result = resultAndStatus.result,
            status = resultAndStatus.status;
        
        _log(true, 'authentication result: ' + result);
        _log(true, 'authentication status: ' + status);
        
        regGlobals.lastAuthStatus = status;
    }
    
    /**
    * @private
    */
    function _triggerMMDeviceEvent($this, result) {
        _log(true, 'mmDeviceChange', result);
        if (result) {
            // store the updated device list and notify the web app
            _plugin.multimediadevices = result.multimediadevices;
        }
        var event = $.Event('mmDeviceChange.cwic');
        $this.trigger(event);
    }

    /**
    * @private
    */
    function _triggerExternalWindowEvent($this, state) {
        _log(true, 'externalWindowEvent', state);

        var event = $.Event('externalWindowEvent.cwic');
        event.externalWindowState = state;
        $this.trigger(event);
    }

    // translate NPAPI events into ciscoSDKServerMessages
    function _registerNpapiCallbacks() {
        var fbMessageCbName = 'addonmessage';

        function msgHandler(result){
            var msg;
            
            try {
                msg = JSON.parse(result);
            } catch (e) {
                _log(false, 'Invalid JSON message from plugin', e);
                throw new Error(errorMap.NativePluginError.code);
            }
            
            if (msg.ciscoChannelMessage && msg.ciscoChannelMessage.ciscoSDKServerMessage) {
                if (msg.ciscoChannelMessage.client && msg.ciscoChannelMessage.client.id && msg.ciscoChannelMessage.client.id !== clientId) {
                    return;
                }
                msg = msg.ciscoChannelMessage;

            }
            _handlePluginMessage(msg);
        }

        // add property to '_registerNpapiCallbacks' function which holds the list of registered handlers. Used as a helper to unregister those handlers later.
        var handlers = _registerNpapiCallbacks.handlersList = [];

        handlers.push({name: fbMessageCbName, handler: msgHandler});

        _log(true, 'adding npapi listener for ' + fbMessageCbName);
        _addListener(_plugin.api, fbMessageCbName, msgHandler);
    }

    // remove registered NPAPI event handlers. Called in 'shutdown' to prevent multiplication of registered events in case when 'init' API function is called multiple times during one session.
    function _unregisterNpapiCallbacks() {
        var handlers = _registerNpapiCallbacks.handlersList,
            name, handler, i, n;

        if (handlers) {
            for (i = 0, n = handlers.length; i < n; i+=1) {
                name = handlers[i].name;
                handler = handlers[i].handler;

                if (typeof name === 'string' && typeof handler === 'function') {
                    _log(true, 'removing npapi listener for ' + name + ' event.');
                    _removeListener(_plugin.api, name, handler);
                }
            }
        }
        else {
            _log(true, 'trying to remove npapi listeners, but no "_registerNpapiCallbacks.handlersList" found.');
        }
    }

    /**
    * Switch mode on a session that is already authorized. Can also be used for switching to different device in the same mode<br>
    * @example
    * $('#phone').cwic('switchPhoneMode',{
    *     success: function(registration) { console.log('Phone is in '+registration.mode+' mode'); },
    *     error: function(err) { console.log('Error: '+error.message+' while switching mode'); },
    *     mode: 'DeskPhone',
    *     device: 'SEP01234567'
    * });
    * @param options
    * @param {Function} [options.progress] A handler called when the mode switch has passed pre-conditions.<br>If specified, the handler is called when the switchMode operation starts.
    * @param {Function} [options.success(registration)] A handler called when mode switch complete with registration as a parameter
    * @param {Function} [options.error(err)] A handler called when the mode switch fails on pre-conditions.  {@link $.fn.cwic-errorMapEntry} is passed as parameter.
    * @param {string} [options.mode] The new mode 'SoftPhone'/'DeskPhone'.  Defaults to SoftPhone.  If you want to change a property on a desk phone, such as the line, you must explicitly set this parameter to 'DeskPhone'.
    * @param {string} [options.device] Name of the device (e.g. SEP012345678, ECPUSER) to control. If not specified and switching from SoftPhone to DeskPhone mode, it defaults to picking first available. If not specified and switching from DeskPhone to SoftPhone mode, it defaults to output of predictDevice function (see {@link $.fn.cwic-settings.predictDevice}). If 'first available' is desired result in this case, output of custom predictDevice function should be empty string (''). If device name is invalid, it fallbacks to default device selection algorithm. 
    * @param {string} [options.line] Phone number of a line valid for the specified device (e.g. '0000'). defaults to picking first available
    * @param {Boolean} [options.forceRegistration] Specifies whether to forcibly unregister other softphone instances with CUCM. Default is false. See GracefulRegistration doc for more info.
    */
    function switchPhoneMode(options) {
        var $this = this;
        
        _log(true, 'switchPhoneMode started with arguments: ', options);
        
        if (typeof options !== 'object') {
            _log(true, 'switchPhoneMode: no arguments provided, stoping execution!');
            return $this;
        }
        
        regGlobals.successCb = $.isFunction(options.success) ? options.success : null;
        regGlobals.errorCb = $.isFunction(options.error) ? options.error : null;
        regGlobals.switchingMode = true;

        var switchModeArgs = {
            phoneMode: options.mode || 'SoftPhone',
            deviceName: options.device || (options.mode === 'SoftPhone' ? _predictDevice({ username: registration.user }) : ''),
            lineDN: options.line || '',
            forceRegistration: options.forceRegistration || false
        };
        
        function getDevicesCb(res) {
            var devices = res.devices || [],
                chooseDefault = true,
                filteredDevices,
                filteredDevicesNames,
                selectedDeviceName,
                isDeviceNameValid,
                mode = switchModeArgs.phoneMode,
                name = switchModeArgs.deviceName,
                lineDN = switchModeArgs.lineDN,
                force = switchModeArgs.forceRegistration; 
            
            filteredDevices = $.grep(devices, function (elem) {
                return (elem.isDeskPhone && mode === 'DeskPhone' || 
                        elem.isSoftPhone && mode === 'SoftPhone');
            });
            
            if (filteredDevices.length === 0) {
                _log(true, 'switchPhoneMode: filtered device list is empty!');

                if ($.isFunction(options.error)) {
                    _triggerError($this, options.error, 'no device found for mode: ' + '"' + mode + '"');
                }
                
                return $this;
            }

            filteredDevicesNames = $.map(filteredDevices, function (device) {
                return device.name;
            });

            isDeviceNameValid = (name && $.inArray(name, filteredDevicesNames) > -1);
            
            if (name && isDeviceNameValid) {
                chooseDefault = false;
            }
            
            if(!isDeviceNameValid) {
                _log(true, 'switchPhoneMode: Device name not set or invalid, proceeding with default device selection');
            }
            
            if (chooseDefault) {
                lineDN = ''; // ignore line if device name not given or not valid
                selectedDeviceName = filteredDevices[0] && filteredDevices[0].name;
            } else {
                selectedDeviceName = name;
            }
            
            _log(true, 'switchPhoneMode: selected device: ', selectedDeviceName);
            _log(true, 'switchPhoneMode: switching to mode: ', mode);
            _log(true, 'switchPhoneMode: switching to line: ', lineDN);
            
            _sendClientRequest('connect', {
                    phoneMode: mode,
                    deviceName: selectedDeviceName,
                    lineDN: lineDN,
                    forceRegistration: force
                }, 
                function successCb() {
                    onProgress({message: 'Switch mode operation started'});
                },
                function errorCb(error) {
                    if ($.isFunction(options.error)) {
                        _triggerError($this, options.error, getError(error), { message: error });
                    }
                }
            );
        }
        
        getAvailableDevices(getDevicesCb);
        
        function onProgress(msg) {
            if ($.isFunction(options.progress)) {
                try {
                    options.progress(msg);
                } catch (progressException) {
                    _log('Exception occurred in application switchPhoneMode progress callback', progressException);
                    if (typeof console !== 'undefined' && console.trace) {
                        console.trace();
                    }
                }
            }
        }
        
        return this;
    }

    /**
    * Register phone to CUCM (SIP register). Used for manual type of registration, in which connection parameters are manually configured (tftp, ccmcip, cti).
    * @param args A map with:
    * @param {String} args.user The CUCM end user name (required)
    * @param {String|Object} args.password String - clear password. Object - {encrypted: encoded password, cipher:'cucm'}
    * @param {String|Object|Array} args.cucm The list of CUCM(s) to attempt to register with (required).<br>
    * If String, it will be used as a TFTP, CCMCIP and CTI address.<br>
    * If Array, a list of String or Object as described above.
    * Three is the maximum number of addresses per server (TFTP, CCMCIP, CTI).
    * @param {String[]} [args.cucm.tftp] TFTP addresses. Maximum three values.
    * @param {String[]} [args.cucm.ccmcip] CCMCIP addresses (will use tftp values if not present). Maximum three values.
    * @param {String[]} [args.cucm.cti]  Since: 2.1.1 <br>
    * CTI addresses (will use tftp values if not present). Maximum three values.
    * @param {String} [args.mode]  Register the phone in this mode. Available modes are "SoftPhone" or "DeskPhone". Default of intelligent guess is applied after a device is selected.<br>
    * @param {Function} [args.devicesAvailable(devices, phoneMode, callback)] Callback called after successful authentication. Might be called multiple times.
    * If this callback is not specified, cwic applies the default device selection algorithm.  An array of {@link device} objects is passed so the application can select the device.<br>
    * To complete the device registration, call the callback function that is passed in to devicesAvailable as the third parameter.
    * The callback function is defined in the API, but it must be called by the function that is specified as the devicesAvailable parameter.
    * @param {Function} [args.error(err)] Callback called if the registration fails.  {@link $.fn.cwic-errorMapEntry} is passed as parameter.
    * @param {Boolean} [args.forceRegistration] Specifies whether to forcibly unregister other softphone instances with CUCM. Default is false. See GracefulRegistration doc for more info.
    * @param {Function} [args.success(registration)] Callback called when registration succeeds. A {@link registration} object is passed to the callback:
    * registerPhone examples <br>
    * @example
    * // *************************************
    * // register with lab CUCM in default mode (SoftPhone)
    * jQuery('#phone').cwic('registerPhone', {
    *     user: 'fbar',
    *     password: 'secret', // clear password
    *     cucm: '1.2.3.4',
    *     success: function (registration) {
    *         console.log('registered in mode ' + registration.mode);
    *         console.log('registered with device ' + registration.device.name);
    *     }
    * });
    * @example
    * // *************************************
    * // register with Alpha CUCM in DeskPhone mode with encrypted password
    * jQuery('#phone').cwic('registerPhone', {
    *     user: 'fbar',
    *     password: {
    *         encoded: 'GJH$&*"@$%$^BLKJ==',
    *         cipher: 'cucm'
    *     },
    *     mode: 'DeskPhone',
    *     cucm: '1.2.3.4',
    *     success: function (registration) {
    *         console.log('registered in mode ' + registration.mode);
    *         console.log('registered with device ' + registration.device.name);
    *     }
    * );
    * @example
    * // *************************************
    * // register with Alpha CUCM in SoftPhone mode, select ECP{user} device
    * jQuery('#phone').cwic('registerPhone', {
    *     user: 'fbar',
    *     password: {
    *         encoded: 'GJH$&*"@$%$^BLKJ==',
    *         cipher: 'cucm'
    *     },
    *     mode: 'SoftPhone',
    *     cucm: {
    *         ccmcip: ['1.2.3.4'],
    *         tftp: ['1.2.3.5']
    *     },
    *     devicesAvailable: function (devices, phoneMode, callback) {
    *         for (var i = 0; i &lt; devices.length; i++) {
    *             var device = devices[i];
    *             if (device.name.match(/^ECP/i)) {
    *                 callback(phoneMode, device);
    *             } // starts with 'ECP'
    *         }
    *         return; // stop registration if no ECP{user} device found
    *     },
    *     success: function (registration) {
    *         console.log('registered in mode ' + registration.mode);
    *         console.log('registered with device ' + registration.device.name);
    *     },
    *     error: function (err) {
    *         console.log('cannot register phone: ' + err.message);
    *     }
    * );
    */
    function registerPhone(args) {
        var $this = this,
            devicesAvailableCb,
            tftp = [],
            ccmcip = [],
            cti = [],
            result,
            props = {},
            passphrase;

        // function definitions (callbacks)
        //
        function encryptCb(res) {
            if (res) {
                // update passphrase with encrypted result
                passphrase = {
                    cipher: 'cucm',
                    encrypted: res
                };
            }
            // continue with get and set for various props...
            _sendClientRequest('setProperty', {
                'TftpAddressList': tftp
            }, createCb('TftpAddressList'));

            _sendClientRequest('setProperty', {
                'CtiAddressList': cti
            }, createCb('CtiAddressList'));

            _sendClientRequest('setProperty', {
                'CcmcipAddressList': ccmcip
            }, createCb('CcmcipAddressList'));

            _sendClientRequest('getProperty', 'connectionStatus', createCb('connectionStatus'));
        }

        // first need to set/get a bunch of props before moving on to authenticateAndConnect
        function createCb(name) {
            return function (res) {
                _log(true, name + ' callback received');
                props[name] = res[name];
                if (props.hasOwnProperty('TftpAddressList') &&
                    props.hasOwnProperty('CtiAddressList') &&
                    props.hasOwnProperty('CcmcipAddressList') &&
                    props.hasOwnProperty('connectionStatus')
                ) {
                    // all callbacks returned
                    _log(true, 'All prop callbacks received.  Continuing toward authenticateAndConnect', props);

                    _plugin.connectionStatus = props.connectionStatus;

                    // now move on to authenticateAndConnect
                    authenticateAndConnect();
                }
            };
        }

        // authenticateAndConnect gets called after all the property set and get callbacks return
        function authenticateAndConnect() {
            var currState = _plugin.connectionStatus;
            
            // is the plugin already ready ?
            if (currState === 'eReady') { // state = connection status, not a call state!
                _triggerProviderEvent($this, currState);
            }
            regGlobals.passphrase = passphrase;

            if (currState !== 'eReady') { // state = connection status, not a call state!    
                regGlobals.currState = currState;
                
                // authenticatedCallback is called affter receiving authenticationresult event with positive outcome
                regGlobals.authenticatedCallback = getAuthenticatedCb(devicesAvailableCb, $this);
                
                // in this step, passphrase must be in encrypted format
                if (!passphrase.encrypted || (passphrase.cipher !== 'cucm')) {
                    return _triggerError($this, regGlobals.errorCb, errorMap.InvalidArguments, 'authenticateAndConnect: invalid passphrase (type ' + typeof passphrase + ')', {
                        registration: registration
                    });
                }
                
                // plugin is saving credentials, so, after first login attempt with wrong credentials, credentialsRequired is triggered with "wrongCredentials" error. 
                // When next time lifecycle is started, the same message will be again attached to credentialsRequired event, which will cause _triggerError call... 
                // So, instead of starting lifecycle every time registerPhone is called, only encrypt new credentials and submit.
                if (regGlobals.errorState === 'credentialsRequired') {
                    _triggerCredentialsRequired($this, {
                        errors: [],
                        error: '',
                        authenticatorId: regGlobals.lastAuthenticatorId});
                } else {
                    _sendClientRequest('startSignIn', {
                            manualSettings: true
                        }, $.noop,
                        function errorCb(error) {
                            _triggerError($this, regGlobals.errorCb, getError(error), error, {
                                registration: registration
                            });
                        }
                    );    
                }
            }
        }
       
        ////////////////////////////////
        // registerPhone main logic     
        logArgsWithMaskedPassphrase(args);

        // M for manual
        setRegGlobalsM(args);

        try {
            result = parseAndCheckArgs(args, $this);
            devicesAvailableCb = result.devicesAvailableCb;
            tftp = result.tftp;
            ccmcip = result.ccmcip;
            cti = result.cti;
            passphrase = result.passphrase;
        } catch (e) {
            // parseAndCheckArgs triggers error callback
            return $this;
        }

        if (typeof passphrase === 'string') {
            // clear passphrase, encrypt it
            _sendClientRequest('encryptCucmPassword', passphrase, encryptCb);
        } else {
            // passphrase valid and already encrypted
            encryptCb();
        }

        return $this;
    } 
    
    // for registerPhone
    function logArgsWithMaskedPassphrase(args) {
        var argsForLog = $.extend({}, args);

        if (argsForLog.passphrase) {
            argsForLog.passphrase = '*****';
        }

        if (argsForLog.password) {
            argsForLog.password = '*****';
        }

        _log(true, 'manualSignIn', argsForLog);
    }

    // for registerPhone
    // M for Manual
    function setRegGlobalsM(args) {
        // flag to indicate cwic is in the process of registering a phone in manual mode
        regGlobals.registeringPhone = true;
        regGlobals.manual = true;

        // reset global registration object
        registration = {
            user: args.user,
            mode: args.mode || 'SoftPhone',
            devices: {},
            forceRegistration: args.forceRegistration || false
        };

        regGlobals.successCb = $.isFunction(args.success) ? args.success : null;
        regGlobals.errorCb = $.isFunction(args.error) ? args.error : null;
        regGlobals.CUCM = args.cucm;
        regGlobals.user = args.user;

        _log(true, 'setRegGlobalsM: regGlobals set: ', regGlobals);
        _log(true, 'setRegGlobalsM: registration set: ', registration);
    }
    
    // for registerPhone
    function parseAndCheckArgs(args, $this) {
        var passphraseValidator = validators.get('passphrase'),
            result = {
                devicesAvailableCb: null,
                tftp: [],
                ccmcip: [],
                cti: [],
                passphrase: ''
            };

        result.devicesAvailableCb = $.isFunction(args.devicesAvailable) ? args.devicesAvailable : null;

        // check plugin state also!
        if (!_plugin) {
            _triggerError($this, regGlobals.errorCb, errorMap.PluginNotAvailable, 'Plug-in is not available or has not been initialized', {
                registration: registration
            });
            throw new Error('Break manual login');
        }

        // parse CUCM argument into tftp, ccmcip and cti arrays (list of String addresses)
        // from the 11.0 release and on, tftp, ccmcip and cti are limited to 3 addresses only

        // args.cucm can be a String, an Object or an Array of both
        $.each($.makeArray(args.cucm), function (i, elem) {
            if (typeof elem === 'string') {
                // cucm string can be 'lab call manager 1.2.3.4'
                var a = elem.split(' ').pop();
                result.tftp.push(a);
                result.ccmcip.push(a);
                result.cti.push(a);
            } else if (typeof elem === 'object') {
                var tftpElem = []; // the tftp array of the current elem
                var hasOneProperty = false; // just to log a warning

                if ($.isArray(elem.tftp)) {
                    result.tftp = result.tftp.concat(elem.tftp);
                    tftpElem = elem.tftp;
                    hasOneProperty = true;
                }

                if ($.isArray(elem.ccmcip)) {
                    result.ccmcip = result.ccmcip.concat(elem.ccmcip);
                    hasOneProperty = true;
                } else {
                    // ccmcip defaults to tftp (backward compatibility)
                    result.ccmcip = result.ccmcip.concat(tftpElem);
                }

                if ($.isArray(elem.cti)) {
                    result.cti = result.cti.concat(elem.cti);
                    hasOneProperty = true;
                } else {
                    // cti defaults to tftp (backward compatibility)
                    result.cti = result.cti.concat(tftpElem);
                }

                if (!hasOneProperty) {
                    _log('registerPhone: no ccmcip/tftp/cti properties for cucm element');
                    _log(true, elem);
                }
            } else {
                _log('registerPhone: ignoring cucm argument of type ' + typeof elem);
            }
        });

        _log('registerPhone: ' + result.tftp.length + ' cucm TFTP address(es)');
        _log(true, result.tftp);
        _log('registerPhone: ' + result.ccmcip.length + ' cucm CCMCIP address(es)');
        _log(true, result.ccmcip);
        _log('registerPhone: ' + result.cti.length + ' cucm CTI address(es)');
        _log(true, result.cti);

        if (result.tftp.length > 3 || result.ccmcip.length > 3 || result.cti.length > 3) {
            _log('registerPhone: Server address(es) are limited to 3 values. Only first 3 values will be kept.');
            result.tftp = result.tftp.splice(0, 3);
            result.ccmcip = result.ccmcip.splice(0, 3);
            result.cti = result.cti.splice(0, 3);
        }

        _log('registerPhone of user=' + registration.user + ' in mode="' + registration.mode + '"');

        if (!registration.user) {
            _triggerError($this, regGlobals.errorCb, errorMap.InvalidArguments, 'Missing user name', {
                registration: registration
            });
            throw new Error('Break manual login');
        }

        if (!$.isArray(result.tftp) || result.tftp.length < 1) {
            _triggerError($this, regGlobals.errorCb, errorMap.NoCallManagerConfigured, 'Missing CUCM address', {
                registration: registration
            });
            throw new Error('Break manual login');
        }

        if (!registration.mode.match(/^(SoftPhone|DeskPhone)$/)) {
            _triggerError($this, regGlobals.errorCb, errorMap.InvalidArguments, 'Invalid phone mode "' + registration.mode + '"', {
                registration: registration
            });
            throw new Error('Break manual login');
        }

        // validate password
        result.passphrase = args.passphrase || args.password;

        if (typeof result.passphrase === 'string') {
            if (passphraseValidator.isNotValid(result.passphrase)) {
                _triggerError($this, regGlobals.errorCb, errorMap.InvalidArguments, 'invalid passphrase', {
                    registration: registration
                });
                throw new Error('Break manual login');
            }
        } else if (typeof result.passphrase !== 'object' || (result.passphrase.cipher !== 'cucm')) {
            _triggerError($this, regGlobals.errorCb, errorMap.InvalidArguments, 'invalid passphrase (type ' + typeof result.passphrase + ')', {
                registration: registration
            });
            throw new Error('Break manual login');
        } else {
            if (passphraseValidator.isNotValid(result.passphrase.encrypted)) {
                _triggerError($this, regGlobals.errorCb, errorMap.InvalidArguments, 'invalid passphrase', {
                    registration: registration
                });
                throw new Error('Break manual login');
            }
        }

        return result;
    }
    
    /**
     * Alias for {@link $.fn.cwic-registerPhone}
     */
    function manualSignIn() {
        return;
    }
    
    /** <br>
    * Unregisters a phone from CUCM:<ul>
    * <li>Ends any active call if this is the last instance or forceLogout is set to true.</li>
    * <li>In softphone mode, SIP unregisters, in deskphone mode, closes the CTI connection.</li>
    * <li>Calls the optional complete handler (always called).</li></ul>
    * @param args Is a set of key/value pairs to configure the phone unregistration.
    * @param {Function} [args.complete] Callback called when unregistration is successfully completed.<br>
    * If specified, the handler is called only in the case where the phone was already registered.
    * @param {Boolean} args.forceLogout: If true, end the phone session even if registered in other instances.
    * unregisterPhone examples
    * @example
    * // *************************************
    * // unregister phone
    * jQuery('#phone')
    *     .unbind('.cwic')             // optionally unbind cwic events (it's done in shutdown API automatically)
    *     .cwic('unregisterPhone', {
    *         forceLogout: true,   
    *         complete: function() {
    *             console.log('phone is unregistered');
    *         }
    * });
    */
    function unregisterPhone() {
        _log(true, 'unregisterPhone', arguments);

        var $this = this;
        
        // have to close it here because of ECC bug, which cause plugin to crash during signing out while call in progress (preview + remote video)
        hideExternalWindow();

        // should we remove forceLogout parameter at all? What is the purpose of it? If it is false, nothing happens
        // leave it only for backward compatibility
        if (isObject(arguments[0]) && arguments[0].forceLogout === true) {
            _sendClientRequest('logout');

            // reset global registration object
            registration = { 
                devices: {} 
            };
        }

        if (isObject(arguments[0]) && typeof arguments[0].complete === 'function') {
            // call complete callback
            var complete = arguments[0].complete;
            regGlobals.unregisterCb = function () {
                _log(true, 'Calling unregisterCb...');
                try {
                    complete();
                } catch (completeException) {
                    _log('Exception occurred in application unregister complete callback', completeException);
                    if (typeof console !== 'undefined' && console.trace) {
                        console.trace();
                    }
                }

                regGlobals.unregisterCb = null;
            };
        }
        
        _reset();
        
        return $this;
    }
    
     /** <br>
    * Signs out a registered device from CUCM:<ul> 
    * <li>Ends any active call.</li>
    * <li>In softphone mode, SIP unregisters, in deskphone mode, closes the CTI connection.</li>
    * <li>Calls the optional complete callback</li></ul>
    * If specified, the function is called only in the case where the phone was already registered. <br>
    * <b>Note:</b> This API is a preferred alternative to unregisterPhone API.<br>
    * <br>
    * signOut examples: <br>
    * @example
    * // *************************************
    * // signOut device
    * jQuery('#phone')
    *     .cwic('signOut', {
    *         complete: function() {
    *             console.log('device is signed out');
    *         }
    * });
    * 
    * @param [args] Is a set of key/value pairs to configure the phone signOut.
    * @param {Function} [args.complete] Callback called when sign out is successfully completed.<br>
    */
    function signOut(args) {
        var completeCb;
        _log(true, 'signOut', arguments);
        
        if (isObject(arguments[0]) && typeof arguments[0].complete === 'function') {
            // call complete callback
            completeCb = arguments[0].complete;
        }
        
        unregisterPhone({forceLogout:true, complete: completeCb});
    }

    /**
     * Should clear all resources occupied during the signIn/registerPhone process and during regular usage of registered device.
     * @private
     */
    function _reset() {
        _log(true, '_reset: reseting regGlobals...');
        // clear all cwic data - data attached with $('.cwic-data').data('cwic', somedata);
        $('.cwic-data').removeData('cwic');
        resetGlobals();
    }

    function objEqual(o1, o2) {
        var equal = true;

        if (o1 === o2) {
            return true;
        }

        $.each(o1, function (key, value) {
            if(o2[key] !== value) equal = false;
        });

        return equal;
    }

  /**
   * IMPORTANT: if new property is added to call object, this function must be updated !!!!
   * @param c1
   * @param c2
   * @returns {boolean}
   */
    function compareConversationObjects(c1, c2) {

        if (
            c1.audioMuted !== c2.audioMuted ||
            c1.callType !== c2.callType ||
            c1.isConference !== c2.isConference ||
            c1.exists !== c2.exists ||
            c1.videoDirection !== c2.videoDirection ||
            c1.videoMuted !== c2.videoMuted

        ) {
            return false;
        }

        if (
            !objEqual(c1.capabilities, c2.capabilities) ||
            !objEqual(c1.localParticipant, c2.localParticipant) ||
            !objEqual(c1.participant, c2.participant) ||
            c1.participants.length !== c2.participants.length ||
            !objEqual(c1.videoResolution, c2.videoResolution)
        ) {
            return false;
        }

        return true;
    }

    function _triggerConversationEvent($this, conversation, topic) {
        var conversationId = conversation.callId;
        var conversationState = conversation.callState;
        var lastConversation = lastConversationMap[conversationId];

        // bypass JCF bug that emits "Connected" state after conversation is ended - this can cause various bugs, i.e. calling showCallInExternalWindow after conversation is destroyed
        // it works for locally ended calls, but not for calls ended by the other side
        if (conversationId === regGlobals.endingCallForId && conversationState === 'Connected') {
            _log(true, 'Ignoring "connect" state [ending call]!', conversation);
            return;
        }

        // ... so, additionally filter all duplicated 'Connect' state notifications
        lastConversationMap[conversationId] = conversation;
        if (
            lastConversation && lastConversation.callState === 'Connected' && conversationState  === 'Connected' &&
            compareConversationObjects(conversation, lastConversation)
        ) {
            _log(true, 'Ignoring "connect" state!', conversation);
            return;
        }

        // prevent call transfer while another one is in progress
        if (transferCallGlobals.inProgress) {
            conversation.capabilities.canDirectTransfer = false;
        }

        // determine first participant name and number (remote participant)
        // CSCug19119: we no longer use conversation.calledPartyName and conversation.calledPartyNumber since those are depreciated from ECC
        // instead, just grab the first entry from participants list, if available
        var participant = (conversation.participants && conversation.participants.length > 0) ? conversation.participants[0] : {};
        var number = (participant.directoryNumber && participant.directoryNumber !== '') ? participant.directoryNumber : participant.number;
        participant = $.extend({}, participant, { recipient: number });

        // select the conversation container with class cwic-conversation-{conversationId}
        var container = $('.cwic-conversation-' + conversationId);

        // if no container, select the outgoing conversation (see startConversation)
        if (container.length === 0) {
            container = $('.cwic-conversation-outgoing');

            // in deskphone mode, container may not exist yet if conversation was initiated from deskphone
            //if (container.length == 0 && conversation.callType == 'Outgoing') {
            //container = $('<div>').addClass('cwic-conversation-outgoing');
            //}
        }

        // at this point container may be empty, which means the conversation is incoming

        var data = container.data('cwic') || {};

        _log(true, 'conversation id=' + conversationId + ' state=' + conversation.callState || data.state, conversation);

        // extend conversation
        conversation = $.extend({}, data, conversation, {
            id: conversationId,
            state: conversationState || data.state,
            participant: $.extend(data.participant, participant)
        });

        /* ECC call states and old skittles/webphone states
        OnHook : Disconnected
        OffHook : Created
        Ringout : RemotePartyAlerting
        Ringin : Alerting
        Proceed : Ringin on Deskphone while on a call amongst others
        Connected : Connected
        Hold : Held
        RemHold : "Passive Held"
        Resume : ?
        Busy : n/a (connected)
        Reorder : Failed
        Conference : n/a
        Dialing : Dialing
        RemInUse : "Passive not held" ("RemInUse" should indicate 'Remote In-Use' state, i.e. the line is a shared-line, and another device is actively using the shared line.)
        HoldRevert : n/a
        Whisper : n/a
        Parked : n/a
        ParkRevert : n/a
        ParkRetrieved : n/a
        Preservation : n/a
        WaitingForDigits : na/ ? Overlapdial capability ?
        Spoof_Ringout : n/a
        */
        // check for an incoming call - based on condition:
        // * Empty container and conversation state 'Ringin'
        if (conversation.state === 'Ringin' && container.length === 0) {
            // new container for incoming call, application is supposed to attach it to the DOM
            container = $('<div>').addClass('cwic-data cwic-conversation cwic-conversation-' + conversationId).data('cwic', conversation);
            $this.trigger('conversationIncoming.cwic', [conversation, container]);
            return;
        } else if ((conversation.state === 'OnHook' && !conversation.capabilities.canOriginateCall) || !conversation.exists) {
            // If we can originate a call, onHook does not mean the call has ended - it means it's just about to start

            removeWindowFromCall({
                callId: conversationId,
                remoteVideoWindow: activeConversation.videoObject,
                window: activeConversation.window,
                endCall: true
            });

            if (container.length === 0) {
                _log('warning: no container for ended conversation ' + conversationId);
                $this.trigger('conversationEnd.cwic', [conversation]);
                return;
            }

            container.removeData('cwic')
                .removeClass('cwic-data cwic-conversation cwic-conversation-' + conversation.id)
                .trigger('conversationEnd.cwic', [conversation]);
            
            return;
        } else {
            if (conversation.state === 'OffHook' || conversation.state === 'Connected') {

                // store media connection time
                if (typeof conversation.connect === 'undefined' && conversation.state === 'Connected') {
                    if (container.length === 0) {
                        container = $('<div>').addClass('cwic-conversation cwic-conversation-' + conversationId);
                    }
                    $.extend(conversation, { connect: new Date() });
                    container.data('cwic', conversation);
                }

                // store start time and trigger start event only once
                if (typeof conversation.start === 'undefined') {
                    if (container.length === 0) {
                        container = $('<div>');
                    }
                    $.extend(conversation, { start: new Date() });
                    container.data('cwic', conversation);

                    container
                        .removeClass('cwic-conversation-outgoing')
                        .addClass('cwic-conversation cwic-conversation-' + conversationId)
                        .data('cwic', conversation);

                    $this.trigger('conversationStart.cwic', [conversation, container]);
                    return;
                }
            }

            if (container.length === 0) {
                // if we've just switched to deskphone mode and there's already a call, create a container div
                // or if we've just opened a new tab, we also need to trigger a conversation start for an ongoing call
                container = $('<div>').data('cwic', conversation).addClass('cwic-conversation cwic-conversation-' + conversationId);
                _log('warning: no container for updated conversation ' + conversationId);
                if (conversation.exists) {
                    $this.trigger('conversationStart.cwic', [conversation, container]);
                    return;
                } else {
                    $this.trigger('conversationUpdate.cwic', [conversation, container]); // trigger update event
                    return;
                }

            } else {
                container.data('cwic', conversation);
            }

            container.trigger('conversationUpdate.cwic', [conversation, container]); // trigger update event
        }

    } // function _triggerConversationEvent

    /**
    * _triggerError(target, [callback], [code], [data]) <br>
    * <br>
    * - target (Object): a jQuery selection where to trigger the event error from <br>
    * - callback (Function): an optional callback to be called call with the error. if specifed, prevents the generic error event to be triggered <br>
    * - code (Number): an optional cwic error code (defaults to 0 - Unknown) <br>
    * - data (String, Object): some optional error data, if String, used as error message. if Object, used to extend the error. <br>
    * <br>
    * cwic builds an error object with the following properties: <br>
    *  code: a pre-defined error code <br>
    *  message: the error message (optional) <br>
    *  any other data passed to _triggerError or set to errorMap (see the init function) <br>
    *  <br>
    * When an error event is triggered, the event object is extended with the error properties. <br>
    * <br>
    */
    function _triggerError() {
        var $this = arguments[0]; // target (first mandatory argument)
        var errorCb = null;

        // the default error
        var error = $.extend({ details: [] }, errorMap.Unknown);

        // extend error from arguments
        for (var i = 1; i < arguments.length; i++) {
            var arg = arguments[i];

            // is the argument a specific error callback ?
            if ($.isFunction(arg)) { errorCb = arg; }

            else if (typeof arg === 'string') { error.details.push(arg); }

            else if (typeof arg === 'object') { $.extend(error, arg); }

        }

        _log(error.message, error);

        // if specific error callback, call it
        if (errorCb) {
            try {
                errorCb(error);
            } catch (errorException) {
                _log('Exception occurred in application error callback', errorException);
                if (typeof console !== 'undefined' && console.trace) {
                    console.trace();
                }
            }

        } else {
            // if no specific error callback, raise generic error event
            var event = $.Event('error.cwic');
            $.extend(event, error);
            $this.trigger(event);
        }

        return $this;
    }

    /**
    * @param {Object|call} conversation Can be a new object to start a new conversation or an existing {@link call} which you wish to answer.
    * @param {Number} conversation.id Unique identifier of the conversation.  Required when referencing an exising call.
    * @param {participant} conversation.participant First remote participant of the call.
    * @param {String} conversation.participant.recipient The phone number of the participant.  Required when placing a new outbound call.  This will be the dialed number for the call.
    * @param {String} [conversation.participant.name] The participant name.
    * @param {String} [conversation.participant.photosrc] A suitable value for the src attribute of an &lt;img&gt; element.
    * @param {String} [conversation.state] Current state of the conversation. Can be OffHook, Ringing, Connected, OnHook, Reorder.
    * @param {Date} [conversation.start] Start time. Defined on resolution update only.
    * @param {Date} [conversation.connect] Media connection time. Defined on resolution update only.
    * @param {Object} [conversation.videoResolution] Resolution of the video conversation, contains width and height properties. Defined on resolution update only.
    * @param {String|Object} [conversation.container] The HTML element which contains the conversation. Conversation events are triggered on this element.
    * If String, specifies a jQuery selector If Object, specifies a jQuery wrapper of matched elements(s).
    * By default container is $(this), that is the first element of the matched set startConversation is called on.
    * @param {String} [conversation.subject] The subject of the conversation to start.
    * @param {Function} [conversation.error(err)] A function to be called if the conversation cannot be started.  {@link $.fn.cwic-errorMapEntry} is passed as parameter.
    * @param {String} [conversation.videoDirection] The video media direction: 'Inactive' or undefined (audio only by default), 'SendOnly', 'RecvOnly' or 'SendRecv'.
    * @param {Object} [conversation.remoteVideoWindow] The video object (must be of mime type application/x-cisco-cwc-videocall).
    * @param {DOMWindow} [conversation.window] DOM window that contains the remoteVideoWindow (default to this DOM window) required if specifying a video object on another window (popup/iframe).
    * @description Start a conversation with a participant.
    * <br>If conversation contain both an ID and a state property, cwic assumes you want to answer that incoming conversation, in this case starting the passed conversation means accepting(answering) it.
    * @example
    * // start an audio conversation with element #foo as container
    * jQuery('#phone').cwic('startConversation', {
    *   participant: {
    *     recipient: '1234'
    *   },
    *   container: '#foo'
    * });
    * // start an audio conversation with a contact (call work phone number)
    * jQuery('#conversation').cwic('startConversation', {
    *   participant: {
    *     recipient: '1234',
    *     displayName: 'Foo Bar',
    *     screenName: ' fbar',
    *     phoneNumbers: {
    *       work: '1234',
    *       mobile: '5678'
    *     }
    *   }
    * });
    * // answer an incoming conversation (input has an id property)
    * // see another example about the conversationIncoming event
    * jQuery('#conversation').cwic('startConversation', {
    *   participant: {
    *     recipient: '1234'
    *   },
    *   id: '612',
    *   state: 'Ringin'
    * });
    * // answer an incoming conversation with video
    * jQuery('#conversation').cwic('startConversation',
    *   jQuery.extend(conversation,{
    *   videoDirection: (sendingVideo ? 'SendRecv':''),
    *   remoteVideoWindow: 'remoteVideoWindow',  // pass id
    *   id: callId
    * }));
    * // answer an incoming conversation with video object hosted in popoutwindow
    * jQuery('#conversation').cwic('startConversation',
    *   jQuery.extend(conversation,{
    *   videoDirection: (sendingVideo ? 'SendRecv':''),
    *   remoteVideoWindow: $('#remoteVideoWindow', popoutwindow.document)[0] // pass object setting jQuery context to popoutwindow document
    *   window: popoutwindow,
    *   id: callId
    * }));
    * // answer an incoming conversation without video
    * jQuery('#callcontainer').cwic('startConversation', conversation);
    */
    function startConversation() {
        _log(true, 'startConversation', arguments);

        var $this = this;

        var callsettings = arguments[0] || $this.data('cwic') || {};
        var windowhandle, videoDirection;

        if ($this.length === 0) {
            return _triggerError($this, callsettings.error, errorMap.InvalidArguments, 'cannot start conversation with empty selection');
        }

        // container is the jQuery wrapper of the video container
        var container = $this;

        if (typeof callsettings.container === 'string') {
            container = $(callsettings.container);
        } else if (typeof callsettings.container === 'object') {
            container = callsettings.container;
        }

        container = container.first();

        if (typeof callsettings.id !== 'undefined') {
            // start an incoming conversation
            container.addClass('cwic-data cwic-conversation cwic-conversation-' + callsettings.id).data('cwic', callsettings);

            if (arguments.length >= 1) {
                videoDirection = callsettings.videoDirection;
                if (callsettings.remoteVideoWindow) {
                    addWindowToCall({
                        callId: callsettings.id,
                        remoteVideoWindow: callsettings.remoteVideoWindow
                    });

                    if (callsettings.remoteVideoWindow.windowhandle) {
                        windowhandle = callsettings.remoteVideoWindow.windowhandle;
                    }
                }
            } else {
                videoDirection = '';
            }

            var answerObject = {
                callId: callsettings.id,
                videoDirection: videoDirection
            };

            if (windowhandle) {
                answerObject.windowhandle = windowhandle;
            }

            _sendClientRequest('answer', answerObject);

        } else {
            // start an outgoing conversation
            var participant = callsettings.participant || {};

            if (typeof participant === 'string') {
                participant = { recipient: participant };
            }

            if (typeof participant.recipient === 'undefined') {
                return _triggerError($this, callsettings.error, errorMap.InvalidArguments, 'cannot start conversation: undefined or empty recipient');
            }

            container.addClass('cwic-data cwic-conversation cwic-conversation-outgoing').data('cwic', { participant: participant });

            if (container.is(':hidden')) {
                _log(true, 'startConversation - warning: container is hidden');
            }

            var originateObject = {
                recipient: participant.recipient,
                videoDirection: callsettings.videoDirection
            };

            if (callsettings.remoteVideoWindow && callsettings.remoteVideoWindow.windowhandle) {
                originateObject.windowhandle = callsettings.remoteVideoWindow.windowhandle;
            }

            _sendClientRequest('originate', originateObject,
                function originateCb(res) {
                    if (res.callId && res.callId >= 1) {
                        if (callsettings.remoteVideoWindow) {
                            callsettings.window = callsettings.window || window;

                            addWindowToCall({
                                callId: res.callId,
                                remoteVideoWindow: callsettings.remoteVideoWindow,
                                window: callsettings.window
                            });

                        }
                    }
                },
                function errorCb(error) {
                    if (error) {
                        _log(true, 'originate error', error);
                        _triggerError($this, getError(error), error, 'cannot start conversation');
                        }
                    }
                );
        }

        return $this;
    }

    /**
    * @description Ends a conversation. Triggers a conversationEnd event.
    * @param {boolean} iDivert If true, redirects the call to voice mail. See UCM documentation on the Immediate Divert (iDivert) feature for details. The call can be iDiverted only if {@link call#capabilities} contains 'canImmediateDivert',
    * @param {String|Object} id A conversation identifier (String) or an Object containing an id property.
    * @example
    *  // typeof input is string
    * jQuery('#phone').cwic('endConversation', '1234');
    *  // or
    * jQuery('#phone').cwic('endConversation', conversation.id);
    *  // typeof input is object
    * jQuery('#phone').cwic('endConversation', conversation);
    *  // let cwic find the conversation data attached to #conversation
    * jQuery('#conversation').cwic('endConversation');
    *  // iDivert the conversation
    * jQuery('#myconversation').cwic('endConversation', true);
    *  // iDivert and specify conversation id as a string
    * jQuery('#phone').cwic('endConversation', true, '1234');
    *
    *
    */
    function endConversation() {
        _log(true, 'endConversation', arguments);

        var $this = this;

        if ($this.length === 0) {
            return $this;
        }

        var iDivert = null;
        var conversation = null;
        var conversationId = null;

        if (arguments.length === 0) {
            conversation = $this.data('cwic');

            if (!conversation) {
                return _triggerError($this, 'cannot end conversation: no conversation exists for this element');
            }

            conversationId = conversation.id;
        } else if (arguments.length === 1) {
            iDivert = typeof arguments[0] === 'boolean' ? arguments[0] : null;
            conversation = typeof arguments[0] === 'object' ? arguments[0] : $this.data('cwic');
            conversationId = typeof arguments[0] === 'string' ? arguments[0] : conversation.id;
        } else if (arguments.length === 2) {
            iDivert = typeof arguments[0] === 'boolean' ? arguments[0] : null;
            conversation = typeof arguments[1] === 'object' ? arguments[1] : $this.data('cwic');
            conversationId = typeof arguments[1] === 'string' ? arguments[1] : conversation.id;
        }

        if (!conversationId) {
            return _triggerError($this, errorMap.InvalidArguments, 'cannot end conversation: undefined or empty conversation id');
        }
        
        if (transferCallGlobals.callId === conversationId) {
            transferCallGlobals.endTransfer();
        }

        if (iDivert) {
            // need to check capabilities first
            conversation = conversation || $('.cwic-conversation-' + conversationId).data('cwic');

            if (!conversation) {
                return _triggerError($this, 'cannot iDivert - undefined conversation');
            }

            if (!conversation.capabilities || !conversation.capabilities.canImmediateDivert) {
                return _triggerError($this, errorMap.CapabilityMissing, 'cannot iDivert - missing capability', { conversation: conversation });
            }

            _log(true, 'iDivert conversation', conversation);
            
            _sendClientRequest('iDivert', {
                callId: conversationId
            });
        } else {
            _log(true, 'end conversation', conversation);
            
            regGlobals.endingCallForId = conversationId;
            
            _sendClientRequest('endCall', {
                callId: conversationId
            });
        }

        return $this;
    }
    /**
    * @description Updates an existing conversation.<br>
    * This function controls the call allowing the following operations<ul>
    * <li>hold call</li>
    * <li>resume call</li>
    * <li>mute call</li>
    * <li>unmute call</li>
    * <li>mute audio only</li>
    * <li>mute video only</li>
    * <li>unmute audio only</li>
    * <li>unmute video only</li>
    * <li>add video window for remote sender</li>
    * <li>remove video window for remote sender</li>
    * <li>update video preference on a call video escalate/de-escalate</li>
    * <li>conference two calls together</li>
    * <li>transfer a call</li>
    * </ul>
    * Transfer call flow:
    * <ol>
    * <li>establish a conversation between clients A and B.</li>
    * <li>call "transferCall" API to transfer a conversation to the number of client C. A conversation between clients A and C is established.
    * <li>Now, client A have an option to complete an ongoing call transfer. If the call transfer is completed, 
    * conversation between clients B and C is established and client A is put out from both conversations. To cancel call transfer, endConversation should be called.</li>
    * </ol>
    * There are two ways to implement the final step of call transfer flow. The first one is to pass a "complete" button, 
    * either its id or jQuery object, to the "transferCall" API and library will automatically attach/detach handler and enable/disable the button when it's appropriate.
    * If more specific behavior is desired comparing to this higher level API, then 'callTransferInProgress.cwic' event could be implemented, see {@link $.fn.cwic#event:callTransferInProgress}
    * @param {String|Object} update Update a started conversation. update can be: <br>
    * A String: hold, resume, mute, unmute, muteAudio, muteVideo, unmuteAudio, unmuteVideo.<br>
    * An Object: contains one or more writable conversation properties to update e.g. videoDirection.<br>
    * Triggers a conversationUpdate event.
    * @param {String|Object} id A conversation identifier (String) or Object containing an id property <br>
    * @example
    * // typeof input is string HOLD/RESUME
    * jQuery('#phone').cwic('updateConversation', 'hold', '1234')
    * jQuery('body').cwic('updateConversation', 'hold', conversation.id);
    * jQuery('#myid').cwic('updateConversation', 'hold', conversation);
    *   // typeof input is object
    * jQuery('#conversation').cwic('updateConversation', 'hold');
    *   // resume the same conversation,
    *   // let cwic find the conversation data attached to #conversation
    * jQuery('#conversation').cwic('updateConversation', 'resume');
    *   // MUTE/UNMUTE
    *   // typeof input is string
    * jQuery('#phone').cwic('updateConversation', 'mute', '1234');
    * jQuery('body').cwic('updateConversation', 'mute', conversation.id);
    * jQuery('#myid').cwic('updateConversation', 'mute', conversation);
    *   // typeof input is object <br>
    * jQuery('#conversation').cwic('updateConversation', 'mute');
    *   // unmute the same conversation,
    *   // let cwic find the conversation data attached to #conversation
    * jQuery('#conversation').cwic('updateConversation', 'unmute');
    *
    *  // add/remove video object in this (default) DOMWindow
    * jQuery('#conversation').cwic('updateConversation',
    *               { 'addRemoteVideoWindow':videoObject });
    * jQuery('#conversation').cwic('updateConversation',
    *               { 'removeRemoteVideoWindow':videoObject });
    * // add/remove video object from another DOMWindow
    * jQuery('#conversation').cwic('updateConversation',
    *               { 'addRemoteVideoWindow':videoObject, window:popupWindow });
    * jQuery('#conversation').cwic('updateConversation',
    *               { 'removeRemoteVideoWindow':videoObject, window:popupWindow });
    *
    * // Escalate to video
    * jQuery('#conversation').cwic('updateConversation', {'videoDirection': 'SendRecv'}); // implied source call is call associated with conversation div
    * jQuery('#phone').cwic('updateConversation', {'videoDirection': 'SendRecv'}, conversation.id}); // source call id passed
    * jQuery('#phone').cwic('updateConversation', {'videoDirection': 'SendRecv'}, conversation}); // source call passed
    * // De-escalate from video
    * jQuery('#conversation').cwic('updateConversation', {'videoDirection': 'Inactive'}); // implied source call is call associated with conversation div
    * jQuery('#phone').cwic('updateConversation', {'videoDirection': 'Inactive'}, conversation.id}); // source call id passed
    * jQuery('#phone').cwic('updateConversation', {'videoDirection': 'Inactive'}, conversation}); // source call passed
    *
    * // Transfer call to target number
    * jQuery('#conversation').cwic('updateConversation', {'transferCall': number, completeButton: 'completebtn'}); // implied source call is call associated with conversation div
    * jQuery('#phone').cwic('updateConversation', {'transferCall': number}, conversation.id}); // source call id passed. Bind to {@link $.fn.cwic#event:callTransferInProgress} to handle transfer complete
    * jQuery('#phone').cwic('updateConversation', {'transferCall': number}, conversation}); // source call passed
    *
    * // Join target callId to source call
    * jQuery('#conversation').cwic('updateConversation', {'joinCall':callId}); // implied source call is call associated with conversation div
    * jQuery('#phone').cwic('updateConversation', {'joinCall':callId}, conversation.id}); // source call id passed
    * jQuery('#phone').cwic('updateConversation', {'joinCall':callId}, conversation}); // source call passed
    */
    function updateConversation() {
        _log(true, 'updateConversation', arguments);

        var $this = this;

        if ($this.length === 0) {
            return $this;
        }

        // mandatory first argument
        var update = arguments[0];

        // find conversation information
        var conversation = null;
        var conversationId = null;

        if (typeof arguments[1] === 'object') {
            conversation = arguments[1];
            conversationId = conversation.id;
        } else if (typeof arguments[1] === 'undefined') {
            conversation = $this.data('cwic'); // attached conversation object
            if (typeof conversation === 'object') { conversationId = conversation.id; }
        } else {
            conversationId = arguments[1];
            conversation = $('.cwic-conversation-' + conversationId).data('cwic') || $this.data('cwic');
        }

        if (!conversationId || !conversation) {
            return _triggerError($this, errorMap.InvalidArguments, 'cannot update conversation: undefined or empty conversation id');
        }

        if (typeof update === 'string') {
            var request = null, content = null;

            if (update.match(/^hold$/i)) {
                request = 'hold';
                content = { callId: conversationId };
            } else if (update.match(/^resume$/i)) {
                request = 'resume';
                content = { callId: conversationId };
            } else if (update.match(/^mute$/i)) {
                request = 'mute';
                content = { callId: conversationId };
            } else if (update.match(/^unmute$/i)) {
                request = 'unmute';
                content = { callId: conversationId };
            } else if (update.match(/^muteAudio$/i)) {
                request = 'mute';
                content = { callId: conversationId, muteAudio: true };
            } else if (update.match(/^muteVideo$/i)) {
                request = 'mute';
                content = { callId: conversationId, muteVideo: true };
            } else if (update.match(/^unmuteAudio$/i)) {
                request = 'unmute';
                content = { callId: conversationId, unmuteAudio: true };
            } else if (update.match(/^unmuteVideo$/i)) {
                request = 'unmute';
                content = { callId: conversationId, unmuteVideo: true };
            } else {
                return _triggerError($this, errorMap.InvalidArguments, 'wrong arguments (update conversation) - ' + update, arguments);
            }

            _sendClientRequest(request, content,
                $.noop,
                function errorCb(error) {
                    _triggerError($this, getError(error), error);
                }
            );

        } else if (typeof update === 'object') {
            var foundWritable = false;

            if (update.transferCall) {
                if (transferCallGlobals.inProgress) {
                    _log(true, 'Call transfer already in progress, canceling...');
                    return $this;
                }
                
                foundWritable = true;
                
                transferCallGlobals.completeBtn = update.completeButton;
                transferCallGlobals.inProgress = true;
                
                _sendClientRequest('transferCall',
                    {
                        callId: conversationId,
                        transferToNumber: update.transferCall
                    },
                    $.noop,
                    function errorCb(error) {
                        _triggerError($this, getError(error, 'NativePluginError'), 'transferCall', error);
                    }
                );
            }

            if (update.joinCall) {
                foundWritable = true;

                _sendClientRequest('joinCalls',
                    {
                        joinCallId: conversationId,
                        callId: update.joinCall
                    },
                    $.noop,
                    function errorCb(error) {
                        _triggerError($this, getError(error, 'NativePluginError'), 'joinCall', error);
                    }
                );
            }

            if (update.videoDirection) {
                foundWritable = true;
                _sendClientRequest('setVideoDirection',
                    {
                        callId: conversationId,
                        videoDirection: update.videoDirection
                    },
                    $.noop,
                    function errorCb(error) {
                        _triggerError($this, getError(error, 'NativePluginError'), 'videoDirection', error);
                    }
                );
            }

            if (update.addRemoteVideoWindow) {
                foundWritable = true;

                _log('updateConversation() calling addWindowToCall() for conversationId: ' + conversationId);

                addWindowToCall({
                    callId: conversationId,
                    remoteVideoWindow: update.addRemoteVideoWindow,
                    window: update.window
                });
            }

            if (update.removeRemoteVideoWindow) {
                foundWritable = true;
                _log('updateConversation() calling removeWindowFromCall() for conversationId: ' + conversationId);

                removeWindowFromCall({
                    callId: conversationId,
                    remoteVideoWindow:  update.removeRemoteVideoWindow,
                    window: update.window,
                    endCall: false
                });
            }

            if (!foundWritable) {
                _triggerError($this, errorMap.InvalidArguments, 'wrong arguments (update conversation)', arguments);
            }

        } else {
            _triggerError($this, errorMap.InvalidArguments, 'wrong arguments (update conversation)', arguments);
        }

        return $this;
    }
    
    /**
    * Sends digit (String) as Dual-Tone Multi-Frequency (DTMF)
    * @example
    *  // SEND DTMF EXAMPLE
    * jQuery('#phone').cwic('sendDTMF', '5', '1234');
    * jQuery('#mydiv').cwic('sendDTMF', '3', conversation.id);
    * jQuery('body').cwic('sendDTMF', '7', conversation);
    * jQuery('#conversation').cwic('sendDTMF', '1');
    * @param {String} digit Dual-Tone Multi-Frequency (DTMF) digit to send.  Does not trigger any event.
    * @param {String|Object} [id] a {String} conversation identifier or an {Object} containing an id property
    */
    function sendDTMF() {
        _log(true, 'sendDTMF'); // don't send dtmf digits to logger

        var $this = this;
        var digit = null;
        var conversation = $this.data('cwic');
        var conversationId = conversation ? conversation.id : null;
        var allowedDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '#', '*', 'A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'];

        // inspect arguments
        if (arguments.length > 0) {
            digit = typeof arguments[0] === 'string' ? arguments[0] : null;

            if (arguments.length > 1) {
                if (typeof arguments[1] === 'object') {
                    conversation = arguments[1];
                    conversationId = conversation.id;
                }
                else if (typeof arguments[1] === 'string') {
                    conversationId = arguments[1];
                }
            }
        }

        if (typeof digit !== 'string' || !conversationId) {
            return _triggerError($this, errorMap.InvalidArguments, 'wrong arguments (sendDTMF)', arguments);
        }

        if (allowedDigits.indexOf(digit) === -1) {
            return _triggerError($this, errorMap.InvalidArguments, 'invalid DTMF digit (sendDTMF)', arguments);
        }

        _sendClientRequest('sendDTMF', {
            callId: conversationId,
            digit: digit
        });

        return $this;
    }

    function getInstanceId() {
        _log(true, 'getInstanceId');
        return _plugin.instanceId;
    }

    /**
    * Gets a list of objects describing the multimedia devices installed on a system.
    * @since 3.0.0
    * @returns
    * a list of objects describing the multimedia devices with the following properties:<ul>
    *   <li>deviceID: unique device ID</li>
    *   <li>deviceName: {string} human readable device name</li>
    *   <li>vendorID: {string} unique vendor ID</li>
    *   <li>productID: {string} vendor product ID</li>
    *   <li>hardwareID: {string} hardware dependent ID</li>
    *   <li>canRecord: {boolean} indicates whether this object can be used as an audio recording device</li>
    *   <li>canPlayout: {boolean} indicates whether this object can be used as an audio playout device</li>
    *   <li>canCapture: {boolean} indicates whether this object can be used as a video capture device</li>
    *   <li>canRing: {boolean} indicates whether this object can be used as a ringer device</li>
    *   <li>isDefault:  {boolean} indicates whether this object represents the default device of the type indicated by the canRecord, canPlayout, and canCapture flags</li>
    *   <li>recordingName: {string} human readable name for the audio recording function of this device</li>
    *   <li>playoutName: {string} human readable name for the audio playout function of this device</li>
    *   <li>captureName: {string} human readable name for the video capture function of this device</li>
    *   <li>recordingID: {string} ID for the audio recording function of this device</li>
    *   <li>playoutID: {string} ID for the audio playout function of this device</li>
    *   <li>captureID: {string} ID for the video capture function of this device</li>
    *   <li>clientRecordingID: {string} the ID to pass to setRecordingDevice to select this device as the audio recording device</li>
    *   <li>clientPlayoutID: {string} the ID to pass to setPlayoutDevice to select this device as the audio playout device</li>
    *   <li>clientCaptureID: {string} the ID to pass to setCaptureDevice to select this device as the video capture device</li>
    *   <li>isSelectedRecordingDevice: {boolean} indicates whether this is the currently selected audio recording device</li>
    *   <li>isSelectedPlayoutDevice: {boolean} indicates whether this is the currently selected audio playout device</li>
    *   <li>isSelectedCaptureDevice: {boolean} indicates whether this is the currently selected video capture device</li>
    *   </ul>
    *   In order to use the list, the client should check the canXXXX fields to determine if a device can be passed as a particular function, then pass the clientXXXID
    *   to the correct setXXXXDevice function.
    *
    *   Depending on the platform, devices with multiple functions may show up as a single entry with multiple IDs, or multiple times with similar or different IDs.
    *
    * @example
    *  see sample.html
    */
    function getMultimediaDevices() {
        // new messaging interface passes mmDevices list in the change event
        // so we just return the data from the most recent event
        var devices = { 'multimediadevices': _plugin.multimediadevices };

        _log(true, 'getMultimediaDevices returning:', devices);
        return devices;

    }

    function getAvailableRingtones($this) {
        if (isMac()) {
            return;
        }
        
        _sendClientRequest('getAvailableRingtones', function (ringtones) {
            handleRingtonesAvailable($this, ringtones);
        });
    }

    function handleRingtonesAvailable($this, ringtonesList) {
        var event = $.Event('ringtonesListAvailable.cwic');
        event.ringtones = ringtonesList.ringtones;
        $this.trigger(event);
    }
 
    /**
    * Sets the audio recording device used by the Cisco Web Communicator.  To set a device, pass the clientRecordingID from a device with the canRecord flag set to true.
    * @since 3.0.0
    * @param {String} clientRecordingID: clientRecordingID retrieved from getMultimediaDevices()
    */
    function setRecordingDevice() {
        _log(true, 'setRecordingDevice', arguments);
        var $this = this;

        var clientRecordingIDIn = arguments[0];

        if (typeof clientRecordingIDIn !== 'string' || clientRecordingIDIn.length === 0) {
            return _triggerError($this, errorMap.InvalidArguments, 'wrong arguments (setRecordingDevice)', arguments);
        }

        _sendClientRequest('setRecordingDevice', {
            'clientRecordingID': clientRecordingIDIn
        });

        // after setting device, we need to refresh our cache
        _sendClientRequest('getMultimediaDevices', function mmDevicesCb(content) {
            _triggerMMDeviceEvent($this, content);
        });
    }
    /**
     * Sets the ringer device used by the Cisco Web Communicator. To set a device, pass the clientRingerID from a device with the canRing flag set to true.
     * @since 4.0.0
     * @param {String} clientRingerID: clientRingerID retrieved from getMultimediaDevices()
     */
    function setRingerDevice() {
        _log(true, 'setRingerDevice', arguments);
        
        var $this = this;
        var clientRingerIDIn = arguments[0];

        if (typeof clientRingerIDIn !== 'string' || clientRingerIDIn.length === 0) {
            return _triggerError($this, errorMap.InvalidArguments, 'wrong arguments (setRingerDevice)', arguments);
        }

        _sendClientRequest('setRingerDevice', {
            'clientRingerID': clientRingerIDIn
        });

        // after setting device, we need to refresh our cache
        _sendClientRequest('getMultimediaDevices', function mmDevicesCb(content) {
            _triggerMMDeviceEvent($this, content);
        });
    }

    /**
     * Sets speaker volume. Works on Windows platform only.
     * @since 4.0.0
     * @param {String|Number} args.volume Volume to set (0 to 100)
     * @param {Function} args.success Success callback
     * @param {Function} args.error Error callback
     */
    function setSpeakerVolume(content) {
        if (isMac()) {
            _log(false, 'setPlayRingerOnAllDevices works only on Windows platform for now...');
            return;
        }
        
        var volume = parseInt(content.speakerVolume, 10),
            success = $.isFunction(content.success) ? content.success : $.noop,
            error = $.isFunction(content.error) ? content.error : $.noop;

        _sendClientRequest('setCurrentSpeakerVolume', {
            volume: volume
        }, success, error);
    }

    /**
     * Sets ringer volume. Works on Windows platform only.
     * @since 4.0.0
     * @param {String|Number} args.volume Volume to set (0 to 100)
     * @param {Function} args.success Success callback
     * @param {Function} args.error Error callback
     */
    function setRingerVolume(content) {
        if (isMac()) {
            _log(false, 'setRingerVolume works only on Windows platform for now...');
            return;
        }
        
        var volume = parseInt(content.ringerVolume, 10),
            success = $.isFunction(content.success) ? content.success : $.noop,
            error = $.isFunction(content.error) ? content.error : $.noop;
        _sendClientRequest('setCurrentRingerVolume', {
            volume: volume
        }, success, error);
    }
    
    /**
     * Sets microphone volume. Works on Windows platform only.
     * @since 4.0.0
     * @param {String|Number} args.volume Volume to set (0 to 100)
     * @param {Function} args.success Success callback
     * @param {Function} args.error Error callback
     */
    function setMicrophoneVolume(content) {    
        if (isMac()) {
            _log(false, 'setMicrophoneVolume works only on Windows platform for now...');
            return;
        }
        var volume = parseInt(content.microphoneVolume, 10),
            success = $.isFunction(content.success) ? content.success : $.noop,
            error = $.isFunction(content.error) ? content.error : $.noop;
            
        _sendClientRequest('setCurrentMicrophoneVolume', {
            volume: volume
        }, success, error);
    }
    
    /**
     * Sets ringtone. Will trigger ringtoneChange.cwic event. Works on Windows platform only.
     * @since 4.0.0
     * @param {String} ringtone ringtone name
     */
    function setRingtone(ringtone) {
        if (isMac()) {
            _log(false, 'setRingtone works only on Windows platform for now...');
            return;
        }
        
        _sendClientRequest('setCurrentRingtone', {
            ringtone: ringtone
        });
    }

     /**
     * Sets all capable devices as ringers. Works on Windows platform only.
     * @since 4.0.0
     */
    function setPlayRingerOnAllDevices() {
        if (isMac()) {
            _log(false, 'setPlayRingerOnAllDevices works only on Windows platform for now...');
            return;
        }
        
        _sendClientRequest('setPlayRingerOnAllDevices');
    }

    
     /**
     * Gets the current volume value for particular device. Async function.
     * Works on Windows platform only.
     * @since 4.0.0
     * @param {String} device Type of device. One of: "Speaker", "Microphone", "Ringer"
     * @param {Function} callback(volume) Callback to be called with volume value
     */
    function getMultimediaDeviceVolume(device, handleVolumeChangeCallback) {
        if (isMac()) {
            _log(false, 'getMultimediaDeviceVolume works only on Windows platform for now...');
            return;
        }
        
        if (device !== 'Speaker' && 
            device !== 'Microphone' && 
            device !== 'Ringer') {
            _log(false, 'getMultimediaDeviceVolume received wrong "device" parameter. Must be one of ("Speaker", "Microphone", "Ringer") and received: ' + device);
        }
        
        if (isMultimediaStarted) {
            _sendClientRequest('getMultimediaDeviceVolume', {
                device: device
            }, handleVolumeChangeCallback);
        } else {
            _log(true, 'getMultimediaDeviceVolume: Mutimedia services not started, returning...');
        }
    }
    
    
    /**
    * Sets the audio playout device used by the Cisco Web Communicator.  To set a device, pass the clientPlayoutID from a device with the canPlayout flag set to true.
    * @since 3.0.0
    * @param {String} clientPlayoutID: clientPlayoutID retrieved from getMultimediaDevices()
    */
    function setPlayoutDevice() {
        _log(true, 'setPlayoutDevice', arguments);

        var $this = this;
        var clientPlayoutIDIn = arguments[0];

        if (typeof clientPlayoutIDIn !== 'string' || clientPlayoutIDIn.length === 0) {
            return _triggerError($this, errorMap.InvalidArguments, 'wrong arguments (setPlayoutDevice)', arguments);
        }

        _sendClientRequest('setPlayoutDevice', {
            'clientPlayoutID': clientPlayoutIDIn
        });

        // after setting device, we need to refresh our cache
        _sendClientRequest('getMultimediaDevices', function mmDevicesCb(content) {
            _triggerMMDeviceEvent($this, content);
        });
    }

    /**
    * Sets the video capture device used by the Cisco Web Communicator.  To set a device, pass the clientCaptureID from a device with the canCapture flag set to true.
    * @since 3.0.0
    * @param {String} clientCaptureID: clientCaptureID retrieved from getMultimediaDevices()
    */
    function setCaptureDevice() {
        _log(true, 'setCaptureDevice', arguments);

        var $this = this;
        var clientCaptureIDIn = arguments[0];

        if (typeof clientCaptureIDIn !== 'string' || clientCaptureIDIn.length === 0) {
            return _triggerError($this, errorMap.InvalidArguments, 'wrong arguments (setCaptureDevice)', arguments);
        }

        _sendClientRequest('setCaptureDevice', {
            'clientCaptureID': clientCaptureIDIn
        });

        // after setting device, we need to refresh our cache
        _sendClientRequest('getMultimediaDevices', function mmDevicesCb(content) {
            _triggerMMDeviceEvent($this, content);
        });
    }

    /**
    * Shows the call in an external video window.  If an external video window already exists,
    * the current contents will be replaced by the video stream for the selected call.  Otherwise, a new external window will be created.
    * To detect changes in the window state, for example the user closes the window, use {@link $.fn.cwic#event:externalWindowEvent}.
    * <br>
    * By default the external video window will have always on top property and will include a picture-in-picture preview (self-view).
    * This can be changed using {@link $.fn.cwic-setExternalWindowAlwaysOnTop} and {@link $.fn.cwic-setExternalWindowShowSelfViewPip}, respectively.
    * <br>
    * If the user closes an external video window that contains a video call, the call will be ended.
    * Use {@link $.fn.cwic-hideExternalWindow} to remove the window without interupting the call.
    * @since 3.1.0
    * @param {String|Object} [id] A {String} conversation identifier or an {Object} containing an id property.
    */
    function showCallInExternalWindow() {
        _log(true, 'showCallInExternalWindow');

        var $this = this;
        var conversation = $this.data('cwic');
        var conversationId = conversation ? conversation.id : null;

        // inspect arguments
        if (arguments.length > 0) {
            if (typeof arguments[0] === 'object') {
                conversation = arguments[0];
                conversationId = conversation.id;
            }
            else if (typeof arguments[0] === 'string') {
                conversationId = arguments[0];
            }
        }

        if (!conversationId) {
            return _triggerError($this, errorMap.InvalidArguments, 'wrong arguments (showCallInExternalWindow)', arguments);
        }

        dockGlobals.isVideoBeingReceived = true;
        _sendClientRequest('showCallInExternalWindow', {
            callId: conversationId
        });
    }

    /**
    * Shows preview (self-view) in an external video window.  If an external video window already exists,
    * the current contents will be replaced by the preview.  Otherwise, a new external window will be created.
    * To detect changes in the window state, for example the user closes the window, use {@link $.fn.cwic#event:externalWindowEvent}.
    * <br>
    * By default the external video window will have always on top property.  This can be changed using {@link $.fn.cwic-setExternalWindowAlwaysOnTop}.
    * <br>
    * If preview in picture-in-picture is enabled (see {@link $.fn.cwic-setExternalWindowShowSelfViewPip})
    * it will not be visible while the preview is in the full window.
    * <br>
    * Use {@link $.fn.cwic-hideExternalWindow} to remove the window.
    * @since 3.1.0
    */
    function showPreviewInExternalWindow() {
        if (isMultimediaStarted) {
            _log(true, 'showPreviewInExternalWindow');
            dockGlobals.isVideoBeingReceived = true;
            _sendClientRequest('showPreviewInExternalWindow');            
        } else {
            _log(false, 'returning from showPreviewInExternalWindow ... not supported in the current state');
        }
    }

    /**
    * Triggers an {@link $.fn.cwic#event:externalWindowEvent} to be sent to the application with the current state of the external window.
    * @since 3.1.0
    */
    function getExternalWindowState() {
        if (isMultimediaStarted) {
            _log(true, 'getExternalWindowState');
            _sendClientRequest('getExternalWindowState');
        } else {
            _log(false, 'returning from getExternalWindowState ... not supported in the current state');
        }
    }

    /**
    * Hides an external video window created by {@link $.fn.cwic-showPreviewInExternalWindow} or {@link $.fn.cwic-showCallInExternalWindow}.
    * @since 3.1.0
    */
    function hideExternalWindow() {
        if (isMultimediaStarted) {
            _log(true, 'hideExternalWindow');
            dockGlobals.isVideoBeingReceived = false;
            _sendClientRequest('hideExternalWindow');            
        } else {
            _log(false, 'returning from hideExternalWindow ... not supported in the current state');
        }
    }

    /**
    * Controls whether external video windows created by {@link $.fn.cwic-showPreviewInExternalWindow} or
    * {@link $.fn.cwic-showCallInExternalWindow} are shown always on top (default) or not.
    * @since 3.1.0
    * @param {Boolean} isAlwaysOnTop Set to false to remove the always on top property.  Set to true to restore default behavior.
    */
    function setExternalWindowAlwaysOnTop() {
        if (isMultimediaStarted) {
            _log(true, 'setExternalWindowAlwaysOnTop');
            if (typeof arguments[0] === 'boolean') {
                _sendClientRequest('setExternalWindowAlwaysOnTop', { alwaysOnTop: arguments[0] });
            }
        } else {
            _log(false, 'returning from setExternalWindowAlwaysOnTop ... not supported in the current state');
        }
    }

    /**
    * Controls whether a picture-in-picture preview (self-view) is shown when {@link $.fn.cwic-showCallInExternalWindow} is used to put a call in external video window.
    * @since 3.1.0
    * @param {Boolean} showPipSelfView Set to false to turn off the picture-in-picture.  Set to true to restore default behavior.
    */
    function setExternalWindowShowSelfViewPip() {
        if (isMultimediaStarted) {
            _log(true, 'setExternalWindowShowSelfViewPip');
            if (typeof arguments[0] === 'boolean') {
                _sendClientRequest('setExternalWindowShowSelfViewPip', { showSelfViewPip: arguments[0] });
            }
        } else {
            _log(false, 'returning from setExternalWindowShowSelfViewPip ... not supported in the current state');
        }
    }

    /**
    * Controls whether a overlaid controls are shown in external video window created by {@link $.fn.cwic-showCallInExternalWindow} or {@link $.fn.cwic-showPreviewInExternalWindow}.
    * @since 4.0.0
    * @param {Boolean} showControls Set to false to turn off the overlaid call controls. Set to true to restore default behavior.
    */
    function setExternalWindowShowControls(showControls) {
        if (isMultimediaStarted) {
            _log(true, 'setExternalWindowShowControls');
            if (typeof showControls === 'boolean') {
                _sendClientRequest('setExternalWindowShowControls', {showControls: showControls});
            }
        } else {
            _log(false, 'returning from setExternalWindowShowControls ... not supported in the current state');
        }
    }
    
    
    function sendSelfViewCoordinates(coordinatesInPercentage) {
        if (!isObject(coordinatesInPercentage)) {
            _log(false, 'setExternalWindowSelfViewPipPosition expects object as an argument');
            return;
        }
        
        var left = parseInt(coordinatesInPercentage.topLeftX, 10),
            top = parseInt(coordinatesInPercentage.topLeftY, 10),
            right = parseInt(coordinatesInPercentage.bottomRightX, 10),
            bottom = parseInt(coordinatesInPercentage.bottomRightY, 10);
        
        
        if (
            !isNumeric(left) ||
            !isNumeric(top) ||
            !isNumeric(right) ||
            !isNumeric(bottom)
            ) {
                _log(false, 'setExternalWindowSelfViewPipPosition invalid arguments ... expecting numbers from 0 to 100');
                return;
        }
        
        _sendClientRequest('setExternalWindowSelfViewPipPosition', {pipLeft: left, pipTop: top, pipRight: right, pipBottom: bottom});         
    }
    
    /**
    * Sets the position of self view window relative to parent external video window created by {@link $.fn.cwic-showCallInExternalWindow}.
    * @since 4.0.0
    * @param {Object} coordinatesInPercentage
    * @param {Number|String} coordinatesInPercentage.topLeftX Distance of top-left corner of self view window from the left edge of parent window (in percentage - 0 to 100).
    * @param {Number|String} coordinatesInPercentage.topLeftY Distance of top-left corner of self view window from the top edge of parent window (in percentage - 0 to 100).
    * @param {Number|String} coordinatesInPercentage.bottomRightX Distance of bottom-right corner of self view window from the left edge of parent window (in percentage - 0 to 100).
    * @param {Number|String} coordinatesInPercentage.bottomRightY Distance of bottom-right corner of self view window from the top edge of parent window (in percentage - 0 to 100).
    */
    function setExternalWindowSelfViewPipPosition(coordinatesInPercentage) {
        if (isMultimediaStarted) {
            _log(true, 'setExternalWindowSelfViewPipPosition');
            sendSelfViewCoordinates(coordinatesInPercentage);
            
        } else {
            _log(false, 'returning from setExternalWindowShowControls ... not supported in the current state');
        }
    }
    
    /**
     * Show/hide the border of self view in external video window created by {@link $.fn.cwic-showCallInExternalWindow}.
     * @since 11.0.1
     * @param {Boolean} showSelfViewPipBorder
     */
    function setExternalWindowShowSelfViewPipBorder(showSelfViewPipBorder) {
        if (isMultimediaStarted) {
            _log(true, 'setExternalWindowShowSelfViewPipBorder');
            
            if (typeof showSelfViewPipBorder === 'boolean') {
                _sendClientRequest('setExternalWindowShowSelfViewPipBorder', { showSelfViewPipBorder: showSelfViewPipBorder });
            }
            
        } else {
            _log(false, 'returning from setExternalWindowShowSelfViewPipBorder ... not supported in the current state');
        }
    }
    
    /**
    * Sets the window title used in external video windows created by {@link $.fn.cwic-showPreviewInExternalWindow} or {@link $.fn.cwic-showCallInExternalWindow}.
    * @since 3.1.0
    * @param {String} title A string value to be used as the window title for the exernal video window.
    */
    function setExternalWindowTitle() {
        if (isMultimediaStarted) {
            _log(true, 'setExternalWindowTitle');
            if (typeof arguments[0] === 'string') {
                _sendClientRequest('setExternalWindowTitle', { title: arguments[0] });
            }
        } else {
            _log(false, 'returning from setExternalWindowTitle ... not supported in the current state');
        }
    }
    
    var dockGlobals = {
        _about: null,
        hasDockingCapabilities: function () {
            return dockGlobals._about.capabilities.externalWindowDocking;
        },
        isVideoBeingReceived: false,
        isDocked: false,
        timeOfPreviousDocking: 0,
        minimalTimeBeforeChangingPosition: /* TODO: find optimal value to avoid lag, but also to avoid too many dockUpdate messges */ 10,
        targetDiv: null,
        targetDivStyle: {
            'background-color': 'magenta',
            'width': '8px',
            'height': '8px',
            'position': 'fixed',
            'border-right': '8px solid black',
            'z-index': '2147483647'
        },
        frame: window,
        element: null,
        position: {},
        move: function () {
            if (dockGlobals.isDocked) {
                // (new Date()).getTime() returns the current time in milliseconds
                var millisecondsSinceLastMove =  (new Date()).getTime() - dockGlobals.timeOfPreviousDocking;
                var rect = dockGlobals.updateOffsets(dockGlobals.element.getBoundingClientRect());
                var dockedWindowMoved = (rect.top === dockGlobals.position.top &&
                        rect.left === dockGlobals.position.left &&
                        rect.height === dockGlobals.position.height &&
                        rect.width === dockGlobals.position.width &&
                        rect.cropTop === dockGlobals.position.cropTop &&
                        rect.cropLeft === dockGlobals.position.cropLeft &&
                        rect.cropHeight === dockGlobals.position.cropHeight &&
                        rect.cropWidth === dockGlobals.position.cropWidth) ?
                            false : true;
                
                if (dockedWindowMoved && millisecondsSinceLastMove > dockGlobals.minimalTimeBeforeChangingPosition) {
                    dockGlobals.timeOfPreviousDocking = (new Date()).getTime();
                    $.extend(dockGlobals.position, rect);
                    dockGlobals.sendMessageToAddOn("dockUpdate", dockGlobals.position);
                }
                
                dockGlobals.frame.requestAnimationFrame(dockGlobals.move);
            }
        },
        updateOffsets: function (positionWithinInnermostFrame) {
            var currentFrame = dockGlobals.frame,
                currentFrameHeight = $(currentFrame).height(),
                currentFrameWidth = $(currentFrame).width(),
                currentFrameRect,
                parentFrameWidth,
                parentFrameHeight,
                position = $.extend({
                        cropTop: 0,
                        cropLeft: 0,
                        cropBottom: 0,
                        cropRight: 0,
                        cropWidth: 0,
                        cropHeight: 0
                    }, positionWithinInnermostFrame),
                frameBorderOffset = 0,
                borderTopOffset = 0,
                borderLeftOffset = 0,
                paddingTopOffset = 0,
                paddingLeftOffset = 0;
           
            // we need to take into account the devicePixelRatio and the CSS zoom property
            // it won't work if css zoom is set on some of parent elements
            var scaleCoefficient = currentFrame.devicePixelRatio * $(dockGlobals.element).css('zoom');

            var scrollX = 0;
            var scrollY = 0;
            
            if (('ontouchstart' in window) &&
                (navigator.maxTouchPoints > 1) 
            ) {
                 //running on touch-capable device
              
               var inner = currentFrame.innerWidth;
               var hasScrollbar = inner - currentFrame.document.documentElement.clientWidth;     
               dockGlobals.lastZoomFactor = dockGlobals.lastZoomFactor || 1;          
                   
               // scrollbar width changes when zooming, we need to calculate it for each scale level
               // on pinch zoom, hasScrollbar very quickly goes below zero, and we should skip that case (no scrollbars on pinch-zoom)
               // ...basically just an aproximation which works currentlly 
               if (hasScrollbar > 0) {
                   inner -= hasScrollbar; 
               } else {
                   inner -= (scrollBarWidth / dockGlobals.lastZoomFactor);
               }
               
               var pinchZoomCoefficient = currentFrame.document.documentElement.clientWidth / inner;
               
               scaleCoefficient *= pinchZoomCoefficient;
               dockGlobals.lastZoomFactor = scaleCoefficient;
               
               var scrollSizeX = $(currentFrame.document).width() - $(currentFrame).width();
               var scrollSizeY = $(currentFrame.document).height() - $(currentFrame).height();
               
               if (pinchZoomCoefficient > 1.01) {
                   scrollX = currentFrame.scrollX;
                   scrollY = currentFrame.scrollY;
                   
                   // this is complex logic dealing with case when the page (pinchZoom=0) has scrollbars
                   // In that case, when the page is pinche-zoomed, scrollX and scrollY are no longer accurate in providing position of docking container 
                   var diffY = scrollSizeY - scrollY;
                   
                   // while diff is >0, position.top represent accurate top position
                   // when it goes below 0 (meaning that "original" scrollbar hit the end), position.top gets stuck and then diff value represent how much container is moved
                   if (diffY >= 0) {
                       scrollY = 0;
                   } else {
                       scrollY = Math.abs(diffY);
                   }
                   
                   var diffX = scrollSizeX - scrollX;
                   
                   if (diffX >= 0) {
                       scrollX = 0;
                   } else {
                       scrollX = Math.abs(diffX);
                   }
                   
                   if (diffY >= 0) {
                       dockGlobals.initPosY = position.top + currentFrame.scrollY;
                   }
                   
                   if (
                       position.top > dockGlobals.initPosY - scrollSizeY &&
                       diffY < 0
                       ) {
                       position.top = dockGlobals.initPosY - scrollSizeY;
                   }
                   
                   if (diffX >= 0) {
                       dockGlobals.initPosX = position.left + currentFrame.scrollX;
                   }
                   
                   if (
                       position.left > dockGlobals.initPosX - scrollSizeX &&
                       diffX < 0
                       ) {
                       position.left = dockGlobals.initPosX - scrollSizeX;
                   }
               }
               
            }
            
            position.left -= scrollX;
            position.top -= scrollY;
            
            // console.log('SCALE TOP: ', position.top);
            // console.log('SCALE SCROLL: ', scrollY);
            // console.log('SCALE SCROLL ACTUAL: ', window.scrollY);
            // console.log('SCALE SCROLL SIZE: ', scrollSizeY);
            // console.log('SCALE SCROLL DIFF: ', diffY);
            // console.log('SCALE NORMAL: ', scaleCoefficient);
            // console.log('SCALE PINCH: ', pinchZoomCoefficient);
            // console.log('SCALE INIT POS: ', dockGlobals.initPos);

            // calculating crop values for innermost iframe
            position.cropTop = (position.top < 0) ?
                Math.abs(position.top) : 0;
                
            position.cropLeft = (position.left < 0) ?
                Math.abs(position.left) : 0;
                
            position.cropBottom = Math.max(position.bottom - currentFrameHeight, 0);
            position.cropRight = Math.max(position.right - currentFrameWidth, 0);

            while (currentFrame != currentFrame.top) {
                currentFrameRect = currentFrame.frameElement.getBoundingClientRect();
                parentFrameWidth = $(currentFrame.parent).width();
                parentFrameHeight = $(currentFrame.parent).height();

                // !! converts to boolean: 0 and NaN map to false, the rest of the numbers map to true  
                if (currentFrame.frameElement.frameBorder === "" ||
                        !!parseInt(currentFrame.frameElement.frameBorder, 10)) {
                    // after testing on Chrome, whenever a frameBorder is present, it's size is 2px
                    frameBorderOffset = 2;
                } else {
                    frameBorderOffset = 0;
                }

                if (currentFrame.frameElement.style.borderTopWidth === "") {
                    borderTopOffset = frameBorderOffset;
                } else {
                    borderTopOffset = parseInt(currentFrame.frameElement.style.borderTopWidth || 0, 10);
                }
                paddingTopOffset = parseInt(currentFrame.frameElement.style.paddingTop || 0, 10);

                if (currentFrameRect.top < 0) {
                    if (position.top + position.cropTop < 0) {
                        position.cropTop += Math.abs(currentFrameRect.top);
                    } else if (Math.abs(currentFrameRect.top) - (position.top + position.cropTop + borderTopOffset + paddingTopOffset) > 0) {
                        position.cropTop += Math.abs(Math.abs(currentFrameRect.top) - (position.top + position.cropTop + borderTopOffset + paddingTopOffset));
                    }
                }

                if (currentFrameRect.top + borderTopOffset + paddingTopOffset + position.top + position.height - position.cropBottom > parentFrameHeight) {
                    position.cropBottom = currentFrameRect.top + borderTopOffset + paddingTopOffset + position.top + position.height - parentFrameHeight;
                }
                position.top += currentFrameRect.top + borderTopOffset + paddingTopOffset;
                
                if (currentFrame.frameElement.style.borderLeftWidth === "") {
                    borderLeftOffset = frameBorderOffset;
                } else {
                    borderLeftOffset = parseInt(currentFrame.frameElement.style.borderLeftWidth || 0, 10);
                }
                paddingLeftOffset = parseInt(currentFrame.frameElement.style.paddingLeft || 0, 10);
                
                if (currentFrameRect.left < 0) {
                    if (position.left + position.cropLeft < 0) {
                        position.cropLeft += Math.abs(currentFrameRect.left);
                    } else if (Math.abs(currentFrameRect.left) - (position.left + position.cropLeft + borderLeftOffset + paddingLeftOffset) > 0) {
                        position.cropLeft += Math.abs(Math.abs(currentFrameRect.left) - (position.left + position.cropLeft + borderLeftOffset + paddingLeftOffset));
                    }
                }

                if (currentFrameRect.left + borderLeftOffset + paddingLeftOffset + position.left + position.width - position.cropRight > parentFrameWidth) {
                    position.cropRight = currentFrameRect.left + borderLeftOffset + paddingLeftOffset + position.left + position.width - parentFrameWidth;
                }
                position.left += currentFrameRect.left + borderLeftOffset + paddingLeftOffset;
                currentFrame = currentFrame.parent;
            }

            position.cropHeight = Math.max(position.height - (position.cropTop + position.cropBottom), 0);
            position.cropTop = (position.height > position.cropTop) ? position.cropTop : 0;
            position.cropWidth = Math.max(position.width - (position.cropLeft + position.cropRight), 0);
            position.cropLeft = (position.width > position.cropLeft) ? position.cropLeft : 0;
            
            // set target before scaling (Mac) - target is HTML element, it is "immune" to scaling
            // 8 and 16 because of minimal width of magenta target
            if (dockGlobals.isVideoBeingReceived && position.cropHeight > 8 && position.cropWidth > 16 && dockGlobals._about.capabilities.showingDockingTarget) {
                dockGlobals.setTarget(position);
            } else {
                $(dockGlobals.targetDiv).css({"display": "none"});
            }
                
            // include scale coefficient
            position.left = Math.round(scaleCoefficient * position.left);
            position.top = Math.round(scaleCoefficient * position.top);
            position.width = Math.ceil(scaleCoefficient * position.width);
            position.height = Math.ceil(scaleCoefficient * position.height);
            position.cropLeft = Math.round(scaleCoefficient * position.cropLeft) || 0;
            position.cropTop = Math.round(scaleCoefficient * position.cropTop) || 0;
            position.cropWidth = Math.floor(scaleCoefficient * position.cropWidth) || 0;
            position.cropHeight = Math.floor(scaleCoefficient * position.cropHeight) || 0;
            position.scaleCoefficient = scaleCoefficient;

            return position;
        },
        sendMessageToAddOn: function (msgName, position) {  
            var addOnMessageContent = {
                offsetX: position.left,
                offsetY: position.top,
                width: position.width,
                height: position.height,
                cropOffsetX: position.cropLeft,
                cropOffsetY: position.cropTop,
                cropWidth: position.cropWidth,
                cropHeight: position.cropHeight
            };
            
            var scaleCoefficient = position.scaleCoefficient;
            
            if (msgName === "dockExternalWindow") {
                addOnMessageContent.title = dockGlobals.frame.top.document.title ||
                    (dockGlobals.frame.top.location.host + dockGlobals.frame.top.location.pathname + dockGlobals.frame.top.location.search);
            } else {
                addOnMessageContent.pageWidth = Math.floor($(dockGlobals.frame.top).width() * scaleCoefficient);
                addOnMessageContent.pageHeight = Math.floor($(dockGlobals.frame.top).height() * scaleCoefficient);
            }
            
            _sendClientRequest(msgName, addOnMessageContent); // TODO: couple of ms could be saved if we call _plugin.api.sendRequest directly.
        },
        resetPosition: function () {
            if (dockGlobals.targetDiv) {
                $(dockGlobals.targetDiv).css('display', 'none');
            }
            dockGlobals.position = {};
            dockGlobals.timeOfPreviousDocking = 0;
        },
        setTarget: function (position) {
            // if the overlay DOM Element is only partially visible, the target should be at the top left of the visible part of the DOM Element
            var targetTop = (position.top + position.cropTop > 0 || position.bottom <= /* magenta target height */ 8) ?
                    Math.ceil(position.top + position.cropTop) : 0;
            var targetLeft = (position.left + position.cropLeft > 0 || position.right <= /* magenta target (+ border) width */ 16) ?
                    Math.ceil(position.left + position.cropLeft) : 0;
            dockGlobals.createTargetDivIfNeeded();
            $(dockGlobals.targetDiv).css({"display": "block", "top": targetTop, "left": targetLeft});
        },
        createTargetDivIfNeeded: function () {
            if (!dockGlobals.targetDiv) {
                dockGlobals.targetDiv = dockGlobals.frame.top.document.createElement("div");
                dockGlobals.frame.top.document.body.appendChild(dockGlobals.targetDiv);
                $(dockGlobals.targetDiv).css(dockGlobals.targetDivStyle);
            }
        }
    };

    /**
    * Docks an external video window created by {@link $.fn.cwic-showPreviewInExternalWindow} or {@link $.fn.cwic-showCallInExternalWindow}.<br>
    * Example use:
    * @example
    * // simple case where the target video container is on the same HTML page as cwic.js file
    * $('#videocontainer').cwic('dock');
    * // or an extended form where the window object along with target element could be specified. 
    * // Window object could be from an iFrame or a popup with the same origin as "parent" page
    * $().cwic('dock', {window: windowElementOfSomeHtmlDocument, element: targetElementForVideoOverlay});
    * @param {Object} [args] Information about target element for video overlay
    * @param {DOMWindow} args.window Window object in which the target element is located
    * @param {DOMElement} args.element Target element for video overlay
    * @since 3.1.2
    */
    function dock(args) {
        var $this = this,
            frame = args ? args.window : window,
            element = args ? args.element : $this[0];
        
        dockGlobals._about = about();
        
        if (dockGlobals.hasDockingCapabilities() && (element instanceof frame.HTMLElement)) {
            dockGlobals.isDocked = true;
            _log(true, 'dock', arguments);
            dockGlobals.resetPosition();
            dockGlobals.frame = frame;
            dockGlobals.element = element;
            dockGlobals.sendMessageToAddOn("dockExternalWindow",
                    dockGlobals.updateOffsets(dockGlobals.element.getBoundingClientRect()));
            dockGlobals.frame.requestAnimationFrame(dockGlobals.move);
        } else  if (!dockGlobals.hasDockingCapabilities()) {
            _triggerError($this, errorMap.DockingCapabilitiesNotAvailable);
        } else if (!(element instanceof frame.HTMLElement)) {
            _triggerError($this, errorMap.DockArgumentNotHTMLElement);
        }
        return $this;
    }

    /**
    * Undocks an external video window previously docked by {@link $.fn.cwic-dock}<br>
    * Example use:
    * @example
    * $('#videocontainer').cwic('undock');
    * // or:
    * $(document).cwic('undock');
    * // or:
    * $().cwic('undock');
    * @since 3.1.2
    */
    function undock() {
        _log(false, 'Undocking ...');
        var $this = this;
        if (dockGlobals.hasDockingCapabilities() && dockGlobals.isDocked) {
            _log(true, 'undock', arguments);
            dockGlobals.resetPosition();
            _log(true, 'Setting isDocked to false');
            dockGlobals.isDocked = false;
            _sendClientRequest('undockExternalWindow');
        } else if (!dockGlobals.hasDockingCapabilities()) {
            _triggerError($this, errorMap.DockingCapabilitiesNotAvailable);
        }
        
        return $this;
    }
    
    function _triggerDockExternalWindowNeeded($this) {
        var dockArgs = {window: dockGlobals.frame, element: dockGlobals.element};
        
        _log(true, 'Sending new "dock" message with parameters: ', dockArgs);
        
        dock(dockArgs);
    }

    /** @description Gets the current user authorization status.
    * @since 3.0.1
    * @returns {String} a value indicating the current user authorization status.
    * <ul>
    * <li>"UserAuthorized" indicates the user has authorized the Cisco Web Communicator add-on and it is ready to use.</li>
    * <li>"MustShowAuth" indicates the application must call {@link $.fn.cwic-showUserAuthorization} to show the user authorization dialog.</li>
    * <li>"UserDenied" indicates the user has denied the application access to the Cisco Web Communicator add-on.</li>
    * <li>"UserAuthPending" indicates the dialog box is currently displayed and the user has not yet selected "allow", "deny", or "always allow".</li>
    * <li>"Unknown" indicates status cannot be determined because delay authorization feature is not supported by the current Cisco Web Communicator add-on.
    * This case will trigger {@link $.fn.cwic-errorMap.OperationNotSupported} as well.</li>
    * </ul>
    */
    function getUserAuthStatus() {
        var ab = about();

        if (!ab.capabilities.delayedUserAuth) {
            _triggerError(this, errorMap.OperationNotSupported, 'Check cwic("about").capabilities.delayedUserAuth');
            return 'Unknown';
        }

        return _plugin.userAuthStatus;
    }
    /** @description Shows the user authorization dialog.  This API must only be called if the application has provided a delayedUserAuth callback
    * in the settings object provided to the init function, and the status returned by {@link $.fn.cwic-getUserAuthStatus} is "MustShowAuth"  If the application
    * receives the {@link $.fn.cwic-settings.delayedUserAuth} callback, the user authorization state will always be "MustShowAuth" so the application can safely call
    * showUserAuthorization from within the delayedUserAuth callback without checking getUserAuthStatus.
    * @since 3.0.1
    * @param {Function} denied A callback that will be called if the user selects "deny" from the user authorization dialog.  If the user
    * selects allow or always allow, the settings.ready callback will be called.
    * @param {Boolean} [force=false] Since 3.1.0 <br>
    * Set <tt>true</tt> to force the dialog to display even if the page is currently hidden.
    * Setting this may cause the dialog to appear when the page is not yet accessible to the user.
    */
    function showUserAuthorization(args) {
        if (!args || !args.denied || !$.isFunction(args.denied)) {
            return _triggerError(this, errorMap.InvalidArguments, 'showUserAuthorization: wrong arguments');
        }

        // if page is not visible, then wait for visibilitychange event and retry showUserAuthorization
        if (document.hidden && !args.force) {
            _log('showUserAuthorization deferred with visibilityState: ' + document.visibilityState);
            _addListener(document,'visibilitychange', function handleVisibilityChange() {
                if(!document.hidden) {
                    // show deferred dialog and remove listener
                    _log('showUserAuthorization detected visibilitychange from hidden to ' + document.visibilityState);
                    showUserAuthorization(args);
                    _removeListener(document,'visibilitychange',handleVisibilityChange);
                }
                // else continue listening for 'visibilitychange' until not hidden
            });
            return;
        }

        _sendClientRequest('showUserAuthorization', function() {
            _plugin.deniedCb = args.denied;
            _plugin.userAuthStatus = 'UserAuthPending';
        });
    }

    // a map with all exposed methods
    var methods = {
        about: about,
        init: init,
        shutdown: shutdown,
        rebootIfBroken: rebootIfBroken,
        registerPhone: registerPhone,
        manualSignIn: registerPhone,
        switchPhoneMode: switchPhoneMode,
        unregisterPhone: unregisterPhone,
        startConversation: startConversation,
        updateConversation: updateConversation,
        endConversation: endConversation,
        createVideoWindow: createVideoWindow,
        addPreviewWindow: addPreviewWindow,
        removePreviewWindow: removePreviewWindow,
        sendDTMF: sendDTMF,
        getInstanceId: getInstanceId,
        getMultimediaDevices: getMultimediaDevices,
        setRecordingDevice: setRecordingDevice,
        setPlayoutDevice: setPlayoutDevice,
        setCaptureDevice: setCaptureDevice,
        setRingerDevice: setRingerDevice,
        getUserAuthStatus: getUserAuthStatus,
        showUserAuthorization: showUserAuthorization,
        showCallInExternalWindow: showCallInExternalWindow,
        hideExternalWindow: hideExternalWindow,
        showPreviewInExternalWindow: showPreviewInExternalWindow,
        setExternalWindowAlwaysOnTop: setExternalWindowAlwaysOnTop,
        setExternalWindowShowSelfViewPip: setExternalWindowShowSelfViewPip,
        setExternalWindowShowControls: setExternalWindowShowControls,
        setExternalWindowTitle: setExternalWindowTitle,
        getExternalWindowState: getExternalWindowState,
        setExternalWindowSelfViewPipPosition: setExternalWindowSelfViewPipPosition,
        setExternalWindowShowSelfViewPipBorder: setExternalWindowShowSelfViewPipBorder,
        dock: dock,
        undock: undock,
        startDiscovery: startDiscovery,
        cancelSSO: cancelSSO,
        resetData: resetData,
        signOut: signOut,
        setSpeakerVolume: setSpeakerVolume,
        setRingerVolume: setRingerVolume,
        setMicrophoneVolume: setMicrophoneVolume,
        setRingtone: setRingtone,
        setPlayRingerOnAllDevices: setPlayRingerOnAllDevices,
        getMultimediaDeviceVolume : getMultimediaDeviceVolume
    };

    // the jQuery plugin
    /**
    * @description
    * CWIC is a jQuery plug-in to access the Cisco Web Communicator<br>
    * Audio and Video media require the Cisco Web Communicator add-on to be installed <br>
    * <h3>Fields overview</h3>
    * <h3>Methods overview</h3>
    * All cwic methods are called in the following manner<br>
    * <pre class="code">$('#selector').cwic('method',parameters)</pre><br>
    * <h3>Events overview</h3>
    * All events are part of the cwic namespace.  For example:
    * <ul>
    * <li>conversationStart.cwic</li>
    * <li>system.cwic</li>
    * <li>error.cwic</li>
    * </ul>
    * <h4>Example conversation events:</h4>
    * These are conversation-related events that can be triggered by the SDK.<br>
    * The event handlers are passed the conversation properties as a single object. For example:<br>
    * @example
    * // start an audio conversation with phone a number and bind to conversation events
    * jQuery('#conversation')
    *   .cwic('startConversation', '+1 234 567')  // container defaults to $(this)
    *   .bind('conversationStart.cwic', function(event, conversation, container) {
    *      console.log('conversation has just started');
    *      // container is jQuery('#conversation')
    *    })
    *    .bind('conversationUpdate.cwic', function(event, conversation) {
    *      console.log('conversation has just been updated');
    *    })
    *    .bind('conversationEnd.cwic', function(event, conversation) {
    *      console.log('conversation has just ended');
    *    });
    * @example
    * // listen for incoming conversation
    * jQuery('#phone')
    *   .bind('conversationIncoming.cwic', function(event, conversation, container) {
    *     console.log('incoming conversation with id ' + conversation.id);
    *     // attach the 'toast' container to the DOM and bind to events
    *     container
    *       .appendTo('#phone')
    *       .bind('conversationUpdate.cwic', function(event, conversation) {
    *         // update on incoming conversation
    *       })
    *       .bind('conversationEnd.cwic', function(event, conversation) {
    *         // incoming conversation has ended
    *         container.remove();
    *       });
    *     // suppose UI has a button with id 'answer'
    *     jQuery('#answer').click(function() {
    *       // answer the incoming conversation
    *       // conversation has an id property, so startConversation accepts it
    *       // use element #conversation as container
    *       jQuery('#conversation').cwic('startConversation', conversation);
    *       // remove incoming container
    *       container.remove();
    *     });
    *   });
    * @class
    * @static
    * @param {String} method The name of the method to call
    * @param {Variable} arguments trailing arguments are passed to the specific call see methods below
    */
    $.fn.cwic = function(method) {

        try {
            // Method calling logic
            if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || !method) {
                return methods.init.apply(this, arguments);
            } else {
                throw method + ': no such method on jQuery.cwic';
            }
        }
        catch (e) {
            if (typeof console !== 'undefined') {
                if (console.trace) {
                    console.trace();
                }
                if (console.log && e.message) {
                    console.log('Exception occured in $.fn.cwic() ' + e.message);
                }
            }
            _triggerError(this, e);
        }
    };
} (jQuery));
