const rp = require('request-promise-native');
const {getFormData, getIframeData, generateIframeSrc, parseIframePostResult, LoginError, userAgent} = require('./utils');
const {CourseAPI} = require('./api');

/**
 * Represents Acorn.
 */
class Acorn {

    /**
     * @param {string} username - Acorn username
     * @param {string} password - Acorn password
     */
    constructor(username, password) {
        this.username = username;
        this.password = password;
        // store cookie across all requests.
        this._cookieJar = rp.jar();
        /**
         * @type {Registration[]}
         */
        this.registrations = null;

        /**
         * @type {CourseAPI}
         */
        this.course = new CourseAPI(this);
    }

    /**
     * @private
     * @returns {RequestJar}
     */
    get cookieJar() {
        return this._cookieJar;
    }

    /**
     * Log in to Acorn, this is an async function, remember to catch exceptions.
     * @return {Promise<Acorn>} Acorn instance
     * @throws {LoginError|Error} LoginError instance or error thrown from request-promise or unknown error
     */
    async login() {
        let url = 'https://acorn.utoronto.ca/sws';
        let response;

        // first step
        response = await rp({
            uri: url,
            jar: this.cookieJar,
            resolveWithFullResponse: true,
            headers: {
                'User-Agent': userAgent,
            }
        });
        url = response.request.href;

        const form = getFormData(response.body).data;
        form.j_username = this.username;
        form.j_password = this.password;
        form._eventId_proceed = '';
        form['$csrfToken.getParameterName()'] = '$csrfToken.getToken()';

        // second step
        response = await rp.post({
            uri: url,
            jar: this.cookieJar,
            resolveWithFullResponse: true,
            followAllRedirects: true,
            form,
            headers: {
                'User-Agent': userAgent,
            }
        });
        url = response.request.href;

        if (!response.body.includes('iframe')) {
            throw new LoginError('Username or password incorrect.');
        }
        const iframeData = getIframeData(response.body);

        const appPart = iframeData['data-sig-request'].split(':')[1];
        url = generateIframeSrc(iframeData['data-host'], iframeData['data-sig-request'].split(':')[0], url);


        // third step (iframe, Duo Security - Two-Factor Authentication)
        response = await rp.get({
            uri: url,
            jar: this.cookieJar,
            followAllRedirects: true,
            headers: {
                'User-Agent': userAgent,
            }
        });

        let {data, action} = getFormData(response);

        // override with real values from a browser
        data.color_depth = 24;
        data.screen_resolution_width = 1920;
        data.screen_resolution_height = 1080;
        data.is_cef_browser = false;
        data.is_ipad_os = false;
        data.referer = data.parent;

        // forth step (post to duo security)
        response = await rp.post({
            uri: url,
            jar: this.cookieJar,
            followAllRedirects: true,
            form: data,
            headers: {
                'User-Agent': userAgent,
            }
        });

        data = parseIframePostResult(response);
        url = data['js_parent'];

        // fifth step
        response = await rp.post({
            uri: url,
            jar: this.cookieJar,
            followAllRedirects: true,
            form: {
                _eventId: 'proceed',
                sig_response: data['js_cookie'] + ':' + appPart
            },
            headers: {
                'User-Agent': userAgent,
            }
        });

        const res = getFormData(response);
        data = res.data;
        action = res.action;

        // final step
        response = await rp.post({
            uri: action,
            jar: this.cookieJar,
            followAllRedirects: true,
            form: data,
            headers: {
                'User-Agent': userAgent,
            }
        });

        if (!response.includes('<title>ACORN</title>')) {
            throw Error('Acorn Unavailable/Unknown Error');
        } else {
            await this.loadRegistrations();
            return this;
        }
    };

    /**
     * Load registrations, this is called internally after login.
     * @private
     * @return {Promise<void>}
     */
    async loadRegistrations() {
        this.registrations = await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/eligible-registrations',
            jar: this.cookieJar,
            json: true
        });
    };

}

module.exports = {
    Acorn,
};
