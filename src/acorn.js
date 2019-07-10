const rp = require('request-promise');
const {getFormData, parseAcornLoginError} = require('./utils');

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
        this._cookieJar = rp.jar();
        this.registrations = null;
    }

    /**
     * Log in to Acorn, this is an async function, remember to catch exceptions.
     * @return {Promise<Acorn>} Acorn instance
     * @throws {LoginError|Error} LoginError instance or error thrown from request-promise or unknown error
     */
    login = async () => {
        let url = 'https://acorn.utoronto.ca/sws';
        let response;

        // first step
        response = await rp({
            uri: url,
            jar: this._cookieJar,
            resolveWithFullResponse: true,
        });
        url = response.request.href;

        const form = getFormData(response.body).data;
        form.j_username = this.username;
        form.j_password = this.password;
        form._eventId_proceed = '';

        // second step
        response = await rp.post({
            uri: url,
            jar: this._cookieJar,
            form
        });
        if (!response.includes('SAMLResponse')) {
            throw parseAcornLoginError(response);
        }
        const {data, action} = getFormData(response);

        // final step
        response = await rp.post({
            uri: action,
            jar: this._cookieJar,
            followAllRedirects: true,
            form: data
        });

        if (!response.includes('<title>ACORN</title>')) {
            throw Error('Acorn Unavailable/Unknown Error');
        } else {
            await this.loadRegistrations();
            return this;
        }
    };

    loadRegistrations = async () => {
        const response = await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/eligible-registrations',
            jar: this._cookieJar,
            json: true
        });
        this.registrations = response;
    };

}

module.exports = {
    Acorn,
};
