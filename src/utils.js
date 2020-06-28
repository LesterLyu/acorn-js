const {parse} = require('node-html-parser');

/**
 * An Error usually represents username or password error.
 */
class LoginError extends Error {
    constructor(...args) {
        super(...args);
    }
}

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';

module.exports = {
    LoginError,
    userAgent,
    /**
     * Extract all form data from an html document.
     * @param {string} body - An html document
     * @return {{data: {}, action: string}}
     */
    getFormData: body => {
        const root = parse(body);
        const inputs = root.querySelectorAll('form input');
        const data = {};
        inputs.forEach(input => {
            data[input.attributes.name] = input.attributes.value;
        });
        const action = root.querySelector('form').attributes.action;
        return {data, action};
    },

    /**
     *
     * @param body
     * @returns {{'data-host', 'data-sig-request', 'data-post-action'}}
     */
    getIframeData: body => {
        const root = parse(body);
        const iframe = root.querySelector('iframe');
        const required = ['data-host', 'data-sig-request', 'data-post-action'];
        const result = {};
        for (const item of required)
            result[item] = iframe.attributes[item];
        return result;
    },

    parseIframePostResult: body => {
        const root = parse(body);
        const inputs = root.querySelectorAll('input');
        const data = {};
        inputs.forEach(input => {
            data[input.attributes.name] = input.attributes.value;
        });
        return data;
    },

    /**
     * Generate the URL that goes to the Duo Prompt.
     * Note: From 3rd party Duo-Web-v2.js
     */
    generateIframeSrc: (host, duoSig, currHref) => {
        return [
            'https://', host, '/frame/web/v1/auth?tx=', duoSig,
            '&parent=', encodeURIComponent(currHref),
            '&v=2.3'
        ].join('');
    },

    /**
     * Parse login error on the login page.
     * i.e. https://idpz.utorauth.utoronto.ca/idp/profile/SAML2/Redirect/SSO?execution=e1s1
     * @param {string} body - An html document
     * @return {LoginError} An Error
     */
    parseAcornLoginError: body => {
        const root = parse(body);
        const p = root.querySelector('p.form-error');
        return new LoginError(p.innerHTML);
    },
};
